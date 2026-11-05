/**
 * BTC Maya-2017 HEAD-ONLY anatomical study.
 *
 * Actual 5406-vertex Horse_BaseShapeOrig polygon sculpt supplied by the user.
 * Crops only Maya's head; never retargets Maya's legs or modifies the source
 * 50-joint native Quaternius Gallop clip. This is an opt-in lookdev candidate,
 * not a certified AAA model or a new production baseline.
 */
import * as THREE from 'three';
import {BTC_EQUINE_MESH} from './btc-maya-body-data.js?v=btc-master-procedural-hind-groom-20261104-v12';

export const BTC_MAYA_HEAD_GRAFT_BUILD='btc-maya-actual-head-geometry-20261105-v1';
const MAYA_HEAD_CUT=-.0206,GLB_FACE_CUT=-.0235;

function sourceArray(encoded){
 const str=atob(encoded),buffer=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)buffer[i]=str.charCodeAt(i);
 return new Uint16Array(buffer.buffer);
}
function unpackMaya(){
 const positions16=sourceArray(BTC_EQUINE_MESH.position16);
 const indices=sourceArray(BTC_EQUINE_MESH.index16);
 if(positions16.length!==BTC_EQUINE_MESH.count*3||
    indices.length!==BTC_EQUINE_MESH.triangles*3)
  throw Error('Maya head source is truncated');
 const points=new Float32Array(positions16.length);
 for(let i=0;i<points.length;i++){
  const a=i%3;
  points[i]=BTC_EQUINE_MESH.min[a]+(positions16[i]/65535)*
   (BTC_EQUINE_MESH.max[a]-BTC_EQUINE_MESH.min[a]);
 }
 return {points,indices};
}
function originalBody(root){
 let main=null;
 const facialParts=[];
 root.traverse(obj=>{
  if(!obj.isSkinnedMesh)return;
  const mats=[obj.material].flat(),names=mats.map(m=>m?.name);
  if(names.includes('Main')&&obj.geometry?.getAttribute('position')?.count>2500)
   main=obj;
  if(names.some(n=>['Main_Dark','Muzzle','Main_Light'].includes(n)))
   facialParts.push(obj);
 });
 if(!main?.skeleton?.bones.some(b=>b.name==='Head'))
  throw Error('BTC Maya head must use original animated Quaternius skeleton');
 return {main,facialParts};
}
function smoothstep(a,b,x){
 const t=Math.min(1,Math.max(0,(x-a)/(b-a)));
 return t*t*(3-2*t);
}
function nativeInfluence(x,y,z,position,joints,weights){
 const best=[];
 // Heads cannot borrow weights from rump or opposite side of the neck.
 for(let i=0;i<position.count;i++){
  if(Math.abs(position.getY(i)-y)>.009)continue;
  const dx=x-position.getX(i),dy=y-position.getY(i),dz=z-position.getZ(i);
  const distance=dx*dx+1.15*dy*dy+dz*dz;
  if(best.length<6||distance<best[best.length-1].d){
   best.push({i,d:distance});best.sort((a,b)=>a.d-b.d);
   if(best.length>6)best.pop();
  }
 }
 if(!best.length)throw Error('Native Head and Neck are not in their expected rest position');
 const influence=new Map();
 for(const {i,d} of best){
  const near=1/Math.pow(Math.max(d,1e-10),.72);
  for(let k=0;k<4;k++){
   const bone=joints.getComponent(i,k),w=weights.getComponent(i,k);
   if(w<1e-5)continue;
   // Do not transfer shoulder, limb or IK weights into the Maya face.
   if(bone<5||bone>16)continue;
   influence.set(bone,(influence.get(bone)||0)+w*near);
  }
 }
 if(!influence.size)throw Error('Maya head sampling found no native head/neck skin weights');
 const ordered=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
 const total=ordered.reduce((n,e)=>n+e[1],0);
 return {
  bones:Array.from({length:4},(_,i)=>ordered[i]?.[0]||0),
  weights:Array.from({length:4},(_,i)=>(ordered[i]?.[1]||0)/total)
 };
}
function cropNativeHead(main){
 const old=main.geometry,idx=old.getIndex(),p=old.getAttribute('position');
 if(!idx||!p||!old.getAttribute('skinIndex'))throw Error('GLB Main has no native rig');
 const keep=[];
 for(let i=0;i<idx.count;i+=3){
  const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);
  const centerY=(p.getY(a)+p.getY(b)+p.getY(c))/3;
  if(centerY>=GLB_FACE_CUT)keep.push(a,b,c);
 }
 if(keep.length<1200||keep.length>=idx.count)throw Error('Native face crop removed unexpected geometry');
 const trimmed=old.clone();
 trimmed.setIndex(keep);
 trimmed.computeBoundingSphere();
 main.geometry=trimmed;
 return {faceTrianglesRemoved:(idx.count-keep.length)/3,
  restore(){if(main.geometry===trimmed)main.geometry=old;trimmed.dispose();}};
}

