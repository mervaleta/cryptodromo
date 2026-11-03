import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createProceduralHorse} from '../horse-fidelity/proceduralHorse.js';
import {randomHorseProfile,normalizeHorseProfile} from '../horse-fidelity/horseProfiles.js';
import {verifyTextureFreeMaterial} from '../horse-fidelity/horseShader.js';

const $=id=>document.getElementById(id);
const canvas=$('viewport'),stage=$('stage');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
catch(e){$('error').textContent='WebGL no disponible: '+e.message;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.3;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#839b94');
const camera=new THREE.PerspectiveCamera(40,1,.1,450);
camera.position.set(5.7,3.8,8.5);
const controls=new OrbitControls(camera,canvas);
controls.target.set(.12,1.45,0);controls.enableDamping=true;
controls.minDistance=3.5;controls.maxDistance=42;controls.maxPolarAngle=Math.PI*.48;
const hemi=new THREE.HemisphereLight('#f7fcf3','#35352a',2.3);scene.add(hemi);
const key=new THREE.DirectionalLight('#ffe5b7',3.8);key.position.set(-10,19,12);scene.add(key);
const rim=new THREE.DirectionalLight('#b7d8fa',2.4);rim.position.set(7,8,-13);scene.add(rim);
const fill=new THREE.DirectionalLight('#f6e3d3',.95);fill.position.set(4,6,8);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#3d5543',roughness:.99});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(130,130),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.013;floor.receiveShadow=true;scene.add(floor);
const ellipse=new THREE.CircleGeometry(1,32);
const shadowMat=new THREE.MeshBasicMaterial({color:'#0d2317',transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide});
const shadows=new THREE.Group();scene.add(shadows);
for(let i=0;i<12;i++){
 const sh=new THREE.Mesh(ellipse,shadowMat);
 sh.rotation.x=-Math.PI/2;sh.scale.set(1.3,.56,1);sh.position.y=.005;
 shadows.add(sh);
}
const symbols=['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX','LINK','DOT','LTC','UNI'];
let horses=[],mode='portrait',moving=false,time=0,frame=performance.now(),lastMetrics=0;
const newProfile=i=>{
 const p=randomHorseProfile(symbols[i],i);
 if(i===0)return normalizeHorseProfile({...p,
  archetype:$('archetype').value,coat:$('coat').value,
  maneStyle:$('mane').value,tailStyle:$('tail').value,
  marking:$('marking').value,quality:$('quality').value,
  wetness:Number($('wet').value)/100,mud:Number($('mud').value)/100
 });
 return normalizeHorseProfile({...p,quality:$('quality').value});
};
function addHorse(i){
 const model=createProceduralHorse({THREE,profile:newProfile(i)});
 scene.add(model.root);
 return model;
}
for(let i=0;i<12;i++)horses.push(addHorse(i));
function layout(){
 for(let i=0;i<horses.length;i++){
  const h=horses[i],shadow=shadows.children[i];
  h.root.visible=mode!=='portrait'||i===0;shadow.visible=h.root.visible;
  if(mode==='portrait')h.root.position.set(0,0,0);
  if(mode==='grid')h.root.position.set((i%4-1.5)*4.8,0,(Math.floor(i/4)-1)*4.0);
  if(mode==='gallop')h.root.position.set(-1.5-(i%3)*.55,0,(i-5.5)*1.75);
  shadow.position.x=h.root.position.x;shadow.position.z=h.root.position.z;
  h.play(mode==='gallop'?'Gallop':moving?'Gallop':'Idle');
 }
 controls.target.set(0,mode==='grid'?0:1.45,0);
 if(mode==='portrait')camera.position.set(5.8,3.45,7.9);
 if(mode==='grid')camera.position.set(15.5,22.5,23.5);
 if(mode==='gallop')camera.position.set(8.0,6.2,23.5);
 controls.update();
 $('modeTitle').textContent=mode==='portrait'?'Retrato de corredor':mode==='grid'?'Doce corredores':'Galope cinematográfico';
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===mode));
}
function replaceAll(){
 const old=horses;
 horses=Array.from({length:12},(_,i)=>addHorse(i));
 old.forEach(h=>h.dispose());layout();updateMetrics();
}
function replaceHero(){
 const p=horses[0];
 horses[0]=addHorse(0);p.dispose();layout();updateMetrics();
}
function updateLook(){
 horses[0].setAppearance({coat:$('coat').value,maneStyle:$('mane').value,
  tailStyle:$('tail').value,marking:$('marking').value});
 applyWeather();
 updateMetrics();
}
function applyWeather(){
 const weather=$('weather').value,night=weather==='night',rain=weather==='rain';
 scene.background.set(night?'#111d29':rain?'#667f87':'#839b94');
 hemi.intensity=night?.88:rain?1.65:2.3;
 key.intensity=night?.8:rain?2.25:3.8;
 rim.intensity=night?2.8:rain?1.8:2.4;
 renderer.toneMappingExposure=night?1.05:rain?1.2:1.3;
 floorMat.color.set(rain?'#38584e':night?'#35403d':'#405b47');
 for(const h of horses){h.setWetness(rain?.75:Number($('wet').value)/100);
  h.setMud(Number($('mud').value)/100);}
 $('wetLabel').textContent=String($('wet').value)+'%';
 $('mudLabel').textContent=String($('mud').value)+'%';
}
function updateMetrics(){
 const hero=horses[0]?.shapeStats,textureChecks=horses.every(h=>h.isTextureFree);
 $('metrics').textContent=[
  'MODELADO 100% PROCEDURAL',
  'Corredores: '+horses.length,
  'Mallas caballo: '+(hero?.meshes||0),
  'Vértices caballo: '+(hero?.vertices||0).toLocaleString('es'),
  'Triángulos caballo: '+(hero?.triangles||0).toLocaleString('es'),
  'Mechones geométricos: '+(hero?.hairStrands||0),
  'Texturas PNG / JPG / Canvas: '+(hero?.imageTextures||0),
  'Sin mapas de imagen: '+(textureChecks?'SÍ':'NO'),
  'Draw calls GPU: '+renderer.info.render.calls,
  'Visor: '+mode
 ].join('\n');
}
for(const button of document.querySelectorAll('[data-view]')){
 button.addEventListener('click',()=>{mode=button.dataset.view;time=0;layout();updateMetrics();});
}
for(const id of ['archetype','quality'])$(id).addEventListener('change',()=>{
 if(id==='quality')replaceAll();else replaceHero();
});
for(const id of ['coat','mane','tail','marking'])$(id).addEventListener('change',updateLook);
for(const id of ['wet','mud'])$(id).addEventListener('input',()=>{applyWeather();updateMetrics();});
$('weather').addEventListener('change',applyWeather);
$('rate').addEventListener('input',()=>{
 $('rateLabel').textContent=(Number($('rate').value)/100).toFixed(2)+'×';
});
$('animate').addEventListener('click',()=>{
 moving=!moving;time=0;
 horses.forEach(h=>h.play(moving?'Gallop':'Idle'));
 $('animate').textContent=moving?'Ⅱ Pausar animación':'▶ Activar galope';
});
$('reset').addEventListener('click',()=>{
 for(const [id,value] of Object.entries({
  archetype:'thoroughbred',coat:'bay',mane:'sport',tail:'natural',marking:'star',
  quality:'balanced',weather:'golden',wet:'0',mud:'0',rate:'100'
 }))$(id).value=value;
 moving=false;mode='portrait';time=0;replaceAll();applyWeather();
 $('animate').textContent='▶ Activar galope';$('rateLabel').textContent='1,00×';
});
const zeroPosition=()=>new THREE.Vector3(0,0,0);
function animate(now){
 const dt=Math.min(.06,Math.max(0,(now-frame)/1000));frame=now;
 const animateAll=mode==='gallop'||moving;
 if(animateAll)time+=dt;
 for(let i=0;i<horses.length;i++){
  const h=horses[i];
  const active=mode==='gallop'||moving;
  h.play(active?'Gallop':'Idle');
  h.update(dt,active?Number($('rate').value)/100:1);
  if(mode==='gallop'){
   // Deterministic demonstration ONLY: not based on market data.
   const x=((time*(3.35+i*.06)+i*.37)%39)-19.5;
   h.root.position.x=x;
  }
  if(shadows.children[i]){shadows.children[i].position.x=h.root.position.x;
   shadows.children[i].position.z=h.root.position.z;}
 }
 controls.update();
 const width=Math.max(1,stage.clientWidth),height=Math.max(1,stage.clientHeight);
 if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||
    canvas.height!==Math.floor(height*renderer.getPixelRatio())){
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 renderer.render(scene,camera);
 if(now-lastMetrics>1000){lastMetrics=now;updateMetrics();}
 requestAnimationFrame(animate);
}
window.__cryptodromoAlpha22QA={
 snapshot:()=>({
  ready:horses.length===12,
  count:horses.length,
  procedural:horses.filter(h=>h.procedural).length,
  textures:horses.reduce((sum,h)=>sum+h.shapeStats.imageTextures,0),
  allTextureFree:horses.every(h=>h.isTextureFree),
  selectedProfile:horses[0]?.profile,
  mode,moving,hoofPhases:horses.map(h=>h.hoofPhase),
  drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
  heroStats:horses[0]?.shapeStats
 }),
 setView:value=>{if(['portrait','grid','gallop'].includes(value)){mode=value;layout();}},
 dispose:()=>{horses.forEach(h=>h.dispose());horses=[];}
};
layout();applyWeather();
$('state').textContent='12 caballos generados por código · listos para inspección';
requestAnimationFrame(animate);
