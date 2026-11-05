<?php
declare(strict_types=1);
/**
 * One-time TEST account provisioning. Run via CLI after users-migrate.php:
 * CRP_TEST_SEED=1 CRP_TEST_EMAIL='...' CRP_TEST_PASSWORD='...' php scripts/seed-test-whale.php
 * Do not commit credentials. Does not expose a public HTTP endpoint.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if (getenv('CRP_TEST_SEED') !== '1') { fwrite(STDERR,"Set CRP_TEST_SEED=1 to confirm test-only provisioning.\n"); exit(1); }
require_once dirname(__DIR__).'/api/users-lib.php';
$email=strtolower(trim((string)getenv('CRP_TEST_EMAIL')));
$password=(string)getenv('CRP_TEST_PASSWORD');
if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($password)<5 || strlen($password)>128) {
 fwrite(STDERR,"Supply valid CRP_TEST_EMAIL and CRP_TEST_PASSWORD (5-128 characters).\n"); exit(1);
}
if (!defined('PASSWORD_ARGON2ID')) { fwrite(STDERR,"Argon2id required.\n"); exit(1); }
try {
 $db=crp_users_db();
 crp_users_schema_ready($db);
 $db->beginTransaction();
 $q=$db->prepare('SELECT id FROM users WHERE email=?');
 $q->execute([$email]);
 $uid=$q->fetchColumn();
 $now=time();
 if (!$uid) {
  $db->prepare('INSERT INTO users(email,google_id,name,avatar_url,balance_credits) VALUES(?,NULL,?,?,0)')
     ->execute([$email,'Santoro y Donoso','']);
  $uid=(int)$db->lastInsertId();
 } else $uid=(int)$uid;
 crp_users_ensure_profile($db,$uid);
 $hash=password_hash($password,PASSWORD_ARGON2ID);
 $q=$db->prepare('SELECT user_id FROM user_credentials WHERE user_id=?');
 $q->execute([$uid]);
 if ($q->fetchColumn()) {
  $db->prepare('UPDATE user_credentials SET password_hash=?,changed_at=? WHERE user_id=?')->execute([$hash,$now,$uid]);
 } else {
  $db->prepare('INSERT INTO user_credentials(user_id,password_hash,changed_at) VALUES(?,?,?)')->execute([$uid,$hash,$now]);
 }
 $db->commit();
 echo "Test account provisioned. User ID: ".$uid.". No balance credited by this script.\n";
} catch(Throwable $e) {
 if(isset($db)&&$db instanceof PDO&&$db->inTransaction())$db->rollBack();
 fwrite(STDERR,"Test provisioning failed: ".$e->getMessage()."\n");exit(1);
}
