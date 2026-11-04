<?php
declare(strict_types=1);
/**
 * Legacy deployment endpoint retired for security.
 * The former version contained a credential in public source and could rewrite
 * production files. Deploy using the authenticated Hostinger/GitHub pipeline.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
http_response_code(410);
echo json_encode([
    'ok' => false,
    'error' => 'legacy_deploy_retired',
    'message' => 'Deployment through this public endpoint is disabled.'
]);
