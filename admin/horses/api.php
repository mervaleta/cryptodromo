<?php
declare(strict_types=1);
require __DIR__.'/../fixture/_auth.php';
require __DIR__.'/_store.php';
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');
session_name('crp_horses_admin');
session_set_cookie_params(['lifetime'=>0,'path'=>'/admin/horses/','secure'=>PHP_SAPI!=='cli-server','httponly'=>true,'samesite'=>'Strict']);
ini_set('session.use_strict_mode','1');
session_start();
if (empty($_SESSION['horse_csrf']))$_SESSION['horse_csrf']=bin2hex(random_bytes(32));
[$dir,$file]=horse_storage();
$method=$_SERVER['REQUEST_METHOD']??'GET';
if ($method==='GET') {
    horse_reply(['ok'=>true,'schema'=>'cryptodromo-horses-v1','csrf'=>$_SESSION['horse_csrf'],
        'symbols'=>horse_catalog(), ...horse_read_state($file)]);
}
if ($method!=='POST')horse_problem('Método no permitido',405);
if ((int)($_SERVER['CONTENT_LENGTH']??0)>20000)horse_problem('Solicitud demasiado grande',413);
if (!str_starts_with(strtolower((string)($_SERVER['CONTENT_TYPE']??'')),'application/json'))horse_problem('Se requiere JSON',415);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
$host=(string)($_SERVER['HTTP_HOST']??'');
if ($origin===''||$host===''||strtolower((string)parse_url($origin,PHP_URL_HOST))!==strtolower((string)parse_url('http://'.$host,PHP_URL_HOST))) {
    horse_problem('Origen no autorizado',403);
}
if (($fetchSite=$_SERVER['HTTP_SEC_FETCH_SITE']??'')!=='' && $fetchSite!=='same-origin')horse_problem('Solicitud externa',403);
$raw=file_get_contents('php://input');
$body=json_decode($raw===false?'':$raw,true);
if (!is_array($body)||array_is_list($body))horse_problem('JSON inválido');
horse_exact_keys($body,['csrf','revision','action','symbol','profile'],'solicitud');
if (!is_string($body['csrf']??null)||!hash_equals($_SESSION['horse_csrf'],$body['csrf']))horse_problem('CSRF inválido',403);
if (!isset($body['revision'])||!is_int($body['revision'])||$body['revision']<0)horse_problem('Revisión inválida');
$action=$body['action']??'';
if (!in_array($action,['save','publish','reset'],true))horse_problem('Acción inválida');
$symbol=$body['symbol']??'';
if (!is_string($symbol)||!in_array($symbol,horse_catalog(),true))horse_problem('Token ajeno al catálogo oficial');
$profile=$action==='reset'?null:horse_validate_profile($body['profile']??null);
if ($profile!==null&&$profile['name']==='')horse_problem('El caballo debe tener nombre');
if (!is_dir($dir)&&!@mkdir($dir,0700,true)&&!is_dir($dir))horse_problem('No se pudo crear el almacenamiento privado',503);
$lock=@fopen($dir.'/profiles.lock','c');
if (!$lock||!flock($lock,LOCK_EX))horse_problem('No se pudo bloquear el editor',503);
$state=horse_read_state($file);
if ($state['revision']!==$body['revision']) {
    flock($lock,LOCK_UN);fclose($lock);
    horse_problem('Conflicto de edición. Recargá y revisá los cambios antes de guardar.',409);
}
if ($action==='save')$state['drafts'][$symbol]=$profile;
if ($action==='publish') {
    $state['drafts'][$symbol]=$profile;
    $state['published'][$symbol]=$profile;
    ++$state['publishedRevision'];
    $state['publishedAt']=gmdate('c');
}
if ($action==='reset') {
    unset($state['drafts'][$symbol]);
    if (isset($state['published'][$symbol])) {
        unset($state['published'][$symbol]);
        ++$state['publishedRevision'];$state['publishedAt']=gmdate('c');
    }
}
$now=gmdate('c');
$temp=tempnam($dir,'horse-');
if ($temp===false)horse_problem('No se pudo crear el archivo temporal',503);
chmod($temp,0600);
$bytes=json_encode($state,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
if (@file_put_contents($temp,$bytes,LOCK_EX)===false||!@rename($temp,$file)) {
    @unlink($temp);flock($lock,LOCK_UN);fclose($lock);horse_problem('No se pudo guardar; no se modificaron las fichas',503);
}
$log=['time'=>$now,'user'=>(string)getenv('CRP_FIXTURE_ADMIN_USER'),'action'=>$action,'symbol'=>$symbol,
    'revision'=>$state['revision'],'publishedRevision'=>$state['publishedRevision'],'sha256'=>hash('sha256',$bytes)];
@file_put_contents($dir.'/audit.jsonl',json_encode($log,JSON_UNESCAPED_SLASHES)."\n",FILE_APPEND|LOCK_EX);
flock($lock,LOCK_UN);fclose($lock);
horse_reply(['ok'=>true,'schema'=>'cryptodromo-horses-v1', ...$state]);
