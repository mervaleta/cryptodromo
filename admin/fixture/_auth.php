<?php
declare(strict_types=1);
/** Private admin authentication. Configure BOTH values outside Git (Hostinger PHP env). */
ini_set('display_errors','0');
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header('Content-Security-Policy: frame-ancestors \'none\'');
function crp_admin_fail(int $status,string $body): never {
 http_response_code($status);
 header('Content-Type: text/plain; charset=utf-8');
 echo $body;exit;
}
function crp_admin_auth(): void {
 $configuredUser=getenv('CRP_FIXTURE_ADMIN_USER');
 $hash=getenv('CRP_FIXTURE_ADMIN_PASSWORD_HASH');
 if (!is_string($configuredUser)||$configuredUser===''||!is_string($hash)||$hash==='') crp_admin_fail(503,'Administracion no configurada');
 // Only allow credentials over HTTPS, including when running behind a trusted configured proxy.
 $https=(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off');
 if (!$https && PHP_SAPI!=='cli-server') crp_admin_fail(403,'Se requiere HTTPS');
 $username=$_SERVER['PHP_AUTH_USER']??'';
 $password=$_SERVER['PHP_AUTH_PW']??'';
 if (!is_string($username)||!is_string($password)||!hash_equals($configuredUser,$username)||!password_verify($password,$hash)){
   header('WWW-Authenticate: Basic realm="Cryptodromo - Direccion de Carreras", charset="UTF-8"');
   crp_admin_fail(401,'Autenticacion requerida');
 }
}
crp_admin_auth();
