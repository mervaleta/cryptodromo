import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('legacy V5 groom and Gallop stay selectable as a rollback',()=>{
 const racers=read('racers/racers.js'),preview=read('racers/btc-atelier-preview.js');
 assert.match(racers,/requestedBTCMaster==='v5'\?'enhanced'/);
 assert.match(preview,/createBTCHeroV5/);assert.match(preview,/createBTCHeroMaya/);
 assert.match(preview,/gaitCorrectionStrength:0/);
 const v5=read('racers/btc-hero-v5.js'),shell=read('racers/btc-silk-shell-v5.js');
 assert.match(v5,/damped-gallop-coupled-spring/);assert.match(v5,/createBTCSilkShell/);
 assert.match(shell,/SkinnedMesh/);
});
test('BTC V21 is visible with owner visual acceptance still pending',()=>{
 const manifest=JSON.parse(read('racers/btc-master-revision.json'));
 assert.equal(manifest.masterId,'btc-maya-2017-sculpt-gallop-20261104');
 assert.equal(manifest.buildId,'btc-v21-ocular-tail-root-20261107-v1');
 assert.equal(manifest.status,'needs_visual_qa');
 assert.match(read('racers/btc-maya-master.js'),/BTC_MAYA_RENDER_BUILD='btc-v21-ocular-tail-root-20261107-v1'/);
});
