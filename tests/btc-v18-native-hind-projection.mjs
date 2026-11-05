import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const code=read('racers/btc-maya-native-hind-skin.js');
const native=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

const attributes=(array,components)=>({
 count:array.length/components,
 getX(i){return array[i*components];},
 getY(i){return array[i*components+1];},
 getZ(i){return array[i*components+2];},
 getComponent(i,k){return array[i*components+k];}
});

test('closest point returns exact surface barycentrics without crossing bone hinge',()=>{
 const a=[0,0,0],b=[1,0,0],c=[0,1,0];
 for(const [point,expected] of [
  [[0,0,0],[1,0,0]],[[1,0,0],[0,1,0]],[[0,1,0],[0,0,1]],
  [[.25,.25,0],[.5,.25,.25]]
 ]){
  const out=native.closestTriangleWeights(point,a,b,c);
  for(let i=0;i<3;i++)assert.ok(Math.abs(out[i]-expected[i])<1e-6,JSON.stringify({out,expected}));
 }
});

test('native Gallop hind leg weights stay on their OWN side; front legs unaffected',()=>{
 const xyz=[
  .003,.011,.017,.004,.011,.017,.0035,.013,.018,
  -.003,.011,.017,-.004,.011,.017,-.0035,.013,.018
 ];
 const src={
  geometry:{
   getAttribute(key){
    return key==='position'?attributes(xyz,3):
      key==='skinIndex'?attributes([
       1,0,0,0,1,0,0,0,1,0,0,0,
       2,0,0,0,2,0,0,0,2,0,0,0],4):
      key==='skinWeight'?attributes([
       1,0,0,0,1,0,0,0,1,0,0,0,
       1,0,0,0,1,0,0,0,1,0,0,0],4):null;
   },
   getIndex(){return attributes([0,1,2,3,4,5],1);}
  },
  skeleton:{bones:[
   {name:'Body'},{name:'BackUpperLeg.L'},{name:'BackUpperLeg.R'}
  ]}
 };
 const rest=new Float32Array([.0035,.012,.0172,-.0035,.012,.0172,.0035,-.012,.0172]);
 const bones=new Uint16Array([2,0,0,0,1,0,0,0,0,0,0,0]);
 const weights=new Float32Array([1,0,0,0,1,0,0,0,1,0,0,0]);
 const report=native.projectHindWeightsFromNative(src,rest,bones,weights);
 assert.equal(report.adjusted,2,'both hind legs projected');
 assert.equal(report.originalGallop,true);
 assert.ok(report.nativeHindTriangles===2);
 assert.ok(report.meanProjectionError<.003);
 const mass=(i,j)=>Array.from({length:4},(_,k)=>bones[i*4+k]===j?weights[i*4+k]:0).reduce((a,b)=>a+b,0);
 assert.ok(mass(0,1)>.85,'left limb must follow original LEFT Gallop bone');
 assert.ok(mass(1,2)>.85,'right limb must follow original RIGHT Gallop bone');
 assert.ok(mass(0,2)<.1&&mass(1,1)<.1,'no crossed limb influences');
 for(let i=0;i<3;i++){
  const sum=Array.from(weights.slice(i*4,i*4+4)).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(sum-1)<1e-6,'normalized skin weights');
 }
 assert.deepEqual(Array.from(weights.slice(8)),[1,0,0,0],'front leg untouched');
});

test('V18 changes only BTC preview imports and keeps the authored Gallop clip',()=>{
 const master=read('racers/btc-maya-master.js');
 assert.match(master,/projectHindWeightsFromNative\(source,skinRest,bone,weights\)/);
 assert.match(master,/gaitCorrectionStrength:0|gallopPreserved:true/);
 const groom=read('racers/btc-maya-groom.js');
 assert.match(groom,/measureSculptedCrest\(scalpGeometry\)/);
 assert.match(groom,/headShare/);
 assert.match(groom,/forelockInertia/);
});
