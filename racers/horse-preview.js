/**
 * Alpha22 Fidelity portrait. The same geometry, IK gait and analytic coat used
 * by LIVE, without legacy GLB or horse image textures.
 * This is a viewer only: it never controls market movements or results.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createAlpha22RaceHorse} from '../visual-lab/horse-fidelity/horseAdapter.js';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js?v=coat-20261102';

export function createPreview(canvas,onFailure=()=>{}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.22;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(36,1,.1,60);
 camera.position.set(4.2,3.1,6.7);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;
 controls.enablePan=false;
 controls.minDistance=3.6;
 controls.maxDistance=14;
 controls.maxPolarAngle=Math.PI*.49;
 controls.target.set(.22,1.36,0);
 controls.update();
 scene.add(new THREE.HemisphereLight('#f7fff6','#35483b',2.05));
 const sun=new THREE.DirectionalLight('#ffedce',3.25);
 sun.position.set(-2,8,7);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);
 sun.shadow.camera.left=-4;sun.shadow.camera.right=4;
 sun.shadow.camera.top=5;sun.shadow.camera.bottom=-4;
 sun.shadow.bias=-.00035;
 scene.add(sun);
 const rim=new THREE.DirectionalLight('#a6d5ef',1.7);
 rim.position.set(5,5,-6);scene.add(rim);
 const platformGeo=new THREE.CylinderGeometry(1.93,2.06,.14,80);
 const platformMat=new THREE.MeshStandardMaterial({color:'#273f32',roughness:.87,metalness:.04});
 const platform=new THREE.Mesh(platformGeo,platformMat);
 platform.position.y=-.13;platform.receiveShadow=true;
 scene.add(platform);
 let horse=null,selectedSymbol=null,disposed=false;
 let paused=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
 let selection=0;
 const resize=()=>{
  if(disposed)return;
  const box=canvas.parentElement;
  if(!box)return;
  const w=Math.max(1,box.clientWidth),h=Math.max(1,box.clientHeight);
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
 };
 const observer=new ResizeObserver(resize);
 observer.observe(canvas.parentElement);resize();
 function select(token){
  if(disposed||!token)return;
  const request=++selection;
  try{
   const index=TOKEN_ROSTER.findIndex(t=>t.symbol===token.symbol);
   if(index<0)throw Error('El corredor no pertenece al plantel oficial');
   const next=createAlpha22RaceHorse({
    THREE,coat:token.coat,accent:token.color,symbol:token.symbol,
    stallNumber:Math.min(99,index+1),height:2.85,
    mode:paused?'Idle':'Gallop',quality:'high',jockey:false,
    phase:(index%12)*.13
   });
   // The race mantilla currently supports 1-99. Hide its number only for #100.
   if(index===99){
    const numerals=next.root.getObjectByName('3D numbered racing mantilla');
    if(numerals)numerals.visible=false;
   }
   if(request!==selection||disposed){next.dispose();return;}
   scene.add(next.root);
   const previous=horse;horse=next;selectedSymbol=token.symbol;
   if(previous)previous.dispose();
  }catch(error){
   if(request===selection&&!disposed){
    console.error('Fidelity preview error:',error);
    onFailure(token,error);
   }
  }
 }
 function pause(value){
  paused=!!value;
  horse?.play(paused?'Idle':'Gallop');
 }
 const clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{
  if(disposed)return;
  const dt=Math.min(clock.getDelta(),.05);
  if(!document.hidden)horse?.update(dt,1);
  controls.update();
  renderer.render(scene,camera);
 });
 return {
  select,pause,
  snapshot:()=>({symbol:selectedSymbol,procedural:horse?.procedural===true,
   textureFree:horse?.isTextureFree===true,quality:horse?.profile?.quality,
   jockey:horse?.profile?.jockey,paused,drawCalls:renderer.info.render.calls,
   hoofPhase:horse?.hoofPhase}),
  dispose(){
   if(disposed)return;disposed=true;selection++;
   renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();
   horse?.dispose();scene.remove(platform);
   platformGeo.dispose();platformMat.dispose();
   renderer.dispose();
  }
 };
}
