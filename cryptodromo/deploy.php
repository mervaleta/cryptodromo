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

$options = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: HostingerDeployer/1.0\r\nCache-Control: no-cache\r\n"
    ]
];
$context = stream_context_create($options);

// 1. Deploy index.html
$raw_url = "https://raw.githubusercontent.com/mervaleta/rngmarketdriven/{$ref}/cryptodromo/index.html?t=" . time();
$content = @file_get_contents($raw_url, false, $context);

if ($content && strlen($content) > 100) {
    file_put_contents(__DIR__ . '/index.html', $content);
}

// 2. Deploy profile.html and profile/index.html
$profile_url = "https://raw.githubusercontent.com/mervaleta/rngmarketdriven/{$ref}/cryptodromo/profile.html?t=" . time();
$profile_content = @file_get_contents($profile_url, false, $context);

if ($profile_content && strlen($profile_content) > 100) {
    file_put_contents(__DIR__ . '/profile.html', $profile_content);
    if (!is_dir(__DIR__ . '/profile')) {
        @mkdir(__DIR__ . '/profile', 0755, true);
    }
    file_put_contents(__DIR__ . '/profile/index.html', $profile_content);
}

// 3. Self-update deploy.php
$self_url = "https://raw.githubusercontent.com/mervaleta/rngmarketdriven/{$ref}/cryptodromo/deploy.php?t=" . time();
$self_content = @file_get_contents($self_url, false, $context);
if ($self_content && strlen($self_content) > 100) {
    @file_put_contents(__FILE__, $self_content);
}

echo json_encode([
    'status' => 'success',
    'message' => 'Cryptodromo index & profile deployed successfully',
    'ref' => $ref,
    'index_bytes' => $content ? strlen($content) : 0,
    'profile_bytes' => $profile_content ? strlen($profile_content) : 0,
    'timestamp' => date('Y-m-d H:i:s')
]);
