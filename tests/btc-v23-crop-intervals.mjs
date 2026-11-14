// BTC V23: independent mathematical regression for the piecewise crop boundary.
// This is NOT visual approval; run with node --test tests/btc-v23-crop-intervals.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';

function removedIntervals(a,b){
 const [ax,ay,az]=a, [dx,dy,dz]=b.map((v,i)=>v-a[i]);
 function restrict(lo,hi,value,slope,sign){
  const v=value*sign,d=slope*sign;
  if(d===0)return v>0?[lo,hi]:null;
  const t=-v/d;
  return d>0?[Math.max(lo,t),hi]:[lo,Math.min(hi,t)];
 }
 const out=[];
 for(const side of [-1,1]){
  let range=[0,1];
  for(const [value,slope,sign] of [
   [az-.0208,dz,-1],[ay-.0052,dy,1],[side*ax-.0015,side*dx,1]
  ]){
   range=restrict(range[0],range[1],value,slope,sign);
   if(!range||range[1]<=range[0])break;
  }
  if(range&&range[1]>range[0])out.push(range);
 }
 return out;
}
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`expected ${expected}, got ${actual}`);
test('no crop above height threshold',()=>assert.deepEqual(removedIntervals([.003,.01,.03],[.004,.01,.03]),[]));
test('no crop ahead of rear threshold',()=>assert.deepEqual(removedIntervals([.003,0,.01],[.004,0,.01]),[]));
test('two disjoint cropped intervals across both sides',()=>{
 const ranges=removedIntervals([-.004,.01,.01],[.004,.01,.01]);
 assert.equal(ranges.length,2);
 close(ranges[0][0],0);close(ranges[0][1],.3125);
 close(ranges[1][0],.6875);close(ranges[1][1],1);
});
test('subsample-width interval must still be detected',()=>{
 const ranges=removedIntervals([.0014999,.01,.01],[.0015001,.01,.01]);
 assert.equal(ranges.length,1);close(ranges[0][0],.5);close(ranges[0][1],1);
});
test('exact tangent to x threshold is not a removed interval',()=>{
 assert.deepEqual(removedIntervals([.0015,.01,.01],[.0015,.02,.01]),[]);
});
test('one crossing at height threshold',()=>{
 const ranges=removedIntervals([.004,.01,.03],[.004,.01,.01]);
 assert.equal(ranges.length,1);close(ranges[0][0],.46);close(ranges[0][1],1);
});
