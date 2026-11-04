import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pure=async path=>import('data:text/javascript;base64,'+Buffer.from(read(path)).toString('base64'));
const eyes=await pure('racers/btc-maya-eye-layout.js');
const poll=await pure('racers/btc-maya-poll-bridge.js');
const spring=await pure('racers/btc-maya-tail-spring.js');

test('both eyes share one symmetric cornea and lid landmark without surface-snap seams',()=>{
 const a=eyes.BTC_EYE_LAYOUT;
 assert.ok(a.x>.0022&&a.x<.0026);
 assert.ok(a.radiusX>.00030&&a.radiusX<.0004);
 assert.ok(a.radiusY>a.radiusX,'naturally elongated equine eye');
 for(const angle of [0,.2,1.2,2.7,Math.PI,4.2,6.2]){
  const l=eyes.eyeFrame(-1,angle,.875),r=eyes.eyeFrame(1,angle,.875);
  assert.ok(Math.abs(l.x+r.x)<1e-12,'bilateral mirror');
  assert.ok(Math.abs(l.y-r.y)<1e-12&&Math.abs(l.z-r.z)<1e-12);
  assert.ok(l.x<0&&r.x>0&&Number.isFinite(l.z));
 }
 const source=read('racers/btc-maya-face-details.js');
 assert.match(source,/eyeFrame\(side,a,/);
 assert.doesNotMatch(source,/makeProjector|project\(side,y,z/);
 assert.match(source,/skin\.bind|mesh\.bind\(source\.skeleton/);
});
test('poll forces Head to Neck3 transition, preserving untouched face and hoof weights',()=>{
 const h=7,n=8,skin={joints:[h,n,2,3],weights:[.1,.1,.4,.4]};
 const max=poll.pollMask(0,-.0232,.0446);
 assert.ok(max>.50,'poll core receives real continuity treatment');
 const result=poll.stabilizePollWeights(skin,0,-.0232,.0446,h,n);
 assert.ok(result.weights.every(w=>w>=0&&w<=1));
 assert.ok(Math.abs(result.weights.reduce((a,b)=>a+b,0)-1)<1e-8);
 assert.ok(poll.pollCrestLift(0,-.0232,.0446)>0);
 for(const p of [[.002,-.0281,.04257],[.003,-.033,.034],[.003,.013,.0015]]){
  assert.deepEqual(poll.stabilizePollWeights(skin,...p,h,n),skin,'face/hooves must remain pristine');
 }
 assert.match(read('racers/btc-maya-master.js'),/pollStabilizedVertices/);
 assert.match(read('racers/btc-maya-master.js'),/stabilizePollWeights\(old,x,y,z/);
 assert.match(read('racers/btc-maya-master.js'),/sculptBTCHindquarters\(positions\)/);
});
test('tail inertia follows native Gallop and settles to rest without moving its bones',()=>{
 const tail=spring.createBTCTailSpring();
 const a=[],b=[];
 for(let i=0;i<240;i++){
  const phase=i/35%1;
  const state=tail.update(1/60,{phase,wind:1,speed:1,running:true});
  a.push(state.sway);b.push(state.lift);
  assert.ok(Math.abs(state.sway)<=1.8&&Math.abs(state.lift)<=1.5);
 }
 assert.ok(Math.max(...a)-Math.min(...a)>.45,'tail must swing visibly left/right');
 assert.ok(Math.max(...b)-Math.min(...b)>.32,'tail must lift dynamically');
 for(let i=0;i<240;i++)tail.update(1/60,{phase:.4,wind:0,speed:1,running:false});
 assert.ok(Math.abs(tail.state.sway)<.02,'tail swings should decay once idle');
 assert.ok(Math.abs(tail.state.lift)<.02);
 const code=read('racers/btc-maya-groom.js');
 assert.match(code,/mayaTailSway/);assert.match(code,/btcTailElastic/);
 assert.match(code,/pow\(smoothstep\(\.10,1\.,mayaHairTip\),1\.7\)/);
 assert.doesNotMatch(code,/Tail\d+\.rotation\s*=/);
});
test('the normal real BTC card loads refined 3D resources, with rollback and all others intact',()=>{
 const page=read('racers/index.html'),catalog=read('racers/racers.js');
 const preview=read('racers/btc-atelier-preview.js'),master=read('racers/btc-maya-master.js');
 assert.match(page,/racers\.js\?v=btc-face-poll-tail-20261104-v14/);
 assert.match(catalog,/btc-atelier-preview\.js\?v=btc-face-poll-tail-20261104-v14/);
 assert.match(preview,/btc-maya-master\.js\?v=btc-face-poll-tail-20261104-v14/);
 assert.match(master,/btc-maya-face-details\.js\?v=btc-face-poll-tail-20261104-v14/);
 assert.match(master,/createBTCHeroMaya/);
 assert.match(preview,/createBTCTerrainStage/);
 assert.match(preview,/variant==='original'/);
 assert.doesNotMatch(master,/new THREE\.Sprite|TextureLoader|jockey:true/);
});
