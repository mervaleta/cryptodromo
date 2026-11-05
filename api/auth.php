<?php
declare(strict_types=1);
/**
 * Cryptodromo demo identity endpoint.
 * SECURITY: never trust email/google_id supplied by the browser.
 * A verified Google ID token and configured OAuth client ID are mandatory.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    respond(200, ['status' => 'ready', 'service' => 'Cryptodromo Auth API', 'mode' => 'verified-google-id-token']);
}
if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['status' => 'error', 'message' => 'Método no permitido']);
}
if (($_GET['action'] ?? '') !== 'login_google') {
    respond(404, ['status' => 'error', 'message' => 'Acción desconocida']);
}
if (!str_starts_with(strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])), 'application/json')) {
    respond(415, ['status' => 'error', 'message' => 'Se requiere JSON']);
}

$clientId = trim((string) getenv('GOOGLE_OAUTH_CLIENT_ID'));
if ($clientId === '') {
    respond(503, ['status' => 'error', 'message' => 'Inicio de sesión no configurado']);
}
$body = file_get_contents('php://input', false, null, 0, 8193);
if ($body === false || strlen($body) > 8192) {
    respond(413, ['status' => 'error', 'message' => 'Solicitud demasiado grande']);
}
$input = json_decode($body, true);
$idToken = is_array($input) ? ($input['id_token'] ?? '') : '';
if (!is_string($idToken) || strlen($idToken) > 6000 || strlen($idToken) < 32) {
    respond(400, ['status' => 'error', 'message' => 'Token de identidad requerido']);
}

// Exchange no personal data with user-controlled URLs: fixed Google verification endpoint.
if (!function_exists('curl_init')) {
    respond(503, ['status' => 'error', 'message' => 'Verificador no disponible']);
}
$ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($idToken));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 6,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
]);
$verification = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);
if (!is_string($verification) || $status !== 200) {
    respond(401, ['status' => 'error', 'message' => 'Token inválido']);
}
$claims = json_decode($verification, true);
if (!is_array($claims) ||
    !hash_equals($clientId, (string) ($claims['aud'] ?? '')) ||
    !in_array((string) ($claims['iss'] ?? ''), ['accounts.google.com', 'https://accounts.google.com'], true) ||
    !in_array($claims['email_verified'] ?? null, ['true', true, 1, '1'], true) ||
    !ctype_digit((string) ($claims['exp'] ?? '')) ||
    (int) $claims['exp'] <= time() ||
    !is_string($claims['sub'] ?? null) || $claims['sub'] === '') {
    respond(401, ['status' => 'error', 'message' => 'Identidad no verificada']);
}
$email = filter_var($claims['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) respond(401, ['status' => 'error', 'message' => 'Correo no verificado']);
$googleId = $claims['sub'];
$rawName = trim((string) ($claims['name'] ?? 'Usuario'));
$name = function_exists('mb_substr') ? mb_substr($rawName, 0, 120, 'UTF-8') : substr($rawName, 0, 120);
$avatar = filter_var($claims['picture'] ?? '', FILTER_VALIDATE_URL) ?: '';
if ($avatar !== '' && parse_url($avatar, PHP_URL_SCHEME) !== 'https') $avatar = '';

$dbUser = getenv('DB_USER') ?: '';
$dbName = getenv('DB_NAME') ?: '';
try {
    if ($dbUser !== '' && $dbName !== '') {
        $pdo = new PDO(
            'mysql:host=' . (getenv('DB_HOST') ?: 'localhost') . ';dbname=' . $dbName . ';charset=utf8mb4',
            $dbUser, getenv('DB_PASS') ?: '',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } else {
        // No automatic private-data fallback inside an accidentally public web directory.
        $sqlitePath = getenv('CRP_AUTH_SQLITE_PATH') ?: '';
        if ($sqlitePath === '' || !is_file($sqlitePath)) {
            respond(503, ['status' => 'error', 'message' => 'Base de usuarios no configurada']);
        }
        $pdo = new PDO('sqlite:' . $sqlitePath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    $pdo->beginTransaction();
    $get = $pdo->prepare('SELECT * FROM users WHERE google_id = ?');
    $get->execute([$googleId]);
    $user = $get->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        $getEmail = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $getEmail->execute([$email]);
        if ($getEmail->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            respond(409, ['status' => 'error', 'message' => 'La cuenta existente requiere vinculación verificada']);
        }
        $create = $pdo->prepare('INSERT INTO users (email, google_id, name, avatar_url, balance_credits) VALUES (?, ?, ?, ?, 1000)');
        $create->execute([$email, $googleId, $name, $avatar]);
        $get->execute([$googleId]);
        $user = $get->fetch(PDO::FETCH_ASSOC);
    } else {
        $update = $pdo->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, name = ?, avatar_url = ? WHERE id = ?');
        $update->execute([$name, $avatar, $user['id']]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Cryptodromo auth storage failure');
    respond(503, ['status' => 'error', 'message' => 'Acceso temporalmente no disponible']);
}

// Share the canonical revocable session store with email/password accounts.
require_once __DIR__ . '/users-lib.php';
try {
    crp_users_secret();
    crp_users_schema_ready($pdo);
    crp_users_ensure_profile($pdo, (int) $user['id'], $avatar, true);
    crp_users_login($pdo, (int) $user['id']);
    crp_users_event($pdo, (int) $user['id'], 'google_login');
    $me = crp_users_current($pdo);
    if (!$me) throw new RuntimeException('Login session could not be established');
} catch (Throwable $e) {
    error_log('Cryptodromo Google identity session unavailable');
    respond(503, ['status' => 'error', 'message' => 'Sesiones no disponibles']);
}
respond(200, ['status' => 'success', 'user' => [
    'id' => (int) $me['id'], 'email' => $me['email'],
    'name' => $me['name'], 'alias' => $me['alias']
]]);
