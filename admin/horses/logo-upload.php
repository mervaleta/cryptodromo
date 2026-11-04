<?php
declare(strict_types=1);
/** Upload an immutable raster token logo to PRIVATE storage; publishing remains a separate step. */
require __DIR__.'/../fixture/_auth.php';
require __DIR__.'/_store.php';
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD']??'')!=='POST')horse_problem('Método no permitido',405);
if ((int)($_SERVER['CONTENT_LENGTH']??0)>2300000)horse_problem('Logo demasiado grande (máximo 2 MB)',413);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
$host=(string)($_SERVER['HTTP_HOST']??'');
if ($origin===''||$host===''||strtolower((string)parse_url($origin,PHP_URL_HOST))!==strtolower((string)parse_url('http://'.$host,PHP_URL_HOST)))horse_problem('Origen no autorizado',403);
if (($site=$_SERVER['HTTP_SEC_FETCH_SITE']??'')!==''&&$site!=='same-origin')horse_problem('Solicitud externa',403);
session_name('crp_horses_admin');
session_set_cookie_params(['lifetime'=>0,'path'=>'/admin/horses/','secure'=>PHP_SAPI!=='cli-server','httponly'=>true,'samesite'=>'Strict']);
ini_set('session.use_strict_mode','1');
session_start();
$csrf=$_POST['csrf']??null;
if (!is_string($csrf)||!is_string($_SESSION['horse_csrf']??null)||!hash_equals($_SESSION['horse_csrf'],$csrf))horse_problem('CSRF inválido',403);
$symbol=$_POST['symbol']??null;
if (!is_string($symbol)||!in_array($symbol,horse_catalog(),true))horse_problem('Token inválido',400);
$uploaded=$_FILES['logo']??null;
if (!is_array($uploaded)||is_array($uploaded['error']??null)||($uploaded['error']??-1)!==UPLOAD_ERR_OK)horse_problem('Archivo no recibido o demasiado grande');
$tmp=$uploaded['tmp_name']??null;$size=$uploaded['size']??null;
if (!is_string($tmp)||!is_uploaded_file($tmp)||!is_int($size)||$size<1||$size>2097152)horse_problem('Logo inválido o superior a 2 MB');
$info=@getimagesize($tmp);
$allowed=[IMAGETYPE_PNG=>['png','image/png'],IMAGETYPE_JPEG=>['jpg','image/jpeg'],IMAGETYPE_WEBP=>['webp','image/webp']];
$type=is_array($info)?($info[2]??null):null;
if (!is_int($type)||!isset($allowed[$type])||($info[0]??0)<16||($info[1]??0)<16||($info[0]??0)>4096||($info[1]??0)>4096)horse_problem('Logo no válido: usá PNG, JPG o WebP de 16 a 4096 px');
$mime=(new finfo(FILEINFO_MIME_TYPE))->file($tmp);
if ($mime!==$allowed[$type][1])horse_problem('El contenido no coincide con el formato de la imagen');
[$dir]=horse_storage();$logos=$dir.'/logos';
if (!is_dir($logos)&&!@mkdir($logos,0700,true)&&!is_dir($logos))horse_problem('Almacenamiento privado no disponible',503);
$id=hash_file('sha256',$tmp);
$destination=$logos.'/'.$id.'.'.$allowed[$type][0];
if (!is_file($destination)) {
    $temporary=@tempnam($logos,'logo-');
    if ($temporary===false)horse_problem('No se pudo reservar almacenamiento',503);
    if (!move_uploaded_file($tmp,$temporary)){@unlink($temporary);horse_problem('No se pudo almacenar el logo',503);}
    @chmod($temporary,0600);
    if (!@rename($temporary,$destination)){@unlink($temporary);horse_problem('No se pudo confirmar el logo',503);}
}
horse_reply(['ok'=>true,'symbol'=>$symbol,'logoId'=>$id,'contentType'=>$mime,'size'=>$size,'previewUrl'=>'/admin/horses/logo.php?id='.$id]);
