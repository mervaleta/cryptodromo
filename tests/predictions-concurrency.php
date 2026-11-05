<?php
declare(strict_types=1);
require_once __DIR__.'/../predictions/lib.php';
if(!extension_loaded('pcntl') || !in_array('sqlite',PDO::getAvailableDrivers(),true)) {
 fwrite(STDERR,"pcntl and PDO SQLite required\n");exit(2);
}
$dir=sys_get_temp_dir().'/crp-predictions-'.bin2hex(random_bytes(6));
mkdir($dir,0700,true);
$dbPath=$dir.'/test.sqlite';
try {
 $db=new PDO('sqlite:'.$dbPath,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
 $db->exec('PRAGMA journal_mode=WAL');
 $db->exec('PRAGMA busy_timeout=30000');
 $db->exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
 for($i=1;$i<=100;$i++)$db->exec('INSERT INTO users(id) VALUES('.$i.')');
 $db->exec(file_get_contents(__DIR__.'/../predictions/schema.sqlite.sql'));
 $db=null;
 $pids=[];
 $fixtureDir=__DIR__.'/../predictions/fixtures';
 $anchor=new CrpPredictions(new PDO('sqlite:'.$dbPath),$fixtureDir);
 $race=$anchor->race('2026-11-05',600);
 unset($anchor);
 for($n=1;$n<=100;$n++){
  $pid=pcntl_fork();
  if($pid===-1)throw new RuntimeException('fork failed');
  if($pid===0) {
   try {
    $conn=new PDO('sqlite:'.$dbPath,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $conn->exec('PRAGMA busy_timeout=30000');
    $svc=new CrpPredictions($conn,$fixtureDir);
    $svc->confirm($n,['race_id'=>$race['race_id'],'modality'=>'winner',
     'picks'=>[$race['runners'][0]],'stake'=>25,
     'idempotency_key'=>sprintf('00000000-0000-4000-8000-%012x',$n)],
     $race['start_at']-120);
    exit(0);
   }catch(Throwable $e){fwrite(STDERR,"worker ".$n.": ".$e->getMessage()."\n");exit(1);}
  }
  $pids[]=$pid;
 }
 $failed=0;
 foreach($pids as $pid) {
  pcntl_waitpid($pid,$status);
  if(!pcntl_wifexited($status)||pcntl_wexitstatus($status)!==0)$failed++;
 }
 if($failed)throw new RuntimeException($failed.' concurrent request(s) failed');
 $db=new PDO('sqlite:'.$dbPath,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
 $total=(int)$db->query('SELECT COUNT(*) FROM predictions')->fetchColumn();
 $credit=(int)$db->query('SELECT SUM(credits) FROM prediction_accounts')->fetchColumn();
 $balance=(int)$db->query("SELECT SUM(delta) FROM prediction_journal WHERE account_key LIKE 'user:%'")->fetchColumn();
 if($total!==100 || $credit!==97500 || $balance!==$credit)
  throw new RuntimeException('Concurrency invariant failed: '.$total.'/'.$credit.'/'.$balance);
 $broken=$db->query('SELECT event_id FROM prediction_journal GROUP BY event_id HAVING COUNT(*)<>2 OR SUM(delta)<>0')->fetchAll();
 if($broken)throw new RuntimeException('Unbalanced ledger');
 echo "PASS 100 concurrent authenticated test users; no lost updates or imbalance\n";
} finally {
 if(is_file($dbPath))unlink($dbPath);
 if(is_file($dbPath.'-wal'))unlink($dbPath.'-wal');
 if(is_file($dbPath.'-shm'))unlink($dbPath.'-shm');
 rmdir($dir);
}
