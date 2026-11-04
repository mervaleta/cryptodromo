import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildThreeCoursePreview,THREE_COURSE_POSITIONS,SATOSHI_COURSE_MASTER,
 SATOSHI_MIN_SAMPLE_CLEARANCE,stadiumCoursePoint,stadiumCourseTangent,courseBoundaryClearance}
 from '../visual-lab/threeCoursePreview.js';

const require=createRequire(new URL('../race-lab/source/package.json',import.meta.url));
const THREE=require('three');
const context={fillRect(){},fillText(){}};
globalThis.document={createElement(tag){
 assert.equal(tag,'canvas');
 return {width:0,height:0,getContext(){return context;}};
}};
const tracks=['muybridge','genesis','vint-cerf'];
test('correct three-course topology: outer oval, northern diagonal and infield S',()=>{
 assert.equal(SATOSHI_COURSE_MASTER,'satoshi-three-course-master-v2');
 assert.deepEqual(Object.keys(THREE_COURSE_POSITIONS),tracks);
 assert.equal(THREE_COURSE_POSITIONS.muybridge.mode,'oval');
 assert.equal(THREE_COURSE_POSITIONS.genesis.mode,'straight');
 assert.equal(THREE_COURSE_POSITIONS['vint-cerf'].mode,'s-bend');
 assert.equal(THREE_COURSE_POSITIONS['vint-cerf'].centerZ,0,'Vint Cerf must not cut through the historic grandstand');
 assert.ok(THREE_COURSE_POSITIONS.genesis.centerZ>150,'Genesis north concourse missing');
 for(const id of tracks){
  for(const p of [0,.1,.25,.5,.75,.9,1]){
   const point=stadiumCoursePoint(id,p),tangent=stadiumCourseTangent(id,p);
   assert.ok([point.x,point.z,tangent.x,tangent.z].every(Number.isFinite));
   assert.ok(Math.abs(Math.hypot(tangent.x,tangent.z)-1)<1e-9);
  }
 }
});
test('all course surfaces and safety margins remain geometrically disjoint',()=>{
 for(let i=0;i<tracks.length;i++)for(let j=i+1;j<tracks.length;j++){
  const gap=courseBoundaryClearance(tracks[i],tracks[j],160);
  assert.ok(gap>=SATOSHI_MIN_SAMPLE_CLEARANCE,
   tracks[i]+' vs '+tracks[j]+': '+gap.toFixed(2)+'m sampled clearance');
 }
});
for(const quality of ['low','medium','high']){
 test(quality+': build master track geometry, run focus and dispose without replacing other venue scene',()=>{
  const scene=new THREE.Scene(),before=scene.children.length;
  const venue=buildThreeCoursePreview({THREE,scene,quality});
  assert.equal(scene.children.length,before+1);
  assert.equal(venue.root.name,'SATOSHI_NAKAMOTO_THREE_COURSE_MASTER_V2');
  assert.deepEqual(venue.courses,tracks);
  assert.deepEqual(venue.stats.courseCount,3);
  assert.equal(venue.stats.ribbonCount,6);
  assert.equal(venue.stats.signCount,3);
  assert.ok(venue.stats.lightCount>=24);
  assert.equal(venue.stats.layoutVersion,SATOSHI_COURSE_MASTER);
  const meshes=[];
  venue.root.traverse(obj=>{if(obj.isMesh)meshes.push(obj)});
  assert.ok(meshes.length>80,'Missing start/finish/rails/signage meshes '+meshes.length);
  for(const id of tracks){
   const group=venue.root.getObjectByName('SATOSHI_TRACK_'+id.toUpperCase());
   assert.ok(group&&group.children.length>15,'Missing model for '+id);
   venue.setFocus(id);assert.equal(venue.focus,id);
  }
  venue.setFocus(null);
  assert.equal(venue.focus,null);
  assert.throws(()=>venue.setFocus('fake-track'),RangeError);
  const refs=meshes.map(m=>m.geometry);
  venue.dispose();
  assert.equal(scene.children.length,before);
  assert.equal(venue.root.children.length,0);
  assert.ok(refs.some(g=>g.index||g.attributes.position),'No usable geometry built');
 });
}
