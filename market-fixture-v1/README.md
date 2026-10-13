# Cryptodromo shared simulation fixture v1

**SIMULATED / FICTIONAL. Not market observations, live quotes, official exchange sessions, investment advice, or race results.** All asset anchors in `catalog.json` are invented static numbers. Every asset has a synthetic **24/7** minute grid, including nights and weekends. Paths include deterministic rises and falls in integer units; they are synthetic test scenarios, not calibrated financial models. Coverage is representative and nonexhaustive.

## Persisted artifact

- Version: `market-fixture-v1`.
- UTC inclusive range: `2026-10-05T00:00:00Z` through `2026-10-11T23:59:00Z`.
- **53 assets × 10,080 minutes = 534,240 stored quotes**.
- `private/market-v1.sqlite`: complete indexed dataset, no API-side generation.
- `private/manifest.json`: exact row counts, semantics and actual SHA-256 checksums of database and catalog.
- Database SHA-256: `bee921c8070d3644c90ecb9052c39b9de8cddca623e3d7e9e748e538c5fd556a`.
- Prices: SQLite integer units. Value = units / 10^scale; API decimal **strings**, never floating-point arithmetic. Crypto scale 8, FX 6, other assets 4. Do not parse prices as JS floating-point if exact arithmetic matters.

Catalog includes CRYPTO BTC ETH SOL IOTA AVAX DOT ADA CAKE BNB POL DOGE SUSHI XRP, plus **CRYPTO:MATIC as an explicitly distinct legacy fixture label**, not a POL synonym. US NASDAQ NVDA TSLA AAPL MSFT AMZN GOOGL; HKEX 0700/9988; SSE 600519/601318/600036; BYMA YPFD GGAL PAMP BMA ALUA TXAR CEPU EDN CRES SUPV; separate NYSE-ADR YPF/GGAL; six index examples; five FX pairs; five commodity examples. Always select market-qualified `asset_id`, not bare ticker. BYMA:GGAL and NYSE-ADR:GGAL are different assets and currencies. Commodity labels are synthetic price proxies, not futures contracts or physical-unit specifications. FX `QUOTE` means the second currency in the pair (USD, JPY, CNY or ARS); INDEX uses synthetic points.

Extensibility: change the static catalog and run an offline build for a **new version/path**. Never mutate an already published v1 database/catalog or change its semantic contract: historical endpoints use immutable caching. There is no external market network access, polling, cron, dependency service, randomness at request time, or write operation in the API. Keep the shipped files fixed; regeneration is for development only. Build reproducibility was verified on Python 3.14.8/its SQLite library; database byte layout can differ across SQLite versions, so the shipped database/checksum is authoritative.

## Shared-hosting placement (not deployed by this task)

Requirements: PHP >=8.1 on 64-bit, PDO and `pdo_sqlite`. No Python is needed on the host. Only publish `public_html/market-data/v1/index.php` under the existing site's public_html without replacing any existing project. Prefer a new private sibling directory:

```
<site-root>/public_html/market-data/v1/index.php
<site-root>/market-fixture-v1-private/market-v1.sqlite
<site-root>/market-fixture-v1-private/manifest.json
```

Set environment `MARKET_DATA_PRIVATE_DIR` to the **absolute private directory** using hosting PHP configuration, or Apache `SetEnv MARKET_DATA_PRIVATE_DIR /absolute/site-root/market-fixture-v1-private` in the endpoint directory's .htaccess if the host supports SetEnv. No secret is involved. With no override the default is `<site-root>/private`. The directory must not be inside public_html or a symlink; the API refuses these configurations. Do not expose catalog/build scripts/tests/runtime/SQL imports over HTTP. Set private directory permissions 700 (or owner PHP-readable group 750), database/manifest 400 (or 440), and ensure PHP's user can read them. PDO `mode=ro` plus `PRAGMA query_only=ON` protects the connection even if file permissions are accidentally permissive. Configure host `open_basedir` to permit the private sibling. Do not use symlinks into public_html.

Deployment verification for the parent/operator: check host PHP extensions; upload only the exact files above; verify database checksum and counts privately; GET manifest/assets/series/snapshot/replay; verify errors/ETag/304. Never assume success from upload alone. No deployment or host configuration was performed here.

## API

Intended base URL: `https://cryptodromo.com/market-data/v1/index.php` **(placement example, not a claim this is live)**. GET only; no authentication/secrets needed for this public fictional fixture. All responses indicate `simulation: true` and an `X-Market-Data` header. Do not relabel them as actual prices today. Same-origin browser projects can reuse one endpoint; cross-origin projects should use their server or configure a deliberate CORS policy separately (no permissive CORS added).

Examples (UTC seconds must be exactly `00Z`; URL-encode parameters in application code):

```
?action=manifest
?action=assets
?action=series&asset_id=CRYPTO:BTC&start=2026-10-05T00:00:00Z&end=2026-10-11T23:59:00Z&limit=1000
?action=series&asset_id=CRYPTO:BTC&start=2026-10-05T00:00:00Z&end=2026-10-11T23:59:00Z&limit=1000&cursor=2026-10-05T16:40:00Z
?action=snapshot&at=2026-10-05T00:00:00Z
?action=snapshot&at=2026-10-05T00:00:00Z&asset_id=BYMA:GGAL
?action=replay&playback_time=2026-10-13T12:34:00Z&epoch=2026-10-05T00:00:00Z&asset_id=CRYPTO:BTC
```

