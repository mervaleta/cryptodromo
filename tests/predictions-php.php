<?php
declare(strict_types=1);
require_once __DIR__.'/../predictions/lib.php';
function check(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
function denied(callable $f,int $status): void {
 try {$f();} catch(PredictionFailure $e){check($e->http===$status,'expected HTTP '.$status.', got '.$e->http);return;}
 throw new RuntimeException('Expected rejection HTTP '.$status);
}
function key(int $n): string {return sprintf('00000000-0000-4000-8000-%012x',$n);}
if(!in_array('sqlite',PDO::getAvailableDrivers(),true)){fwrite(STDERR,"pdo_sqlite required\n");exit(2);}
$db=new PDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE);INSERT INTO users(id,email) VALUES (1,"one@invalid.test"),(2,"two@invalid.test")');
$db->exec(file_get_contents(__DIR__.'/../predictions/schema.sqlite.sql'));
$service=new CrpPredictions($db,__DIR__.'/../predictions/fixtures');
$race=$service->race('2026-11-05',600);
check(str_contains($race['event_key'],'MUYBRIDGE'),'official track');
check(count($race['runners'])===12,'12 official runners');
$fixture=json_decode(file_get_contents(__DIR__.'/../predictions/fixtures/day-4.json'),true);
$rank=$fixture['races'][600]['ranking'];
check(count($rank)===12,'canonical result ranking');
$start=$race['start_at'];
$now=$start-100;
$base=['race_id'=>$race['race_id'],'modality'=>'winner','picks'=>[$rank[0]],'stake'=>10,'idempotency_key'=>key(1)];
$ticket=$service->confirm(1,$base,$now);
check($ticket['status']==='confirmed','confirmed');
check($service->personal(1,$now)['credits']===990,'initial grant exactly once, stake debit');
check($service->confirm(1,$base,$start+100)['id']===$ticket['id'],'late retry idempotent');
check($service->personal(1,$now)['credits']===990,'no double debit');
denied(fn()=>$service->confirm(1,[...$base,'stake'=>11],$now),409);
denied(fn()=>$service->confirm(1,[...$base,'idempotency_key'=>key(2),'picks'=>[$rank[1]]],$start),409);
denied(fn()=>$service->confirm(1,[...$base,'idempotency_key'=>key(3),'picks'=>['FAKE'] ],$now),400);
denied(fn()=>$service->confirm(1,[...$base,'idempotency_key'=>key(4),'stake'=>1001],$now),400);
denied(fn()=>$service->confirm(999,[...$base,'idempotency_key'=>key(5)],$now),401);
$podium=[$rank[2],$rank[0],$rank[1]];
$pod=$service->confirm(1,[...$base,'modality'=>'podium','picks'=>$podium,'idempotency_key'=>key(6)],$now);
$exacta=$service->confirm(1,[...$base,'modality'=>'exacta','picks'=>[$rank[1],$rank[0]],'idempotency_key'=>key(7)],$now);
$trifecta=$service->confirm(1,[...$base,'modality'=>'trifecta','picks'=>array_slice($rank,0,3),'idempotency_key'=>key(8)],$now);
check($service->personal(1,$now)['credits']===960,'four stake debits');
check($service->settleDue($race['close_at']+1,1)===0,'not paid after closure');
check($service->personal(1,$race['close_at']+1)['history'][0]['status']==='closed','closed state');
check($service->personal(1,$start+1)['history'][0]['status']==='pending_result','awaiting result state');
check($service->settleDue($race['finish_at']+1,1)===4,'four settlements');
check($service->settleDue($race['finish_at']+1,1)===0,'idempotent settlement');
$account=$service->personal(1,$race['finish_at']+1);
check($account['credits']===960+40+250+1500,'virtual reward formulas');
check($account['ledger_credits']===$account['credits'],'reconstruction matches cache');
$outcomes=array_column($account['history'],'status');
check(count(array_filter($outcomes,fn($x)=>$x==='won'))===3,'three wins');
check(in_array('lost',$outcomes,true),'one losing exacta');
check(count($account['history'])===4,'four independent receipts');
check(count($service->personal(2,$now)['history'])===0,'history isolated by verified user');
$sum=$db->query('SELECT event_id,COUNT(*) AS c,SUM(delta) AS s FROM prediction_journal GROUP BY event_id')->fetchAll(PDO::FETCH_ASSOC);
foreach($sum as $event){check((int)$event['c']===2 && (int)$event['s']===0,'double entry invariant: '.$event['event_id']);}
$race2=$service->race('2026-11-05',603);
// Force a SQL error mid-transaction. Neither ticket nor grant nor stake can survive.
$db->exec("CREATE TRIGGER deny_user2_stake BEFORE INSERT ON prediction_journal WHEN NEW.event_id LIKE 'STAKE:%' AND NEW.account_key='user:2' BEGIN SELECT RAISE(ABORT,'forced crash'); END");
try {
 $service->confirm(2,['race_id'=>$race2['race_id'],'modality'=>'winner',
   'picks'=>[$race2['runners'][0]],'stake'=>22,'idempotency_key'=>key(9)],$race2['start_at']-50);
 throw new RuntimeException('Expected simulated storage failure');
} catch(PDOException $expected) {
 check(str_contains($expected->getMessage(),'forced crash'),'mid-transaction rollback error');
}
check((int)$db->query('SELECT COUNT(*) FROM predictions WHERE user_id=2')->fetchColumn()===0,'no dangling ticket on SQL error');
check((int)$db->query('SELECT COUNT(*) FROM prediction_accounts WHERE user_id=2')->fetchColumn()===0,'no phantom first grant on SQL error');
$db->exec('DROP TRIGGER deny_user2_stake');
$other=$service->confirm(2,['race_id'=>$race2['race_id'],'modality'=>'winner','picks'=>[$race2['runners'][0]],'stake'=>22,'idempotency_key'=>key(9)],$race2['start_at']-50);
check($service->voidRace($race2['race_id'],$race2['start_at']-1)===1,'void refunds one ticket');
check($service->voidRace($race2['race_id'],$race2['start_at']-1)===0,'void idempotent');
check($service->personal(2,$race2['start_at']+100)['credits']===1000,'refund exactly once');
check($service->settleDue($race2['finish_at']+1,2)===0,'void cannot settle');
$all=$db->query('SELECT event_id,COUNT(*) AS c,SUM(delta) AS s FROM prediction_journal GROUP BY event_id')->fetchAll(PDO::FETCH_ASSOC);
foreach($all as $event)check((int)$event['c']===2&&(int)$event['s']===0,'all entries balanced');
echo "PASS prediction modes, closure, ledger, retries, losses, voids, privacy and conservation\n";
