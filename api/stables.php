<?php
declare(strict_types=1);
require_once __DIR__ . '/demo-wallet-core.php';
/**
 * Cryptódromo Escuderías: servidor de DEMOSTRACIÓN.
 * Sólo créditos ficticios, sin depósitos, apuestas, pagos ni retiros.
 * Identidad anónima por sesión: NO es un sistema de cuentas verificadas.
 */
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
session_name('crp_stables_demo');
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax'
]);
ini_set('session.use_strict_mode', '1');
// Intentar conservar la identidad demo durante la vida de la cookie (30 días).
ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 30));
session_start();
if (!isset($_SESSION['stable_guest'])) $_SESSION['stable_guest'] = bin2hex(random_bytes(16));
if (!isset($_SESSION['stable_csrf'])) $_SESSION['stable_csrf'] = bin2hex(random_bytes(24));

const DEMO_PLANS = [2 => 100, 3 => 250, 5 => 600, 8 => 1500, 12 => 3500];
const DEMO_XP = [1 => 27, 2 => 17, 3 => 12, 4 => 7, 5 => 7, 6 => 7, 7 => 2, 8 => 2, 9 => 2, 10 => 2, 11 => 2, 12 => 2];
const MIN_STARTS = ['daily' => 5, 'weekly' => 10, 'season' => 30, 'all' => 100];
const FIXTURE_VERSION = 'synthetic-v1';
const MAX_SYNC_ROUNDS = 1800;

