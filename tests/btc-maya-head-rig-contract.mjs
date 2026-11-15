/** Source-backed rig contract. This is a mathematical safety test, not visual AAA approval. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createBTCMayaHeadGraft} from '../racers/experiments/maya-head-graft.js';
const compressed=readFileSync(new URL('../race-lab/source/assets/horse.glb.gz',import.meta.url));
const bin=gunzipSync(compressed);
const asset=await new GLTFLoader().parseAsync(bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength),'');
let body;
const tracked=[];
asset.scene.traverse(o=>{
 if(!o.isSkinnedMesh)return;
 if(o.material?.name==='Main')body=o;
 tracked.push({o,geo:o.geometry,visible:o.visible});
});
assert.ok(body,'Native GLB source Main missing');
const oldMain=body.geometry,oldSkin=body.skeleton;
const restPositions=oldMain.getAttribute('position').array.slice();
const nativeGallop=asset.animations.find(a=>a.name==='Gallop');
assert.ok(nativeGallop,'Must be authored native Gallop');
const head=createBTCMayaHeadGraft(asset.scene,{coatColor:'#a36b4e'});
const headMesh=body.parent.children.find(o=>o.name==='BTC Maya source anatomical head and muzzle, native Gallop');
assert.ok(headMesh,'Original Maya geometry must be instantiated as an actual rigged mesh');

test('Maya source contributes real 3D head, muzzle, cheek and jaw topology',()=>{
 const snap=head.snapshot;
 assert.equal(snap.source,'Horse_VR_2017.ma / Horse_BaseShapeOrig, real Maya triangles');
 assert.ok(snap.mayaHeadVertices>=1800&&snap.mayaHeadVertices<=2200);
 assert.ok(snap.mayaHeadTriangles>=3700&&snap.mayaHeadTriangles<=4100);
 assert.ok(snap.nativeHeadTrianglesRemoved>100);
 assert.equal(snap.untouchedNativeBones,50);
 assert.equal(snap.originalGallopUnchanged,true);
 assert.equal(snap.detachedEyeOverlays,0);
 assert.equal(headMesh.skeleton,oldSkin,'No reconstructed or retargeted skeleton allowed');
 assert.deepEqual(oldMain.getAttribute('position').array,restPositions,'Source GLB native vertex positions must not change');
 for(const {o,geo} of tracked)if(o!==body)assert.equal(o.geometry,geo,'Other body parts must not change mesh geometry');
});
test('Head remains attached through all 16 Gallop phases without broken skin weights',()=>{
 const p=headMesh.geometry.getAttribute('position');
 const wi=headMesh.geometry.getAttribute('skinWeight');
 const ji=headMesh.geometry.getAttribute('skinIndex');
 for(let k=0;k<p.count;k++){
  const w=wi.getX(k)+wi.getY(k)+wi.getZ(k)+wi.getW(k);
  assert.ok(Number.isFinite(w)&&Math.abs(w-1)<1e-5,'Non-normalized graft skin vertex '+k);
  for(let q=0;q<4;q++){
   const bone=ji.getComponent(k,q),weight=wi.getComponent(k,q);
   if(weight>1e-6)assert.ok(bone>=5&&bone<=16,'Head must only use original Neck and Head joints');
  }
 }
 const mixer=new THREE.AnimationMixer(asset.scene);
 mixer.clipAction(nativeGallop).play();
 const sample=[0,Math.floor(p.count*.25),Math.floor(p.count*.5),Math.floor(p.count*.75),p.count-1];
 let motion=false,prev=[];
 for(let phase=0;phase<16;phase++){
  mixer.setTime(nativeGallop.duration*phase/16);
  asset.scene.updateMatrixWorld(true);headMesh.skeleton.update();
  const now=sample.map(i=>{
   const v=new THREE.Vector3().fromBufferAttribute(p,i);
   headMesh.applyBoneTransform(i,v);
   assert.ok([v.x,v.y,v.z].every(Number.isFinite),'Vertex left native gallop space');
   return [v.x,v.y,v.z];
  });
  if(phase&&now.some((v,i)=>v.some((x,k)=>Math.abs(x-prev[i][k])>1e-8)))motion=true;
  prev=now;
 }
 assert.equal(motion,true,'Maya head must animate with original Gallop bones');
});
test('Reverting restores every original mesh and all visible face materials',()=>{
 head.dispose();
 assert.equal(body.geometry,oldMain);
 assert.equal(body.skeleton,oldSkin);
 for(const {o,geo,visible} of tracked){
  assert.equal(o.geometry,geo);
  assert.equal(o.visible,visible);
 }
 assert.ok(!body.parent.children.includes(headMesh));
});
