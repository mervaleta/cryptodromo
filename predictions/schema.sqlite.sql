-- Run once on the SAME verified-users database used by api/auth.php.
-- Virtual-only double-entry accounting; no deposits, withdrawals or cash value.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS prediction_accounts (
 user_id INTEGER PRIMARY KEY,
 credits INTEGER NOT NULL DEFAULT 0 CHECK(credits>=0),
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS prediction_journal (
 event_id TEXT NOT NULL,
 line_no INTEGER NOT NULL CHECK(line_no IN (1,2)),
 account_key TEXT NOT NULL,
 delta INTEGER NOT NULL,
 kind TEXT NOT NULL,
 reference TEXT NOT NULL,
 occurred_at INTEGER NOT NULL,
 PRIMARY KEY(event_id,line_no)
);
CREATE INDEX IF NOT EXISTS prediction_journal_account ON prediction_journal(account_key);
CREATE TABLE IF NOT EXISTS predictions (
 id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL,
 race_id TEXT NOT NULL,
 event_key TEXT NOT NULL,
 race_date TEXT NOT NULL,
 track_id TEXT NOT NULL,
 minute INTEGER NOT NULL CHECK(minute BETWEEN 0 AND 1439),
 modality TEXT NOT NULL CHECK(modality IN ('winner','podium','exacta','trifecta')),
 picks_json TEXT NOT NULL,
 stake INTEGER NOT NULL CHECK(stake BETWEEN 1 AND 1000),
 multiplier INTEGER NOT NULL,
 close_at INTEGER NOT NULL,
 start_at INTEGER NOT NULL,
 finish_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 idempotency_key TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('confirmed','closed','pending_result','won','lost','void')),
 payout INTEGER NOT NULL DEFAULT 0,
 settled_at INTEGER,
 result_json TEXT,
 UNIQUE(user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS predictions_due ON predictions(status,finish_at);
CREATE INDEX IF NOT EXISTS predictions_owner ON predictions(user_id,created_at);
