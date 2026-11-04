/**
 * Two continuous skinned eyelid membranes on the actual BTC horse.
 * Uses the SAME 2017-Maya landmark and native Head joint as its globes.
 * Earlier face projection snapped each point to a different nearby triangle:
 * dark triangular slivers became visible in frontal and side views.
 */
import * as THREE from 'three';
import {BTC_EYE_LAYOUT,eyeFrame} from './btc-maya-eye-layout.js?v=btc-face-poll-tail-20261104-v14';
const TAU=Math.PI*2;
function attach(source,geometry,material,name){
 const head=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(head<0)throw Error('Native Head joint required for continuous BTC eyelids');
 const n=geometry.getAttribute('position').count;
 const bone=new Uint16Array(n*4),weights=new Float32Array(n*4);
 for(let i=0;i<n;i++){bone[i*4]=head;weights[i*4]=1;}
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bone,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name=name;
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);mesh.bindMode=source.bindMode;
 source.parent.add(mesh);mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
 return {mesh,geometry,material};
}
function eyelidRing(source,{color,topOnly=false}={}){
 const positions=[],indices=[],colors=[];
 const segmentCount=topOnly?28:60;
 for(const side of [-1,1]){
  const begin=positions.length/3;
  for(let i=0;i<=segmentCount;i++){
   const a=topOnly?Math.PI*i/segmentCount:TAU*i/segmentCount;
   // No independent surface raycasts: the ring and upper lash share the
   // same eye-frame coordinate system. The rim's outer lip enters the skin.
   const inside=eyeFrame(side,a,topOnly?.89:.875);
   const outside=eyeFrame(side,a,topOnly?1.005:1.105);
   for(const [p,tint] of [[inside,.93],[outside,1]]){
    positions.push(p.x,p.y,p.z);
    colors.push(tint,tint*.985,tint*.965);
   }
  }
  for(let i=0;i<segmentCount;i++){
   const a=begin+i*2,b=a+1,c=a+2,d=a+3;
   indices.push(a,c,b,b,c,d);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(indices);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const material=new THREE.MeshPhysicalMaterial({
  color,vertexColors:true,metalness:0,roughness:topOnly?.88:.83,
  sheen:topOnly?.13:.18,sheenRoughness:.9,clearcoat:0,
  side:THREE.DoubleSide,depthWrite:true,polygonOffset:true,
  polygonOffsetFactor:-.25,polygonOffsetUnits:-.25
 });
 return attach(source,geometry,material,topOnly?
  'BTC skinned continuous equine upper lash':'BTC skinned natural bilateral upper and lower eyelids');
}
export function createBTCMayaFaceDetails(source,skinAt,positions,{coatColor='#9e6444'}={}){
 // skinAt and positions retained for API compatibility with Maya master;
 // all eyelid vertices follow the original Head joint, not a changing surface
 // projection or nearest-neighbor skin transfer.
 if(!source?.skeleton||!BTC_EYE_LAYOUT)throw Error('BTC Maya face requires intact original rig');
 const components=[
  eyelidRing(source,{color:coatColor}),
  eyelidRing(source,{color:'#593829',topOnly:true})
 ];
 return {
  surfaces:components.length,
  triangles:components.reduce((n,c)=>n+c.geometry.index.count/3,0),
  continuity:'single-eye-frame-head-skinned-v14',
  dispose(){for(const c of components){
   c.mesh.removeFromParent();c.geometry.dispose();c.material.dispose();
  }}
 };
}
