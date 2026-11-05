<?php
declare(strict_types=1);
/**
 * One-time schema migration for Cryptódromo identities.
 * Usage: CRP_USERS_DSN=sqlite:/absolute/private/users.sqlite php scripts/users-migrate.php
 * or the existing DB_HOST/DB_NAME/DB_USER/DB_PASS MySQL variables.
 * Never invoke this script over HTTP.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/api/users-lib.php';
function crp_users_index(PDO $db, string $statement, string $name, string $table): void {
    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $db->exec(str_replace('CREATE INDEX ', 'CREATE INDEX IF NOT EXISTS ', $statement));
        return;
    }
    $q = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=?');
    $q->execute([$table,$name]);
    if ((int)$q->fetchColumn() === 0) $db->exec($statement);
}

try {
    $db = crp_users_db();
    $mysql = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    $id = $mysql ? 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $n = $mysql ? 'BIGINT UNSIGNED' : 'INTEGER';
    $str = $mysql ? 'VARCHAR(255)' : 'TEXT';
    $short = $mysql ? 'VARCHAR(80)' : 'TEXT';
    $token = $mysql ? 'CHAR(64)' : 'TEXT';
    $stamp = $mysql ? 'BIGINT' : 'INTEGER';
    // Preserve the existing legacy users table, Google identity and demo wallet columns.
    $db->exec($mysql
      ? "CREATE TABLE IF NOT EXISTS users (id $id, email VARCHAR(255) NOT NULL UNIQUE, google_id VARCHAR(255) NULL UNIQUE, name VARCHAR(120) NOT NULL, avatar_url VARCHAR(512) NOT NULL DEFAULT '', balance_credits BIGINT NOT NULL DEFAULT 0, last_login DATETIME NULL)"
      : "CREATE TABLE IF NOT EXISTS users (id $id, email TEXT NOT NULL UNIQUE, google_id TEXT UNIQUE, name TEXT NOT NULL, avatar_url TEXT NOT NULL DEFAULT '', balance_credits INTEGER NOT NULL DEFAULT 0, last_login TEXT)");
    $db->exec("CREATE TABLE IF NOT EXISTS user_profiles (
      user_id $n PRIMARY KEY, alias $short NOT NULL UNIQUE, avatar_url $str NOT NULL DEFAULT '',
      timezone $short NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
      locale VARCHAR(8) NOT NULL DEFAULT 'es', public_profile INTEGER NOT NULL DEFAULT 0,
      notify_enabled INTEGER NOT NULL DEFAULT 1, verified_at $stamp NULL,
      created_at $stamp NOT NULL, updated_at $stamp NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)");
    $db->exec("CREATE TABLE IF NOT EXISTS user_credentials (
      user_id $n PRIMARY KEY, password_hash $str NOT NULL, changed_at $stamp NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)");
    $db->exec("CREATE TABLE IF NOT EXISTS user_sessions (
      session_hash $token PRIMARY KEY, user_id $n NOT NULL, created_at $stamp NOT NULL,
      expires_at $stamp NOT NULL, last_seen_at $stamp NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)");
    crp_users_index($db, "CREATE INDEX idx_user_sessions_owner ON user_sessions(user_id, expires_at)", "idx_user_sessions_owner", "user_sessions");
    $db->exec("CREATE TABLE IF NOT EXISTS user_favorites (
      user_id $n NOT NULL, symbol VARCHAR(16) NOT NULL, added_at $stamp NOT NULL,
      PRIMARY KEY(user_id,symbol), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)");
    $db->exec("CREATE TABLE IF NOT EXISTS user_notifications (
      id $id, user_id $n NOT NULL, kind VARCHAR(40) NOT NULL,
      title VARCHAR(160) NOT NULL, body TEXT NOT NULL, created_at $stamp NOT NULL,
      read_at $stamp NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)");
    crp_users_index($db, "CREATE INDEX idx_user_notifications_owner ON user_notifications(user_id,created_at)", "idx_user_notifications_owner", "user_notifications");
    $db->exec("CREATE TABLE IF NOT EXISTS user_security_events (
      id $id, user_id $n NULL, kind VARCHAR(50) NOT NULL,
      created_at $stamp NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL)");
    crp_users_index($db, "CREATE INDEX idx_user_events_owner ON user_security_events(user_id,created_at)", "idx_user_events_owner", "user_security_events");
    $db->exec("CREATE TABLE IF NOT EXISTS user_action_tokens (
      token_hash $token PRIMARY KEY, user_id $n NOT NULL, purpose VARCHAR(20) NOT NULL,
      expires_at $stamp NOT NULL, created_at $stamp NOT NULL, used_at $stamp NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)");
    crp_users_index($db, "CREATE INDEX idx_user_tokens_owner ON user_action_tokens(user_id,purpose)", "idx_user_tokens_owner", "user_action_tokens");
    $db->exec("CREATE TABLE IF NOT EXISTS user_rate_limits (
      limiter_key $token PRIMARY KEY, attempts INTEGER NOT NULL,
      window_start $stamp NOT NULL)");
    // CREATE INDEX IF NOT EXISTS is not portable across all supported MySQL versions.
    echo "Cryptódromo users migration: schema ready (" . $db->getAttribute(PDO::ATTR_DRIVER_NAME) . ").\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Migration failed: " . $e->getMessage() . "\n");
    exit(1);
}
