import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hashHorseSeed,solveLegIK} from '../visual-lab/proceduralMath.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const horse=read('visual-lab/proceduralHorse.js');
const ground=read('visual-lab/proceduralGround.js');
const renderer=read('visual-lab/horseRenderer.js');
const scene=read('visual-lab/scene.js');

test('procedural horse seeds are reproducible and independent of roster position',()=>{
 for(const symbol of ['BTC','ETH','DOGE','BTC','1INCH']){
  assert.equal(hashHorseSeed(symbol),hashHorseSeed(symbol));
  assert.ok(Number.isInteger(hashHorseSeed(symbol)));
 }
 assert.notEqual(hashHorseSeed('BTC'),hashHorseSeed('ETH'));
});
test('two-bone hoof IK remains finite for all strides and grounded hooves',()=>{
 for(const side of [-1,1])for(let i=0;i<240;i++){
  const hip={x:side*.75,y:1.36,z:side*.31};
  const foot={x:hip.x+.28*Math.cos(i*.18),y:.135+.20*Math.max(0,Math.sin(i*.18)),z:hip.z};
  const knee=solveLegIK(hip,foot,.70,.73,side);
  assert.ok([knee.x,knee.y,knee.z].every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(knee.x-hip.x,knee.y-hip.y)-.70)<.002);
 }
});
test('horses, jerseys, numbered saddlecloths and gait are generated without external assets',()=>{
 assert.doesNotMatch(horse,/GLTFLoader|fetch\(|\.glb\b|\.fbx\b|new Image\(|\.png\b|\.jpg\b|CanvasTexture|SpriteMaterial|\.play\('runClip'/i);
 assert.match(horse,/new THREE\.MeshStandardMaterial/);
 assert.match(horse,/solveLegIK/);
 assert.match(horse,/stallNumber/);
 assert.match(horse,/setWetness/);
 assert.match(horse,/setBank/);
 assert.match(horse,/setVisualQuality/);
 assert.match(horse,/h\.mesh\.rotation\.z=h\.base\+/);
});
test('official homepage always uses Fidelity and preserves race choreography',()=>{
 assert.match(renderer,/return 'fidelity'/);
 assert.match(renderer,/createAlpha22RaceHorse/);
 assert.doesNotMatch(renderer,/return createLegacyHorse|return createProceduralRaceHorse/);
 assert.match(scene,/horseEngineMode=selectedHorseRenderer\(location\.search\)/);
 assert.match(scene,/createCinematicLineup\(\{entries,coats:horseCoats,createHorse\}\)/);
 assert.match(read('visual-lab/cinematicLineup.js'),/stallNumber:index\+1/);
 assert.match(scene,/const world=trackPoint\(layoutMode,pr,i\)/);
 assert.match(scene,/h\.model\.root\.position\.set\(world\.x,0,world\.z\)/);
 assert.match(scene,/applyGateStaging\(\{horses,gate:gateKit/);
 assert.match(read('index.html'),/id="horse-engine" hidden/);
 assert.match(read('index.html'),/value="fidelity" selected/);
 assert.doesNotMatch(read('assets/crp-global-nav.js'),/Visual Lab|Modo Parade|Laboratorio/);
});
test('GPU turf, soil and rain do not need texture files or change race results',()=>{
 assert.match(ground,/onBeforeCompile/);
 assert.match(ground,/crpGroundMowing/);
 assert.match(ground,/crpGroundWetness/);
 assert.match(ground,/track\.map=null/);
 assert.match(scene,/proceduralGround\?\.setSurface\(type\)/);
 assert.match(scene,/proceduralGround\?\.setWetness\(wet\)/);
 assert.doesNotMatch(ground,/createOfficialRace|officialRanking|PRICE_FIXTURE|broadcastPosition|fetch\(/);
 assert.doesNotMatch(horse,/createOfficialRace|officialRanking|PRICE_FIXTURE|broadcastPosition/);
});

test('Alpha22 remains canonical and all presentation quality is cinematic',()=>{
 const adapter=read('visual-lab/horse-fidelity/horseAdapter.js');
 const fidelity=read('visual-lab/horse-fidelity/proceduralHorse.js');
 assert.match(adapter,/createAlpha22RaceHorse/);
 for(const key of ['setVisualQuality','setWetness','setBank','hoofPhase'])
  assert.ok(fidelity.includes(key));
 assert.match(scene,/horseEngineMode!=='legacy'\?installProceduralGround/);
 assert.match(scene,/graphicsModeSelect.value='cinematic'/);
 assert.match(scene,/new THREE.WebGLRenderer\(\{canvas,antialias:true/);
 assert.match(scene,/renderer.shadowMap.enabled=true/);
 assert.doesNotMatch(scene,/new THREE.SphereGeometry\(\.95,12,9\)/);
 assert.match(read('index.html'),/id="graphics-quality" hidden/);
 assert.doesNotMatch(fidelity,/createOfficialRace|PRICE_FIXTURE|officialRanking|broadcastPosition/);
});
