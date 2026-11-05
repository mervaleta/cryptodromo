/** Native GLB structural head closure and sixteen authored Gallop frames. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {closeBTCNeckCrest} from '../racers/btc-neck-crest-repair.js';

const compressed=readFileSync(new URL('../race-lab/source/assets/horse.glb.gz',import.meta.url));
const binary=gunzipSync(compressed);
const gltf=await new GLTFLoader().parseAsync(
 binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'');
let main=null;const other=[];
gltf.scene.traverse(obj=>{
 if(!obj.isSkinnedMesh)return;
 if(obj.material?.name==='Main')main=obj;
 else other.push({obj,geometry:obj.geometry});
});
assert.ok(main,'Original Main mesh required');
const clip=gltf.animations.find(x=>x.name==='Gallop');
assert.ok(clip,'Authored Gallop required');
const mixer=new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(clip).play();mixer.setTime(0);
gltf.scene.updateMatrixWorld(true);main.skeleton.update();
const original=main.geometry,p=original.getAttribute('position'),n=p.count,
 originalIndices=original.getIndex().count,
 positions=p.array.slice(),weights=original.getAttribute('skinWeight').array.slice(),
 joints=original.getAttribute('skinIndex').array.slice(),skeleton=main.skeleton;
const repair=closeBTCNeckCrest(main),patched=main.geometry;

test('74-edge skull/neck border fully sealed by 72 triangles without new vertices',()=>{
 assert.equal(repair.triangles,72);
 assert.equal(repair.sealedOriginalBorderEdges,74);
 assert.equal(repair.remainingSkullBorderEdges,0);
 assert.equal(patched.getAttribute('position').count,n);
 assert.equal(patched.getIndex().count,originalIndices+216);
 assert.deepEqual(patched.getAttribute('position').array,positions);
 assert.deepEqual(patched.getAttribute('skinIndex').array,joints);
 assert.deepEqual(patched.getAttribute('skinWeight').array,weights);
 assert.equal(main.skeleton,skeleton);
 for(const item of other)assert.equal(item.obj.geometry,item.geometry);
});
test('72 skinned triangles retain anatomy and front faces in 16 Gallop phases',()=>{
 const pi=patched.getIndex(),pp=patched.getAttribute('position'),
  ww=patched.getAttribute('skinWeight');
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),
  ab=new THREE.Vector3(),ac=new THREE.Vector3(),cross=new THREE.Vector3();
 for(let phase=0;phase<16;phase++){
  mixer.setTime(clip.duration*phase/16);
  gltf.scene.updateMatrixWorld(true);main.skeleton.update();
  for(let k=originalIndices;k<pi.count;k+=3){
   const ids=[pi.getX(k),pi.getX(k+1),pi.getX(k+2)];
   for(const id of ids){
    const sum=ww.getX(id)+ww.getY(id)+ww.getZ(id)+ww.getW(id);
    assert.ok(Math.abs(sum-1)<1e-5,'Original skin weights normalized');
   }
   a.fromBufferAttribute(pp,ids[0]);main.applyBoneTransform(ids[0],a);
   b.fromBufferAttribute(pp,ids[1]);main.applyBoneTransform(ids[1],b);
   c.fromBufferAttribute(pp,ids[2]);main.applyBoneTransform(ids[2],c);
   ab.subVectors(b,a);ac.subVectors(c,a);cross.crossVectors(ab,ac);
   assert.ok(cross.length()*.5>1e-12,'Degenerate face in phase '+phase);
   assert.ok(cross.z>0,'Backfacing forehead/crest in phase '+phase);
  }
 }
});
test('rollback restores the exact original native geometry and skeleton',()=>{
 repair.dispose();
 assert.equal(main.geometry,original);
 assert.equal(main.skeleton,skeleton);
});