export function createBTCMayaHeadGraft(root,{coatColor}={}){
 const {main,facialParts}=originalBody(root);
 const {points,indices}=unpackMaya();
 const pMain=main.geometry.getAttribute('position');
 const joints=main.geometry.getAttribute('skinIndex');
 const weights=main.geometry.getAttribute('skinWeight');
 const used=new Map(),xyz=[],skinJoints=[],skinWeights=[],triangles=[];
 // Source Maya topology and muzzle are preserved. Only the head and upper
 // neck are selected; no Maya hindquarters, legs, hooves or body skinning.
 function vertex(id){
  if(used.has(id))return used.get(id);
  const index=xyz.length/3,offset=3*id;
  const x=points[offset],y=points[offset+1],z=points[offset+2];
  let px=x,py=y,pz=z;
  // Blend the *rear neck only* onto the native collar. Muzzle, cheek, jaw,
  // ears and eyes are never re-proportioned by this compatibility blend.
  const blend=smoothstep(-.0248,-.0206,y);
  if(blend>0){
   let best=-1,d=Infinity;
   for(let i=0;i<pMain.count;i++){
    const dx=x-pMain.getX(i),dy=y-pMain.getY(i),dz=z-pMain.getZ(i);
    const dist=dx*dx+dy*dy+dz*dz;
    if(dist<d){d=dist;best=i;}
   }
   if(best>=0){
    const amount=blend*.80;
    px+=(pMain.getX(best)-x)*amount;
    py+=(pMain.getY(best)-y)*amount*.40;
    pz+=(pMain.getZ(best)-z)*amount;
   }
  }
  xyz.push(px,py,pz);
  const transfer=nativeInfluence(x,y,z,pMain,joints,weights);
  skinJoints.push(...transfer.bones);skinWeights.push(...transfer.weights);
  used.set(id,index);
  return index;
 }
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  if(points[a*3+1]>=MAYA_HEAD_CUT||
     points[b*3+1]>=MAYA_HEAD_CUT||
     points[c*3+1]>=MAYA_HEAD_CUT)continue;
  triangles.push(vertex(a),vertex(b),vertex(c));
 }
 if(used.size<1500||triangles.length<8000)
  throw Error('Maya face topology changed: refusing partial or damaged graft');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinJoints,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
 geometry.setIndex(triangles);
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 // Native pigment and shading stay compatible with the rest of the horse.
 // The Maya muzzle has actual modeled cheekbones/nostrils; no spheres,
 // photographs, stickers, detached eye overlays or procedural nose cones.
 const originalMaterial=[main.material].flat()[0];
 const material=new THREE.MeshStandardMaterial({
  name:'BTC Maya 2017 anatomical head only',
  color:/^#[0-9a-f]{6}$/i.test(coatColor||'')?coatColor:originalMaterial.color,
  metalness:0,roughness:.74,side:THREE.FrontSide
 });
 const head=new THREE.SkinnedMesh(geometry,material);
 head.name='BTC Maya source anatomical head and muzzle, native Gallop';
 head.bindMode=main.bindMode;
 head.position.copy(main.position);head.quaternion.copy(main.quaternion);
 head.scale.copy(main.scale);
 main.parent.add(head);
 head.bind(main.skeleton,main.bindMatrix.clone());
 head.bindMatrixInverse.copy(main.bindMatrixInverse);
 head.frustumCulled=false;head.castShadow=true;head.receiveShadow=true;
 const replaced=cropNativeHead(main);
 const originalVisibility=facialParts.map(obj=>({obj,visible:obj.visible}));
 for(const item of originalVisibility)item.obj.visible=false;
 let disposed=false;
 return {
  get snapshot(){return {
   build:BTC_MAYA_HEAD_GRAFT_BUILD,
   source:'Horse_VR_2017.ma / Horse_BaseShapeOrig, real Maya triangles',
   mayaHeadVertices:used.size,mayaHeadTriangles:triangles.length/3,
   untouchedNativeBones:main.skeleton.bones.length,
   nativeHeadTrianglesRemoved:replaced.faceTrianglesRemoved,
   originalGallopUnchanged:true,
   mayFaceOnly:true,
   detachedEyeOverlays:0
  };},
  dispose(){
   if(disposed)return;disposed=true;
   for(const item of originalVisibility)item.obj.visible=item.visible;
   replaced.restore();head.removeFromParent();geometry.dispose();material.dispose();
  }
 };
}
