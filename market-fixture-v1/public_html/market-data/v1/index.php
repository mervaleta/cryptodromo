<?php
// Read-only fixed simulation API. Requires PHP >= 8.1, 64-bit integers, PDO SQLite.
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('X-Market-Data: simulated-fixture-v1');
function output(array $data, int $status = 200): never {
    http_response_code($status);
    $body=json_encode($data, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if ($status===200) {
        $etag='"'.hash('sha256',$body).'"';
        header('ETag: '.$etag);
        header('X-Dataset-Version: market-fixture-v1');
        // A replay request without an explicit epoch depends on server configuration.
        header('Cache-Control: '.((($_GET['action'] ?? '')==='replay' && !isset($_GET['epoch'])) ? 'public, max-age=60, must-revalidate' : 'public, max-age=31536000, immutable'));
        $matches=explode(',',$_SERVER['HTTP_IF_NONE_MATCH'] ?? '');
        foreach ($matches as $match) {
            if (trim($match)==='*' || preg_replace('/^W\//','',trim($match))===$etag) {
                http_response_code(304); exit;
            }
        }
    }
    echo $body;
    exit;
}
function fail(string $message, int $status = 400, string $code = 'invalid_parameter'): never {
    header('Cache-Control: no-store');
    output(['simulation'=>true,'error'=>['code'=>$code,'message'=>$message]],$status);
}
function decimalPrice(int $units, int $scale): string {
    $digits = str_pad((string)$units, $scale + 1, '0', STR_PAD_LEFT);
    return substr($digits, 0, -$scale) . '.' . substr($digits, -$scale);
}
function minuteTime(int $minute): string { return gmdate('Y-m-d\TH:i:00\Z', $minute * 60); }
function utcMinute(string $value, bool $inWeek = true): int {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/D', $value)) fail('Expected UTC minute YYYY-MM-DDTHH:MM:00Z');
    $dt=DateTimeImmutable::createFromFormat('!Y-m-d\TH:i:s\Z',$value,new DateTimeZone('UTC'));
    if (!$dt || $dt->format('Y-m-d\TH:i:s\Z') !== $value) fail('Invalid calendar minute');
    $minute=intdiv($dt->getTimestamp(),60);
    if ($inWeek && ($minute < 29852640 || $minute > 29862719)) fail('Minute outside fixed week');
    return $minute;
}
try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        header('Allow: GET'); fail('Only GET is supported',405,'method_not_allowed');
    }
    $seen=[];
    foreach (explode('&',$_SERVER['QUERY_STRING'] ?? '') as $part) {
        if ($part==='') continue;
        $key=urldecode(explode('=',$part,2)[0]);
        if (isset($seen[$key])) fail('Duplicate parameter');
        $seen[$key]=true;
    }
    foreach ($_GET as $key=>$value) if (!is_string($value)) fail('Parameters must be scalar strings');
    $action=$_GET['action'] ?? 'manifest';
    $allowed=['manifest'=>['action'],'assets'=>['action'],'series'=>['action','asset_id','start','end','limit','cursor'],'snapshot'=>['action','at','asset_id'],'replay'=>['action','playback_time','epoch','asset_id']];
    if (!isset($allowed[$action])) fail('Unknown action');
    foreach (array_keys($seen) as $key) if (!in_array($key,$allowed[$action],true)) fail('Unknown parameter');
    $required=['series'=>['asset_id','start','end'],'snapshot'=>['at'],'replay'=>['playback_time']];
    foreach ($required[$action] ?? [] as $key) if (!isset($_GET[$key]) || $_GET[$key]==='') fail('Missing '.$key);
    $configured=getenv('MARKET_DATA_PRIVATE_DIR') ?: dirname(__DIR__,3).'/private';
    $public=realpath(dirname(__DIR__,2));
    $private=realpath($configured);
    if (!$private || is_link($configured) || $private===$public || str_starts_with($private,$public.'/') || !is_readable($private.'/manifest.json') || !is_readable($private.'/market-v1.sqlite')) fail('Fixture unavailable',503,'service_unavailable');
    $manifest=json_decode(file_get_contents($private.'/manifest.json'),true,512,JSON_THROW_ON_ERROR);
    if ($action==='manifest') output($manifest);
    $db=new PDO('sqlite:file:'.$private.'/market-v1.sqlite?mode=ro',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA query_only=ON');
    $asset=null;
    if (isset($_GET['asset_id'])) {
        $assetQuery=$db->prepare('SELECT * FROM assets WHERE asset_id=?'); $assetQuery->execute([$_GET['asset_id']]);
        $asset=$assetQuery->fetch(PDO::FETCH_ASSOC);
        if (!$asset) fail('Unknown market-qualified asset_id',404,'asset_not_found');
    }
    if ($action==='series') {
        $start=utcMinute($_GET['start']); $end=utcMinute($_GET['end']);
        if ($start>$end) fail('start must not exceed end');
        $cursor=isset($_GET['cursor']) ? utcMinute($_GET['cursor']) : $start;
        if ($cursor<$start || $cursor>$end) fail('cursor outside requested range');
        $rawLimit=$_GET['limit'] ?? '1000';
        if (!preg_match('/^[1-9][0-9]{0,3}$/D',$rawLimit) || (int)$rawLimit>1000) fail('limit must be 1 through 1000');
        $limit=(int)$rawLimit;
        $q=$db->prepare('SELECT minute,price_units FROM prices WHERE asset_id=? AND minute>=? AND minute<=? ORDER BY minute LIMIT ?');
        $q->bindValue(1,$_GET['asset_id']); $q->bindValue(2,$cursor,PDO::PARAM_INT); $q->bindValue(3,$end,PDO::PARAM_INT); $q->bindValue(4,$limit+1,PDO::PARAM_INT); $q->execute();
        $rows=$q->fetchAll(PDO::FETCH_ASSOC);
        $next=count($rows)>$limit ? minuteTime((int)$rows[$limit]['minute']) : null;
        $points=[];
        foreach (array_slice($rows,0,$limit) as $row) $points[]=['time'=>minuteTime((int)$row['minute']),'price'=>decimalPrice((int)$row['price_units'],(int)$asset['scale'])];
        output(['simulation'=>true,'version'=>'market-fixture-v1','asset_id'=>$_GET['asset_id'],'total'=>$end-$start+1,'count'=>count($points),'next_cursor'=>$next,'points'=>$points]);
    }
    if ($action==='snapshot' || $action==='replay') {
        $extra=['data_mode'=>'simulated'];
        if ($action==='replay') {
            $playback=utcMinute($_GET['playback_time'],false);
            $epochText=$_GET['epoch'] ?? (getenv('MARKET_REPLAY_EPOCH') ?: '2026-10-05T00:00:00Z');
            $epoch=utcMinute($epochText,false);
            $elapsed=$playback-$epoch;
            $at=29852640+(($elapsed%10080+10080)%10080);
            $extra=['data_mode'=>'simulated/replay','playback_time'=>minuteTime($playback),'epoch'=>minuteTime($epoch)];
        } else $at=utcMinute($_GET['at']);
        $sql='SELECT a.asset_id,a.currency,a.scale,p.price_units FROM assets a JOIN prices p ON a.asset_id=p.asset_id WHERE p.minute=?';
        $params=[$at];
        if ($asset) { $sql.=' AND a.asset_id=?'; $params[]=$_GET['asset_id']; }
        $sql.=' ORDER BY a.asset_id';
        $q=$db->prepare($sql); $q->execute($params); $quotes=[];
        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $row) $quotes[]=['asset_id'=>$row['asset_id'],'currency'=>$row['currency'],'price'=>decimalPrice((int)$row['price_units'],(int)$row['scale'])];
        output(['simulation'=>true,'version'=>'market-fixture-v1','source_time'=>minuteTime($at),'quotes'=>$quotes]+$extra);
    }
    $assets=$db->query('SELECT * FROM assets ORDER BY asset_id')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($assets as &$asset) {
        $asset['anchor_price']=decimalPrice((int)$asset['anchor_units'],(int)$asset['scale']); unset($asset['anchor_units']);
    }
    output(['simulation'=>true,'version'=>'market-fixture-v1','assets'=>$assets]);
} catch (Throwable $e) {
    fail('Fixture unavailable',503,'service_unavailable');
}
