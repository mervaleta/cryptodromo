import * as THREE from 'three';
import {createChurchillStadium} from '/race-lab/source/src/churchillStadium.js';
const wrap=document.querySelector('#stadiumView'),canvas=document.querySelector('#stadiumCanvas');
const notice=document.querySelector('#stadiumNotice'),sky=new THREE.Color();
const scene=new THREE.Scene();
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
}catch(e){
  notice.textContent='Esta vista requiere WebGL en el navegador.';
  throw e;
}
const camera=new THREE.PerspectiveCamera(48,1,.1,320);
scene.add(new THREE.HemisphereLight(0xe6f5ff,0x445b3c,1.5));
const sun=new THREE.DirectionalLight(0xffefc8,1.8);sun.position.set(-10,28,40);scene.add(sun);
const fog=new THREE.Fog(0x9cafa6,85,220);scene.fog=fog;
let mode='overview',hour=17.5,type='clear';
let stadium=createChurchillStadium({THREE,scene,mode,quality:window.innerWidth<700?'low':'medium',enableParticles:true});
function setCamera(){
  if(mode==='overview'){camera.position.set(0,34,143);camera.lookAt(0,6,-2);camera.fov=49;}
  else{camera.position.set(0,13,69);camera.lookAt(0,11,-9);camera.fov=45;}
  camera.updateProjectionMatrix();
}
function choose(next){
  if(next!==mode){stadium.dispose();mode=next;stadium=createChurchillStadium({THREE,scene,mode,quality:window.innerWidth<700?'low':'medium',enableParticles:true});}
  setCamera();applyWeather();
  for(const id of ['overview','homestretch'])document.querySelector('#'+id).setAttribute('aria-pressed',String(mode===id||(id==='homestretch'&&mode==='race')));
}
function applyWeather(){
  stadium.setEnvironment({hour,type,wind:12,clouds:type==='clear'?.15:.75});
  const night=hour<6||hour>=19;
  const base=night?0x172b40:hour<9?0xaeb2b0:hour<16?0x83b8ce:0xd2a98f;
  scene.background=new THREE.Color(base);fog.color.set(base);
  fog.near=type==='fog'?35:85;fog.far=type==='fog'?130:220;
  sun.intensity=night?.35:type==='storm'?.65:1.8;
  sun.color.set(night?0x8dadd9:hour>16?0xffc18b:0xffedc5);
  renderer.toneMappingExposure=night?.72:1.1;
}
document.querySelector('#overview').addEventListener('click',()=>choose('overview'));
document.querySelector('#homestretch').addEventListener('click',()=>choose('race'));
document.querySelector('#lighting').addEventListener('change',e=>{hour=Number(e.target.value);applyWeather();});
document.querySelector('#climate').addEventListener('change',e=>{type=e.target.value;applyWeather();});
function resize(){
  const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap);
choose('overview');resize();
const clock=new THREE.Clock();
let frame=0;function tick(){
  frame=requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05);
  stadium.update(dt,{running:false});
  renderer.render(scene,camera);
}
tick();
document.addEventListener('visibilitychange',()=>{if(document.hidden)clock.stop();else clock.start();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);stadium.dispose();renderer.dispose();},{once:true});
