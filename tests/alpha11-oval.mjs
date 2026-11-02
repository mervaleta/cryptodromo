import test from 'node:test';
import assert from 'node:assert/strict';
import {trackPoint} from '../visual-lab/trackMath.js';
test('oval has twelve separated lanes throughout both semicircles',()=>{
 for(let step=0;step<720;step++){
  const p=step/720;
  const points=Array.from({length:12},(_,lane)=>trackPoint('oval',p,lane));
  for(let lane=0;lane<11;lane++){
   const a=points[lane],b=points[lane+1];
   const separation=Math.hypot(a.x-b.x,a.z-b.z);
   assert.ok(Math.abs(separation-2.55)<1e-7,'lane separation '+step+'/'+lane+': '+separation);
  }
 }
});
test('oval is continuous at quarter turns and returns to start',()=>{
 for(const p of [0, .25,.5,.75,.9999]){
  const a=trackPoint('oval',p,5.5),b=trackPoint('oval',p+.00001,5.5);
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.5,'oval discontinuity at '+p);
 }
 const a=trackPoint('oval',0,5.5),b=trackPoint('oval',1,5.5);
 assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-6);
});
