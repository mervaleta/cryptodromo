# Cryptodromo 3D Race Lab

Procedural Three.js race scene based on reusable geometry rather than external art files. The stadium now has a modular covered grandstand, crowd instancing, roof trusses, LED boards, floodlights, city silhouette and generated surface textures. The scene remains configurable for time, weather, wind and track surface. Race input uses deterministic sample-price fixtures.

- `index.html` and `assets/`: static deployment at `/race-lab/`.
- `source/`: editable Vite project.
- `source/src/main.js`: scene, procedural materials and race simulation.

Run `npm ci && npm run dev` from `source/`; build with `npm run build`. No external art assets are fetched. Three.js is bundled. The 2D canvas mode is only a compatibility fallback for environments where WebGL is unavailable.
