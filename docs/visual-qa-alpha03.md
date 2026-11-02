# Cinematic Alpha 03 · visual QA (2 Nov 2026)

Status: **NOT AAA.** This is a publicly accessible 3D foundation, not production art.

## Visual evidence
- Live URL: https://race.cryptodromo.com/visual-lab/
- Test pipeline: .github/workflows/visual-lab.yml
- Browser screenshots: GitHub Actions artifacts under "cryptodromo-cinematic-alpha03".
- Visual standards: Winning Post 10 gameplay camera, Rival Stars Horse Racing gameplay; compare actual in-game frames, not promotional renders.

## Improvements actually implemented
- Replaced XY pseudo-2D theater by Y-up 3D scene with true XZ race surface and perspective lens.
- Rebuilt 3D grandstands, roof, twin spires, scoreboard signage and instanced crowd.
- Added course environment, 3D rails, terrain texture, lighting, day/night/rain, dust and four cameras.
- Attached jockey proxy geometry, token-colored racing silks and distinct horse coat palette.
- Connected to CRP market fixture and official deterministic race engine, 12 runners.
- Fixed time progression to wall-clock independent of GPU FPS.

## Harsh visual inspection: FAIL versus AAA references
1. **Horses: FAIL**. Quaternius model is ~1,874 triangles, and is clearly faceted beside the 45k+ triangle, textured horse assets common in realistic games. Jockeys are proxy cylinders, not rigged characters.
2. **Horse motion: FAIL**. Gallop cycles exist, but mane/tail secondary motion, cloth, hooves, weight shifts, transitions and rider contact have not been built or approved.
3. **Stadium: FAIL**. Current procedural terrace, spectators and roof are visually repetitive and synthetic. Must replace placeholder stadium architecture with modular authored geometry, detailed materials, authentic crowds, flags, signage and landscaping.
4. **Cinematography: PARTIAL**. Moving perspective camera now exists, and closer/lower framing is a real improvement. Needs action-specific camera cuts, composition by leader, focal length, atmospheric depth and motion effects.
5. **Surface and lighting: PARTIAL**. Ground has procedural texture, soft shadows and weather controls, but it lacks believable PBR normal/roughness/wear, contact shadows and coherent HDR environment.
6. **UI: PARTIAL**. Functional modern broadcast overlay, but needs race-specific tactical information and improved legibility at mobile sizes.
7. **Functional: PASS**. Browser launch, 12 entrants, timing and camera selection. The result depends on two saved price intervals; video cadence is not a race determinant.

## Asset blocker and policy
- Horse_VR_2017.ma and Horse_VR_2018.ma and .max scenes in the supplied sources contain purchased model data; Maya ASCII files refer to external /HorsesMayaVR/sourceimages/*.png, absent from the provided package. Converted FBX/GLB with baked skeletal animations and the original legally licensed textures is required to get serious AAA horse geometry into Three.js.
- The original backup's 2D racecourse artwork is stylized and deliberately not used as fake PBR textures. It is useful for historical identity and storytelling only.
- Do not use non-commercial or unverified models from asset marketplaces in public deployment.
- Future art should maintain user asset license restrictions and document provenance.

## Next acceptance gates
1. Obtain full horse model + textures + GLB export and build mounted jockey rig.
2. At least four cinematic camera shots with stable compositions at 16:9 and mobile.
3. Stadium architecture with instanced grandstands and believable audience silhouettes, 60 FPS on midrange desktop at chosen quality.
4. Weather with actually believable rain, puddles and fog; no visible particle tiling.
5. Side-by-side blinded comparison with reference screenshots, rejecting any shot that looks markedly worse; record artifacts and reproducible captures.

No claim of a blind AAA win has been made. Keep current production entry unchanged until gates pass.
