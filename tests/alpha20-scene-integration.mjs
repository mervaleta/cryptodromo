import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
test('existing static gates replaced with unique Alpha20 factory',()=>{
 assert.equal((scene.match(/const gateKit=createBroadcastGates/g)||[]).length,1);
 assert.equal((scene.match(/scene.add\(gateKit.root\)/g)||[]).length,1);
 assert.doesNotMatch(scene,/const gateFrames=new THREE.Group/);
});
test('fixture change refreshes both gates and symbols',()=>{
 assert.match(scene,/gateKit\.setEntries\(race.entries\);gateLabels\.setEntries\(race.entries\)/);
});
test('runtime draws staging after per-frame official positioning',()=>{
 const update=scene.indexOf('const world=trackPoint(layoutMode,pr,i)');
 const stage=scene.indexOf('applyGateStaging({horses,gate:gateKit');
 const render=scene.indexOf('renderer.render(scene,camera)',stage);
 assert.ok(update>0 && stage>update && render>stage);
});
test('visual gates do not mutate scoring, source or official ranking',()=>{
 const files=['broadcastGates.js','broadcastGateNumbers.js','gateChoreography.js'];
 for(const file of files){
  const src=readFileSync(new URL('../visual-lab/'+file,import.meta.url),'utf8');
  assert.doesNotMatch(src,/createOfficialRace|officialRanking|PRICE_FIXTURE|priceAtStart|priceAtFinish/);
 }
});
test('separate oval layout hides straight-track gate assembly',()=>{
 assert.match(scene,/gateKit\.root\.visible=mode==='straight'/);
});
