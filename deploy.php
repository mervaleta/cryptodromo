<?php
/**
 * Auto-Deploy Webhook for Hostinger
 * Fetches the latest index.html directly from GitHub repository.
 * Usage: https://rngmarketdriven.com/deploy.php?token=RNG_DEPLOY_SECRET_2026
 */

$secret_token = 'RNG_DEPLOY_SECRET_2026';

if (!isset($_GET['token']) || $_GET['token'] !== $secret_token) {
    http_response_code(403);
    die(json_encode(['status' => 'error', 'message' => 'Unauthorized token']));
}

$raw_github_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/index.html';

$options = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: HostingerDeployer/1.0\r\n"
    ]
];
$context = stream_context_create($options);
$content = @file_get_contents($raw_github_url, false, $context);

if ($content === false || strlen($content) < 500) {
    http_response_code(500);
    die(json_encode(['status' => 'error', 'message' => 'Failed to fetch index.html from GitHub']));
}

$target_file = __DIR__ . '/index.html';
if (file_put_contents($target_file, $content) === false) {
    http_response_code(500);
    die(json_encode(['status' => 'error', 'message' => 'Failed to write index.html locally']));
}

// Also fetch and deploy soluciones landing
$soluciones_github_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/soluciones/index.html';
$soluciones_content = @file_get_contents($soluciones_github_url, false, $context);
if ($soluciones_content !== false && strlen($soluciones_content) > 500) {
    if (!is_dir(__DIR__ . '/soluciones')) {
        @mkdir(__DIR__ . '/soluciones', 0755, true);
    }
    @file_put_contents(__DIR__ . '/soluciones/index.html', $soluciones_content);
    @file_put_contents(__DIR__ . '/soluciones.html', $soluciones_content);
}

// Self update deploy.php
$self_github_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/deploy.php';
$self_content = @file_get_contents($self_github_url, false, $context);
if ($self_content !== false && strlen($self_content) > 200) {
    @file_put_contents(__FILE__, $self_content);
}

// Also fetch and deploy lava-lab interactive visualizer
$lava_github_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/lava-lab/index.html';
$lava_content = @file_get_contents($lava_github_url, false, $context);
if ($lava_content !== false && strlen($lava_content) > 500) {
    if (!is_dir(__DIR__ . '/lava-lab')) {
        @mkdir(__DIR__ . '/lava-lab', 0755, true);
    }
    @file_put_contents(__DIR__ . '/lava-lab/index.html', $lava_content);
    @file_put_contents(__DIR__ . '/lava.html', $lava_content);
}

// Also fetch and deploy prode-bursatil sub-site
$prode_github_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/prode-bursatil/index.html';
$prode_content = @file_get_contents($prode_github_url, false, $context);
if ($prode_content !== false && strlen($prode_content) > 500) {
    if (!is_dir(__DIR__ . '/prode-bursatil')) {
        @mkdir(__DIR__ . '/prode-bursatil', 0755, true);
    }
    @file_put_contents(__DIR__ . '/prode-bursatil/index.html', $prode_content);
    @file_put_contents(__DIR__ . '/prode.html', $prode_content);
}

// Fetch favicon
$fav_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/favicon.svg';
$fav_content = @file_get_contents($fav_url, false, $context);
if ($fav_content !== false) {
    @file_put_contents(__DIR__ . '/favicon.svg', $fav_content);
    @file_put_contents(__DIR__ . '/favicon.ico', $fav_content);
}

// Fetch api/auth.php
$auth_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/api/auth.php';
$auth_content = @file_get_contents($auth_url, false, $context);
if ($auth_content !== false && strlen($auth_content) > 200) {
    if (!is_dir(__DIR__ . '/api')) {
        @mkdir(__DIR__ . '/api', 0755, true);
    }
    @file_put_contents(__DIR__ . '/api/auth.php', $auth_content);
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'Successfully deployed latest index.html from GitHub to Hostinger',
    'bytes' => strlen($content),
    'timestamp' => date('Y-m-d H:i:s')
]);
