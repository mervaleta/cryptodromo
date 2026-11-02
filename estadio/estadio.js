import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createStadiumVenue} from '/race-lab/source/src/stadium/venue.js';
import {getStadiumPreset} from '/race-lab/source/src/stadium/presets.js';
// The stadium museum is independent from the alpha14 live race and its horse/camera pipeline.

const $=id=>document.getElementById(id);
const wrap=$('stadiumView'),canvas=$('stadiumCanvas'),notice=$('stadiumNotice');
let renderer,venue,frame=0,lastTime=0;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:window.innerWidth>720,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
}catch(error){
  notice.textContent='WebGL no disponible. La visita 3D requiere un navegador compatible.';
  throw error;
}
const scene=new THREE.Scene();scene.background=new THREE.Color(0x93b8c2);
scene.fog=new THREE.Fog(0x93b8c2,250,920);
const camera=new THREE.PerspectiveCamera(49,1,.1,1500);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=25;controls.maxDistance=850;
controls.maxPolarAngle=Math.PI*.49;
const ambient=new THREE.HemisphereLight(0xd8efff,0x394f3b,1.5);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xffe8c4,2.7);sun.position.set(-150,250,180);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-400;sun.shadow.camera.right=400;
sun.shadow.camera.top=400;sun.shadow.camera.bottom=-400;sun.shadow.camera.far=1100;
scene.add(sun);
const views={
  aerial:{eye:[570,215,380],target:[0,5,-55]},
  grandstand:{eye:[0,44,162],target:[0,13,-152]},
  entrance:{eye:[0,83,-405],target:[0,9,-243]},
  paddock:{eye:[-470,85,-30],target:[-340,7,-100]},
  side:{eye:[585,170,95],target:[0,16,-65]}
};
const venueInput=$('venue-select'),qualityInput=$('quality-select'),cameraInput=$('camera-select'),
  hourInput=$('lighting'),weatherInput=$('climate'),caption=$('venue-caption');
if(window.innerWidth<720)qualityInput.value='low';
const initial=new URLSearchParams(location.search).get('venue');
if(['satoshi','exchange','horizon'].includes(initial))venueInput.value=initial;
function pickCamera(){
  const view=views[cameraInput.value]||views.aerial;
  camera.position.set(...view.eye);controls.target.set(...view.target);
  controls.update();
}
function environment(){
  if(!venue)return;
  const hour=Number(hourInput.value),type=weatherInput.value;
  const night=hour<6||hour>=19;
  const base=night?0x1b3044:hour<9?0xc8a797:hour<16?0x85bbcb:0xd5b393;
  const color=type==='storm'?0x687781:type==='cloudy'?0xa2abad:base;
  scene.background.setHex(color);scene.fog.color.setHex(color);
  scene.fog.near=type==='fog'?65:type==='storm'?185:260;
  scene.fog.far=type==='fog'?370:type==='storm'?700:950;
  ambient.intensity=night?.6:1.5;
  sun.intensity=night?.23:type==='storm'?.7:2.7;
  sun.color.setHex(night?0x9abce4:hour>16?0xffc48f:0xffebcb);
  renderer.toneMappingExposure=night?.87:1.1;
  venue.setEnvironment({hour,type,wind:type==='storm'?24:8,clouds:type==='clear'?.12:.82});
}
function rebuild(){
  const previous=venue;
  try{
    const next=createStadiumVenue({THREE,scene,stadiumId:venueInput.value,
      quality:qualityInput.value,weatherParticles:true});
    venue=next;previous?.dispose();
    const preset=getStadiumPreset(venueInput.value),stats=venue.getStats();
    caption.textContent=preset.name+' · '+preset.track+' · '+preset.market+' · '+preset.tagline;
    notice.textContent='ESCENOGRAFÍA PROCEDURAL · '+stats.crowdCount+' ESPECTADORES · '+stats.treeCount+' ÁRBOLES';
    pickCamera();environment();
  }catch(error){
    console.error('Stadium explorer error:',error);
    notice.textContent='Error al construir el estadio: '+error.message;
    if(previous)venue=previous;
  }
}
function resize(){
  const width=wrap.clientWidth,height=wrap.clientHeight;
  if(width<=0||height<=0)return;
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
venueInput.addEventListener('change',rebuild);
qualityInput.addEventListener('change',rebuild);
cameraInput.addEventListener('change',pickCamera);
hourInput.addEventListener('change',environment);
weatherInput.addEventListener('change',environment);
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(wrap);
window.addEventListener('resize',resize);
rebuild();resize();
function tick(now){
  frame=requestAnimationFrame(tick);
  const dt=Math.min(.05,Math.max(0,(now-lastTime)/1000||0));lastTime=now;
  if(document.hidden)return;
  venue?.update(dt);controls.update();renderer.render(scene,camera);
}
frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>{
  cancelAnimationFrame(frame);resizeObserver.disconnect();
  controls.dispose();venue?.dispose();renderer.dispose();
},{once:true});
