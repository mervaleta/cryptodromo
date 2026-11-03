<?php
declare(strict_types=1);
require __DIR__.'/_auth.php';
header('Content-Type: application/json; charset=utf-8');
session_name('crp_fixture_admin');
session_set_cookie_params(['lifetime'=>0,'path'=>'/admin/fixture/','secure'=>PHP_SAPI!=='cli-server','httponly'=>true,'samesite'=>'Strict']);
ini_set('session.use_strict_mode','1');
session_start();
if(empty($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(24));
function reply(array $data,int $code=200): never {http_response_code($code);echo json_encode($data,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
function problem(string $why,int $code=400): never {reply(['ok'=>false,'error'=>$why],$code);}
function storage(): array {
 $directory=dirname(__DIR__,3).'/cryptodromo-fixture-private';
 if(PHP_SAPI==='cli-server' && getenv('CRP_FIXTURE_TEST_DIR'))$directory=(string)getenv('CRP_FIXTURE_TEST_DIR');
 if(!is_dir($directory) && !mkdir($directory,0700,true) && !is_dir($directory))problem('No se puede abrir el almacenamiento privado',503);
 $file=$directory.'/fixture-drafts-v1.json';
 return [$directory,$file];
}
function readState(string $file): array {
 if(!is_file($file))return ['revision'=>0,'drafts'=>[]];
 $s=json_decode((string)file_get_contents($file),true);
 if(!is_array($s)||!isset($s['revision'])||!is_int($s['revision'])||!is_array($s['drafts']))problem('Estado privado corrupto',503);
 return $s;
}
function validateDrafts(mixed $input): array {
 if(!is_array($input)||count($input)>3360)problem('Borradores inválidos');
 $fixture=json_decode((string)file_get_contents(dirname(__DIR__,2).'/stables/official-week-v1.json'),true);
 if(!is_array($fixture)||($fixture['version']??'')!=='synthetic-v1'||count($fixture['symbols']??[])!==100)problem('Catálogo oficial no disponible',503);
 $symbols=$fixture['symbols'];
 $index=array_flip($symbols);$clean=[];
 foreach($input as $key=>$runners) {
  if(!is_string($key)||!preg_match('/^[0-6]:(?:0|[1-9][0-9]{0,2})$/',$key))problem('Identificador de carrera inválido');
  [, $slot]=explode(':',$key);
  if((int)$slot>=480)problem('Carrera fuera de rango');
  if(!is_array($runners)||count($runners)!==12||array_values($runners)!==$runners)problem('Se requieren 12 corredores');
  $seen=[];$tier=[0,0,0];
  foreach($runners as $s){
   if(!is_string($s)||!isset($index[$s])||isset($seen[$s]))problem('Símbolo duplicado o inválido');
   $seen[$s]=true;$i=$index[$s];$tier[$i<8?0:($i<32?1:2)]++;
  }
  if($tier!==[4,4,4])problem('La carrera requiere 4 estrellas, 4 principales y 4 desafíos');
  $clean[$key]=$runners;
 }
 ksort($clean,SORT_STRING);
 return $clean;
}
[$dir,$file]=storage();
if($_SERVER['REQUEST_METHOD']==='GET'){
 $state=readState($file);
 reply(['ok'=>true,'csrf'=>$_SESSION['csrf'],'revision'=>$state['revision'],'drafts'=>$state['drafts'],'published'=>false]);
}
if($_SERVER['REQUEST_METHOD']!=='POST')problem('Método no permitido',405);
if((int)($_SERVER['CONTENT_LENGTH']??0)>450000)problem('Solicitud excesiva',413);
if(!str_contains($_SERVER['CONTENT_TYPE']??'','application/json'))problem('Se requiere JSON',415);
$origin=$_SERVER['HTTP_ORIGIN']??'';
$host=$_SERVER['HTTP_HOST']??'';
if(!$origin||!in_array(parse_url($origin,PHP_URL_HOST),[parse_url('http://'.$host,PHP_URL_HOST)],true))problem('Origen no autorizado',403);
$fetchSite=$_SERVER['HTTP_SEC_FETCH_SITE']??'';
if($fetchSite!==''&&$fetchSite!=='same-origin')problem('Solicitud externa',403);
$body=json_decode(file_get_contents('php://input')?:'',true);
if(!is_array($body))problem('JSON inválido');
if(!hash_equals((string)$_SESSION['csrf'],(string)($body['csrf']??'')))problem('Token de sesión incorrecto',403);
if(!isset($body['revision'])||!is_int($body['revision'])||$body['revision']<0)problem('Revisión inválida');
$drafts=validateDrafts($body['drafts']??null);
$lock=fopen($dir.'/fixture-drafts.lock','c');
if(!$lock||!flock($lock,LOCK_EX))problem('No se puede bloquear el estado privado',503);
$current=readState($file);
if($current['revision']!==$body['revision']){flock($lock,LOCK_UN);fclose($lock);problem('Conflicto: otro administrador modificó los borradores. Recargá la página.',409);}
$next=['revision'=>$current['revision']+1,'drafts'=>$drafts,'modifiedAt'=>gmdate('c')];
$tmp=tempnam($dir,'draft-');
if($tmp===false){flock($lock,LOCK_UN);problem('No se pudo crear el borrador',503);}
chmod($tmp,0600);
if(file_put_contents($tmp,json_encode($next,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE),LOCK_EX)===false||!rename($tmp,$file)){@unlink($tmp);flock($lock,LOCK_UN);problem('No se pudo conservar el borrador',503);}
file_put_contents($dir.'/fixture-drafts-audit.jsonl',json_encode(['revision'=>$next['revision'],'at'=>$next['modifiedAt'],'admin'=>getenv('CRP_FIXTURE_ADMIN_USER'),'count'=>count($drafts),'hash'=>hash('sha256',json_encode($drafts))],JSON_UNESCAPED_SLASHES)."\n",FILE_APPEND|LOCK_EX);
flock($lock,LOCK_UN);fclose($lock);
reply(['ok'=>true,'revision'=>$next['revision'],'drafts'=>$drafts,'published'=>false]);
