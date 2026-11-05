/**
 * BTC horse atelier, opt-in on /racers/?atelier=btc#BTC.
 * Uses the same original GLB + authored gallop as the stable race.
 * Only the BTC preview is experimental. No live scene or token data changes.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createHorse} from '../race-lab/source/src/horse.js?v=btc-native-lookdev-20261105-v1';
import {createBTCHeroV5} from './btc-hero-v5.js?v=btc-v5-motion-study-20261103';
import {createBTCHeroV4} from './btc-hero-v4.js?v=btc-real-hero-v4-20261103';
import {createBTCHeroMaya} from './btc-maya-master.js?v=btc-safe-master-20261105-v1';
import {createBTCTerrainStage} from './btc-terrain-stage.js?v=btc-safe-master-20261105-v1';

const CAMERA_POSITIONS={
 profile:[2.12,1.97,3.73],
 front:[3.85,2.12,.13],
 rear:[-3.52,1.78,1.70],
 detail:[1.64,2.16,2.89],
 threeQuarter:[2.85,2.18,2.75],
 top:[1.02,4.55,1.12]
};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
const stageParams=new URLSearchParams(location.search);
let btcPass=Math.floor(clamp(stageParams.get('btcPass')??10,1,10));
const fixedFrame=stageParams.get('btcFreeze')==='1';
export function createPreview(canvas,onFailure=()=>{}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.055;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(33,1,.1,55);
 camera.position.set(...CAMERA_POSITIONS.profile);
 const controls=new OrbitControls(camera,canvas);
 controls.target.set(0,1.05,0);
 controls.enableDamping=true;
 controls.minDistance=2.7;
 controls.maxDistance=11;
 controls.enablePan=false;
 scene.add(new THREE.HemisphereLight('#e1e6e7','#344035',1.06));scene.add(new THREE.AmbientLight('#d8c8b2',.16));
 const key=new THREE.DirectionalLight('#ffefd7',2.6);key.position.set(-4,7,6);
 key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.bias=-.0002;key.shadow.normalBias=.012;key.shadow.radius=2.1;scene.add(key);
 const fill=new THREE.DirectionalLight('#c2d3de',1.12);fill.position.set(5,4,-5);scene.add(fill);
 const edge=new THREE.DirectionalLight('#ffd39d',1.42);edge.position.set(3,5,5);scene.add(edge);
 // Cool opposing rim lifts the tail off the background without bleaching coat.
 const tailRim=new THREE.DirectionalLight('#d6d5c5',.75);
 tailRim.position.set(-5,3,-3);scene.add(tailRim);
 const platformMat=new THREE.MeshStandardMaterial({color:'#1a302c',roughness:.71,metalness:.10});
 const platformGeo=new THREE.CylinderGeometry(1.85,1.95,.12,96);
 const platform=new THREE.Mesh(platformGeo,platformMat);platform.position.y=-.02;platform.receiveShadow=true;scene.add(platform);
 const pedestalRing=new THREE.Mesh(new THREE.TorusGeometry(1.86,.009,6,128),new THREE.MeshBasicMaterial({color:'#b9a268',toneMapped:false}));
 pedestalRing.rotation.x=Math.PI/2;pedestalRing.position.y=.043;scene.add(pedestalRing);
 // The 3D profile now displays the same hoof contact VFX engine as the stadium.
 // This never changes the animal skin/rig or official race coordinates.
 const terrain=createBTCTerrainStage(scene,{platform,pedestalRing,renderer});
 let terrainSurface='dirt',terrainWetness=0;

 let horse=null,hero=null,selected=null,selection=0,disposed=false,variant=stageParams.get('btcMaster')==='maya'?'maya':stageParams.get('btcMaster')==='v5'?'enhanced':'original',renderedSymbol=null,renderedVariant=null,frameHeld=false;
 let paused=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
 let wind=.95,speed=1,cameraView='profile',maneSize=1.22,tailSize=1.16,hairColor='#29232a';
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
  const candidate=(variant==='enhanced'||variant==='baseline'||variant==='maya')&&token.symbol==='BTC';
  try{
   const next=await createHorse({
    coat:token.coat,accent:token.color,symbol:token.symbol,height:2.5,
    mode:paused?'Idle':'Gallop',maneMotion:true,nativeLookdev:token.symbol==='BTC',
    // Three.js Horse.glb reference: evaluate the authored gait as one coherent clip.
    // No secondary gaitRefiner joint offsets on the BTC anatomy QA viewer.
    gaitCorrectionStrength:0
   });
   if(disposed||request!==selection){next.dispose();return;}
   next.root.scale.setScalar(.78);
   if(token.symbol==='BTC')next.setVisualQuality?.('cinematic');
   // Hair is an isolated preview-layer upgrade: original body, gait, pigmentation.
   let nextHero=null;
   try{
    if(candidate){
     next.setVisualQuality?.('cinematic');next.setCoatFinish?.(.40);
     const profile=token.mayaAppearance||{};
     const coatOptions=variant==='maya'?{
      coatColor:profile.coatColor,brandMode:profile.brandMode||'natural_coat',
      brandAccent:token.color,hoofColor:profile.hoofColor,
      maneSize:maneSize*(profile.maneScale??1)*({short:.77,medium:1,long:1.28}[profile.maneStyle]||1),
      tailSize:tailSize*(profile.tailScale??1)*({short:.77,medium:1,long:1.28}[profile.tailStyle]||1),
      color:profile.maneColor||hairColor,
      tailColor:profile.tailColor||hairColor,
      eyeColor:profile.eyeColor
     }:{maneSize,tailSize,color:hairColor,pass:btcPass};
     nextHero=(variant==='maya'?createBTCHeroMaya:variant==='baseline'?createBTCHeroV4:createBTCHeroV5)(next.root,coatOptions);
    }
   }catch(error){next.dispose();throw error;}
   scene.add(next.root);
   const prev=horse,prevHero=hero;
   horse=next;hero=nextHero;frameHeld=false;
   terrain.reset();
   terrain.setVisible(token.symbol==='BTC'&&terrainSurface!=='off');
   renderedSymbol=token.symbol;renderedVariant=candidate?variant:'original';
   prevHero?.dispose();prev?.dispose();
  }catch(error){
   if(!disposed&&selection===request){console.error('BTC atelier model:',error);onFailure(token,error);}
  }
 }
 function select(token){selected=token;return rebuild();}
 function setStage(next){const p=Math.floor(clamp(next,1,10));if(p!==btcPass){btcPass=p;rebuild();}}
 function setVariant(next){
  if(next!=='original'&&next!=='enhanced'&&next!=='baseline'&&next!=='maya')return;
  if(variant!==next){variant=next;rebuild();}
 }
 function setWind(value){wind=clamp(value,0,2);}
 function setSpeed(value){speed=clamp(value,.5,1.6);}
 function setManeSize(value){maneSize=clamp(value,.65,1.85);if(selected?.symbol==='BTC'&&variant!=='original')rebuild();}
 function setTailSize(value){tailSize=clamp(value,.65,1.85);if(selected?.symbol==='BTC'&&variant!=='original')rebuild();}
 function setHairColor(value){if(/^#[0-9a-f]{6}$/i.test(value)){hairColor=value;hero?.setColor(value);}}
 function pause(value){paused=!!value;horse?.play(paused?'Idle':'Gallop',.2);}
 function setTerrainSurface(next){
  if(!['off','dirt','sand','grass'].includes(next))return;
  terrainSurface=next;terrain.setSurface(next);
  terrain.setVisible(selected?.symbol==='BTC'&&next!=='off');
 }
 function setTerrainWetness(level){
  terrainWetness=Math.max(0,Math.min(1,Number(level)||0));
  terrain.setWetness(terrainWetness);
 }
 const clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{
  if(disposed)return;
  const dt=Math.min(clock.getDelta(),.05);
  if(!document.hidden){
   if(fixedFrame){
    if(horse&&!frameHeld){for(let i=0;i<3;i++)horse.update(.1,1);frameHeld=true;}
   }else{
    horse?.update(dt,speed);
   }
   hero?.update(dt,{wind,speed,running:!paused,phase:horse?.hoofPhase||0});
   terrain.update({horse,dt,running:!paused&&!fixedFrame&&selected?.symbol==='BTC',speed,wind});
  }
  controls.update();renderer.render(scene,camera);
 });
 return {
  select,pause,setVariant,setWind,setSpeed,setManeSize,setTailSize,setHairColor,setCamera,setStage,setTerrainSurface,setTerrainWetness,
  snapshot:()=>({
   symbol:renderedSymbol,variant:renderedVariant,btcPass,fixedFrame,requestedSymbol:selected?.symbol||null,requestedVariant:variant,ready:!!horse,paused,wind,speed,maneSize,tailSize,hairColor,camera:cameraView,
   originalAsset:true,jockey:false,maneEnabled:!!hero,
   maneMotion:hero?'animated':null,tailMotion:hero?'animated':null,
   hairSystem:null,heroGroom:hero?.snapshot||null,clips:horse?.clips||[],
   hoofPhase:horse?.hoofPhase||0,terrain:terrain.snapshot(),drawCalls:renderer.info.render.calls
  }),
  dispose(){
   if(disposed)return;disposed=true;selection++;
   renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();
   terrain.dispose();hero?.dispose();horse?.dispose();scene.remove(platform);scene.remove(pedestalRing);scene.remove(tailRim);
   pedestalRing.geometry.dispose();pedestalRing.material.dispose();
   platformGeo.dispose();platformMat.dispose();renderer.dispose();
  }
 };
}
