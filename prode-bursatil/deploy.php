<?php
/**
 * Auto-Deploy Webhook for Hostinger (Prode Bursátil Argentino)
 * Fetches the latest prode.html directly from GitHub repository into index.html.
 * Usage: https://mediumvioletred-shrew-934553.hostingersite.com/deploy.php?token=RNG_DEPLOY_SECRET_2026
 */

$secret_token = 'RNG_DEPLOY_SECRET_2026';

if (!isset($_GET['token']) || $_GET['token'] !== $secret_token) {
    http_response_code(403);
    die(json_encode(['status' => 'error', 'message' => 'Unauthorized token']));
}

$raw_github_url = 'https://raw.githubusercontent.com/mervaleta/rngmarketdriven/main/prode-bursatil/index.html';

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
    die(json_encode(['status' => 'error', 'message' => 'Failed to fetch prode from GitHub']));
}

$target_file = __DIR__ . '/index.html';
if (file_put_contents($target_file, $content) === false) {
    http_response_code(500);
    die(json_encode(['status' => 'error', 'message' => 'Failed to write index.html locally']));
}

// Remove default.php if present so index.html loads by default
if (file_exists(__DIR__ . '/default.php')) {
    @unlink(__DIR__ . '/default.php');
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'Successfully deployed Prode Bursátil index.html to Hostinger',
    'bytes' => strlen($content),
    'timestamp' => date('Y-m-d H:i:s')
]);
