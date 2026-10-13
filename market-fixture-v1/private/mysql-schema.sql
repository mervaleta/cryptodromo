-- OPTIONAL: use a NEW dedicated database; no DROP statements.
CREATE TABLE assets (
 asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 ticker VARCHAR(32) NOT NULL, market VARCHAR(32) NOT NULL, name VARCHAR(255) NOT NULL,
 currency VARCHAR(16) NOT NULL, scale INT NOT NULL, anchor_units BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE prices (
 asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 minute BIGINT NOT NULL, price_units BIGINT NOT NULL,
 PRIMARY KEY (asset_id, minute), KEY prices_minute (minute, asset_id),
 FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
