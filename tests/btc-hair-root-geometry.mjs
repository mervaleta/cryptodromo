/**
 * Guarantees V5 hair roots are actually under the ORIGINAL Quaternius croup
 * surface, not free-standing outside the animated horse.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createBTCSilkShell} from '../racers/btc-silk-shell-v5.js';

const b=gunzipSync(readFileSync(new URL('../race-lab/source/assets/horse.glb.gz',import.meta.url)));
const data=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const asset=await new GLTFLoader().parseAsync(data,'');
let body;
asset.scene.traverse(m=>{if(m.isSkinnedMesh&&m.material?.name==='Main')body=m;});
assert.ok(body,'Original native coat required');
const original=body.geometry.getAttribute('position');
const motion={mane:{value:0},tail:{value:0},clock:{value:0},wind:{value:.9}};
const nativeSkeleton=body.skeleton;
const shell=createBTCSilkShell(body,{pass:10,maneSize:1.22,tailSize:1.16,color:'#30261f'},motion);
const mesh=body.parent.children.find(m=>m.name==='BTC V5 continuous silky lock masses');
assert.ok(mesh,'V5 procedural real skinned groom must be rendered');
const p=mesh.geometry.getAttribute('position'),tail=mesh.geometry.getAttribute('silkTail'),
 tip=mesh.geometry.getAttribute('silkTip'),w=mesh.geometry.getAttribute('skinWeight');
const tailRoots=[];
for(let i=0;i<p.count;i++)if(tail.getX(i)>.5&&tip.getX(i)<.001)
 tailRoots.push([p.getX(i),p.getY(i),p.getZ(i),i]);
const sourceCroup=[];
for(let i=0;i<original.count;i++)if(
 Math.abs(original.getY(i)-.0164)<.0008&&Math.abs(original.getX(i))<.0035
)sourceCroup.push(original.getZ(i));
const surfaceTop=Math.max(...sourceCroup);
test('All tail roots are under the real croup surface instead of floating above it',()=>{
 assert.ok(sourceCroup.length>25,'source must have measurable real croup samples');
 assert.ok(tailRoots.length>30,'must test every hair lock, not one favorable tip');
 for(const [x,y,z] of tailRoots){
  assert.ok(y>.0157&&y<.0172,'tail root must sit inside the rump along its axis');
  assert.ok(z<surfaceTop-.001,'tail root emerged above native croup: '+z+' >= '+surfaceTop);
  assert.ok(Math.abs(x)<.002,'hair root must not start outside croup side');
 }
});
test('Original Gallop bones are shared and hair skin weights remain normalized',()=>{
 assert.equal(mesh.skeleton,nativeSkeleton);
 assert.equal(shell.nativeTailBones,7);
 for(const [, , ,i] of tailRoots){
  const total=w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i);
  assert.ok(Math.abs(total-1)<1e-5);
 }
 assert.ok(asset.animations.some(clip=>clip.name==='Gallop'));
});
test('Reverting the BTC groom restores the exact native rig and removes temporary geometry',()=>{
 shell.dispose();
 assert.equal(body.skeleton,nativeSkeleton);
 assert.ok(!body.parent.children.some(m=>m.name==='BTC V5 continuous silky lock masses'));
});
