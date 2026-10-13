# RED/GREEN evidence and reusable workflow

Use one vertical slice at a time: add a behavior assertion, run it and observe the expected missing-feature failure, implement the smallest slice, run the entire current suite. Do not write a horizontal pile of speculative tests first. This project used stdlib unittest and real local PHP HTTP requests; no mocked quotes/API responses.

Observed RED gates before their implementations (tool output in the originating session):

| Slice | Observed RED |
|---|---|
| Persisted fixed fixture | AssertionError: build-time generator missing |
| Manifest HTTP | AssertionError: API missing |
| Asset listing | AssertionError: 'assets' not found / asset listing missing |
| Series pagination | AssertionError: 'points' not found / series missing |
| Snapshot | AssertionError: 'quotes' not found / snapshot missing |
| Strict parameter/error handling | 200 != 400 for unknown/invalid params; 200 != 404 for unknown asset; warning-contaminated missing-parameter bodies |
| Explicit replay | 400 != 200 (unknown replay action) |
| ETag/immutable caching | unexpectedly None (ETag absent) |
| Private path protection | 'error' not found / public private path must be refused |
| Low-cost snapshot index | query plan SCAN prices instead of SEARCH minute index |
| Optional offline SQL export | AssertionError: optional exporter missing |

Each gate was followed by implementation and a passing full-current-suite run. Initial date-minute constants in the test were corrected using Python UTC datetime timestamp calculation before implementing the fixture. Asset-list test initially raised KeyError for the absent key; it was clarified into an explicit assertion and rerun RED before implementation. Closed test connections after a ResourceWarning appeared; subsequent full runs were clean.

Extra regression tests for duplicate build input and actual read-only PDO connection were added after those behaviors were already implemented/covered; they are supplementary verification, not claimed as new RED/GREEN feature slices.

Offline PHP recovery on non-root Debian host: download package lists into project-local runtime/lists, apt-get download php8.4-cli/common/sqlite3 + libargon2-1, dpkg-deb -x under runtime/extracted, run extracted PHP with -n and explicit pdo.so/pdo_sqlite.so extension paths and LD_LIBRARY_PATH. Never deploy this development runtime to shared hosting. System apt update post-hook attempted inaccessible cache cleanup and was permission denied; no system configuration/package installation was performed.

Final test execution, exact counts, and statuses: see test-output.txt. Keep immutable fixture v1 bytes when publishing; produce a new version for catalog/schema changes. Keep generated DB outside public_html and perform real PDO read-only proof before claiming an API is safe.
