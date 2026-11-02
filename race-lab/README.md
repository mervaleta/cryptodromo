# Cryptodromo procedural race demo

The published entry point is the repository root `index.html` at `race.cryptodromo.com`. The static files under `assets/` are the current production build.

The editable Vite project is under `race-lab/source/`. Run `npm ci && npm run build` there to create a static build. Three.js is loaded from the pinned jsDelivr URL in `vite.config.js`; the race scene itself uses procedural geometry and no horse or stadium sprites.

The deterministic synthetic fixture contains 100 crypto assets × 10,080 one-minute prices (seven 1,440-minute days). It has 480 scheduled races per day, 12 runners each, and seeded 4/4/4 draws from star, core, and challenger tiers. It is fictional and makes no market requests.