function answer(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fail(string $message, int $status = 400): never { answer(['ok' => false, 'error' => $message], $status); }
function input(): array {
    if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) fail('Se requiere JSON', 415);
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 12000) fail('Solicitud demasiado grande', 413);
    $decoded = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($decoded)) fail('JSON inválido');
    return $decoded;
}
function request_token(array $payload): void {
    if (!hash_equals((string)$_SESSION['stable_csrf'], (string)($payload['csrf'] ?? ''))) fail('Sesión vencida; recargá la página', 403);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $requestHost = parse_url('https://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    if ($origin && strcasecmp((string)parse_url($origin, PHP_URL_HOST), (string)$requestHost) !== 0) fail('Origen no permitido', 403);
}
function demo_now(): int {
    // Sólo para pruebas reproducibles del servidor PHP embebido; nunca en FPM/Hostinger.
    $testing = getenv('STABLES_TEST_UNIX');
    return PHP_SAPI === 'cli-server' && $testing !== false ? (int)$testing : time();
}
function now_round(): int {
    $anchor = (new DateTimeImmutable('2026-11-02 00:00:00', new DateTimeZone('America/Argentina/Buenos_Aires')))->getTimestamp();
    return (int) floor((demo_now() - $anchor) / 180);
}
function completed_round(): int {
    $anchor = (new DateTimeImmutable('2026-11-02 00:00:00', new DateTimeZone('America/Argentina/Buenos_Aires')))->getTimestamp();
    return (int) floor((demo_now() - $anchor - 60) / 180);
}
function fixture(): array {
    static $fixture = null;
    if ($fixture !== null) return $fixture;
    $path = __DIR__ . '/../stables/official-week-v1.json';
    $fixture = json_decode((string)@file_get_contents($path), true);
    if (!is_array($fixture) || ($fixture['version'] ?? '') !== FIXTURE_VERSION
        || count($fixture['positions'] ?? []) !== 3360 || count($fixture['symbols'] ?? []) !== 100) {
        throw new RuntimeException('Fixture oficial no disponible o incompatible');
    }
    return $fixture;
}
function db(): PDO {
    $directory = dirname(__DIR__, 2) . '/cryptodromo-stables-private';
    if (PHP_SAPI === 'cli-server' && getenv('STABLES_TEST_DIR')) {
        $directory = (string)getenv('STABLES_TEST_DIR');
    }
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('No hay almacenamiento privado disponible');
    }
    $pdo = new PDO('sqlite:' . $directory . '/stables-demo-v1.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10
    ]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON');
    $pdo->exec("CREATE TABLE IF NOT EXISTS demo_owners(
        id TEXT PRIMARY KEY, alias TEXT NOT NULL, credits INTEGER NOT NULL DEFAULT 5000, created_at TEXT NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS demo_stables(
        id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id TEXT NOT NULL UNIQUE REFERENCES demo_owners(id),
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, capacity INTEGER NOT NULL, color TEXT NOT NULL,
        captain TEXT NOT NULL, created_round INTEGER NOT NULL, last_round INTEGER NOT NULL,
        created_at TEXT NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS demo_roster(
        stable_id INTEGER NOT NULL REFERENCES demo_stables(id), symbol TEXT NOT NULL,
        from_round INTEGER NOT NULL, until_round INTEGER,
        PRIMARY KEY(stable_id,symbol,from_round))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS demo_wallet_ops(
        op_key TEXT PRIMARY KEY, owner_id TEXT NOT NULL, action TEXT NOT NULL,
        delta INTEGER NOT NULL, stable_id INTEGER NOT NULL, created_at TEXT NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS demo_roster_changes(
        stable_id INTEGER NOT NULL, effective_round INTEGER NOT NULL, changes INTEGER NOT NULL,
        created_at TEXT NOT NULL, PRIMARY KEY(stable_id,effective_round))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS demo_xp(
        stable_id INTEGER NOT NULL, round_no INTEGER NOT NULL, symbol TEXT NOT NULL,
        place INTEGER NOT NULL, xp INTEGER NOT NULL,
        PRIMARY KEY(stable_id,round_no,symbol))");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_demo_xp_round ON demo_xp(round_no,stable_id)");
    $id = $_SESSION['stable_guest'];
    $stmt = $pdo->prepare('INSERT OR IGNORE INTO demo_owners(id,alias,credits,created_at) VALUES(?,?,5000,?)');
    $stmt->execute([$id, 'Entrenador ' . strtoupper(substr($id, 0, 5)), gmdate('c')]);
    dw_schema($pdo);
    dw_owner($pdo,(string)$id);
    return $pdo;
}
function my_stable(PDO $db, string $owner): ?array {
    $s = $db->prepare('SELECT * FROM demo_stables WHERE owner_id=?'); $s->execute([$owner]);
    return $s->fetch() ?: null;
}
function valid_roster(array $tokens, int $capacity): array {
    if (count($tokens) !== $capacity || count(array_unique($tokens)) !== $capacity) fail('Elegí ' . $capacity . ' corredores diferentes');
    $available = array_fill_keys(fixture()['symbols'], true);
    foreach ($tokens as $symbol) {
        if (!is_string($symbol) || !isset($available[$symbol])) fail('Hay un corredor desconocido');
    }
    return array_values($tokens);
}
function valid_name($name): string {
    $name = is_string($name) ? trim($name) : '';
    if (!preg_match('/^[\p{L}\p{N}][\p{L}\p{N} ._-]{2,48}$/u', $name)) fail('Nombre inválido (3 a 49 caracteres)');
    return $name;
}
function valid_color($color): string {
    return is_string($color) && preg_match('/^#[a-fA-F0-9]{6}$/', $color) ? strtoupper($color) : '#13D69A';
}
function valid_key($key): string {
    if (!is_string($key) || !preg_match('/^[A-Za-z0-9_-]{8,90}$/', $key)) fail('Clave de operación inválida');
    return $key;
}
function run_roster(PDO $db, int $sid, int $round): array {
    $s = $db->prepare('SELECT symbol FROM demo_roster WHERE stable_id=? AND from_round<=? AND (until_round IS NULL OR until_round>?) ORDER BY symbol');
    $s->execute([$sid,$round,$round]); return $s->fetchAll(PDO::FETCH_COLUMN);
}
function sync_stables(PDO $db): int {
    $latest = completed_round();
    if ($latest < 0) return 0;
    $results = fixture()['positions'];
    $db->exec('BEGIN IMMEDIATE');
    try {
        $stables = $db->query('SELECT id,created_round,last_round FROM demo_stables')->fetchAll();
        $insert = $db->prepare('INSERT OR IGNORE INTO demo_xp(stable_id,round_no,symbol,place,xp) VALUES(?,?,?,?,?)');
        $update = $db->prepare('UPDATE demo_stables SET last_round=? WHERE id=?');
        $pending = 0;
        foreach ($stables as $stable) {
            $sid = (int)$stable['id'];
            $start = max((int)$stable['last_round'] + 1, (int)$stable['created_round']);
            if ($start > $latest) continue;
            $end = min($latest, $start + MAX_SYNC_ROUNDS - 1);
            for ($round = $start; $round <= $end; $round++) {
                $roster = run_roster($db, $sid, $round);
                if (!$roster) continue;
                $places = array_flip($results[$round % 3360]);
                foreach ($roster as $token) {
                    if (!isset($places[$token])) continue;
                    $place = $places[$token] + 1;
                    $insert->execute([$sid,$round,$token,$place,DEMO_XP[$place]]);
                }
            }
            $update->execute([$end,$sid]);
            if ($end < $latest) $pending++;
        }
        $db->exec('COMMIT');
        return $pending;
    } catch (Throwable $e) { $db->exec('ROLLBACK'); throw $e; }
}
function state(PDO $db, string $owner): array {
    $o = $db->prepare('SELECT alias, credits FROM demo_owners WHERE id=?');
    $o->execute([$owner]); $user=$o->fetch();
    $s = my_stable($db, $owner);
    if (!$s) return ['user'=>$user, 'stable'=>null];
    $roster = run_roster($db,(int)$s['id'],now_round()+1);
    $totals=$db->prepare('SELECT COALESCE(SUM(xp),0) xp,COUNT(*) starts,COALESCE(SUM(place=1),0) wins,COALESCE(SUM(place<=3),0) podiums FROM demo_xp WHERE stable_id=?');
    $totals->execute([$s['id']]);$stats=$totals->fetch();
    return ['user'=>$user, 'stable'=>[
        'id'=>(int)$s['id'], 'name'=>$s['name'], 'slug'=>$s['slug'], 'capacity'=>(int)$s['capacity'],
        'color'=>$s['color'], 'captain'=>$s['captain'], 'roster'=>$roster,
        'created_at'=>$s['created_at'], 'xp'=>(int)$stats['xp'],
        'starts'=>(int)$stats['starts'], 'wins'=>(int)$stats['wins'],
        'podiums'=>(int)$stats['podiums'],
        'efficiency'=>$stats['starts']>0 ? round((int)$stats['xp']/(int)$stats['starts'],2) : 0
    ]];
}
function records(PDO $db, string $period, string $mode): array {
    if (!array_key_exists($period,MIN_STARTS) || !in_array($mode,['total','efficiency'],true)) fail('Ranking no válido');
    $round = max(0,completed_round());
    $start = match ($period) {
        'daily' => intdiv($round,480)*480,
        'weekly' => intdiv($round,3360)*3360,
        'season' => intdiv($round,13440)*13440,
        default => 0
    };
    $q=$db->prepare("SELECT s.id,s.name,s.color,s.capacity,o.alias,
         COALESCE(SUM(x.xp),0) xp,COUNT(x.round_no) starts,
         COALESCE(SUM(CASE WHEN x.place=1 THEN 1 ELSE 0 END),0) wins,
         COALESCE(SUM(CASE WHEN x.place<=3 THEN 1 ELSE 0 END),0) podiums
         FROM demo_stables s JOIN demo_owners o ON o.id=s.owner_id
         LEFT JOIN demo_xp x ON x.stable_id=s.id AND x.round_no>=?
         GROUP BY s.id");
    $q->execute([$start]);$all=[];
    foreach($q->fetchAll() as $row) {
        $starts=(int)$row['starts'];$xp=(int)$row['xp'];
        $all[]=['id'=>(int)$row['id'],'name'=>$row['name'],'color'=>$row['color'],
            'capacity'=>(int)$row['capacity'],'owner'=>$row['alias'],
            'xp'=>$xp,'starts'=>$starts,'wins'=>(int)$row['wins'],'podiums'=>(int)$row['podiums'],
            'efficiency'=>$starts ? $xp/$starts : 0,'eligible'=>$starts>=MIN_STARTS[$period]];
    }
    usort($all,static function($a,$b)use($mode) {
        if($mode==='efficiency') return ($b['eligible']<=>$a['eligible'])
            ?: ($b['efficiency']<=>$a['efficiency']) ?: ($b['starts']<=>$a['starts'])
            ?: ($b['xp']<=>$a['xp']) ?: ($a['id']<=>$b['id']);
        return ($b['xp']<=>$a['xp']) ?: ($b['efficiency']<=>$a['efficiency'])
            ?: ($b['wins']<=>$a['wins']) ?: ($a['id']<=>$b['id']);
    });
    $rank=0;
    foreach($all as &$r) {
        $r['rank']=$mode==='total'||$r['eligible'] ? ++$rank : null;
        $r['provisional']=$mode==='efficiency'&&!$r['eligible'];
        $r['efficiency']=round($r['efficiency'],2);
    }
    unset($r);
    return ['mode'=>$mode,'period'=>$period,'minimum_starts'=>MIN_STARTS[$period],
        'as_of'=>gmdate('c'),'entries'=>array_slice($all,0,100)];
}
function begin(PDO $db): void { $db->exec('BEGIN IMMEDIATE'); }
function commit_tx(PDO $db): void { $db->exec('COMMIT'); }
function stop(PDO $db): void { if($db->inTransaction()) $db->exec('ROLLBACK'); }
function already(PDO $db, string $key, string $owner, string $action): bool {
    $q=$db->prepare('SELECT owner_id,action FROM demo_wallet_ops WHERE op_key=?');$q->execute([$key]);
    $r=$q->fetch();
    if (!$r) return false;
    if ($r['owner_id'] !== $owner || $r['action'] !== $action) fail('Clave utilizada para otra operación',409);
    return true;
}
function debit(PDO $db, string $owner, int $cost, string $key, string $action, int $stable): void {
    dw_stables_debit($db,$owner,$cost,$key,$action);
    $q=$db->prepare('INSERT INTO demo_wallet_ops VALUES(?,?,?,?,?,?)');
    $q->execute([$key,$owner,$action,-$cost,$stable,gmdate('c')]);
}
function change_roster(PDO $db, int $id, array $tokens, int $effective): void {
    $q=$db->prepare('UPDATE demo_roster SET until_round=? WHERE stable_id=? AND until_round IS NULL');
    $q->execute([$effective,$id]);
    $q=$db->prepare('INSERT INTO demo_roster(stable_id,symbol,from_round,until_round) VALUES(?,?,?,NULL)');
    foreach($tokens as $symbol) $q->execute([$id,$symbol,$effective]);
}
try {
    $action=(string)($_GET['action'] ?? 'bootstrap');
    $method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    $owner=(string)$_SESSION['stable_guest'];
    $db=db();
    $pending=sync_stables($db);
    if ($method==='GET') {
        if ($action==='bootstrap') {
            answer(['ok'=>true,'demo'=>true,'currency'=>'Créditos de demostración (no canjeables)',
                'csrf'=>$_SESSION['stable_csrf'],'plans'=>DEMO_PLANS,'symbols'=>fixture()['symbols'],
                'pending'=>$pending,'current_round'=>now_round(),'state'=>state($db,$owner)]);
        }
        if ($action==='leaderboard') answer(['ok'=>true,'demo'=>true,'pending'=>$pending] + records($db,
            (string)($_GET['period']??'season'),(string)($_GET['mode']??'total')));
        if ($action==='stable') {
            $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);
            if(!$id)fail('Escudería no válida');
            $q=$db->prepare('SELECT s.id,s.name,s.color,s.capacity,s.captain,o.alias owner FROM demo_stables s JOIN demo_owners o ON o.id=s.owner_id WHERE s.id=?');
            $q->execute([$id]);$row=$q->fetch();if(!$row)fail('Escudería inexistente',404);
            $row['roster']=run_roster($db,(int)$id,now_round()+1);
            $q=$db->prepare('SELECT round_no,symbol,place,xp FROM demo_xp WHERE stable_id=? ORDER BY round_no DESC LIMIT 30');
            $q->execute([$id]);$row['ledger']=$q->fetchAll();
            answer(['ok'=>true,'stable'=>$row,'demo'=>true]);
        }
        fail('Ruta no encontrada',404);
    }
    if ($method!=='POST') fail('Método no permitido',405);
    $payload=input();request_token($payload);
    if ($action==='profile') {
        $alias=valid_name($payload['alias']??'');
        $q=$db->prepare('UPDATE demo_owners SET alias=? WHERE id=?');
        $q->execute([$alias,$owner]);
        answer(['ok'=>true,'state'=>state($db,$owner)]);
    }
    if (!in_array($action,['create','upgrade','roster'],true)) fail('Acción no disponible',404);
    $capacity=filter_var($payload['capacity']??null,FILTER_VALIDATE_INT);
    if(!array_key_exists((int)$capacity,DEMO_PLANS)) fail('Licencia no válida');
    $capacity=(int)$capacity;
    $tokens=valid_roster($payload['tokens']??[],$capacity);
    $captain=(string)($payload['captain']??'');
    if(!in_array($captain,$tokens,true)) fail('Capitán fuera del equipo');
    $color=valid_color($payload['color']??null);
    $key=$action==='roster' ? null : valid_key($payload['key']??'');
    begin($db);
    try {
        if($key!==null && already($db,$key,$owner,$action)) {
            commit_tx($db);answer(['ok'=>true,'replayed'=>true,'state'=>state($db,$owner)]);
        }
        $s=my_stable($db,$owner);
        $effective=now_round()+1; // no se inscribe durante una carrera iniciada
        if ($s && ($action==='roster' || $action==='upgrade')) {
            // Rechazar modificaciones sucesivas durante el mismo intervalo,
            // porque ambas tendrían la misma hora efectiva y duplicarían filas.
            $future=$db->prepare('SELECT 1 FROM demo_roster WHERE stable_id=? AND from_round>=? LIMIT 1');
            $future->execute([(int)$s['id'],$effective]);
            if ($future->fetchColumn()) fail('Ya hay una modificación pendiente para la próxima largada',409);
        }
        if($action==='create'){
            if($s)fail('Ya tenés una escudería',409);
            $name=valid_name($payload['name']??'');
            $slug=strtolower(preg_replace('/[^a-z0-9]+/', '-',iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$name) ?: $name));
            $slug=trim($slug,'-').'-'.substr($owner,0,8);
            $q=$db->prepare('INSERT INTO demo_stables(owner_id,name,slug,capacity,color,captain,created_round,last_round,created_at) VALUES(?,?,?,?,?,?,?,?,?)');
            $q->execute([$owner,$name,$slug,$capacity,$color,$captain,$effective,$effective-1,gmdate('c')]);
            $id=(int)$db->lastInsertId();
            debit($db,$owner,DEMO_PLANS[$capacity],$key,'create',$id);
            change_roster($db,$id,$tokens,$effective);
        }elseif($action==='upgrade'){
            if(!$s)fail('Creá tu escudería primero',409);
            if($capacity <= (int)$s['capacity'])fail('La ampliación debe aumentar las plazas',409);
            $id=(int)$s['id'];
            $q=$db->prepare('UPDATE demo_stables SET capacity=?,color=?,captain=? WHERE id=?');
            $q->execute([$capacity,$color,$captain,$id]);
            debit($db,$owner,DEMO_PLANS[$capacity]-DEMO_PLANS[(int)$s['capacity']],$key,'upgrade',$id);
            change_roster($db,$id,$tokens,$effective);
        }else{
            if(!$s)fail('Creá tu escudería primero',409);
            if($capacity !== (int)$s['capacity'])fail('Para ampliar plazas utilizá Ampliar',409);
            $id=(int)$s['id'];
            $current=run_roster($db,$id,$effective);
            $removed=array_diff($current,$tokens);
            $added=array_diff($tokens,$current);
            if(count($removed)!==count($added))fail('La plantilla debe conservar el tamaño');
            $changes=count($removed);
            if($changes>0){
                $wstart=intdiv(max(0,$effective),3360)*3360;
                $q=$db->prepare('SELECT COALESCE(SUM(changes),0) FROM demo_roster_changes WHERE stable_id=? AND effective_round>=?');
                $q->execute([$id,$wstart]);$used=(int)$q->fetchColumn();
                if($changes+$used>2)fail('Límite de dos cambios por semana',409);
                $q=$db->prepare('INSERT INTO demo_roster_changes(stable_id,effective_round,changes,created_at) VALUES(?,?,?,?)');
                $q->execute([$id,$effective,$changes,gmdate('c')]);
                change_roster($db,$id,$tokens,$effective);
            }
            $q=$db->prepare('UPDATE demo_stables SET color=?,captain=? WHERE id=?');
            $q->execute([$color,$captain,$id]);
        }
        commit_tx($db);
        answer(['ok'=>true,'state'=>state($db,$owner)]);
    }catch(Throwable $e){stop($db);throw $e;}
} catch (DomainException $e) {
    error_log('stables rejected operation: '.$e->getMessage());
    fail('Saldo insuficiente u operación ya registrada',409);
} catch (PDOException $e) {
    error_log('stables DB error: '.$e->getMessage());
    fail('No se pudo guardar la operación. Verificá que PHP tenga SQLite disponible.',503);
} catch (Throwable $e) {
    error_log('stables error: '.$e->getMessage());
    fail($e instanceof RuntimeException ? $e->getMessage() : 'Error del servicio de escuderías',503);
}
