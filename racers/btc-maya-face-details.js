/**
 * BTC Maya facial micro-anatomy from rest-space landmarks of the supplied
 * Horse_VR_2017 sculpt. Surfaces are skinned to the unchanged native rig.
 * This module adds geometry, never paints an image or a billboard.
 */
import * as THREE from 'three';
const TAU=Math.PI*2;
const sin=Math.sin,cos=Math.cos;
function makeProjector(positions) {
 // Nearest single triangle vertices gave millimetre-scale jumps along an eye
 // rim. Blend the six closest ORIGINAL Maya skin samples in the eye's YZ plane.
 // Matching both the eyeball and the eyelids to Head keeps the eye intact
 // through all phases of the native Gallop.
 const p=positions,n=p.length/3;
 return (side,y,z)=>{
  const nearby=[];
  for(let i=0;i<n;i++){
   const x=p[i*3],py=p[i*3+1],pz=p[i*3+2];
   if(side*x<.00025)continue;
   const d2=Math.pow((py-y)*1.6,2)+Math.pow((pz-z)*1.35,2);
   if(nearby.length<8||d2<nearby.at(-1).d2){
    nearby.push({x,d2});nearby.sort((a,b)=>a.d2-b.d2);
    if(nearby.length>8)nearby.pop();
   }
  }
  let total=0,weighted=0;
  for(const a of nearby){
   const w=1/(a.d2+2.5e-8);
   total+=w;weighted+=a.x*w;
  }
  return {x:total?weighted/total:side*.00228,miss:Math.sqrt(nearby[0]?.d2||0)};
 };
}
function detailMesh(source,skinAt,positions,{name,color,metalness=0,roughness=.72,sheen=0},build) {
 const xyz=[],joints=[],weights=[],idx=[],colorRGB=[];
 const face={xyz,idx};
 // Face details sit on the rigid authored Head joint. Interpolating
 // nearest-body weights independently at each detail vertex tore mouths and
 // nostrils into floating wires during Gallop.
 const headBone=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(headBone<0)throw Error('BTC Maya facial details require native Head joint');
 function vert(x,y,z,tint=1){
  const skin={joints:[headBone,0,0,0],weights:[1,0,0,0]};
  xyz.push(x,y,z);
  const weightSum=skin.weights.reduce((sum,w)=>sum+w,0)||1;
  for(let k=0;k<4;k++){
   joints.push(skin.joints[k]||0);
   weights.push((skin.weights[k]||0)/weightSum);
  }
  colorRGB.push(tint,tint,tint);
  return xyz.length/3-1;
 }
 build({vert,idx,face});
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(idx);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colorRGB,3));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new THREE.MeshPhysicalMaterial({
  color,vertexColors:true,roughness,metalness,sheen,
  side:THREE.DoubleSide,depthWrite:true
 });
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name=name;
 mesh.position.copy(source.position);
 mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);
 mesh.bindMode=source.bindMode;
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
 return {mesh,geometry,material};
}
function loopRibbon(ctx,project,side,cy,cz,ry,rz,thickness,phase=0,sweep=TAU) {
 const {vert,idx}=ctx,N=36,start=ctx.face.xyz.length/3;
 for(let i=0;i<=N;i++){
  const a=phase+sweep*i/N;
  const y=cy+ry*cos(a),z=cz+rz*sin(a);
  const skew=1+.18*sin(a);
  const x=project(side,y,z,.0019).x;
  const dy=-sin(a)*thickness*skew,dz=cos(a)*thickness*skew;
  vert(x+side*.000014,y+dy,z+dz,.92+.07*sin(a)*sin(a));
  vert(x+side*.000027,y-dy,z-dz,.91+.08*cos(a)*cos(a));
 }
 for(let i=0;i<N;i++){
  const a=start+i*2,b=a+1,c=a+2,d=a+3;
  idx.push(a,b,c,b,d,c);
 }
}
export function createBTCMayaFaceDetails(source,skinAt,positions) {
 const project=makeProjector(positions);
 const components=[];
 // Equine eye rim, not an oversized doll-eye sphere. The inset iris from the
 // master remains visible; a warm upper eyelid creates a true brow silhouette.
 components.push(detailMesh(source,skinAt,positions,{
  name:'BTC Maya skinned symmetric upper eyelid contours',color:'#81513b',roughness:.93
 },ctx=>{
  for(const side of [-1,1]){
   loopRibbon(ctx,project,side,-.02814,.04257,.00052,.00039,.000035,0,Math.PI);
  }
 }));
 // The old isolated dark tear-duct triangles fractured in front/rear views.
 // Replace them with a continuous low-contrast lower eyelid. Every vertex
 // is shaped from the same anatomical eye center and Head skin transform.
 components.push(detailMesh(source,skinAt,positions,{
  name:'BTC Maya symmetric lower eyelid contours',color:'#73503e',roughness:.94
 },ctx=>{
  for(const side of [-1,1]){
   loopRibbon(ctx,project,side,-.02814,.04257,.00052,.00039,.000031,Math.PI,Math.PI);
  }
 }));
 // The user's Maya surface already has physically shaped nostrils. Additional
 // flat skinned disks and edge strips floated ahead of the animated lips and
 // looked like dark metal clips, so nostril darkening now belongs solely to
 // the actual coat shader in btc-maya-master.js.
 // Mouth seam is implemented in the coat's fragment shader, following
 // the actual skinned Maya muzzle surface. Added standalone strips looked
 // disconnected at the nostril and must never reappear.

 return {
  surfaces:components.length,
  triangles:components.reduce((n,c)=>n+c.geometry.index.count/3,0),
  dispose(){
   for(const c of components){
    c.mesh.removeFromParent();
    c.geometry.dispose();
    c.material.dispose();
   }
  }
 };
}
