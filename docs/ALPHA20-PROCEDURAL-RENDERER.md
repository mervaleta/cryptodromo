# Alpha20 LIVE Procedural Graphics Integration
2026-11-03. Base: GitHub main d12f2bb, including Alpha18 graphics, Alpha20 numbered synchronized gates, sports and global stadium network. Developed in isolated branch feature/procedural-live-engine-20261103.

## What actually ships

- visual-lab/proceduralHorse.js builds horse, neck, head, legs, hoofs, mane, tail, saddlecloth, generated track number and jockey entirely in Three.js geometry. Fur color/grain comes from a mathematical shader. Gait uses two-bone IK and phase functions. This renderer needs no Maya, FBX, GLB, sprites or downloaded image maps.
- visual-lab/proceduralGround.js computes grass mowing lines, granular soil, paving noise and weather response in GPU shaders on the existing LIVE materials.
- visual-lab/proceduralMath.js owns deterministic independent seeds and IK.
- visual-lab/horseRenderer.js preserves the legacy GLB as a reversible alternative to compare without breaking prior work.
- LIVE pages expose MOTOR DE CABALLOS with Actual (GLB) and 100% procedural (beta). The URL controls the selection; no new backend.
- Current cameras, gate choreography, fixture, betting prototype, presentation, sound, ranking and finishes are unchanged.
- Absolutely no changes to officialRace.js, market price history, fixture source, scoring or payouts.

## Preview and rollback

Once merged and deployed, open /visual-lab/?horse-engine=procedural or /?horse-engine=procedural.
Add &finish-qa=alpha06&procedural-qa=alpha20 for deterministic browser QA snapshot.
Switch the control back to Actual (GLB) to return. Plain site URL keeps the previous horse renderer for all current users.
For complete rollback, revert the isolated integration commit.

## Verification checklist

1. Twelve generated runners, leg motion, jockey, colored mantle, gate numbers, shadows and handoff.
2. Fixture changes preserve official symbol and coat mapping, standings and ranking.
3. Dirt, turf and synthetic surfaces are generated; rain/wetness alters color consistently without file textures.
4. Gate presentation, start at 0..1.2s, manual replay, overtakes, runout, oval track and finish.
5. Noon, evening, night, rain, automatic quality, mobile and low performance device.
6. Median/p95 frame times, draw calls, GPU utilization, allocations and leak-free changes.
7. node --test tests/procedural-live.mjs plus Alpha20 gates and official race tests; Playwright SwiftShader screenshot CI.

## Quality caveat

This is an integrated, functional procedural horse FIRST ITERATION, not a visually validated AAA replacement. The loft and overlapping meshes need anatomical refinements to look photoreal, and the IK needs contact/stance tuning. The user-provided GLOBAL BET screenshots are the intended visual baseline. Default remains GLB until the procedural option surpasses it in visual and performance QA.

No SDF animal library was vendored; this keeps production self-contained. Future upgrades can pin and evaluate MIT procedural-animals under a stable commit.

## Next iterations

1. Match six camera compositions to screenshots and document measurable anatomy, stance and lighting gaps.
2. Continuous implicit/SDF body with skeletal skinning, morph diversity and detailed muscle silhouette.
3. Real hoof planting tied to official visual velocity, improved gallop/canter phases, jockey recoil and inertia.
4. GPU procedural coats including dapples and fiber micro-normal shading, generated mane and tail geometry.
5. Selective camera-dependent foliage/detail, physically balanced lighting, clean night racing, normalized exposure.
6. Geometry batching and shared GPU caches, mesh LOD, stable 30/60 FPS targets by hardware.
7. Integrate the pending Alpha21 hoof/spray/motion branch through the pose API, preserving its changes rather than copying effects.
8. Only change the default after browser checks, visible comparison and ranking parity across fixtures.

## Collision matrix

Alpha20 gates: untouched and reused.
Alpha18 cameras, density, stadium and global network: retained.
Alpha21 motion branch: not modified, to be reconciled after independent QA.
Financial and payout engines: immutable in this work.

All new systems are scenery-only. They must never recompute race ranks or move official participants independently.
