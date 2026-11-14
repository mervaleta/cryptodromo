// BTC V23 regression: all-removed triangles can conceal retained skin.
// Pure mathematical gate; not a substitute for WebGL visual evidence.
import test from 'node:test';
import assert from 'node:assert/strict';

function intervals(a,b){
 const [ax,ay,az]=a,dx=b[0]-ax,dy=b[1]-ay,dz=b[2]-az;
 const out=[];
 for(const side of [-1,1]){
  let lo=0,hi=1;
  for(const [v,d] of [[.0208-az,-dz],[ay-.0052,dy],[side*ax-.0015,side*dx]]){
   if(d===0){if(v<=0){hi=-1;break;}continue;}
   const t=-v/d;
   if(d>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
   if(hi<=lo)break;
  }
  if(hi>lo)out.push([lo,hi]);
 }
 return out;
}
function fullyRemovedEdge(a,b){
 const spans=intervals(a,b);
 return spans.length===1 && spans[0][0]<=0 && spans[0][1]>=1;
}
test('same lateral lobe may be fully removed',()=>{
 assert.equal(fullyRemovedEdge([.003,.01,.01],[.004,.01,.01]),true);
});
test('opposite removed lobes conceal retained centerline',()=>{
 const a=[-.004,.01,.01],b=[.004,.01,.01];
 assert.equal(intervals(a,b).length,2);
 assert.equal(fullyRemovedEdge(a,b),false);
});
test('height transition inside removed endpoints must be rejected',()=>{
 const a=[.004,.01,.01],b=[.004,.01,.03];
 assert.equal(fullyRemovedEdge(a,b),false);
});
test('tangent lateral boundary cannot be treated as fully removed',()=>{
 assert.equal(fullyRemovedEdge([.0015,.01,.01],[.004,.01,.01]),true);
 assert.equal(fullyRemovedEdge([.0015,.01,.01],[.0015,.01,.01]),false);
});
test('triangle spanning both lobes must fail closed',()=>{
 const tri=[[-.004,.01,.01],[.004,.01,.01],[.004,.012,.012]];
 assert.equal(tri.every((p,i)=>fullyRemovedEdge(p,tri[(i+1)%3])),false);
});
