# BTC Horse Reborn · Stage A0 (isolated source recovery)

Scope: `feat/btc-horse-reborn` only. Do not touch `main`, `racers/`, the other 99 horses, races, odds, market data, scheduling, or stadium.

## Actual result, 2026-11-10

- Inspected `Horse_VR_2017.ma`, supplied by the project owner.
- Recovered native authored polygon meshes from Maya ASCII (not JS primitives).
- Body: 5,406 vertices, 10,790 triangles, one connected surface, no face-edge traversal errors; not watertight (must assess boundary loops).
- Added author-provided Maya meshes for mane, tail, left/right cornea + internal eyes, and eyelashes.
- Composite source-assembly GLB: 8 geometries, 25,906 triangles. Includes indexed triangles and exported vertex normals.
- Independent offline Three.js/WebGL inspector: six views, OrbitControls, zoom, wireframe, GLB import, frame rate/triangles/draw calls and build identifier.
- Real Chromium/WebGL smoke test with software renderer in Xvfb passed: 25,906 model triangles (25,908 including floor), 10 draw calls, 0 page/console errors, six rendered camera snapshots. FPS ~10 in CPU software WebGL, **not a representative GPU benchmark**.
- SHA256 of GLB and screenshot/QA report are supplied in the separate Stage A0 artifact ZIP.
- Asset is STATIC at present. No reconstructed skinning, gallop, PBR textures, full mane/tail groom, or visual approval.
- Blender/Maya not available in the execution environment. Maya ASCII source has 164 joint nodes and 31 skinCluster nodes; extracting mesh does **not** restore that rig or animation.
- Existing V21 must remain rollback until all acceptance criteria pass.

## Source and next tasks

This branch records source and QA boundaries. The self-contained ZIP artifact contains the exported GLB, viewer (including local MIT Three.js vendor libraries), Maya ASCII polygon extractor, reproducible QA harness and screenshots. It is intentionally separate from the production app; no public deployment has been performed.

Next: inspect boundary edges, recover and refine high-quality anatomical details and compatible rig/weights in Blender, verify all 16 gallop phases and six camera directions, apply PBR materials/optimized groom, rerun WebGL QA, then seek explicit visual approval **before** any integration into canonical BTC.

## License hygiene

The exported source is derived from the owner's supplied Maya asset. Third-party terms for that Maya asset are not established in this branch. Do not redistribute or publish binary geometry commercially until rights are confirmed. Quaternius has NOT been used as the model base. Consult `ASSET_CREDITS.md` for current V21 provenance.

## Decision

**A0 source-recovery prototype. Not AAA, not an approved master, not for production.**