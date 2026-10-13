<?php
/**
 * Auto-Deploy Webhook for Cryptodromo
 */
$secret = 'RNG_DEPLOY_SECRET_2026';
if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die(json_encode(['status' => 'error', 'message' => 'Unauthorized']));
}

$commit = isset($_GET['commit']) ? preg_replace('/[^a-f0-9]/i', '', $_GET['commit']) : '';
$ref = !empty($commit) ? $commit : 'main';

$raw_url = "https://raw.githubusercontent.com/mervaleta/rngmarketdriven/{$ref}/cryptodromo/index.html?t=" . time();

$options = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: HostingerDeployer/1.0\r\nCache-Control: no-cache\r\n"
    ]
];
$context = stream_context_create($options);
$content = @file_get_contents($raw_url, false, $context);

if ($content && strlen($content) > 100) {
    file_put_contents(__DIR__ . '/index.html', $content);
    
    // Auto-update self if available
    $self_url = "https://raw.githubusercontent.com/mervaleta/rngmarketdriven/{$ref}/cryptodromo/deploy.php?t=" . time();
    $self_content = @file_get_contents($self_url, false, $context);
    if ($self_content && strlen($self_content) > 100) {
        @file_put_contents(__FILE__, $self_content);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Cryptodromo index.html updated successfully',
        'ref' => $ref,
        'bytes' => strlen($content),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Download failed', 'url' => $raw_url]);
}
