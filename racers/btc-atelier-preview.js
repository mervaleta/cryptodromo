/**
 * BTC horse atelier, opt-in on /racers/?atelier=btc#BTC.
 * Uses the same original GLB + authored gallop as the stable race.
 * Only the BTC preview is experimental. No live scene or token data changes.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createHorse} from '../race-lab/source/src/horse.js?v=alpha18-gaitmane-1';

const CAMERA_POSITIONS={
 profile:[3.7,2.6,6.5],
 front:[6.4,2.45,.15],
 rear:[-6.4,2.45,.15],
 detail:[3.0,2.65,4.1]
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
export function createPreview(canvas,onFailure=()=>{}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(35,1,.1,55);
 camera.position.set(...CAMERA_POSITIONS.profile);
 const controls=new OrbitControls(camera,canvas);
 controls.target.set(0,1.05,0);
 controls.enableDamping=true;
 controls.minDistance=2.7;
 controls.maxDistance=11;
 controls.enablePan=false;
 scene.add(new THREE.HemisphereLight('#ecfff3','#354331',2.25));
 const key=new THREE.DirectionalLight('#ffedcb',2.8);key.position.set(-3,7,6);scene.add(key);
 const fill=new THREE.DirectionalLight('#bad6ff',1.6);fill.position.set(5,5,-6);scene.add(fill);
 const platformMat=new THREE.MeshStandardMaterial({color:'#263d2e',roughness:.87});
 const platformGeo=new THREE.CylinderGeometry(1.85,1.95,.12,64);
 const platform=new THREE.Mesh(platformGeo,platformMat);platform.position.y=-.02;scene.add(platform);

 let horse=null,selected=null,selection=0,disposed=false,variant='enhanced';
 let paused=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
 let wind=.95,speed=1,cameraView='profile';
 const resize=()=>{
  if(disposed)return;
  const bounds=canvas.parentElement?.getBoundingClientRect();
  if(!bounds)return;
  const w=Math.max(1,Math.round(bounds.width)),h=Math.max(1,Math.round(bounds.height));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 };
 const observer=new ResizeObserver(resize);
 observer.observe(canvas.parentElement);resize();
 function setCamera(view){
  if(!(view in CAMERA_POSITIONS))return;
  cameraView=view;
  camera.position.set(...CAMERA_POSITIONS[view]);
  controls.target.set(0,1.05,0);controls.update();
 }
 async function rebuild(){
  const token=selected;if(!token||disposed)return;
  const request=++selection;
  const candidate=variant==='enhanced'&&token.symbol==='BTC';
  try{
   const next=await createHorse({
    coat:token.coat,accent:token.color,symbol:token.symbol,height:2.5,
    mode:paused?'Idle':'Gallop',maneMotion:candidate
   });
   if(disposed||request!==selection){next.dispose();return;}
   next.root.scale.setScalar(.78);
   next.setWind?.(candidate?wind:.55);
   if(candidate){next.setVisualQuality?.('cinematic');next.setCoatFinish?.(.4);}
   scene.add(next.root);
   const prev=horse;horse=next;prev?.dispose();
  }catch(error){
   if(!disposed&&selection===request){console.error('BTC atelier model:',error);onFailure(token,error);}
  }
 }
 function select(token){selected=token;return rebuild();}
 function setVariant(next){
  if(next!=='original'&&next!=='enhanced')return;
  if(variant!==next){variant=next;rebuild();}
 }
 function setWind(value){wind=clamp(value,0,2);if(variant==='enhanced'&&selected?.symbol==='BTC')horse?.setWind?.(wind);}
 function setSpeed(value){speed=clamp(value,.5,1.6);}
 function pause(value){paused=!!value;horse?.play(paused?'Idle':'Gallop',.2);}
 const clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{
  if(disposed)return;
  const dt=Math.min(clock.getDelta(),.05);
  if(!document.hidden)horse?.update(dt,speed);
  controls.update();renderer.render(scene,camera);
 });
 return {
  select,pause,setVariant,setWind,setSpeed,setCamera,
  snapshot:()=>({
   symbol:selected?.symbol||null,variant,paused,wind,speed,camera:cameraView,
   originalAsset:true,jockey:false,maneEnabled:!!horse?.maneWindEnabled,
   maneMotion:horse?.maneMotion||0,clips:horse?.clips||[],
   hoofPhase:horse?.hoofPhase||0,drawCalls:renderer.info.render.calls
  }),
  dispose(){
   if(disposed)return;disposed=true;selection++;
   renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();
   horse?.dispose();scene.remove(platform);
   platformGeo.dispose();platformMat.dispose();renderer.dispose();
  }
 };
}
