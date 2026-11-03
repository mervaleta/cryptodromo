<?php
declare(strict_types=1);
/** Cryptódromo shared money DEMO API. Same session, DB and CR balance as escuderías. No real funds. */
require_once __DIR__.'/demo-wallet-core.php';
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
session_name('crp_stables_demo');
session_set_cookie_params(['lifetime'=>2592000,'path'=>'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);
ini_set('session.use_strict_mode','1');ini_set('session.gc_maxlifetime','2592000');
session_start();
if(!isset($_SESSION['stable_guest']))$_SESSION['stable_guest']=bin2hex(random_bytes(16));
if(!isset($_SESSION['stable_csrf']))$_SESSION['stable_csrf']=bin2hex(random_bytes(24));
function reply(array $v,int $status=200): never {http_response_code($status);echo json_encode($v,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
function error_out(string $message,int $status=400): never {reply(['ok'=>false,'error'=>$message],$status);}
function require_json(): array {
 if(!str_contains($_SERVER['CONTENT_TYPE']??'','application/json'))error_out('Se requiere JSON',415);
 if((int)($_SERVER['CONTENT_LENGTH']??0)>10000)error_out('Solicitud demasiado grande',413);
 $v=json_decode(file_get_contents('php://input')?:'',true);if(!is_array($v))error_out('JSON inválido');return $v;
}
function verify_request(array $v): void {
 if(!is_string($v['csrf']??null)||!hash_equals((string)$_SESSION['stable_csrf'],$v['csrf']))error_out('Token de sesión inválido',403);
 $origin=$_SERVER['HTTP_ORIGIN']??'';
 if($origin){
   $host=parse_url($origin,PHP_URL_HOST);$requestHost=parse_url('http://'.($_SERVER['HTTP_HOST']??''),PHP_URL_HOST);
   $scheme=parse_url($origin,PHP_URL_SCHEME);
   if(!in_array($scheme,['http','https'],true)||!is_string($host)||strcasecmp($host,(string)$requestHost)!==0)error_out('Origen no permitido',403);
 }
}
function db_open(): PDO {
 $dir=dirname(__DIR__,2).'/cryptodromo-stables-private';
 if(PHP_SAPI==='cli-server' && getenv('STABLES_TEST_DIR'))$dir=(string)getenv('STABLES_TEST_DIR');
 if(!is_dir($dir)&&!@mkdir($dir,0700,true)&&!is_dir($dir))throw new RuntimeException('Almacenamiento privado no disponible');
 $db=new PDO('sqlite:'.$dir.'/stables-demo-v1.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_TIMEOUT=>10]);
 $db->exec('PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON');
 $db->exec("CREATE TABLE IF NOT EXISTS demo_owners(id TEXT PRIMARY KEY,alias TEXT NOT NULL,credits INTEGER NOT NULL DEFAULT 5000,created_at TEXT NOT NULL)");
 $owner=(string)$_SESSION['stable_guest'];
 $stmt=$db->prepare('INSERT OR IGNORE INTO demo_owners(id,alias,credits,created_at) VALUES(?,?,5000,?)');
 $stmt->execute([$owner,'Entrenador '.strtoupper(substr($owner,0,5)),gmdate('c')]);
 dw_schema($db);dw_owner($db,$owner);
 return $db;
}
function key_input(array $v): string {
 $key=$v['key']??null;
 if(!is_string($key)||!preg_match('/^[a-zA-Z0-9._:-]{12,100}$/D',$key))error_out('Clave idempotente inválida');
 return $key;
}
function positive(array $v,string $name,int $min,int $max): int {
 $n=$v[$name]??null;
 if(!is_int($n)||$n<$min||$n>$max)error_out('Importe fuera de límites: '.$name);
 return $n;
}
function quote_deposit(string $channel,string $method,int $usd): array {
 if(!in_array($usd,[5,10,25,50,100],true))error_out('Paquete no permitido');
 if($channel==='fiat'){
   if(!in_array($method,['card','bank'],true))error_out('Medio fiat inválido');
   return ['channel'=>$channel,'method'=>$method,'usd_cents'=>$usd*100,'rate_usd'=>1,'amount'=>(string)$usd,'currency'=>'USD_DEMO','fee_cents'=>0];
 }
 $rates=['BTC'=>70000,'ETH'=>3500,'USDT'=>1,'SOL'=>150];
 if($channel!=='crypto'||!isset($rates[$method]))error_out('Activo ficticio inválido');
 $amount=sprintf('%.8f',$usd/$rates[$method]);
 return ['channel'=>$channel,'method'=>$method,'usd_cents'=>$usd*100,'rate_usd'=>$rates[$method],'amount'=>$amount,'currency'=>$method,'fee_cents'=>0];
}
function fee_quote(string $method,int $cents): array {
 $fees=['bank'=>[25,100,500],'crypto_usdt'=>[50,50,1000],'crypto_btc'=>[100,75,1500]];
 if(!isset($fees[$method]))error_out('Método de retiro inválido');
 [$fixed,$bps,$min]=$fees[$method];
 if($cents<$min||$cents>1000000)error_out('Importe fuera del rango de retiro');
 $fee=$fixed+intdiv($cents*$bps+9999,10000);
 if($fee >= $cents)error_out('Comisión igual o superior al importe');
 return ['fee_cents'=>$fee,'net_cents'=>$cents-$fee,'total_cents'=>$cents,'method'=>$method];
}
function intents(PDO $db,string $owner,string $kind): array {
 $q=$db->prepare('SELECT id,kind,method,usd_cents,fee_cents,status,details,created_at,updated_at FROM demo_money_intents WHERE owner_id=? AND kind=? ORDER BY created_at DESC LIMIT 60');
 $q->execute([$owner,$kind]);$all=$q->fetchAll();
 foreach($all as &$row)$row['details']=json_decode((string)$row['details'],true)?:[];
 return $all;
}
function history(PDO $db,string $owner): array {
 $q=$db->prepare('SELECT e.id,e.op_key,o.kind,e.currency,e.bucket,e.delta,e.created_at FROM demo_money_entries e JOIN demo_money_ops o ON o.op_key=e.op_key WHERE e.owner_id=? ORDER BY e.id DESC LIMIT 100');
 $q->execute([$owner]);return $q->fetchAll();
}
function tickets(PDO $db,string $owner): array {
 $q=$db->prepare('SELECT id,absolute_round,runner,market,stake,odds_milli,payout,result_position,status,created_at,settled_at FROM demo_bet_tickets WHERE owner_id=? ORDER BY created_at DESC LIMIT 80');
 $q->execute([$owner]);return $q->fetchAll();
}
function absolute_round(): int {
 $anchor=(new DateTimeImmutable('2026-11-02 00:00:00',new DateTimeZone('America/Argentina/Buenos_Aires')))->getTimestamp();
 return (int)floor((time()-$anchor)/180);
}
function fixture_positions(): array {
 static $cache=null;
 if($cache!==null)return $cache;
 $file=__DIR__.'/../stables/official-week-v1.json';
 $data=json_decode((string)@file_get_contents($file),true);
 if(!is_array($data)||($data['version']??null)!=='synthetic-v1'||count($data['positions']??[])!==3360)throw new RuntimeException('Fixture oficial no verificado');
 return $cache=$data['positions'];
}
function settle(PDO $db): void {
 $round=absolute_round();
 // Results become final only 60s after starting. No future settlements.
 $anchor=(new DateTimeImmutable('2026-11-02 00:00:00',new DateTimeZone('America/Argentina/Buenos_Aires')))->getTimestamp();
 $max=(int)floor((time()-$anchor-60)/180);
 $q=$db->prepare("SELECT * FROM demo_bet_tickets WHERE status='open' AND absolute_round<=? ORDER BY absolute_round LIMIT 100");
 $q->execute([$max]);$rows=$q->fetchAll();
 if(!$rows)return;
 $positions=fixture_positions();
 foreach($rows as $row){
   $ranking=$positions[(int)$row['absolute_round']%3360];
   $index=array_search($row['runner'],$ranking,true);
   if($index===false)continue;
   $place=$index+1;
   $won=match($row['market']){'WIN'=>$place===1,'PLACE'=>$place<=2,'SHOW'=>$place<=3,default=>false};
   $payout=$won?intdiv((int)$row['stake']*(int)$row['odds_milli'],1000):0;
   $op='settle:'.$row['id'];
   if(!dw_operation($db,$op,(string)$row['owner_id'],'bet_settlement'))continue;
   if($payout>0)dw_move($db,(string)$row['owner_id'],$op,'CR','available',$payout);
   $up=$db->prepare("UPDATE demo_bet_tickets SET status=?,payout=?,result_position=?,settled_at=? WHERE id=? AND status='open'");
   $up->execute([$won?'won':'lost',$payout,$place,gmdate('c'),$row['id']]);
 }
}
function state_response(PDO $db,string $owner,array $extra=[]): never {
 reply(['ok'=>true,'demo'=>true,'identity'=>'shared-stables-guest',
  'csrf'=>$_SESSION['stable_csrf'],'wallet'=>dw_balances($db,$owner),
  'deposits'=>intents($db,$owner,'deposit'),'withdrawals'=>intents($db,$owner,'withdrawal'),
  'tickets'=>tickets($db,$owner),'ledger'=>history($db,$owner),
  'current_round'=>absolute_round(),'fixture_version'=>'synthetic-v1']+$extra);
}
try {
 $db=db_open();$owner=(string)$_SESSION['stable_guest'];
 $action=(string)($_GET['action']??'bootstrap');$method=$_SERVER['REQUEST_METHOD']??'GET';
 if($method==='GET'){
   if($action!=='bootstrap')error_out('Ruta no disponible',404);
   $db->exec('BEGIN IMMEDIATE');try{settle($db);$db->exec('COMMIT');}catch(Throwable $e){if($db->inTransaction())$db->exec('ROLLBACK');throw $e;}
   state_response($db,$owner);
 }
 if($method!=='POST')error_out('Método no permitido',405);
 $input=require_json();verify_request($input);$key=key_input($input);
 $db->exec('BEGIN IMMEDIATE');
 try {
   if(!dw_operation($db,$key,$owner,$action)){
     $db->exec('COMMIT');state_response($db,$owner,['replayed'=>true]);
   }
   switch($action){
     case 'deposit_create':
       $quote=quote_deposit((string)($input['channel']??''),(string)($input['method']??''),positive($input,'package_usd',5,100));
       $q=$db->prepare("SELECT COUNT(*) FROM demo_money_intents WHERE owner_id=? AND kind='deposit' AND status='pending'");
       $q->execute([$owner]);if((int)$q->fetchColumn()>=3)error_out('Máximo tres ingresos pendientes',409);
       $q=$db->prepare("INSERT INTO demo_money_intents(id,owner_id,kind,method,usd_cents,fee_cents,status,details,created_at,updated_at) VALUES(?,?,'deposit',?,?,0,'pending',?,?,?)");
       $q->execute([$key,$owner,$quote['method'],$quote['usd_cents'],json_encode($quote),gmdate('c'),gmdate('c')]);break;
     case 'deposit_confirm': case 'deposit_cancel':
       $id=(string)($input['intent']??'');
       $q=$db->prepare("SELECT * FROM demo_money_intents WHERE id=? AND owner_id=? AND kind='deposit'");
       $q->execute([$id,$owner]);$row=$q->fetch();
       if(!$row||$row['status']!=='pending')error_out('Depósito inexistente o ya procesado',409);
       if($action==='deposit_confirm')dw_move($db,$owner,$key,'USD_CENTS','available',(int)$row['usd_cents']);
       $q=$db->prepare('UPDATE demo_money_intents SET status=?,updated_at=? WHERE id=?');
       $q->execute([$action==='deposit_confirm'?'confirmed':'cancelled',gmdate('c'),$id]);break;
     case 'exchange_buy':case 'exchange_sell':
       $cents=positive($input,'amount_cents',100,10000);
       if($action==='exchange_buy'){
         dw_move($db,$owner,$key,'USD_CENTS','available',-$cents);
         dw_move($db,$owner,$key,'CR','available',$cents);
       } else {
         dw_move($db,$owner,$key,'CR','available',-$cents);
         dw_move($db,$owner,$key,'USD_CENTS','available',$cents);
       }break;
     case 'withdraw_create':
       $cents=positive($input,'amount_cents',1,1000000);
       $quote=fee_quote((string)($input['method']??''),$cents);
       dw_move($db,$owner,$key,'USD_CENTS','available',-$cents);
       dw_move($db,$owner,$key,'USD_CENTS','held',$cents);
       $q=$db->prepare("INSERT INTO demo_money_intents(id,owner_id,kind,method,usd_cents,fee_cents,status,details,created_at,updated_at) VALUES(?,?,'withdrawal',?,?,?,'pending',?,?,?)");
       $q->execute([$key,$owner,$quote['method'],$cents,$quote['fee_cents'],json_encode($quote),gmdate('c'),gmdate('c')]);break;
     case 'withdraw_action':
       $id=(string)($input['intent']??'');$transition=(string)($input['transition']??'');
       $q=$db->prepare("SELECT * FROM demo_money_intents WHERE id=? AND owner_id=? AND kind='withdrawal'");
       $q->execute([$id,$owner]);$row=$q->fetch();
       if(!$row)error_out('Retiro inexistente',404);
       $matrix=['pending'=>['approve'=>'approved','cancel'=>'cancelled','reject'=>'rejected'],
         'approved'=>['process'=>'processing','cancel'=>'cancelled','reject'=>'rejected'],
         'processing'=>['complete'=>'completed','fail'=>'failed']];
       $next=$matrix[$row['status']][$transition]??null;
       if(!$next)error_out('Cambio de estado no permitido',409);
       if(in_array($next,['cancelled','rejected','failed'],true)){
         dw_move($db,$owner,$key,'USD_CENTS','held',-(int)$row['usd_cents']);
         dw_move($db,$owner,$key,'USD_CENTS','available',(int)$row['usd_cents']);
       }elseif($next==='completed'){
         dw_move($db,$owner,$key,'USD_CENTS','held',-(int)$row['usd_cents']);
         dw_entry($db,$key,$owner,'USD_DEMO_OUT','external',(int)$row['usd_cents']-(int)$row['fee_cents']);
         dw_entry($db,$key,$owner,'USD_DEMO_FEE','provider',(int)$row['fee_cents']);
       }
       $q=$db->prepare('UPDATE demo_money_intents SET status=?,updated_at=? WHERE id=?');
       $q->execute([$next,gmdate('c'),$id]);break;
     case 'bet_place':
       $round=positive($input,'absolute_round',1,2147483647);
       $now=absolute_round();
       if($round<=$now||$round>$now+4)error_out('Carrera no disponible',409);
       $anchor=(new DateTimeImmutable('2026-11-02 00:00:00',new DateTimeZone('America/Argentina/Buenos_Aires')))->getTimestamp();
       if(time()>=$anchor+$round*180-5)error_out('Taquilla cerrada',409);
       $ranking=fixture_positions()[$round%3360];
       $runner=$input['runner']??null;$market=$input['market']??null;
       if(!is_string($runner)||!in_array($runner,$ranking,true))error_out('Corredor fuera del fixture');
       $odds=['WIN'=>8000,'PLACE'=>4000,'SHOW'=>2500];
       if(!is_string($market)||!isset($odds[$market]))error_out('Mercado inválido');
       $stake=positive($input,'stake',1,10000);
       $q=$db->prepare("SELECT COUNT(*) FROM demo_bet_tickets WHERE owner_id=? AND absolute_round=? AND runner=? AND market=? AND status='open'");
       $q->execute([$owner,$round,$runner,$market]);
       if((int)$q->fetchColumn()>0)error_out('Ya hay un ticket abierto para esta selección',409);
       dw_move($db,$owner,$key,'CR','available',-$stake);
       $q=$db->prepare("INSERT INTO demo_bet_tickets(id,owner_id,absolute_round,fixture_version,runner,market,stake,odds_milli,status,created_at) VALUES(?,?,?,'synthetic-v1',?,?,?,?,'open',?)");
       $q->execute([$key,$owner,$round,$runner,$market,$stake,$odds[$market],gmdate('c')]);break;
     default:error_out('Acción no disponible',404);
   }
   $db->exec('COMMIT');
   state_response($db,$owner,['accepted'=>true]);
 }catch(Throwable $e){if($db->inTransaction())$db->exec('ROLLBACK');throw $e;}
} catch(DomainException|InvalidArgumentException $e){
 error_out($e->getMessage(),409);
} catch(PDOException $e){
 error_log('demo wallet DB: '.$e->getMessage());error_out('Operación no disponible. Verificá almacenamiento SQLite.',503);
} catch(Throwable $e){
 error_log('demo wallet: '.$e->getMessage());error_out('Error temporal de caja de prueba',503);
}
