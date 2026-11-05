-- Same MySQL schema/database as api/auth.php. Run by operator, never by public HTTP.
CREATE TABLE IF NOT EXISTS prediction_accounts (
 user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 credits BIGINT NOT NULL DEFAULT 0,
 updated_at BIGINT NOT NULL,
 CONSTRAINT prediction_account_nonnegative CHECK (credits>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS prediction_journal (
 event_id VARCHAR(96) NOT NULL,
 line_no TINYINT UNSIGNED NOT NULL,
 account_key VARCHAR(96) NOT NULL,
 delta BIGINT NOT NULL,
 kind VARCHAR(32) NOT NULL,
 reference VARCHAR(160) NOT NULL,
 occurred_at BIGINT NOT NULL,
 PRIMARY KEY(event_id,line_no),
 INDEX prediction_journal_account (account_key),
 CONSTRAINT prediction_line_check CHECK (line_no IN (1,2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS predictions (
 id CHAR(36) NOT NULL PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 race_id VARCHAR(145) NOT NULL,
 event_key VARCHAR(100) NOT NULL,
 race_date CHAR(10) NOT NULL,
 track_id VARCHAR(20) NOT NULL,
 minute SMALLINT UNSIGNED NOT NULL,
 modality VARCHAR(16) NOT NULL,
 picks_json VARCHAR(180) NOT NULL,
 stake INT UNSIGNED NOT NULL,
 multiplier INT UNSIGNED NOT NULL,
 close_at BIGINT NOT NULL,
 start_at BIGINT NOT NULL,
 finish_at BIGINT NOT NULL,
 created_at BIGINT NOT NULL,
 idempotency_key CHAR(36) NOT NULL,
 fingerprint CHAR(64) NOT NULL,
 status VARCHAR(20) NOT NULL,
 payout BIGINT NOT NULL DEFAULT 0,
 settled_at BIGINT NULL,
 result_json TEXT NULL,
 UNIQUE KEY prediction_idempotency (user_id,idempotency_key),
 INDEX predictions_due (status,finish_at),
 INDEX predictions_owner (user_id,created_at),
 CONSTRAINT prediction_stake_check CHECK(stake BETWEEN 1 AND 1000),
 CONSTRAINT prediction_minute_check CHECK(minute BETWEEN 0 AND 1439)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
