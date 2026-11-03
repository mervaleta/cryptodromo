# BTC Hair Physics: feasibility and guardrails

Date: 2026-11-03

## Original horse asset (asset inspected, NOT replaced)
- The current Quaternius GLB has one skinned Hair primitive: **510 vertices**. There are two disconnected components within that primitive.
- Neck mane: 126 vertices with rest-pose Y in approx -0.02973 to -0.01178 and Z in 0.03647 to 0.04576.
- Tail: 384 vertices with rest-pose Y in approx 0.01593 to 0.02223 and Z in 0.01449 to 0.03341.
- The original rig has Tail1..Tail7, and Neck1..3 + Head, but no dedicated mane-bone chain.
- Source asset is retained. Model bones and original Gallop animation remain unmodified.

## Upstream candidate A: HairPhysics for Three.js
- Source: https://github.com/samueleisen/hairphysic
- License: MIT (copyright 2026 samueleisen).
- Pure JS Verlet integration, guide bone chains, sphere/capsule colliders.
- Requires linear chains with >=3 bones, and writes quaternions after pose update.
- **Potential fit for tail chain Tail1..Tail7 only.** Not directly compatible with neck mane, which lacks dedicated hair bones.
- Known conflict risk: original authored Gallop animates tail bones; direct writeback can overwrite that action. Must test a secondary additive solver or a contained late-pass with explicit joint limits before reuse.
- Evaluate in a private pilot rather than copying wholesale into production; no dependency vendored yet.

## Candidate B: WebGPU Hair Simulation (tenkkov / SiTronXD)
- Source: https://github.com/tenkkov/webgpu-hair-simulation
- GPU Verlet guide strands, sphere collision, camera-facing ribbons.
- Not a drop-in fit for the current Three.js WebGLRenderer and would need new render pipeline, material and geometry integration.
- Good long-term reference, not suitable for this A/B pilot.

## Candidate C: eriondibrani hair-simulator
- Source: https://github.com/eriondibrani/hair-simulator
- Instanced groom generation and custom GLSL curls; uses React Three Fiber, head painting and additional resources.
- No direct benefit to keeping our current 510-vertex skinned Hair primitive, which must not be replaced in the BTC pilot.

## Decision: v1.5
- Keep the 510-vertex skinned mesh and render under existing Three.js/WebGL2.
- Separate neck/tail by validated rest-space coordinate masks.
- Bake 96 visual motion samples once, loop them with interpolation, transfer a few floats as uniforms, and deform the original mesh in its vertex shader BEFORE skeletal skinning. No per-frame physics is performed.
- No physics engine added, no new meshes, no texture files, no new race systems.
- Enable exclusively in /racers/?atelier=btc#BTC; leave the normal catalogue and LIVE race untouched.
- Baseline version must be able to be toggled in the same preview.
- Note: shader displacement can make hair move but **cannot create more physical hair volume than the original mesh**. A subsequent visually approved v2 would require new procedural strand geometry or a rigged groom.

## Acceptance
1. Original GLB and Gallop remain intact; no jockeys.
2. Distinct root-to-tip masks for both parts.
3. Tail looping keyframes advance with a different phase than the mane.
4. Browser renders with no page errors.
5. Visual comparison of head, profile and rear at normal/strong wind.
6. Keep work isolated until owner approves the result.
