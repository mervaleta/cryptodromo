# BTC Horse AAA lookdev · isolated experiment

## Scope and reversibility

- Base: PR #58 head `5142dbff21cd94858c58e92c804ff140f6856e83`.
- The original Quaternius GLB and its authored `Gallop` remain the source of all geometry and skeletal animation.
- Groom improvements are applied to **BTC only** in `racers/btc-atelier-preview.js`.
- The other 99 racer previews and race engine are not edited.
- Rollback: `/racers/?atelier=off#BTC` bypasses the experimental module entirely.
- Original `Hair` SkinnedMesh is hidden only while the enhanced groom is active. Disposing the groom restores its prior visibility.
- Ten candidates can be inspected using `/racers/?lookdev=1#BTC` through `?lookdev=10#BTC` **when this experimental branch is served**. These links on production will not show this unmerged experiment.

## Lookdev stage ledger

| Stage | Active adjustment |
|---|---|
| 01 | Assert original skeleton, hair primitive, and GLB continuity |
| 02 | Smoothly expand and roll continuous mane shell |
| 03 | Add rounded tail volume and nonuniform gentle sweep |
| 04 | Distribute subtler fiber separation toward tips |
| 05 | Set physically-based sheen and nonmetallic satin material |
| 06 | Layer delay onto the original procedural wind (roots remain anchored) |
| 07 | Use v3 microscopic procedural coat shader on the original BTC body |
| 08 | Adjust cinematic studio exposure, rim and shadow softness |
| 09 | Refine original eye/hoof materials when present |
| 10 | Very fine silk striation and final controlled hair roughness |

Each candidate is cumulative: stage N includes previous stages 1..N. They are presentation changes only. No competitor positioning or market data calculations are touched.

## Real browser evidence

The workflow `.github/workflows/btc-horse-atelier.yml` runs Chromium with WebGL in GitHub Actions, executes the normal/rollback runner tests and captures all ten candidates. It produces an artifact `btc-atelier-10-pass-real-webgl` with:

- `artifacts/horse-lookdev/btc-original-before.png`
- `artifacts/horse-lookdev/iteration-NN/profile.png`
- `artifacts/horse-lookdev/iteration-NN/three-quarter.png`
- `artifacts/horse-lookdev/iteration-NN/rear.png`
- `artifacts/horse-lookdev/iteration-NN/detail.png`
- `artifacts/horse-lookdev/iteration-NN/notes.md`

**Important:** Passing automated assertions is not a visual approval. Compare all screenshots to the original and reject any stage whose silhouette, coat, anatomy or motion is worse.

## Open-source evaluations

Three initial references were examined before deciding not to introduce new dependencies:

1. [pmndrs/meshline](https://github.com/pmndrs/meshline), MIT: useful for billboarded lines, but its camera-facing ribbons would undermine the volumetric skinned mane and can create plastic strands.
2. [samueleisen/hairphysic](https://github.com/samueleisen/hairphysic), MIT: Verlet simulation for bone-chain hair, but requires rig hair-chain mapping; our continuous shell is presently skinned to the original joints and favors predictable, nonphysical animation.
3. [majidmanzarpour/threejs-procedural-animals](https://github.com/majidmanzarpour/threejs-procedural-animals), MIT: impressive procedural creature generator and fur techniques, but replacing the source horse violates preservation of the original model and its Gallop.

No code from these libraries was copied, no dependency was installed, and their licenses therefore introduce no redistribution obligations in this PR.

## Honest quality threshold

The base model is a stylized, lightweight horse. Improved surface shaders and hair cannot, on their own, substitute for a high-quality sculpt and groom authored with anatomy, texture and silhouette references. This is experimental character look development, not a certified AAA asset. Production publication should await direct comparison at every angle, correct WebGL rendering, clean shadow pass, and user art direction.
