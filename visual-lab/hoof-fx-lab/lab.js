import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createHorse} from '../../race-lab/source/src/horse.js?v=alpha18-gaitmane-1';
import {createBTCHeroMaya} from '../../racers/btc-maya-master.js?v=btc-master-procedural-hind-groom-20261104-v12';
import {createHoofTerrainFX} from '../hoofTerrainFX.js?v=hoof-fx-1';

const $=id=>document.getElementById(id);
const canvas=$('canvas'),stage=$('stage'),hud=$('hud');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
renderer.setPixelRatio(Math.min(1.6,window.devicePixelRatio||1));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#98b6bd');
scene.fog=new THREE.FogExp2('#c2c4ba',.012);
const camera=new THREE.PerspectiveCamera(36,1,.08,220);camera.position.set(-20,2.9,6.4);
const controls=new OrbitControls(camera,canvas);
controls.target.set(-16,1.15,0);controls.enableDamping=true;
controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=35;controls.update();
scene.add(new THREE.HemisphereLight('#f1f0dc','#49564b',2.1));
const sun=new THREE.DirectionalLight('#fff1cc',3.1);sun.position.set(-12,22,11);
sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left=-25;sun.shadow.camera.right=25;
sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;
sun.shadow.normalBias=.023;sun.shadow.bias=-.0003;scene.add(sun,sun.target);
const surfaceMaterial=new THREE.MeshStandardMaterial({roughness:.94,metalness:0});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,22),surfaceMaterial);
ground.rotation.x=-Math.PI/2;ground.position.y=.049;
ground.receiveShadow=true;scene.add(ground);
const sideMat=new THREE.MeshStandardMaterial({color:'#455e40',roughness:.98});
for(const side of [-1,1]){
 const bank=new THREE.Mesh(new THREE.BoxGeometry(120,.4,5),sideMat);
 bank.position.set(0,-.11,side*13.1);bank.receiveShadow=true;scene.add(bank);
 const rail=new THREE.Mesh(new THREE.BoxGeometry(120,.11,.13),
   new THREE.MeshStandardMaterial({color:'#e4dfcd',roughness:.46,metalness:.11}));
 rail.position.set(0,1.15,side*11.2);rail.castShadow=true;scene.add(rail);
}
const tint={dirt:'#856442',sand:'#dfc18b',grass:'#507a41',synthetic:'#838d89'};
const textures=new Map();
function createGroundTexture(type){
 const c=document.createElement('canvas');c.width=c.height=256;
 const ctx=c.getContext('2d');ctx.fillStyle=tint[type];ctx.fillRect(0,0,256,256);
 let seed=987654+(type.length*907);const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const n=type==='grass'?9300:7200;
 for(let i=0;i<n;i++){
  const x=rnd()*256,y=rnd()*256,r=.25+rnd()*(type==='sand'?1.6:2.9);
  const k=rnd()>.48?'255,240,205':'15,15,15';
  ctx.fillStyle='rgba('+k+','+(type==='grass'?.05:.06+rnd()*.10)+')';
  ctx.fillRect(x,y,r,type==='grass'?r*2.2:r);
 }
 if(type==='sand'){
  ctx.strokeStyle='#fff5da23';ctx.lineWidth=1;
  for(let y=0;y<255;y+=12){
   ctx.beginPath();for(let x=0;x<=256;x+=6){
    const wave=y+2*Math.sin(x*.065+y*.19);if(x===0)ctx.moveTo(x,wave);else ctx.lineTo(x,wave);
   }ctx.stroke();
  }
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(22,4);
 texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 return texture;
}
const fx=createHoofTerrainFX(scene,{lanes:1,quality:$('quality').value,surface:$('surface').value});
fx.setLayout('straight');
function changeSurface(){
 const mode=$('surface').value;
 if(!textures.has(mode))textures.set(mode,createGroundTexture(mode));
 surfaceMaterial.map=textures.get(mode);surfaceMaterial.color.set('#ffffff');
 surfaceMaterial.roughness=mode==='synthetic'?.68:.97;
 surfaceMaterial.needsUpdate=true;fx.setSurface(mode);
 sideMat.color.set(mode==='grass'?'#436439':'#605e48');
}
changeSurface();
let horse=null,hero=null,running=true,speed=1,wetness=0,prev=performance.now(),lastLabel=0;
let horseX=-16,failed=false;
async function loadHorse(){
 try{
  horse=await createHorse({symbol:'BTC',coat:'#594237',accent:'#f7931a',
   height:2.85,mode:'Gallop',maneMotion:true,phase:0});
  horse.root.position.set(horseX,0,0);scene.add(horse.root);
  setModel();
  hud.textContent='BTC listo. Compará las tres superficies.';
 }catch(error){failed=true;hud.textContent='No se pudo cargar el caballo: '+error.message;
  console.error('Hoof FX Lab',error);}
}
function setModel(){
 if(!horse)return;
 hero?.dispose();hero=null;
 if($('horse-model').value==='maya'){
  try{
   hero=createBTCHeroMaya(horse.root,{
    coatColor:'#64493c',hoofColor:'#272423',eyeColor:'#170e0d',
    color:'#302525',tailColor:'#302525',maneSize:1.15,tailSize:1.12
   });
  }catch(error){
   console.warn('BTC Maya unavailable, retaining original animated GLB',error);
   hud.textContent='Maestro Maya no disponible; se usa el GLB original. '+error.message;
  }
 }
}
function restart(){
 horseX=-16;fx.reset();
 if(horse)horse.root.position.x=horseX;
 controls.target.set(horseX,1.15,0);camera.position.set(horseX-4,2.9,6.4);controls.update();
}
$('surface').addEventListener('change',changeSurface);
$('horse-model').addEventListener('change',setModel);
$('speed').addEventListener('input',()=>{speed=Number($('speed').value);
 $('speed-value').textContent=speed.toFixed(1)+'×';});
$('wet').addEventListener('input',()=>{
 wetness=Number($('wet').value)/100;fx.setWetness(wetness);
 $('wet-value').textContent=Math.round(wetness*100)+'%';
 surfaceMaterial.color.setRGB(1-wetness*.24,1-wetness*.28,1-wetness*.32);
 surfaceMaterial.roughness=Math.max(.29,.96-wetness*.51);
});
$('quality').addEventListener('change',()=>fx.setQuality($('quality').value));
$('pause').addEventListener('click',()=>{
 running=!running;horse?.play(running?'Gallop':'Idle');
 $('pause').textContent=running?'Pausar caballo':'Reanudar caballo';
});
$('restart').addEventListener('click',restart);
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);
 camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function draw(now){
 requestAnimationFrame(draw);
 const dt=Math.min(.05,Math.max(0,(now-prev)/1000));prev=now;
 if(horse&&!failed){
  const before=horseX;
  if(running)horseX+=dt*3.8*speed;
  if(horseX>24)restart();
  horse.root.position.x=horseX;
  horse.update(dt,running?speed:1);
  hero?.update(dt,{wind:.45,speed,running,phase:horse.hoofPhase||0});
  fx.stepHorse(0,{model:horse,dt,speed,running});
  const shift=horseX-before;
  if(Math.abs(shift)<2){camera.position.x+=shift;controls.target.x+=shift;}
  sun.position.x=horseX-8;sun.target.position.x=horseX;
 }
 fx.update(dt,{wind:.2,pixelRatio:renderer.getPixelRatio()});
 controls.update();renderer.render(scene,camera);
 if(now-lastLabel>350&&horse){
  lastLabel=now;const s=fx.stats;
  hud.textContent=(hero?'BTC · MAYA MASTER':'BTC · GLB ORIGINAL')+
    ' | '+s.surface.toUpperCase()+' | HUELLA '+s.imprints+
    ' | APOYOS '+s.impacts+' | PARTÍCULAS '+s.particles+
    ' | DRAW CALLS '+renderer.info.render.calls;
 }
}
if(new URLSearchParams(location.search).get('qa')==='1'){
 window.__cryptodromoHoofLabQA=Object.freeze({snapshot:()=>Object.freeze({
  ready:!!horse,master:!!hero,failed,running,horseX,surface:$('surface').value,
  nodes:(()=>{const names=[];horse?.root?.traverse(o=>{if(/Leg|Hoof|hoof|end/.test(o.name))names.push({name:o.name,type:o.type});});return names.slice(0,55);})(),
  wetness,stats:fx.stats,drawCalls:renderer.info.render.calls
 })});
}
requestAnimationFrame(draw);loadHorse();
window.addEventListener('pagehide',()=>{
 fx.dispose();hero?.dispose();horse?.dispose();controls.dispose();
 ground.geometry.dispose();surfaceMaterial.dispose();
 for(const tex of textures.values())tex.dispose();
 renderer.dispose();
},{once:true});
