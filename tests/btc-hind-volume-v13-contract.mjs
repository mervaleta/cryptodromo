import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const src=read('racers/btc-maya-pose-volume.js');
const dq=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const qZ=angle=>[0,0,Math.sin(angle/2),Math.cos(angle/2)];
const bone=(angle,t=[0,0,0])=>({rotation:qZ(angle),translation:t});
const distance=p=>Math.hypot(...p);

test('DQS keeps thigh girth constant for opposing animated bone rotations',()=>{
 const p=[.004,0,0],phases=[0,.10,.20,.30,.40,.50,.60,.70,.80,.90,1];
 for(const phase of phases){
   const bend=(Math.sin(2*Math.PI*phase)+1)/2*(Math.PI/3);
   const bones=[bone(bend),bone(-bend)];
   const v=dq.dualQuaternionSkinPoint(p,bones,[.5,.5]);
   assert.ok(Math.abs(distance(v)-distance(p))<.00000001, 'girth changed at phase '+phase+': '+distance(v));
 }
 const collapsed=.004*Math.cos(Math.PI/3);
 assert.ok(collapsed<.0021,'LBS would narrow the same muscle by around half at the worst phase');
});

test('DQS preserves rigid translations and handles antipodal quaternions',()=>{
 const a={rotation:qZ(.8),translation:[.02,-.01,.005]};
 const b={rotation:a.rotation.map(x=>-x),translation:[.02,-.01,.005]};
 const output=dq.dualQuaternionSkinPoint([.003,0,0],[a,b],[.5,.5]);
 assert.ok(Math.abs(Math.hypot(output[0]-.02,output[1]+.01,output[2]-.005)-.003)<1e-8);
});

test('generated body shader applies only to the rear muscle and leaves hoof unchanged',()=>{
 const shader={vertexShader:'#include <common>\n#include <skinning_vertex>',uniforms:{}};
 const uniform={value:.96};
 dq.installBTCVolumePreservingSkin(shader,uniform);
 assert.equal(shader.uniforms.btcVolumePreservation,uniform);
 assert.match(shader.vertexShader,/vec4 btcDQRotation\(mat4 m\)/);
 assert.match(shader.vertexShader,/btcDQAccumulate\(boneMatW,skinWeight.w/);
 assert.match(shader.vertexShader,/transformed=mix\(transformed,btcDqLocal,btcDqMix\)/);
 assert.match(shader.vertexShader,/smoothstep\(0\.0085,0\.0130,position.z\)/);
 assert.match(shader.vertexShader,/smoothstep\(0\.0012,0\.0027,abs\(position.x\)\)/);
 assert.doesNotMatch(shader.vertexShader,/btcHindGait|sin\(btcHindGait/);
 assert.throws(()=>dq.installBTCVolumePreservingSkin({vertexShader:'void main() {}',uniforms:{}}));
});

test('main BTC viewer connects pose-stable DQ without changing Gallop or other tokens',()=>{
 const master=read('racers/btc-maya-master.js');
 const preview=read('racers/btc-atelier-preview.js');
 const racers=read('racers/racers.js');
 const html=read('racers/index.html');
 for(const x of [master,preview,racers,html])assert.match(x,/btc-hind-pose-volume-20261104-v13/);
 assert.match(master,/installBTCVolumePreservingSkin\(shader,hindDqStrength\)/);
 assert.doesNotMatch(master,/addBTCHindquarterGaitShader\(shader/);
 assert.doesNotMatch(master,/anatomy\.hindGait\.value=gait/);
 assert.match(master,/volumeSkinMethod:'masked-dual-quaternion'/);
 assert.match(master,/originalRig:true/);
 assert.match(master,/gallopPreserved:true/);
 assert.match(racers,/horse-preview\.js\?v=alpha18-gaitmane-1/);
 assert.match(preview,/if\(!fixedFrame\|\|!horse\|\|!hero\|\|selected\?\.symbol!=='BTC'\)return null/);
 assert.equal(dq.BTC_POSE_VOLUME_BUILD,'btc-hind-pose-volume-dq-20261104-v13');
 const manifest=JSON.parse(read('racers/btc-master-revision.json'));
 assert.equal(manifest.buildId,'btc-hind-pose-volume-20261104-v13');
 assert.equal(manifest.status,'pending_deploy');
});
