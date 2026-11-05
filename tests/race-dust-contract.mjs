import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=read('visual-lab/scene.js');
const stamp='scene.js?v=broadcast-aaa-20261105-v1-racedust2';

test('race cloud restores the original 12-horse airborne gallop dust',()=>{
 assert.match(scene,/const dustN=softwareGPU\?110:mobile\?160:450/);
 assert.match(scene,/dust\.name='Broadcast · original trailing gallop dust'/);
 assert.match(scene,/function particles\(dt\)\{[\s\S]*?if\(running&&horses\.length\)/);
 assert.match(scene,/h=horses\[i%horses\.length\]/);
 assert.match(scene,/const trail=1\+r\(\)\*7,lateral=/);
 assert.match(scene,/dust\.visible=true/);
 assert.match(scene,/else dust\.visible=false/);
 assert.match(scene,/trackType\.value==='grass'\?\.14/);
 assert.match(scene,/dustGeo\.setDrawRange/);
});
test('persistent dark hoof stamps are hidden in racing without changing the gait solver',()=>{
 assert.match(scene,/hoofFX\.marks\.visible=false/);
 assert.match(scene,/hoofFX\.shadows\.visible=false/);
 assert.match(scene,/hoofFX\.stepHorse\(h\.index/);
 assert.match(scene,/hoofFX\.update\(dt/);
 assert.doesNotMatch(scene,/trackFX\.stamp\(/);
 assert.match(scene,/officialRanking/);
 assert.match(scene,/raceDustVisible:dust\.visible/);
 assert.match(scene,/visibleGroundStains:hoofFX\.marks\.visible\|\|hoofFX\.shadows\.visible/);
});
test('both public broadcasters request the restored scene, not cached module',()=>{
 assert.ok(read('visual-lab/index.html').includes(stamp));
 assert.ok(read('stadiums/crypto/broadcast/index.html').includes(stamp));
});
