import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('stadium broadcast preserves cinematic engine and site has a new landing',()=>{
 const home=read('index.html');
 assert.match(home,/Elegí tu tribuna/);
 const html=read('stadiums/crypto/broadcast/index.html');
 assert.match(html,/\/visual-lab\/scene\.js\?v=[a-z0-9][\\w.-]+/);
 assert.match(html,/id="presentation-overlay"/);
 assert.match(html,/id="live-countdown"/);
 assert.match(html,/href="\/racers\/"/);
 assert.match(html,/href="\/institucional\/"/);
 assert.match(html,/href="\/parade\/"/);
 assert.doesNotMatch(html,/id="startButton"/);
 assert.doesNotMatch(html,/race-lab\/source\/src\/main\.js/);
});
test('both 3D views load the scenic expansion without any finance-engine change',()=>{
 const lab=read('visual-lab/index.html');
 const scene=read('visual-lab/scene.js');
 const scenery=read('visual-lab/stadiumBackdrop.js');
 assert.match(lab,/scene\.js\?v=[a-z0-9][\\w.-]+/);
 assert.match(scene,/createStadiumBackdrop\(scene,\{softwareGPU,mobile\}\)/);
 assert.match(scene,/createParadeVillage\(scene,/);
 assert.doesNotMatch(scene,/box\(820,2\.6,36/);
 assert.match(scenery,/InstancedMesh/);
 assert.match(scenery,/forestN/);
 assert.match(scene,/createOfficialRace\(race\.entries\)/);
});
