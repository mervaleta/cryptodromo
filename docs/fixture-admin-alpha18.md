# Panel de dirección de carreras para Alpha 18

## Base actual
Branch based on `main` at commit `8e5d36f`. The latest site root serves `index.html`, `fixture/`, `resultados/`, `estadisticas/`, `grandes-premios/` and the shared fixture engine at `race-lab/source/src/data/`.

## Implementation
`admin/fixture/index.html` provides a **hypothetical, local-only** editor:
- 100-asset roster; 4 star, 4 core, 4 challenger per race.
- 480 races per day, 7 days, deterministic official race classification.
- Race search, winner preview, detail audit, local drafts, JSON import/export.
- Reuses original fixture entries, especially their dose decks, for unchanged runners. New runners receive seeded decks that only affect visual sequence; the official total is deterministic.
- Does not overwrite published fixture, results, historical finishes, standings, Grand Prix, badges or racing visuals.

## Access control: blocking gate
`admin/fixture/.htaccess` **DENIES ALL** requests by default where Apache/LiteSpeed honors it. For nginx/CDN or other hosts, this file is ignored. The route MUST be protected in the hosting layer as well BEFORE this branch is merged or deployed.

Set up HTTP authentication / SSO with users and roles, secure cookies, TLS and CSRF protection for future write operations. Do not store passwords in git or browser JavaScript.
In the current version there is NO backend and NO shared write operation. The editor is localStorage only.

## Future release workflow
1. Host/server owner verifies access control on `/admin/fixture/` (unauthenticated 401/403; signed in 200) and confirms that admin URLs are excluded from cache.
2. Validate the page works with the actual root `race-lab/source/src/data/` paths in staging.
3. Run `node --experimental-default-type=module tests/fixture-admin-alpha18.mjs` and existing sports regression suite.
4. Add a separate authenticated server endpoint for publish operations with validation, optimistic concurrency versioning, audit logs and race status locking. Published fixture must be a single source of truth for all pages.
5. Merge after those checks. Do not make public live races editable based solely on localStorage.

## Guardrails
An edit is always hypothetical; never claim an edit changes the official winner. It is inappropriate to present results as unknown before their underlying synthetic dataset makes them calculable, so preserve the existing public UI gating. This dashboard can inspect future hypothetical winners privately, but a publicly reachable copy could reveal all demo outcomes.
