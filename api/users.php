<?php
declare(strict_types=1);
/** Cryptódromo account API. No balances, wagers, wallets or race calculations. */
require_once __DIR__.'/users-lib.php';
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header('Vary: Cookie');
header('Access-Control-Allow-Credentials: false');
function crp_users_public(array $row): array {
    return [
        'alias'=>$row['alias'], 'avatar_url'=>$row['avatar_url'],
        'joined_at'=>(int)$row['created_at']
    ];
}
function crp_users_private(array $row): array {
    return crp_users_public($row) + [
        'id'=>(int)$row['id'], 'email'=>$row['email'],
        'name'=>$row['name'], 'timezone'=>$row['timezone'],
        'locale'=>$row['locale'], 'public_profile'=>(bool)$row['public_profile'],
        'notify_enabled'=>(bool)$row['notify_enabled'],
        'email_verified'=>(bool)$row['verified_at']
    ];
}
function crp_users_auth_required(PDO $db): array {
    $me=crp_users_current($db);
    if (!$me) crp_users_fail(401,'Iniciá sesión para continuar.');
    return $me;
}
function crp_users_json(): array {
    if (!str_starts_with(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE'] ?? '')[0])),
                         'application/json')) crp_users_fail(415,'Se requiere JSON.');
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) crp_users_fail(413,'Solicitud demasiado grande.');
    $raw=file_get_contents('php://input',false,null,0,8193);
    if ($raw === false || strlen($raw)>8192) crp_users_fail(413,'Solicitud demasiado grande.');
    $decoded=json_decode($raw);
    if (!($decoded instanceof stdClass)) crp_users_fail(400,'Solicitud inválida.');
    return (array)$decoded;
}
function crp_users_password(mixed $pass): string {
    if (!is_string($pass) || strlen($pass)<12 || strlen($pass)>128) {
        crp_users_fail(400,'La contraseña debe tener entre 12 y 128 caracteres.');
    }
    return $pass;
}
function crp_users_email(mixed $email): string {
    if (!is_string($email)) crp_users_fail(400,'Correo inválido.');
    $email=strtolower(trim($email));
    if (strlen($email)>254 || !filter_var($email,FILTER_VALIDATE_EMAIL)) crp_users_fail(400,'Correo inválido.');
    return $email;
}
function crp_users_mail_configured(): bool {
    return (bool)getenv('CRP_MAIL_API_KEY') && (bool)getenv('CRP_MAIL_FROM') &&
        filter_var(getenv('CRP_MAIL_FROM'),FILTER_VALIDATE_EMAIL);
}
function crp_users_send_link(PDO $db,int $uid,string $email,string $purpose): bool {
    if (!crp_users_mail_configured()) return false;
    $site=(string)(getenv('CRP_SITE_URL') ?: 'https://race.cryptodromo.com');
    if (!preg_match('~^https://[a-z0-9.-]+$~i',$site)) return false;
    $token=crp_users_issue_token($db,$uid,$purpose);
    $url=$site.'/cuenta/?'.($purpose==='reset'?'reset':'verify').'='.rawurlencode($token);
    $subject=$purpose==='reset'?'Restablecer contraseña · Cryptódromo':'Verificar correo · Cryptódromo';
    $body="Ingresá a este enlace (válido 30 minutos):\n".$url."\nSi no solicitaste esta operación, ignorá este correo.";
    $sent=crp_users_send_mail($email,$subject,$body);
    if (!$sent) {
        $db->prepare('DELETE FROM user_action_tokens WHERE user_id=? AND purpose=?')
           ->execute([$uid,$purpose]);
        error_log('Cryptódromo mail dispatch unavailable: '.$purpose);
    }
    return $sent;
}
try {
    $db=crp_users_db();
    crp_users_secret();
    crp_users_schema_ready($db);
    crp_users_session();
    $action=(string)($_GET['action'] ?? 'bootstrap');
    $method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method==='GET') {
        if ($action==='bootstrap') {
            $me=crp_users_current($db);
            crp_users_reply(200,['ok'=>true,'csrf'=>$_SESSION['csrf'],
                'user'=>$me?crp_users_private($me):null,
                'mail_enabled'=>crp_users_mail_configured()]);
        }
        if ($action==='profile') {
            $alias=(string)($_GET['alias'] ?? '');
            if (!crp_users_safe_alias($alias)) crp_users_fail(404,'Perfil no encontrado.');
            $q=$db->prepare('SELECT alias,avatar_url,created_at FROM user_profiles WHERE alias=? AND public_profile=1');
            $q->execute([$alias]);
            $row=$q->fetch();
            if (!$row) crp_users_fail(404,'Perfil no encontrado.');
            crp_users_reply(200,['ok'=>true,'profile'=>crp_users_public($row)]);
        }
        $me=crp_users_auth_required($db);
        $uid=(int)$me['id'];
        if ($action==='favorites') {
            $q=$db->prepare('SELECT symbol,added_at FROM user_favorites WHERE user_id=? ORDER BY added_at DESC');
            $q->execute([$uid]);
            crp_users_reply(200,['ok'=>true,'favorites'=>$q->fetchAll()]);
        }
        if ($action==='notifications') {
            $q=$db->prepare('SELECT id,kind,title,body,created_at,read_at FROM user_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50');
            $q->execute([$uid]);
            crp_users_reply(200,['ok'=>true,'notifications'=>$q->fetchAll()]);
        }
        if ($action==='activity') {
            $q=$db->prepare('SELECT kind,created_at FROM user_security_events WHERE user_id=? ORDER BY created_at DESC LIMIT 30');
            $q->execute([$uid]);
            crp_users_reply(200,['ok'=>true,'activity'=>$q->fetchAll()]);
        }
        if ($action==='sessions') {
            $q=$db->prepare('SELECT COUNT(*) FROM user_sessions WHERE user_id=? AND expires_at>?');
            $q->execute([$uid,time()]);
            crp_users_reply(200,['ok'=>true,'active_sessions'=>(int)$q->fetchColumn()]);
        }
        crp_users_fail(404,'Acción desconocida.');
    }
    if ($method!=='POST') { header('Allow: GET, POST'); crp_users_fail(405,'Método no permitido.'); }
    $data=crp_users_json();
    crp_users_csrf($data);
    $ip=(string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    switch ($action) {
      case 'register':
        crp_users_throttle($db,'register-ip',$ip,5);
        $email=crp_users_email($data['email'] ?? null);
        $alias=trim((string)($data['alias'] ?? ''));
        if (!crp_users_safe_alias($alias)) crp_users_fail(400,'Alias: entre 3 y 24 letras, números o guiones bajos.');
        $password=crp_users_password($data['password'] ?? null);
        if (!defined('PASSWORD_ARGON2ID')) crp_users_fail(503,'Hashing seguro no disponible.');
        $hash=password_hash($password,PASSWORD_ARGON2ID);
        $name=$alias; $now=time();
        $db->beginTransaction();
        try {
            $db->prepare('INSERT INTO users(email,google_id,name,avatar_url,balance_credits) VALUES(?,NULL,?,?,0)')
               ->execute([$email,$name,'']);
            $uid=(int)$db->lastInsertId();
            $db->prepare('INSERT INTO user_profiles(user_id,alias,created_at,updated_at) VALUES(?,?,?,?)')
               ->execute([$uid,$alias,$now,$now]);
            $db->prepare('INSERT INTO user_credentials(user_id,password_hash,changed_at) VALUES(?,?,?)')
               ->execute([$uid,$hash,$now]);
            crp_users_event($db,$uid,'register');
            $db->commit();
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            if (in_array((string)$e->getCode(),['23000','19'],true)) crp_users_fail(409,'No se pudo crear la cuenta con esos datos.');
            throw $e;
        }
        crp_users_login($db,$uid);
        $sent=crp_users_send_link($db,$uid,$email,'verify');
        $me=crp_users_current($db);
        crp_users_reply(201,['ok'=>true,'user'=>crp_users_private($me),'verification_email_sent'=>$sent]);
      case 'login':
        crp_users_throttle($db,'login-ip',$ip,12);
        $email=crp_users_email($data['email'] ?? null);
        crp_users_throttle($db,'login-account',$email,8);
        $pass=(string)($data['password'] ?? '');
        $q=$db->prepare('SELECT u.id,c.password_hash FROM users u LEFT JOIN user_credentials c ON c.user_id=u.id WHERE u.email=?');
        $q->execute([$email]);
        $row=$q->fetch();
        // Same generic response for missing user, federated-only user and wrong password.
        if (!$row || !$row['password_hash'] || !password_verify($pass,(string)$row['password_hash'])) {
            crp_users_fail(401,'Correo o contraseña incorrectos.');
        }
        $uid=(int)$row['id'];
        crp_users_ensure_profile($db,$uid);
        crp_users_login($db,$uid);
        crp_users_event($db,$uid,'login');
        crp_users_reply(200,['ok'=>true,'user'=>crp_users_private(crp_users_current($db)),'csrf'=>$_SESSION['csrf']]);
      case 'request_reset':
        crp_users_throttle($db,'reset-ip',$ip,5);
        if (!crp_users_mail_configured()) crp_users_fail(503,'Recuperación por correo no habilitada.');
        $email=crp_users_email($data['email'] ?? null);
        $q=$db->prepare('SELECT u.id FROM users u JOIN user_credentials c ON c.user_id=u.id WHERE u.email=?');
        $q->execute([$email]);
        $row=$q->fetch();
        if ($row) crp_users_send_link($db,(int)$row['id'],$email,'reset');
        crp_users_reply(202,['ok'=>true,'message'=>'Si la cuenta existe, recibirás instrucciones si el correo pudo procesarse.']);
      case 'reset_password':
        crp_users_throttle($db,'reset-submit-ip',$ip,8);
        $token=(string)($data['token'] ?? '');
        $hash=password_hash(crp_users_password($data['password'] ?? null), PASSWORD_ARGON2ID);
        $uid=crp_users_consume_token($db,$token,'reset');
        if (!$uid) crp_users_fail(400,'Enlace inválido o vencido.');
        $db->beginTransaction();
        try {
          $db->prepare('UPDATE user_credentials SET password_hash=?,changed_at=? WHERE user_id=?')
             ->execute([$hash,time(),$uid]);
          $db->prepare('DELETE FROM user_sessions WHERE user_id=?')->execute([$uid]);
          crp_users_event($db,$uid,'password_reset');
          $db->commit();
        } catch (Throwable $e) { if($db->inTransaction())$db->rollBack(); throw $e; }
        crp_users_reply(200,['ok'=>true,'message'=>'Contraseña actualizada. Iniciá sesión de nuevo.']);
      case 'verify_email':
        $uid=crp_users_consume_token($db,(string)($data['token'] ?? ''),'verify');
        if (!$uid) crp_users_fail(400,'Enlace inválido o vencido.');
        $db->prepare('UPDATE user_profiles SET verified_at=?,updated_at=? WHERE user_id=?')
           ->execute([time(),time(),$uid]);
        crp_users_event($db,$uid,'email_verified');
        crp_users_reply(200,['ok'=>true]);
      default: break;
    }
    $me=crp_users_auth_required($db);
    $uid=(int)$me['id'];
    switch ($action) {
      case 'logout':
      case 'logout_all':
        crp_users_event($db,$uid,$action);
        crp_users_logout($db,$action==='logout_all');
        crp_users_reply(200,['ok'=>true,'csrf'=>$_SESSION['csrf']]);
      case 'update_profile':
        $alias=trim((string)($data['alias'] ?? $me['alias']));
        if (!crp_users_safe_alias($alias)) crp_users_fail(400,'Alias inválido.');
        $timezone=(string)($data['timezone'] ?? $me['timezone']);
        if (!in_array($timezone,timezone_identifiers_list(),true)) crp_users_fail(400,'Zona horaria inválida.');
        $locale=(string)($data['locale'] ?? $me['locale']);
        if (!in_array($locale,['es','en','pt'],true)) crp_users_fail(400,'Idioma inválido.');
        $public=($data['public_profile'] ?? (bool)$me['public_profile']) === true ? 1 : 0;
        $notify=($data['notify_enabled'] ?? (bool)$me['notify_enabled']) === true ? 1 : 0;
        try {
          $db->prepare('UPDATE user_profiles SET alias=?,timezone=?,locale=?,public_profile=?,notify_enabled=?,updated_at=? WHERE user_id=?')
             ->execute([$alias,$timezone,$locale,$public,$notify,time(),$uid]);
        } catch(PDOException $e) {
          if(in_array((string)$e->getCode(),['23000','19'],true)) crp_users_fail(409,'Alias no disponible.');
          throw $e;
        }
        crp_users_event($db,$uid,'profile_updated');
        crp_users_reply(200,['ok'=>true,'user'=>crp_users_private(crp_users_current($db))]);
      case 'favorite':
        $symbol=strtoupper(trim((string)($data['symbol'] ?? '')));
        if (!in_array($symbol,crp_users_roster(),true)) crp_users_fail(400,'Caballo no registrado en el roster oficial.');
        if (($data['enabled'] ?? null) === true) {
            $q=$db->prepare('SELECT user_id FROM user_favorites WHERE user_id=? AND symbol=?');
            $q->execute([$uid,$symbol]);
            if (!$q->fetch()) {
                $db->prepare('INSERT INTO user_favorites(user_id,symbol,added_at) VALUES(?,?,?)')
                   ->execute([$uid,$symbol,time()]);
            }
        } elseif (($data['enabled'] ?? null) === false) {
            $db->prepare('DELETE FROM user_favorites WHERE user_id=? AND symbol=?')->execute([$uid,$symbol]);
        } else crp_users_fail(400,'Estado inválido.');
        crp_users_event($db,$uid,'favorite_changed');
        crp_users_reply(200,['ok'=>true]);
      case 'read_notification':
        $id=filter_var($data['id'] ?? null,FILTER_VALIDATE_INT);
        if (!$id || $id<1) crp_users_fail(400,'Notificación inválida.');
        $db->prepare('UPDATE user_notifications SET read_at=? WHERE id=? AND user_id=? AND read_at IS NULL')
           ->execute([time(),$id,$uid]);
        crp_users_reply(200,['ok'=>true]);
      case 'request_verification':
        if ($me['verified_at']) crp_users_reply(200,['ok'=>true,'already_verified'=>true]);
        crp_users_throttle($db,'verify-user',(string)$uid,3);
        if (!crp_users_mail_configured()) crp_users_fail(503,'Verificación por correo no habilitada.');
        $sent=crp_users_send_link($db,$uid,$me['email'],'verify');
        if (!$sent) crp_users_fail(503,'No se pudo enviar el correo.');
        crp_users_reply(200,['ok'=>true,'verification_email_sent'=>true]);
      case 'change_password':
        $current=(string)($data['current_password'] ?? '');
        $new=crp_users_password($data['password'] ?? null);
        $q=$db->prepare('SELECT password_hash FROM user_credentials WHERE user_id=?');
        $q->execute([$uid]); $stored=$q->fetchColumn();
        if (!$stored || !password_verify($current,(string)$stored)) crp_users_fail(401,'Credenciales inválidas.');
        $db->prepare('UPDATE user_credentials SET password_hash=?,changed_at=? WHERE user_id=?')
           ->execute([password_hash($new,PASSWORD_ARGON2ID),time(),$uid]);
        crp_users_event($db,$uid,'password_changed');
        crp_users_logout($db,true);
        crp_users_login($db,$uid);
        crp_users_reply(200,['ok'=>true,'csrf'=>$_SESSION['csrf']]);
      default:
        crp_users_fail(404,'Acción desconocida.');
    }
} catch (Throwable $e) {
    error_log('Cryptódromo users: '.get_class($e));
    crp_users_fail(503,'Servicio de usuarios temporalmente no disponible.');
}
