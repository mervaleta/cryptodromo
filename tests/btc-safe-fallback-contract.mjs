import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Maya V16 is the visible BTC default while V5 and native remain reversible',()=>{
 const racers=read('racers/racers.js'),preview=read('racers/btc-atelier-preview.js'),html=read('racers/index.html');
 assert.match(racers,/requestedBTCMaster==='v5'\?'enhanced':'maya'/);
 assert.match(preview,/stageParams\.get\('btcMaster'\)==='v5'\?'enhanced':'maya'/);
 assert.match(html,/data-btc-variant="maya" aria-pressed="true"/);
 assert.match(preview,/createBTCHeroV5/);assert.match(preview,/createBTCHeroMaya/);
 const master=read('racers/btc-maya-master.js');
 assert.match(master,/makeAnatomicalEyes/);assert.match(master,/stabilizeHindSkinWeights/);
 assert.doesNotMatch(master,/addBTCHindquarterGaitShader\(shader,hindGait\)/);
 const manifest=JSON.parse(read('racers/btc-master-revision.json'));
 assert.equal(manifest.buildId,'btc-maya-face-native-gallop-20261105-v16');assert.equal(manifest.status,'needs_visual_qa');
});
