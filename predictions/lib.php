<?php
declare(strict_types=1);
/**
 * Cryptodromo virtual predictions service. No payment instruments or cash value.
 * Sports source: exported official Alpha19 worldRaceRecord, not browser animation.
 * Ledger: every grant, stake, reward and reversal is an atomic balanced 2-line entry.
 */
final class PredictionFailure extends RuntimeException {
    public function __construct(string $message, public readonly int $http=400) {
        parent::__construct($message);
    }
}
final class CrpPredictions {
    private array $fixtureCache=[];
    private DateTimeZone $zone;
    private bool $mysql;
    private const MULTIPLIERS=['winner'=>4,'podium'=>25,'exacta'=>30,'trifecta'=>150];
    public function __construct(private PDO $db, private string $fixturesDir) {
        $this->zone=new DateTimeZone('America/Argentina/Buenos_Aires');
        $this->mysql=$db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql';
        $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);
        if(!$this->mysql) $db->exec('PRAGMA foreign_keys=ON');
    }
    public static function fromEnvironment(): self {
        $dbUser=getenv('DB_USER') ?: '';
        $dbName=getenv('DB_NAME') ?: '';
        if($dbUser!=='' && $dbName!=='') {
            $db=new PDO(
                'mysql:host='.(getenv('DB_HOST') ?: 'localhost').';dbname='.$dbName.';charset=utf8mb4',
                $dbUser,getenv('DB_PASS') ?: '',
                [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]
            );
        } else {
            // Share the verified-users SQLite DB. Never create a public/anonymous database.
            $path=getenv('CRP_AUTH_SQLITE_PATH') ?: '';
            $real=$path!=='' ? realpath($path) : false;
            $root=realpath($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__));
            if(!$real || !is_file($real) || ($root && ($real===$root || str_starts_with($real,$root.DIRECTORY_SEPARATOR)))) {
                throw new PredictionFailure('Almacenamiento privado no configurado',503);
            }
            $db=new PDO('sqlite:'.$real,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
            $db->exec('PRAGMA busy_timeout=10000');
        }
        return new self($db,dirname(__FILE__).'/fixtures');
    }
    private function execute(string $sql,array $params=[]): PDOStatement {
        $stmt=$this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    private function begin(): void {
        if($this->mysql) $this->db->beginTransaction();
        else $this->db->exec('BEGIN IMMEDIATE');
    }
    private function rollback(): void { if($this->db->inTransaction()) $this->db->rollBack(); }
    private static function validDate(string $date): bool {
        if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)) return false;
        $p=explode('-',$date);
        return checkdate((int)$p[1],(int)$p[2],(int)$p[0]);
    }
    private function dayIndex(string $date): int {
        $anchor=new DateTimeImmutable('2026-11-02 00:00:00',$this->zone);
        $d=new DateTimeImmutable($date.' 00:00:00',$this->zone);
        $days=(int)$anchor->diff($d)->format('%r%a');
        return ($days%7+7)%7;
    }
    private function official(int $dayIndex,int $minute): array {
        if($minute<0 || $minute>=1440 || $dayIndex<0 || $dayIndex>6)
            throw new PredictionFailure('Carrera fuera del fixture');
        if(!isset($this->fixtureCache[$dayIndex])) {
            $file=$this->fixturesDir.'/day-'.($dayIndex+1).'.json';
            if(!is_file($file)) throw new PredictionFailure('Fixture oficial sin publicar',503);
            $data=json_decode((string)file_get_contents($file),true,512,JSON_THROW_ON_ERROR);
            if(($data['schema'] ?? '')!=='crp19-predictions-fixture-v1' ||
               ($data['simulation'] ?? false)!==true || ($data['dayIndex'] ?? -1)!==$dayIndex ||
               count($data['races'] ?? [])!==1440) {
                throw new PredictionFailure('Fixture oficial inválido',503);
            }
            $this->fixtureCache[$dayIndex]=$data['races'];
        }
        $race=$this->fixtureCache[$dayIndex][$minute] ?? null;
        $track=['muybridge','genesis','vint-cerf'][$minute%3];
        $picks=$race['runners'] ?? [];
        $rank=$race['ranking'] ?? [];
        $expected='CRP19-CRYPTO-'.strtoupper($track).'-D'.str_pad((string)($dayIndex+1),2,'0',STR_PAD_LEFT).
            '-S'.str_pad((string)(intdiv($minute,3)+1),3,'0',STR_PAD_LEFT);
        if(!is_array($race) || ($race['key'] ?? '')!==$expected ||
           ($race['trackId'] ?? '')!==$track || ($race['minute'] ?? -1)!==$minute ||
           ($race['slot'] ?? -1)!==intdiv($minute,3) || count($picks)!==12 ||
           count(array_unique($picks))!==12 || count($rank)!==12 ||
           (array_diff($picks,$rank)!==[] || array_diff($rank,$picks)!==[])) {
            throw new PredictionFailure('Resultado oficial inconsistente',503);
        }
        return $race;
    }
    public function race(string $date,int $minute): array {
        if(!self::validDate($date)) throw new PredictionFailure('Fecha inválida');
        $index=$this->dayIndex($date);
        $official=$this->official($index,$minute);
        $midnight=new DateTimeImmutable($date.' 00:00:00',$this->zone);
        $start=$midnight->getTimestamp()+$minute*60+30;
        return [
            'race_id'=>$date.'#'.$official['key'],
            'event_key'=>$official['key'],'date'=>$date,'day_index'=>$index,
            'track_id'=>$official['trackId'],'minute'=>$minute,
            'runners'=>$official['runners'],
            'start_at'=>$start,'close_at'=>$start-5,'finish_at'=>$start+60
        ];
    }
    public function upcoming(int $now): array {
        $local=(new DateTimeImmutable('@'.$now))->setTimezone($this->zone);
        $races=[];
        for($i=0;$i<20 && count($races)<9;$i++) {
            $dateTime=$local->modify('+'.$i.' minutes');
            $date=$dateTime->format('Y-m-d');
            $minute=(int)$dateTime->format('G')*60+(int)$dateTime->format('i');
            $race=$this->race($date,$minute);
            if($race['close_at']>$now && $race['start_at']<=$now+900) $races[]=$race;
        }
        return $races;
    }
    private function requireUser(int $userId): void {
        if($userId<=0 || !$this->execute('SELECT id FROM users WHERE id=?',[$userId])->fetch())
            throw new PredictionFailure('Sesión no verificada',401);
    }
    private function account(int $userId,int $now): array {
        $this->requireUser($userId);
        $sql=$this->mysql?
            'INSERT IGNORE INTO prediction_accounts(user_id,credits,updated_at) VALUES(?,0,?)':
            'INSERT OR IGNORE INTO prediction_accounts(user_id,credits,updated_at) VALUES(?,0,?)';
        $insert=$this->execute($sql,[$userId,$now]);
        if($insert->rowCount()===1) {
            $this->execute('UPDATE prediction_accounts SET credits=1000,updated_at=? WHERE user_id=?',[$now,$userId]);
            $this->journal('GRANT:'.$userId,$userId,1000,'system:grant','initial_grant','user:'.$userId,$now);
        }
        $suffix=$this->mysql?' FOR UPDATE':'';
        $row=$this->execute('SELECT credits FROM prediction_accounts WHERE user_id=?'.$suffix,[$userId])->fetch();
        if(!$row) throw new PredictionFailure('Cuenta no disponible',503);
        return $row;
    }
    private function journal(string $event,int $user,int $delta,string $system,string $kind,string $reference,int $now): void {
        $stmt=$this->db->prepare('INSERT INTO prediction_journal(event_id,line_no,account_key,delta,kind,reference,occurred_at) VALUES(?,?,?,?,?,?,?)');
        $stmt->execute([$event,1,'user:'.$user,$delta,$kind,$reference,$now]);
        $stmt->execute([$event,2,$system,-$delta,$kind,$reference,$now]);
    }
    private static function uuid(): string {
        $bytes=random_bytes(16);
        $bytes[6]=chr((ord($bytes[6])&0x0f)|0x40);
        $bytes[8]=chr((ord($bytes[8])&0x3f)|0x80);
        $hex=bin2hex($bytes);
        return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
    }
    private static function selections(string $mode,mixed $value,array $runners): array {
        $count=['winner'=>1,'podium'=>3,'exacta'=>2,'trifecta'=>3][$mode] ?? 0;
        if(!$count || !is_array($value) || count($value)!==$count || !array_is_list($value))
            throw new PredictionFailure('Selección inválida');
        foreach($value as $symbol)
            if(!is_string($symbol) || !in_array($symbol,$runners,true))
                throw new PredictionFailure('Corredor inexistente');
        if(count(array_unique($value))!==$count) throw new PredictionFailure('Selección duplicada');
        if($mode==='podium') sort($value,SORT_STRING);
        return $value;
    }
    private static function payload(array $row): array {
        return [
            'id'=>$row['id'],'race_id'=>$row['race_id'],'track_id'=>$row['track_id'],
            'date'=>$row['race_date'],'minute'=>(int)$row['minute'],
            'modality'=>$row['modality'],'picks'=>json_decode($row['picks_json'],true),
            'stake'=>(int)$row['stake'],'reward_multiplier'=>(int)$row['multiplier'],
            'close_at'=>(int)$row['close_at'],'start_at'=>(int)$row['start_at'],
            'finish_at'=>(int)$row['finish_at'],'created_at'=>(int)$row['created_at'],
            'status'=>$row['status'],'payout'=>(int)$row['payout'],
            'result'=>$row['result_json']===null?null:json_decode($row['result_json'],true)
        ];
    }
    public function confirm(int $userId,array $request,int $now): array {
        $raceId=$request['race_id'] ?? null;
        $mode=$request['modality'] ?? null;
        $stake=$request['stake'] ?? null;
        $requestId=$request['idempotency_key'] ?? null;
        if(!is_string($raceId) || !preg_match('/^(\d{4}-\d{2}-\d{2})#(CRP19-CRYPTO-[A-Z0-9-]+-D\d{2}-S\d{3})$/D',$raceId,$m))
            throw new PredictionFailure('Identificador de carrera inválido');
        if(!is_string($mode) || !isset(self::MULTIPLIERS[$mode])) throw new PredictionFailure('Modalidad inválida');
        if(!is_int($stake) || $stake<1 || $stake>1000) throw new PredictionFailure('Créditos fuera de rango');
        if(!is_string($requestId) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD',$requestId))
            throw new PredictionFailure('Clave de confirmación inválida');
        // Parse minute from the canonical event suffix, not an untrusted client clock.
        $trackSlug=explode('-D',$m[2])[0];
        $track=strtolower(substr($trackSlug,strlen('CRP19-CRYPTO-')));
        $slot=(int)substr($m[2],strrpos($m[2],'-S')+2)-1;
        $offset=array_search($track,['muybridge','genesis','vint-cerf'],true);
        if($offset===false || $slot<0 || $slot>=480) throw new PredictionFailure('Carrera desconocida');
        $race=$this->race($m[1],$slot*3+$offset);
        if($race['race_id']!==$raceId) throw new PredictionFailure('Fixture incorrecto');
        $picks=self::selections($mode,$request['picks'] ?? null,$race['runners']);
        $fingerprint=hash('sha256',json_encode([$raceId,$mode,$picks,$stake],JSON_THROW_ON_ERROR));
        $this->begin();
        try {
            $this->requireUser($userId);
            $existing=$this->execute('SELECT * FROM predictions WHERE user_id=? AND idempotency_key=?'.($this->mysql?' FOR UPDATE':''),[$userId,$requestId])->fetch();
            if($existing) {
                if(!hash_equals($existing['fingerprint'],$fingerprint))
                    throw new PredictionFailure('Clave de confirmación ya utilizada',409);
                $this->db->commit();
                return self::payload($existing);
            }
            if($now >= $race['close_at'] || $race['start_at']>$now+900)
                throw new PredictionFailure('Admisión cerrada o fuera de ventana',409);
            $account=$this->account($userId,$now);
            if((int)$account['credits']<$stake) throw new PredictionFailure('Créditos insuficientes',409);
            $pending=(int)$this->execute("SELECT COUNT(*) AS total FROM predictions WHERE user_id=? AND status IN ('confirmed','closed','pending_result')",[$userId])->fetch()['total'];
            if($pending>=50) throw new PredictionFailure('Límite de pronósticos pendientes alcanzado',429);
            $id=self::uuid();
            $this->execute(
                'INSERT INTO predictions(id,user_id,race_id,event_key,race_date,track_id,minute,modality,picks_json,stake,multiplier,close_at,start_at,finish_at,created_at,idempotency_key,fingerprint,status,payout) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [$id,$userId,$raceId,$race['event_key'],$race['date'],$race['track_id'],$race['minute'],$mode,
                json_encode($picks,JSON_THROW_ON_ERROR),$stake,self::MULTIPLIERS[$mode],
                $race['close_at'],$race['start_at'],$race['finish_at'],$now,$requestId,$fingerprint,'confirmed',0]
            );
            $debit=$this->execute('UPDATE prediction_accounts SET credits=credits-?,updated_at=? WHERE user_id=? AND credits>=?',[$stake,$now,$userId,$stake]);
            if($debit->rowCount()!==1) throw new PredictionFailure('Créditos insuficientes',409);
            $this->journal('STAKE:'.$id,$userId,-$stake,'system:stake','stake',$id,$now);
            $stored=$this->execute('SELECT * FROM predictions WHERE id=?',[$id])->fetch();
            $this->db->commit();
            return self::payload($stored);
        } catch(Throwable $e) {
            $this->rollback();
            throw $e;
        }
    }
    private function refreshStates(int $now,?int $userId=null): void {
        $filter=$userId!==null?' AND user_id=?':'';
        $this->execute("UPDATE predictions SET status='closed' WHERE status='confirmed' AND close_at<=?".$filter,
            $userId===null?[$now]:[$now,$userId]);
        $this->execute("UPDATE predictions SET status='pending_result' WHERE status='closed' AND start_at<=?".$filter,
            $userId===null?[$now]:[$now,$userId]);
    }
    private static function wins(string $mode,array $chosen,array $rank): bool {
        return match($mode) {
            'winner'=>$chosen[0]===$rank[0],
            'podium'=>(function()use($chosen,$rank){$top=array_slice($rank,0,3);sort($top,SORT_STRING);return $chosen===$top;})(),
            'exacta'=>$chosen===array_slice($rank,0,2),
            'trifecta'=>$chosen===array_slice($rank,0,3),
            default=>false
        };
    }
    public function settleDue(int $now,?int $userId=null,int $limit=100): int {
        $this->refreshStates($now,$userId);
        $filter=$userId===null?'':' AND user_id=?';
        $rows=$this->execute(
            "SELECT id FROM predictions WHERE finish_at<=? AND status IN ('confirmed','closed','pending_result')".$filter.
            ' ORDER BY finish_at,id LIMIT '.max(1,min(1000,$limit)),
            $userId===null?[$now]:[$now,$userId]
        )->fetchAll();
        $settled=0;
        foreach($rows as $item) {
            $this->begin();
            try {
                $row=$this->execute('SELECT * FROM predictions WHERE id=?'.($this->mysql?' FOR UPDATE':''),[$item['id']])->fetch();
                if(!$row || !in_array($row['status'],['confirmed','closed','pending_result'],true) ||
                   (int)$row['finish_at']>$now) { $this->db->commit();continue; }
                $official=$this->race($row['race_date'],(int)$row['minute']);
                if($official['race_id']!==$row['race_id'] || $official['finish_at']!==(int)$row['finish_at'])
                    throw new PredictionFailure('Liquidación bloqueada: fixture incompatible',503);
                $record=$this->official((int)$official['day_index'],(int)$row['minute']);
                $picks=json_decode($row['picks_json'],true,512,JSON_THROW_ON_ERROR);
                $won=self::wins($row['modality'],$picks,$record['ranking']);
                $reward=$won?(int)$row['stake']*(int)$row['multiplier']:0;
                $user=(int)$row['user_id'];
                $this->account($user,$now);
                if($reward>0) {
                    $this->execute('UPDATE prediction_accounts SET credits=credits+?,updated_at=? WHERE user_id=?',[$reward,$now,$user]);
                    $this->journal('PAYOUT:'.$row['id'],$user,$reward,'system:reward','virtual_reward',$row['id'],$now);
                }
                // Zero-value balanced journal entry also audits the losing verdict.
                $this->journal('RESULT:'.$row['id'],$user,0,'system:result',$won?'won':'lost',$row['id'],$now);
                $result=['top3'=>array_slice($record['ranking'],0,3),
                    'winner'=>$record['ranking'][0],'source_key'=>$record['key'],'simulation'=>true];
                $this->execute('UPDATE predictions SET status=?,payout=?,result_json=?,settled_at=? WHERE id=?',
                    [$won?'won':'lost',$reward,json_encode($result,JSON_THROW_ON_ERROR),$now,$row['id']]);
                $this->db->commit();
                $settled++;
            } catch(Throwable $e) {
                $this->rollback();
                throw $e;
            }
        }
        return $settled;
    }
    /** Operator-only cancellation; no public HTTP route. Idempotent refund. */
    public function voidRace(string $raceId,int $now): int {
        $ids=$this->execute("SELECT id FROM predictions WHERE race_id=? AND status IN ('confirmed','closed','pending_result')",[$raceId])->fetchAll();
        $count=0;
        foreach($ids as $item) {
            $this->begin();
            try {
                $row=$this->execute('SELECT * FROM predictions WHERE id=?'.($this->mysql?' FOR UPDATE':''),[$item['id']])->fetch();
                if(!$row || !in_array($row['status'],['confirmed','closed','pending_result'],true)) {$this->db->commit();continue;}
                $user=(int)$row['user_id'];$stake=(int)$row['stake'];
                $this->account($user,$now);
                $this->execute('UPDATE prediction_accounts SET credits=credits+?,updated_at=? WHERE user_id=?',[$stake,$now,$user]);
                $this->journal('REFUND:'.$row['id'],$user,$stake,'system:refund','race_void',$row['id'],$now);
                $this->execute('UPDATE predictions SET status=?,payout=?,result_json=?,settled_at=? WHERE id=?',
                    ['void',$stake,json_encode(['void'=>true,'simulation'=>true],JSON_THROW_ON_ERROR),$now,$row['id']]);
                $this->db->commit();$count++;
            } catch(Throwable $e) {$this->rollback();throw $e;}
        }
        return $count;
    }
    public function personal(int $userId,int $now): array {
        $this->settleDue($now,$userId,100);
        $this->begin();
        try {
            $a=$this->account($userId,$now);
            $journal=$this->execute('SELECT COALESCE(SUM(delta),0) AS total FROM prediction_journal WHERE account_key=?',['user:'.$userId])->fetch();
            if((int)$a['credits']!==(int)$journal['total'])
                throw new PredictionFailure('Diferencia contable: operaciones suspendidas',503);
            $rows=$this->execute('SELECT * FROM predictions WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 40',[$userId])->fetchAll();
            $this->db->commit();
            return ['credits'=>(int)$a['credits'],'ledger_credits'=>(int)$journal['total'],
                'history'=>array_map([self::class,'payload'],$rows),'currency'=>'CR-VIRTUAL',
                'simulation'=>true,'transferable'=>false,'redeemable'=>false];
        } catch(Throwable $e) {$this->rollback();throw $e;}
    }
}
