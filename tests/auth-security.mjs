import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../api/auth.php', import.meta.url), 'utf8');
const sessionSource = readFileSync(new URL('../api/users-lib.php', import.meta.url), 'utf8');
const root = new URL('../', import.meta.url);
function php(code, env={}) {
  return execFileSync('php', ['-r', code], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, GOOGLE_OAUTH_CLIENT_ID: '', ...env }
  });
}
test('authentication endpoint parses as valid PHP', () => {
  assert.match(execFileSync('php', ['-l', 'api/auth.php'], {cwd:root,encoding:'utf8'}), /No syntax errors/);
});
test('health status does not reveal users or secrets', () => {
  const output = JSON.parse(php('$_SERVER["REQUEST_METHOD"]="GET"; require "api/auth.php";'));
  assert.equal(output.status, 'ready');
  assert.equal(output.service, 'Cryptodromo Auth API');
  assert.equal(JSON.stringify(output).includes('DB_PASS'), false);
});
test('client-supplied email and Google ID cannot authenticate with no config', () => {
  const output = JSON.parse(php('$_SERVER["REQUEST_METHOD"]="POST"; $_SERVER["CONTENT_TYPE"]="application/json"; $_GET["action"]="login_google"; require "api/auth.php";'));
  assert.equal(output.status, 'error');
  assert.match(output.message, /no configurado/);
});
test('only a Google-verified ID token can establish identity', () => {
  for(const marker of [
    "id_token", "oauth2.googleapis.com/tokeninfo", "email_verified",
    "hash_equals", "claims['sub']", "claims['aud']", "claims['exp']",
    "crp_users_login", "crp_users_schema_ready"
  ]) assert.ok(source.includes(marker), 'Missing safeguard: '+marker);
  for(const marker of ['session_regenerate_id','httponly','user_sessions','crp_users_current']) assert.ok(sessionSource.includes(marker), 'Missing session safeguard: '+marker);
  assert.doesNotMatch(source, /Access-Control-Allow-Origin:\s*\*/i);
  assert.doesNotMatch(source, /trim\(\$input\['google_id'\]/);
  assert.doesNotMatch(source, /mkdir\(/);
});
