<?php
declare(strict_types=1);
// Configure Hostinger PHP CLI cron every minute. No public route or bearer token.
if(PHP_SAPI!=='cli') {http_response_code(404);exit;}
require_once __DIR__.'/../predictions/lib.php';
try {
    $service=CrpPredictions::fromEnvironment();
    $count=0;
    // Re-run is safe. Each result and payout is idempotent in one DB transaction.
    for($i=0;$i<20;$i++) {
        $step=$service->settleDue(time(),null,100);
        $count+=$step;
        if($step<100) break;
    }
    fwrite(STDOUT,'CRP settled '.$count.' synthetic tickets'.PHP_EOL);
} catch(Throwable $e) {
    fwrite(STDERR,'CRP settlement failed: '.get_class($e).PHP_EOL);
    exit(1);
}
