# Alpha20 · Broadcast Starting Gates · Integration handoff

Status: **opt-in / staged / NOT deployed**. Created on top of `main` at `4607d6f`. This branch intentionally **does not edit** `visual-lab/scene.js`, `estadio/`, `race-lab/`, `officialRace.js`, layouts, fixture, skins, weather, cameras or pages.

## Current collision inventory (verified against main)
- `visual-lab/scene.js` around lines 243-250 already makes static `gateFrames` for 12 lanes. **Replace this block, never add a second set.**
- Exact existing dimensions: `x=VISUAL_START_X-3.6`, `z=(lane-5.5)*2.55`, roof center `y=3.02`. Current horses are around `height:2.85`. No scaling changes are included.
- Main scene already imports Alpha17 `cameraRig.js`/`cameraPanel.js`, Alpha18 `stadiumDensity.js`, procedural stadium materials and live race director. Preserve these.
- Existing `getRaceFixture` returns `{day,number,minute,time,entries}`. Its `entries` are already ordered by track lane and carry `symbol`, `color`, `coat`. There is **no gateNumber field**; use `index+1`.
- Main broadcast uses `broadcastPhase(liveSlot(...).slotSeconds)` with a presentation interval, and `setRace()` resets the fixtures. The gate trigger must be the authoritative PRESENTATION→RACE transition, not a new Date.now countdown.
- Alpha19 (#19) adds three courses to a separate draft branch; later integration will require one starting gate assembly **per active physical track**, not 36 duplicated gates in the current track.
- Existing draft PRs #12 (cameras), #13 (tribune density), #15 (procedural), #19 (tracks), #23 (navigation), #26 (economy) must be reconciled before merging. Some corresponding code is already in main.

## Prepared files
- `visual-lab/broadcastGates.js`: reusable geometry, doors, warning lights and `update({secondsSinceStart,phase})` with deterministic easing, `setEntries`, `dispose`.
- `visual-lab/broadcastGateNumbers.js`: optional 12 placards with a BIG number and runner symbol over its unique fixture color. Uses canvas only for display textures, never for official data.
- `tests/alpha20-gates.mjs`: pure logic and source contract smoke checks.

## Minimal integration patch when other agents have stabilized
```js
import {createBroadcastGates} from './broadcastGates.js?v=alpha20-1';
import {attachGateNumbers} from './broadcastGateNumbers.js?v=alpha20-1';

// After entries are known, INSTEAD OF the old static gateFrames block:
const gateKit=createBroadcastGates({THREE,entries:race.entries,startX:VISUAL_START_X});
scene.add(gateKit.root);
const gateLabels=attachGateNumbers({THREE,root:gateKit.root,entries:race.entries,startX:VISUAL_START_X});

// Inside setRace(index), after race is set:
gateKit.setEntries(race.entries);
gateLabels.setEntries(race.entries);

// With timeline elapsed relative to official start:
// PREPARATION: gateKit.update({phase:'presentation',secondsSinceStart:-1});
// RACE: gateKit.update({phase:'race',secondsSinceStart:elapsed});

// Teardown:
gateLabels.dispose();
gateKit.dispose();
```
The above is a **handoff snippet, not a drop-in copy**: `entries` is not available where today's static gate block sits. Initialize the kit after the fixture is loaded, or construct lazily after `setRace` finishes. Avoid referencing it inside `setRace` before initialization. Stage horses *behind* the closed leaves during presentation, then restore the official trackPoint positions when RACE starts, without applying any fictitious distance to the official engine. Current `trackPoint(layoutMode,0,i)` sits ahead of the front of the proposed closed gates: this needs an explicit camera/staging transition and visual review.

## Acceptance conditions before merging
1. Main no longer renders static gateFrames in parallel with this kit.
2. 12 unique numbers 1-12 match fixture entry order and colors, and update every setRace.
3. Closed before start, open once at t=0 over ~0.72s; reset when fixture/replay changes.
4. No gate/horse clipping during Idle→Gallop. Test current horse 2.85; no upward scaling.
5. No extra timers or altered UTC-3 scheduling; manually started replays and live starts both work.
6. Do not touch official ranking, input1/input2, 60-second result or 180-second slot.
7. Verify 3 quality presets, WebGL desktop and mobile, weather and day/night, camera angles and Alpha19 tracks.
8. Frame-by-frame visual proof and FPS measurements required. The geometry has not yet been browser-rendered from this branch. Do not claim AAA shipped.
9. No deployments, branch merges or force pushes without refreshed diff.

## Graphics direction
Metal with roughness/metalness, truss, mechanical outward opening, legible colored bib/number signs, shot-by-shot presentation and optional dust/hit audio via **existing** broadcastFX/audio systems. Keep Photo Finish Live as visual inspiration, not an asset source. For true AAA, still need high-end horse assets, PBR textures, tuned contact shadows, polished FX and camera-grade shots.
