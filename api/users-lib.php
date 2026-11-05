<?php
declare(strict_types=1);
/** Cryptódromo identity primitives. Only the existing users table is authoritative. */
function crp_users_db(): PDO {
    static $db = null;
    if ($db instanceof PDO) return $db;
    $dsn = trim((string)(getenv('CRP_USERS_DSN') ?: ''));
    $dbUser = getenv('DB_USER') ?: '';
    if ($dsn === '') {
        if ($dbUser !== '' && getenv('DB_NAME')) {
            $dsn = 'mysql:host=' . (getenv('DB_HOST') ?: 'localhost') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4';
        } else {
            $path = getenv('CRP_AUTH_SQLITE_PATH') ?: '';
            if (!$path) throw new RuntimeException('User storage not configured');
            $dsn = 'sqlite:' . $path;
        }
    }
    if (!str_starts_with($dsn, 'sqlite:') && !str_starts_with($dsn, 'mysql:')) {
        throw new RuntimeException('Unsupported private database');
    }
    if (str_starts_with($dsn, 'sqlite:')) {
        $path = substr($dsn, 7);
        if ($path === '' || $path[0] !== '/' || str_contains($path, "\0")) {
            throw new RuntimeException('SQLite must use absolute private path');
        }
        $parent = realpath(dirname($path));
        $root = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__)));
        if (!$parent || ($root && ($parent === $root || str_starts_with($parent . '/', rtrim($root, '/') . '/')))) {
            throw new RuntimeException('SQLite cannot reside under public document root');
        }
        if (PHP_SAPI !== 'cli' && !is_file($path)) throw new RuntimeException('User database not migrated');
    }
    $db = new PDO($dsn, $dbUser, getenv('DB_PASS') ?: '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5
    ]);
    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $db->exec('PRAGMA foreign_keys=ON');
        $db->exec('PRAGMA busy_timeout=5000');
    }
    return $db;
}
function crp_users_secret(): string {
    $secret = (string)(getenv('CRP_USERS_SECRET') ?: '');
    if (strlen($secret) < 32) throw new RuntimeException('User secret not configured');
    return $secret;
}
function crp_users_schema_ready(PDO $db): void {
    $db->query('SELECT user_id FROM user_profiles LIMIT 1');
    $db->query('SELECT session_hash FROM user_sessions LIMIT 1');
}
function crp_users_test_http(): bool {
    return PHP_SAPI === 'cli-server'
      && getenv('CRP_USERS_TEST_HTTP') === '1'
      && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
}
function crp_users_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = !crp_users_test_http();
    if ($secure && (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off')
      && PHP_SAPI !== 'cli') throw new RuntimeException('HTTPS required');
    session_name($secure ? '__Host-crp_users' : 'crp_users_test');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '604800');
    session_set_cookie_params([
        'lifetime' => 604800, 'path' => '/', 'secure' => $secure,
        'httponly' => true, 'samesite' => 'Lax'
    ]);
    session_start();
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
}
function crp_users_safe_alias(string $alias): bool {
    return (bool)preg_match('/^[a-zA-Z0-9_]{3,24}$/D', $alias);
}
function crp_users_ensure_profile(PDO $db, int $uid, string $avatar = '', bool $verified = false): void {
    $q = $db->prepare('SELECT user_id FROM user_profiles WHERE user_id=?');
    $q->execute([$uid]);
    if ($q->fetch()) {
        if ($verified) {
            $db->prepare('UPDATE user_profiles SET verified_at=COALESCE(verified_at, ?) WHERE user_id=?')
              ->execute([time(),$uid]);
        }
        return;
    }
    $alias = 'rider_' . $uid;
    $q = $db->prepare('INSERT INTO user_profiles(user_id,alias,avatar_url,verified_at,created_at,updated_at) VALUES(?,?,?,?,?,?)');
    $now = time();
    $q->execute([$uid,$alias,$avatar,$verified ? $now : null,$now,$now]);
}
function crp_users_login(PDO $db, int $uid): void {
    crp_users_session();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    $now = time();
    $hash = hash('sha256', session_id());
    $q = $db->prepare('INSERT INTO user_sessions(session_hash,user_id,created_at,expires_at,last_seen_at) VALUES(?,?,?,?,?)');
    $q->execute([$hash,$uid,$now,$now+604800,$now]);
    $_SESSION['uid'] = $uid;
}
function crp_users_current(PDO $db): ?array {
    crp_users_session();
    $uid = (int)($_SESSION['uid'] ?? 0);
    if ($uid <= 0) return null;
    $hash = hash('sha256', session_id());
    $q = $db->prepare('SELECT u.id,u.email,u.name,p.alias,p.avatar_url,p.timezone,p.locale,
      p.public_profile,p.notify_enabled,p.verified_at,p.created_at,s.expires_at,s.last_seen_at
      FROM user_sessions s JOIN users u ON u.id=s.user_id
      JOIN user_profiles p ON p.user_id=u.id
      WHERE s.session_hash=? AND s.user_id=? AND s.expires_at>?');
    $q->execute([$hash,$uid,time()]);
    $row = $q->fetch();
    if (!$row) { unset($_SESSION['uid']); return null; }
    if (time()-(int)$row['last_seen_at'] > 300) {
        $db->prepare('UPDATE user_sessions SET last_seen_at=? WHERE session_hash=?')->execute([time(),$hash]);
    }
    return $row;
}
function crp_users_logout(PDO $db, bool $all = false): void {
    crp_users_session();
    $uid = (int)($_SESSION['uid'] ?? 0);
    if ($uid) {
        if ($all) $db->prepare('DELETE FROM user_sessions WHERE user_id=?')->execute([$uid]);
        else $db->prepare('DELETE FROM user_sessions WHERE session_hash=? AND user_id=?')
             ->execute([hash('sha256',session_id()),$uid]);
    }
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
}
function crp_users_csrf(array $data): void {
    crp_users_session();
    $expected = (string)($_SESSION['csrf'] ?? '');
    if (!$expected || !is_string($data['csrf'] ?? null) ||
        !hash_equals($expected, $data['csrf'])) crp_users_fail(403, 'Sesión vencida; recargá la página.');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $host = strtolower((string)parse_url('https://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST));
        if (strtolower((string)parse_url($origin, PHP_URL_HOST)) !== $host ||
            (!crp_users_test_http() && parse_url($origin, PHP_URL_SCHEME) !== 'https')) {
            crp_users_fail(403, 'Origen no permitido.');
        }
    }
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') crp_users_fail(403, 'Origen no permitido.');
}
function crp_users_reply(int $code, array $body): never {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_SLASHES);
    exit;
}
function crp_users_fail(int $code, string $msg): never { crp_users_reply($code, ['ok'=>false,'error'=>$msg]); }
function crp_users_event(PDO $db, ?int $uid, string $kind): void {
    $db->prepare('INSERT INTO user_security_events(user_id,kind,created_at) VALUES(?,?,?)')
      ->execute([$uid,$kind,time()]);
}
function crp_users_throttle(PDO $db, string $kind, string $subject, int $limit = 8): void {
    $key = hash_hmac('sha256', $kind . ':' . $subject, crp_users_secret());
    $now = time();
    $q = $db->prepare('SELECT attempts,window_start FROM user_rate_limits WHERE limiter_key=?');
    $q->execute([$key]);
    $row = $q->fetch();
    if ($row && $now-(int)$row['window_start'] < 900 && (int)$row['attempts'] >= $limit) {
        crp_users_fail(429,'Demasiados intentos. Probá más tarde.');
    }
    if ($row) {
        $db->prepare('UPDATE user_rate_limits SET attempts=?,window_start=? WHERE limiter_key=?')
          ->execute([$now-(int)$row['window_start'] >= 900 ? 1 : (int)$row['attempts']+1,
                     $now-(int)$row['window_start'] >= 900 ? $now : (int)$row['window_start'],$key]);
    } else {
        $db->prepare('INSERT INTO user_rate_limits(limiter_key,attempts,window_start) VALUES(?,1,?)')
          ->execute([$key,$now]);
    }
}
function crp_users_roster(): array {
    $fixture = json_decode((string)file_get_contents(dirname(__DIR__) . '/stables/official-week-v1.json'),true);
    if (!is_array($fixture) || count($fixture['symbols'] ?? []) !== 100) {
        throw new RuntimeException('Official horse roster unavailable');
    }
    return $fixture['symbols'];
}
function crp_users_send_mail(string $to, string $subject, string $body): bool {
    $api = (string)(getenv('CRP_MAIL_API_KEY') ?: '');
    $from = (string)(getenv('CRP_MAIL_FROM') ?: '');
    if ($api === '' || !filter_var($from, FILTER_VALIDATE_EMAIL) || !function_exists('curl_init')) return false;
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>8,
        CURLOPT_CONNECTTIMEOUT=>3, CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2, CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$api,'Content-Type: application/json'],
        CURLOPT_POSTFIELDS=>json_encode(['from'=>$from,'to'=>[$to],'subject'=>$subject,'text'=>$body]),
    ]);
    $result=curl_exec($ch);
    $status=curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return is_string($result) && $status >= 200 && $status < 300;
}
function crp_users_issue_token(PDO $db, int $uid, string $purpose): string {
    $token = bin2hex(random_bytes(32));
    $db->prepare('DELETE FROM user_action_tokens WHERE user_id=? AND purpose=?')
      ->execute([$uid,$purpose]);
    $db->prepare('INSERT INTO user_action_tokens(token_hash,user_id,purpose,expires_at,created_at) VALUES(?,?,?,?,?)')
      ->execute([hash('sha256',$token),$uid,$purpose,time()+1800,time()]);
    return $token;
}
function crp_users_consume_token(PDO $db, string $token, string $purpose): ?int {
    if (!preg_match('/^[0-9a-f]{64}$/D',$token)) return null;
    $db->beginTransaction();
    try {
        $q=$db->prepare('SELECT user_id FROM user_action_tokens WHERE token_hash=? AND purpose=? AND expires_at>? AND used_at IS NULL');
        $q->execute([hash('sha256',$token),$purpose,time()]);
        $row=$q->fetch();
        if (!$row) { $db->rollBack(); return null; }
        $db->prepare('UPDATE user_action_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL')
          ->execute([time(),hash('sha256',$token)]);
        $db->commit();
        return (int)$row['user_id'];
    } catch (Throwable $e) { if($db->inTransaction())$db->rollBack(); throw $e; }
}
