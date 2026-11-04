import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('racers/btc-maya-pose-volume.js');
const skin=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('different Gallop poses keep side-specific joint ownership without cross-leg influence',()=>{
 const positions=new Float32Array([
  .004,.012,.018,-.004,.012,.018,
  .004,.012,.002,.004,-.012,.018,
  .004,.012,.035
 ]);
 const jointNames=['Body','BackLeg.L','BackLeg.R','FrontUpperLeg.L','Tail1'];
 const bone=new Uint16Array([
  1,2,0,3,
  2,1,0,4,
  1,2,0,3,
  1,2,0,3,
  1,2,0,3
 ]);
 const weights=new Float32Array([
  .45,.35,.18,.02,
  .45,.35,.18,.02,
  .45,.35,.18,.02,
  .45,.35,.18,.02,
  .45,.35,.18,.02
 ]);
 const original=weights.slice();
 const result=skin.stabilizeHindSkinWeights(positions,bone,weights,jointNames);
 assert.equal(result.nativeLinearSkinning,true);
 assert.equal(result.rigPreserved,true);
 assert.ok(result.adjusted>=2,'both left and right thigh vertices must be sanitized');
 assert.ok(result.crossSideAfter<result.crossSideBefore*.2,'wrong leg weights must be strongly reduced');
 for(let v=0;v<2;v++){
  const norm=weights.slice(v*4,v*4+4).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(norm-1)<1e-6,'native weights remain normalized');
 }
 assert.deepEqual([...weights.slice(8)],[...original.slice(8)],
  'front limb, hoof and rump outside mask must remain intact');
 assert.equal(skin.hindSkinRegion(.004,.012,.002),0,'fetlock outside stabilizer');
 assert.equal(skin.hindSkinRegion(.004,-.012,.018),0,'front limb outside stabilizer');
 assert.equal(skin.hindSkinRegion(.004,.012,.035),0,'top croup outside stabilizer');
});

test('BTC production keeps real LBS and original Gallop rather than rejected DQS',()=>{
 const master=read('racers/btc-maya-master.js');
 const preview=read('racers/btc-atelier-preview.js');
 const racers=read('racers/racers.js');
 const html=read('racers/index.html');
 for(const src of [master,preview,racers,html])
  assert.match(src,/btc-hind-skin-continuity-20261104-v13b/);
 assert.match(master,/stabilizeHindSkinWeights\(/);
 assert.match(master,/volumeSkinMethod:'side-stabilized-native-linear'/);
 assert.doesNotMatch(master,/installBTCVolumePreservingSkin|btcHindGait|hindDqStrength|setHindVolumeStrength/);
 assert.doesNotMatch(source,/btcDQAccumulate|dualQuaternionSkinPoint|skinning_vertex/);
 assert.match(master,/originalRig:true/);
 assert.match(master,/gallopPreserved:true/);
 assert.match(racers,/horse-preview\.js\?v=alpha18-gaitmane-1/);
 assert.match(preview,/debugAdvance\(frames=1,step=\.583\/16\)/);
 const manifest=JSON.parse(read('racers/btc-master-revision.json'));
 assert.equal(manifest.buildId,'btc-hind-skin-continuity-20261104-v13b');
 assert.equal(manifest.status,'pending_deploy');
 assert.equal(skin.BTC_POSE_VOLUME_BUILD,'btc-hind-skin-continuity-20261104-v13b');
});
