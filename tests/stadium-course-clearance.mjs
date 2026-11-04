import test from 'node:test';
import assert from 'node:assert/strict';
import {stadiumCoursePoint,THREE_COURSE_POSITIONS} from '../visual-lab/threeCoursePreview.js';

const ids=['muybridge','genesis','vint-cerf'];
function ribbonSamples(id){
 const samples=[];
 for(let i=0;i<=240;i++)for(const lateral of [-20.5,0,20.5]){
  const p=stadiumCoursePoint(id,i/240,lateral);
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z),id+' nonfinite coordinate');
  samples.push(p);
 }
 return samples;
}
test('museum has one reusable position transform for all three recognized 3D courses',()=>{
 assert.deepEqual(Object.keys(THREE_COURSE_POSITIONS),ids);
 for(const id of ids){
  const p0=stadiumCoursePoint(id,0),p1=stadiumCoursePoint(id,1);
  assert.ok(Number.isFinite(p0.x)&&Number.isFinite(p1.z));
  assert.notDeepEqual(p0,stadiumCoursePoint(id,.35));
 }
 assert.throws(()=>stadiumCoursePoint('unknown',.2),RangeError);
});
test('existing three-course exhibition ribbons have meaningful physical clearance',()=>{
 // Sampled geometric guard only. It does not replace screenshots or mesh intersection QA.
 const samples=Object.fromEntries(ids.map(id=>[id,ribbonSamples(id)]));
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  let minimumSquared=Infinity;
  for(const a of samples[ids[i]])for(const b of samples[ids[j]]){
   const d=(a.x-b.x)**2+(a.z-b.z)**2;
   if(d<minimumSquared)minimumSquared=d;
  }
  const clearance=Math.sqrt(minimumSquared);
  assert.ok(clearance>10,ids[i]+' crosses '+ids[j]+' (sampled clearance '+clearance.toFixed(1)+')');
 }
});
