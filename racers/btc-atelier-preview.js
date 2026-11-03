/**
 * BTC horse atelier, opt-in on /racers/?atelier=btc#BTC.
 * Uses the same original GLB + authored gallop as the stable race.
 * Only the BTC preview is experimental. No live scene or token data changes.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createHorse} from '../race-lab/source/src/horse.js?v=alpha18-gaitmane-1';
import {createBTCHairAtelier} from './btc-hair-v15.js?v=btc-hair-v15-1';
import {createBTC3DHeroGroom} from './btc-hero-groom-v2.js?v=btc-hero-groom-v2-1';

const CAMERA_POSITIONS={
 profile:[2.85,2.25,5.15],
 front:[4.85,2.28,.15],
 rear:[-4.85,2.28,.15],
 detail:[1.95,2.30,3.60]
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
export function createPreview(canvas,onFailure=()=>{}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
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
 const key=new THREE.DirectionalLight('#ffedcb',2.8);key.position.set(-3,7,6);
 key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.bias=-.0003;scene.add(key);
 const fill=new THREE.DirectionalLight('#bad6ff',1.6);fill.position.set(5,5,-6);scene.add(fill);
 const platformMat=new THREE.MeshStandardMaterial({color:'#263d2e',roughness:.87});
 const platformGeo=new THREE.CylinderGeometry(1.85,1.95,.12,64);
 const platform=new THREE.Mesh(platformGeo,platformMat);platform.position.y=-.02;platform.receiveShadow=true;scene.add(platform);

 let horse=null,hair=null,hero=null,selected=null,selection=0,disposed=false,variant='enhanced',renderedSymbol=null,renderedVariant=null;
 let paused=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
 let wind=.95,speed=1,cameraView='profile',maneSize=1.30,tailSize=1.25,hairColor='#39231d';
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
    mode:paused?'Idle':'Gallop',maneMotion:false
   });
   if(disposed||request!==selection){next.dispose();return;}
   next.root.scale.setScalar(.78);
   // Hair is an isolated preview-layer upgrade: original body, gait, pigmentation.
   const nextHair=candidate?createBTCHairAtelier(next.root):null;
   let nextHero=null;
   if(candidate&&nextHair?.channelCount!==1){
    nextHair?.dispose();next.dispose();
    throw Error('No se encontró la crin y cola originales del caballo BTC');
   }
   try{
    if(candidate){nextHero=createBTC3DHeroGroom(next.root,{maneSize,tailSize,color:hairColor});next.setVisualQuality?.('cinematic');next.setCoatFinish?.(.38);}
   }catch(error){nextHair?.dispose();next.dispose();throw error;}
   scene.add(next.root);
   const prev=horse,prevHair=hair,prevHero=hero;
   horse=next;hair=nextHair;hero=nextHero;
   renderedSymbol=token.symbol;renderedVariant=candidate?'enhanced':'original';
   prevHero?.dispose();prevHair?.dispose();prev?.dispose();
  }catch(error){
   if(!disposed&&selection===request){console.error('BTC atelier model:',error);onFailure(token,error);}
  }
 }
 function select(token){selected=token;return rebuild();}
 function setVariant(next){
  if(next!=='original'&&next!=='enhanced')return;
  if(variant!==next){variant=next;rebuild();}
 }
 function setWind(value){wind=clamp(value,0,2);}
 function setSpeed(value){speed=clamp(value,.5,1.6);}
 function setManeSize(value){maneSize=clamp(value,.65,1.85);if(selected?.symbol==='BTC'&&variant==='enhanced')rebuild();}
 function setTailSize(value){tailSize=clamp(value,.65,1.85);if(selected?.symbol==='BTC'&&variant==='enhanced')rebuild();}
 function setHairColor(value){if(/^#[0-9a-f]{6}$/i.test(value)){hairColor=value;hero?.setColor(value);}}
 function pause(value){paused=!!value;horse?.play(paused?'Idle':'Gallop',.2);}
 const clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{
  if(disposed)return;
  const dt=Math.min(clock.getDelta(),.05);
  if(!document.hidden){
   horse?.update(dt,speed);
   hair?.update(dt,{wind,speed,phase:horse?.hoofPhase||0,running:!paused});
   hero?.update(dt,{wind,speed,running:!paused});
  }
  controls.update();renderer.render(scene,camera);
 });
 return {
  select,pause,setVariant,setWind,setSpeed,setManeSize,setTailSize,setHairColor,setCamera,
  snapshot:()=>({
   symbol:renderedSymbol,variant:renderedVariant,requestedSymbol:selected?.symbol||null,requestedVariant:variant,ready:!!horse,paused,wind,speed,maneSize,tailSize,hairColor,camera:cameraView,
   originalAsset:true,jockey:false,maneEnabled:!!hair?.channelCount,
   maneMotion:hair?.snapshot?.mane||0,tailMotion:hair?.snapshot?.tail||0,
   hairSystem:hair?.snapshot||null,heroGroom:hero?.snapshot||null,clips:horse?.clips||[],
   hoofPhase:horse?.hoofPhase||0,drawCalls:renderer.info.render.calls
  }),
  dispose(){
   if(disposed)return;disposed=true;selection++;
   renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();
   hero?.dispose();hair?.dispose();horse?.dispose();scene.remove(platform);
   platformGeo.dispose();platformMat.dispose();renderer.dispose();
  }
 };
}
