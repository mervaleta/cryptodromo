# BTC · Maya 2017 real head graft / anatomical reconstruction

**State 2026-11-05:** source-backed anatomical candidate, **NOT in production, NOT AAA, no approval**. The previous V5 source remains the live BTC. This proposal includes a **working mesh-based cut** from the user's actual \`Horse_VR_2017.ma\`, not polygon count inflation, texture or shader disguise.

## Visual references and measured anatomy

- Source benchmark: \`212734.mp4\` has 316 frames at ~30 fps over 10.5s; captures show convex equine cheeks, articulated jaw/masseter, oval nostril bulb, defined skull and poll, natural ears, neck taper and a continuous dorsal line. Its white horse is animated, not a real filmed horse with contact-plane reference. Reference MP4 was decoded fully and 24 consecutive frames are in the prior benchmark package.
- Source Maya: \`Horse_VR_2017.ma\`, \`Horse_BaseShapeOrig\`: 5,406 original sculpt vertices and 10,790 triangles. Existing \`racers/btc-maya-body-data.js\` is a quantized (Uint16) export of this exact Maya mesh in the same rest coordinate system as the Quaternius GLB. Tested the first Maya-export vertex against the raw .ma, agreement at ~10^-7 in normalized native coordinates.
- **Real cut, not whole-body substitution:** 1,970 Maya vertices, **3,892 triangles** cover only jaw, muzzle, nostrils, skull, cheeks, poll, ears and upper neck with \`nativeY < -0.0206\`. The 99 other horses and Maya legs are untouched. Original Quaternius \`Main\` discards just the ~308 facial triangles with centroid \`nativeY < -0.0235\`. Eyeballs remain separate original native assets; no floating Maya eye overlay is introduced.
- Existing 50-bone Quaternius rig and authored Gallop clip remain authoritative. The new Maya head uses nearest matching ORIGINAL GLB skin influences restricted to native \`Neck1..Head/Ears\` bones (indices 5–16), never borrowed from rump or legs, and a tiny neck collar blend confined to \`Y=-0.0248..-0.0206\`.
- Already generated a CPU-side comparison image from the actual Maya and GLB triangles (\`maya_head_graft_cpu_compare.png\` in the project conversation). This verifies source geometry, not WebGL animation or final AAA quality.

## Browser QA requirements

The experimental source is isolated at \`racers/experiments/maya-head-graft.js\`, not imported by the public \`racers/btc-atelier-preview.js\`. The independent test page \`tests/fixtures/btc-maya-head-preview.html\` performs the real 3D assembly with existing \`createHorse\` + \`createBTCHeroV5\` and opt-in graft \`?graft=1\`; \`?graft=0\` gives exact V5 control.

- \`tests/btc-maya-head-rig-contract.mjs\`: source quantization, anatomy counts, no modified native hoof/body vertices, 50-bone native skeleton, only head/neck weights and 16 Gallop phases, full rollback.
- \`tests/btc-maya-head-only-browser.mjs\`: WebGL screenshot comparison from profile, front, rear, three-quarter, close detail and top. Sixteen native Gallop poses from profile plus four poses per other view; snapshots must differ from baseline and have no render errors.
- \`.github/workflows/btc-maya-head-qa.yml\` collects genuine screenshots. **Passing browser/rig tests does not imply equine anatomy acceptance**: inspect the entire screenshot set for pupils/eye position, gap between cropped head and neck, ear roots, hair roots, z-fighting and continuity at every Gallop frame. Reject/iterate if any defect remains. Compare against the MP4 and earlier best Maya facial screenshot, then adapt shape/weights before making this the BTC default.
- No changes to \`main\`, no deployment of the Maya graft, no cloning the other 99 and no assertion of MODEL MAESTRO until explicit visual approval.

**Next release gate:** compare the graft to the published BTC at \`https://race.cryptodromo.com/racers/#BTC\` in real Chromium/WebGL; if defective, keep production untouched. Only once reviewed should the groom, corrected facial assets and final build identifier be integrated into the actual public fiche via a distinct PR.
