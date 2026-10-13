<?php
/**
 * RNGMarketDriven.com - User Authentication & Session API
 * Handles Google OAuth / Email Registration and stores user profiles in MySQL (or SQLite fallback).
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de Base de Datos (MySQL Hostinger con fallback a SQLite)
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: '';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: '';

$pdo = null;

if (!empty($db_user) && !empty($db_name)) {
    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (Exception $e) {
        // Fallback below
    }
}

if (!$pdo) {
    // Usar SQLite local si MySQL no está configurado aún en Hostinger
    $sqlite_file = __DIR__ . '/../../data/users_db.sqlite';
    if (!file_exists(dirname($sqlite_file))) {
        @mkdir(dirname($sqlite_file), 0755, true);
    }
    $pdo = new PDO("sqlite:$sqlite_file");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            google_id TEXT,
            name TEXT NOT NULL,
            avatar_url TEXT,
            balance_credits REAL DEFAULT 1000.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");
}

$action = $_GET['action'] ?? 'status';

if ($action === 'login_google' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $name = trim($input['name'] ?? 'Usuario');
    $google_id = trim($input['google_id'] ?? '');
    $avatar = trim($input['avatar_url'] ?? '');

    if (!$email) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email inválido']);
        exit;
    }

    // Buscar o insertar usuario
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $update = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP, name = ? WHERE id = ?");
        $update->execute([$name, $user['id']]);
    } else {
        $insert = $pdo->prepare("INSERT INTO users (email, google_id, name, avatar_url, balance_credits) VALUES (?, ?, ?, ?, 1000.00)");
        $insert->execute([$email, $google_id, $name, $avatar]);
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'status' => 'success',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'avatar_url' => $user['avatar_url'],
            'balance_credits' => floatval($user['balance_credits'])
        ]
    ]);
    exit;
}

echo json_encode(['status' => 'ready', 'service' => 'RNGMarketDriven Auth API']);
