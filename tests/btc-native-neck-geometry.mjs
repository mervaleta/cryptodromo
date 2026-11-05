/**
 * Structural acceptance against the REAL compressed Quaternius GLB in the repo.
 * Native Gallop, unmodified muzzle and every native vertex are hard invariants.
 * Real-browser screenshots are a separate mandatory check.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {closeBTCNeckCrest} from '../racers/btc-neck-crest-repair.js';
const compressed=readFileSync(new URL('../race-lab/source/assets/horse.glb.gz',import.meta.url));
const binary=gunzipSync(compressed);
const gltf=await new GLTFLoader().parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'');
let main=null,other=[];
gltf.scene.traverse(obj=>{
 if(!obj.isSkinnedMesh)return;
 if(obj.material?.name==='Main')main=obj;
 else other.push({obj,geometry:obj.geometry});
});
assert.ok(main,'Native Main must be present');
const clip=gltf.animations.find(x=>x.name==='Gallop');
assert.ok(clip,'Original authored Gallop must exist');
const original=main.geometry,p=original.getAttribute('position'),n=p.count,
 originalIndices=original.getIndex().count;
const positions=p.array.slice(),weights=original.getAttribute('skinWeight').array.slice(),
 joints=original.getAttribute('skinIndex').array.slice();
const skeleton=main.skeleton,repair=closeBTCNeckCrest(main),patched=main.geometry;
test('closure adds exactly 30 real triangles and preserves every original vertex and skin influence',()=>{
 assert.equal(repair.triangles,30);
 assert.equal(patched.getAttribute('position').count,n+8);
 assert.equal(patched.getIndex().count,originalIndices+90);
 assert.deepEqual(patched.getAttribute('position').array.slice(0,positions.length),positions);
 assert.deepEqual(patched.getAttribute('skinIndex').array.slice(0,joints.length),joints);
 assert.deepEqual(patched.getAttribute('skinWeight').array.slice(0,weights.length),weights);
 assert.equal(main.skeleton,skeleton);
 for(const item of other)assert.equal(item.obj.geometry,item.geometry);
});
test('added triangles retain normalized skin weights and correct winding across 16 native Gallop frames',()=>{
 const mixer=new THREE.AnimationMixer(gltf.scene);
 mixer.clipAction(clip).play();
 const pi=patched.getIndex().array,pp=patched.getAttribute('position'),ww=patched.getAttribute('skinWeight');
 for(let i=n;i<pp.count;i++){
  const sum=ww.getX(i)+ww.getY(i)+ww.getZ(i)+ww.getW(i);
  assert.ok(Math.abs(sum-1)<1e-5,'New dorsal skin weights must sum to one');
 }
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),cross=new THREE.Vector3();
 for(let phase=0;phase<16;phase++){
  mixer.setTime(clip.duration*phase/16);
  gltf.scene.updateMatrixWorld(true);main.skeleton.update();
  for(let k=originalIndices;k<pi.length;k+=3){
   const x=pi[k],y=pi[k+1],z=pi[k+2];
   a.fromBufferAttribute(pp,x);main.applyBoneTransform(x,a);
   b.fromBufferAttribute(pp,y);main.applyBoneTransform(y,b);
   c.fromBufferAttribute(pp,z);main.applyBoneTransform(z,c);
   ab.subVectors(b,a);ac.subVectors(c,a);cross.crossVectors(ab,ac);
   assert.ok(cross.length()*.5>1e-12,'Zero-area triangle in native Gallop '+phase);
   assert.ok(cross.z>0,'Inverted crest triangle in native Gallop '+phase);
  }
 }
});
test('disposing the candidate restores exact original meshes and visible rollback',()=>{
 repair.dispose();
 assert.equal(main.geometry,original);
 assert.equal(main.skeleton,skeleton);
});
