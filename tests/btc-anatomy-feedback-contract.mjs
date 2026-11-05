import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('racers/btc-maya-pose-volume.js');
const pose=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
test('hind weights separate left and right while hooves retain original rig',()=>{
 const pos=new Float32Array([.004,.012,.018,-.004,.012,.018,.004,.012,.002]);
 const names=['Body','BackLeg.L','BackLeg.R','FrontUpperLeg.L'];
 const joints=new Uint16Array([1,2,0,3,2,1,0,3,1,2,0,3]);
 const w=new Float32Array([.45,.35,.18,.02,.45,.35,.18,.02,.45,.35,.18,.02]);
 const hoof=Array.from(w.slice(8));
 const out=pose.stabilizeHindSkinWeights(pos,joints,w,names);
 assert.equal(out.nativeLinearSkinning,true);
 assert.equal(out.rigPreserved,true);
 assert.ok(out.adjusted>=2);
 assert.ok(out.crossSideAfter<out.crossSideBefore*.25);
 assert.deepEqual(Array.from(w.slice(8)),hoof);
 for(let i=0;i<2;i++)assert.ok(Math.abs(w.slice(i*4,i*4+4).reduce((a,b)=>a+b,0)-1)<1e-6);
});
test('true Maya BTC has stationary muscle mass, stable poll and original Gallop',()=>{
 const master=read('racers/btc-maya-master.js');
 assert.match(master,/stabilizeHindSkinWeights\(/);
 assert.match(master,/pollAnchoredVertices/);
 assert.match(master,/hindGaitCorrective:false/);
 assert.doesNotMatch(master,/addBTCHindquarterGaitShader\(shader,hindGait\)/);
 assert.match(master,/gallopPreserved:true/);
 const manifest=JSON.parse(read('racers/btc-master-revision.json'));
 assert.equal(manifest.buildId,'btc-maya-pose-anatomy-20261105-v1');
});
test('showroom hooves use scaled, limited marks with stadium defaults preserved',()=>{
 const fx=read('visual-lab/hoofTerrainFX.js');
 const stage=read('racers/btc-terrain-stage.js');
 assert.match(fx,/imprintScale=1,imprintLimit=null/);
 assert.match(stage,/imprintScale:\.32,imprintLimit:36/);
 assert.match(stage,/createBTCTerrainStage/);
});
