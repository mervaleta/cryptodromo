/**
 * BTC WildMesh horse adapter, standalone asset for non-commercial MVP evaluation.
 * The visual mesh, bones, skin weights and texture maps are authored by WildMesh 3D.
 * The retargeted Gallop candidate was built from Quaternius CC0 authored curves.
 * CC BY-NC 4.0, source/changes: /licences/
 * This module must only run for symbol BTC.  Never change other 99 horses.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';

export const BTC_WILDMESH_RENDER_BUILD='btc-wildmesh-retarget-20261115-qa02';
export const BTC_WILDMESH_URL='/racers/models/btc-wildmesh-gallop-v2.glb';
const MIME_GALLOP='Gallop_Retarget_QA_Quaternius_to_WildMesh';
let sourcePromise;
async function sourceGLTF(){
 if(!sourcePromise)sourcePromise=(async()=>{
  const response=await fetch(BTC_WILDMESH_URL,{mode:'same-origin',credentials:'omit'});
  if(!response.ok)throw Error('Modelo WildMesh BTC no disponible: HTTP '+response.status);
  const buf=await response.arrayBuffer();
  const asset=await new GLTFLoader().parseAsync(buf,new URL('/racers/models/',location.origin).href);
  if(!asset?.scene||!asset.animations?.some(c=>c.name===MIME_GALLOP))
   throw Error('WildMesh BTC GLB sin malla o clip Gallop QA');
  return asset;
 })().catch(err=>{sourcePromise=null;throw err});
 return sourcePromise;
}
/** Interface compatible with the existing BTC profile preview, but the original
 * Quaternius rig never binds to, skins, or deforms WildMesh's mesh. */
export async function createWildMeshHorse({height=2.5,mode='Gallop',showTack=false}={}){
 const src=await sourceGLTF();
 const model=cloneSkinned(src.scene);
 const root=new THREE.Group();
 const bounds=new THREE.Box3().setFromObject(model);
 const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw Error('WildMesh GLB con dimensiones inválidas');
 const scale=height/size.y;
 model.scale.setScalar(scale);
 // The Sketchfab file is authored in large scene units; offset must scale too.
 model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 root.add(model);
 const mats=new Set();
 model.traverse(object=>{
  if(!object.isMesh)return;
  object.castShadow=true;object.receiveShadow=true;object.frustumCulled=false;
  const originals=Array.isArray(object.material)?object.material:[object.material];
  const assigned=originals.map(old=>{
   const copy=old.clone();mats.add(copy);
   if(copy.name==='M_Hair')copy.side=THREE.DoubleSide;
   return copy;
  });
  object.material=Array.isArray(object.material)?assigned:assigned[0];
  const names=assigned.map(m=>m.name);
  if(!showTack&&names.some(name=>name==='M_Saddle1'||name==='M_Saddle2'))object.visible=false;
 });
 const mixer=new THREE.AnimationMixer(model);
 const tracks={
  Idle:src.animations.find(c=>c.name==='Horse|Horse_Idle'),
  Walk:src.animations.find(c=>c.name==='Horse|Horse_Walk'),
  Gallop:src.animations.find(c=>c.name===MIME_GALLOP)
 };
 let active=null,phase=0,running=true,paused=false;
 const api={
  root,model,isWildMesh:true,clips:['Idle','Walk','Gallop'],get hoofPhase(){return phase;},
  get maneWindEnabled(){return true},get maneMotion(){return 'skeleton-clip'},
  play(name='Gallop',fade=.25){
   const clip=tracks[name]||tracks.Gallop;
   const next=mixer.clipAction(clip);
   if(active===next)return;
   next.reset().play();next.enabled=true;next.setEffectiveWeight(1);
   if(active)next.crossFadeFrom(active,Math.max(.01,fade),true);
   active=next;paused=name==='Idle';
  },
  update(delta,speed=1){
   const dt=THREE.MathUtils.clamp(Number(delta)||0,0,.08);
   mixer.update(dt*Math.max(0,Number(speed)||0));
   if(active?.getClip()?.duration)phase=(active.time/active.getClip().duration)%1;
  },
  setWind(){},setWetness(){},setBank(){},setVisualQuality(){},setCoatFinish(){},setAppearance(){},
  dispose(){
   mixer.stopAllAction();mixer.uncacheRoot(model);root.removeFromParent();mats.forEach(m=>m.dispose());
   // Geometry + textures belong to cached sourceGLTF. Do not dispose shared resources.
  }
 };
 api.play(mode,0.01);
 return api;
}