Missing action defaults to manifest. `assets` returns complete static catalog with `anchor_price` strings. `series` requires asset_id/start/end, inclusive, within fixed coverage; limit defaults to 1000 and must be integer 1..1000. `total` counts all rows in the original start/end range, `count` is current page size. `next_cursor` is the **first unreturned UTC minute**, or null when exhausted; pass it unchanged and retain original start/end. At most 1000 prices returned per page; a single indexed look-ahead row determines next_cursor, including exact page boundaries. `snapshot` requires at and optionally one asset_id, returning <=53 quotes and source_time. There is no implicit 'latest' that could be mistaken for live quotes.

Only documented parameters are accepted. Duplicate, array, unknown, missing, invalid calendar, non-UTC, non-minute, out-of-range, reversed-range and out-of-range cursor values are rejected. 400 `invalid_parameter`, 404 `asset_not_found`, 405 `method_not_allowed` (Allow: GET), 503 `service_unavailable` with sanitized JSON. Errors use no-store. Successful fixed historical responses have body-derived SHA-256 ETags, `X-Dataset-Version`, and `Cache-Control: public, max-age=31536000, immutable`; If-None-Match supports 304. Cache one fixed page per query in each consuming project/CDN instead of repeatedly downloading the week. Minute index supports inexpensive all-asset snapshots; primary composite key supports series.

## Explicit replay and yesterday-at-same-clock reuse

Replay reads **the same persisted prices**; it never generates or updates them. Mapping (floor-mod handles negative elapsed minutes):

```
source minute = fixed-week start + ((playback UTC minutes elapsed from configured epoch) modulo 10080)
```

`replay` requires an explicit `playback_time` UTC minute. `epoch` may be explicit; otherwise it uses environment `MARKET_REPLAY_EPOCH`, default `2026-10-05T00:00:00Z`. For stable shared clients prefer an explicit epoch, kept unchanged across projects. Response emits distinct `source_time`, `playback_time`, `epoch`, `data_mode: "simulated/replay"`, simulation=true and decimal-string quotes. Pre-epoch playback wraps backwards correctly. Explicit-epoch queries are immutable; server-config-dependent replay requests use max-age=60/must-revalidate instead.

For **yesterday at the same UTC clock**, the consuming client selects playback_time = desired display UTC minute minus 1,440 minutes, then applies the mapping above (or calls replay). Store/cache that selected minute and label it yesterday/replayed simulation. Example display clock `2026-10-14T12:34:00Z` chooses playback `2026-10-13T12:34:00Z`, which maps to source `2026-10-06T12:34:00Z` with the default epoch. Display time, playback time and source time are different concepts; this is **not real today's or yesterday's market data**. No server wall-clock dependency or per-minute rebuild is required.

The gazette may reuse this central fictional quote service. **Race outcomes, rankings and winners are NOT automatically derived or invented from this price dataset**. Those require a separate explicitly defined and verified source/contract; this fixture provides quotes only.

## Build and tests

```
python3 build.py
python3 export_mysql.py
python3 -m unittest discover -s tests -v
```

Tests cover full integrity/gap-free minute grid, positive integer prices with rises and falls, exact anchors and decimal serialization, duplicates, reproducible database/export bytes, all 10,080 BTC quotes through 11 pages, boundary cursor behavior, HTTP errors, replay modulo boundaries, private-path refusal, actual read-only PDO write rejection, unchanged DB hashes, cache headers and HTTP 304. Real local PHP HTTP tests were executed with PHP 8.4.26 + PDO SQLite from locally extracted Debian packages because PHP was not initially installed. Runtime files remain under runtime/ for this environment only and must not be deployed. Tests use normal `php`/PHP_BIN when available; absent PHP and local runtime, API tests explicitly skip (not a claimed pass).

All implementation slices were exercised RED before GREEN: fixture build, manifest endpoint, asset listing, series pagination, snapshot, parameter validation, replay, ETag caching, private directory guard, snapshot index and offline export. Additional regression assertions verify already implemented duplicate rejection/read-only behavior. `tests/test-output.txt` contains the final execution output; `tests/TDD.md` records the failing gates.

## Optional MySQL export — NOT deployed or a configured API backend

`private/mysql-schema.sql` and deterministic `private/mysql-import.sql.gz` are provided only as a contingency if the host lacks SQLite. `private/export-manifest.json` contains their actual checksums plus the source database checksum. Import into a **new empty dedicated database**: schema first, then decompressed SQL data via hosting tools/mysql client. No DROP statements, credentials, deployed database or MySQL API adapter is supplied. PDO SQLite remains the only implemented API backend. SQL payload row-for-row roundtrip was verified with SQLite's compatible INSERT syntax; no MySQL server integration was exercised. If SQLite is unavailable, operator must implement and test a read-only MySQL adapter before serving the API; do not claim this export alone enables the PHP endpoint.
