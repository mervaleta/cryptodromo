import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('homepage embeds cinematic broadcast and preserves institutional navigation',()=>{
 const html=read('index.html');
 assert.match(html,/\/visual-lab\/scene\.js\?v=alpha15-atmosphere-2/);
 assert.match(html,/id="presentation-overlay"/);
 assert.match(html,/id="live-countdown"/);
 assert.match(html,/href="\/racers\/"/);
 assert.match(html,/href="\/institucional\/"/);
 assert.doesNotMatch(html,/id="startButton"/);
 assert.doesNotMatch(html,/race-lab\/source\/src\/main\.js/);
});
test('both 3D views load the scenic expansion without any finance-engine change',()=>{
 const lab=read('visual-lab/index.html');
 const scene=read('visual-lab/scene.js');
 const scenery=read('visual-lab/stadiumBackdrop.js');
 assert.match(lab,/alpha15-atmosphere-2/);
 assert.match(scene,/createStadiumBackdrop\(scene,\{softwareGPU,mobile\}\)/);
 assert.match(scenery,/InstancedMesh/);
 assert.match(scenery,/forestN/);
 assert.match(scene,/createOfficialRace\(race\.entries\)/);
});
