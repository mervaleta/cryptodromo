<?php
declare(strict_types=1);
/** Public read-only cosmetics. It NEVER exposes admin drafts, session, or identity secrets. */
require dirname(__DIR__).'/admin/horses/_store.php';
header('Cache-Control: public, max-age=20, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Methods: GET, HEAD');
if (!in_array($_SERVER['REQUEST_METHOD']??'GET',['GET','HEAD'],true))horse_problem('Método no permitido',405);
[, $file]=horse_storage();
$state=horse_read_state($file);
horse_reply([
    'ok'=>true,'schema'=>'cryptodromo-horses-v1','publishedRevision'=>$state['publishedRevision'],
    'publishedAt'=>$state['publishedAt']??null,'master'=>['source'=>'BTC','status'=>'awaiting-visual-approval'],
    'profiles'=>(object)$state['published']
]);
