# Alpha 17 · Unified Camera Console and Countdown handoff

**Status:** prepared on branch `prep/alpha17-camera-director-countdown`. Intentionally **not merged or deployed** while other agents update main.

**Baseline:** `2e9dfe7c847718aad2e6189800789390b25584ca`, preserved at `backup/main-pre-alpha17-camera-20261102`.

## Problems confirmed in existing source

- LIVE had a yaw slider and altitude adjustment plus an optical FOV slider hidden in the main weather controls, but **no pitch and no dolly distance**. Selecting one of nine camera views didn't give an operator a proper camera rig.
- Parade's 3D orbit and horse-follow camera ignored the stored height slider. At least one input only updated a label rather than the camera eye position.
- During the phase from 120 to 180 seconds, both `#clock` in the race dial and `#present-countdown` in the presentation overlay were updated. They could be visible superimposed in the top-right of the scene. The independent fixture countdown `#live-countdown` belongs to the schedule below the canvas and should remain.

## Implementation

### Shared camera math, accessible UI, and matching operator gestures
- `visual-lab/cameraRig.js`: pure finite-precision 3D positioning. Independent yaw, pitch, vertical offset, dolly distance, lateral pan and optical FOV. No dependencies on financial scoring, prices, wallets, or Three.js.
- `visual-lab/cameraPanel.js`: shared native range input binder with output labels, reset and increment/decrement controls.
- `assets/camera-console.css`: same grouped camera-panel look and layout in LIVE and Parade.
- `index.html` and `visual-lab/index.html`: dedicated third `CÁMARAS` tab, rather than mixing camera sliders with climate. Adds manual horizon/pitch, dolly, pan, lens zoom, eye height, preset buttons, touch-friendly nudge keypad. Retains `#camera` selector and existing IDs for test compatibility.
- `visual-lab/scene.js`: composes true camera matrices on top of the broadcast director's authored positions; preserves director TV auto and race results. Additional views include low horse closeup, panoramic stadium, starting gates, side, reverse, and existing aerial, finish, rail, drone, leader, pack and grandstand. Drag the 3D canvas for yaw/pitch; wheel for physical approach, Ctrl+wheel for FOV. Keyboard arrows/plus/minus/page keys only when camera tab is active.
- `parade/drone.js`: fixed actual use of height in orbit/follow. Independent yaw, pitch, altitude, distance, pan and FOV, free flight dolly, plus crane mode.
- `parade/parade.js` and `parade/index.html`: common camera console and styling, more touch buttons, smooth blended transitions when switching sights, crane/horse-follow views, stable manual control.

### No more overlapping clocks
- In the on-canvas waiting phase, `showPresentation` activates `.stage.is-presenting`.
- CSS hides `.dial` only during the presentation. `#present-countdown` remains the single on-stage countdown.
- In racing/results/manual modes, the class is cleared and the original timer appears.
- `visual-lab/cameraRig.js` exports a testable phase policy (`countdownVisibility`).
- `broadcastTimeline.js`, the 60 + 60 + 60 schedule, fixture and finish contracts were not changed.

## QA before merging

- `node --test tests/alpha17-camera.mjs`: 6-axis independence, drone altitude, follow/crane, finite coordinates, one timer per phase, code isolation.
- `node --test tests/alpha16-parade.mjs tests/alpha13-home.mjs tests/stadium-live-integration.mjs`: existing stadium/horse identity/lifecycle checks.
- `tests/alpha17-camera-browser.mjs`: Playwright against local preview; operator camera angles, optical zoom and physical dolly, single presentation clock, Parade orbit altitude and follow mode.
- `tests/alpha16-parade-browser.mjs`: complete original Parade 3D smoke and screenshots.
- `.github/workflows/alpha17-camera.yml`: branch-only CI preview, no Hostinger deployment.

## Reconciliation with other agents

**Important:** main gained new commits after Alpha17 branch point, including a community demo hub commit `c216bc493b49...`. Compare fresh main and avoid force-pushing old `index.html`/scene or any future player overlays. Only after tests are green should this branch be merged using a normal PR, then monitor GitHub Actions and verify Hostinger.

## Visual polish follow-up
- Validate camera transitions at multiple screen widths and both straight/oval layouts.
- If needed, add preset-specific collision/safety rails and virtual horizon damping.
- Keep the fixed live eye safe above terrain, preserve 12 GLBs, avoid extra camera rigs or renderer instances.
- For closer AAA shots, detailed LOD0 assets and better background composition are still needed; this release is about camera operation and UI, not geometry replacement.
