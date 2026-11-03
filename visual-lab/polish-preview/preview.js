import * as THREE from 'three';
import {createHorse} from '/race-lab/source/src/horse.js';
import {createBroadcastGates} from '../broadcastGates.js';
import {attachGateNumbers} from '../broadcastGateNumbers.js';
import {horseStartOffset} from '../gateChoreography.js';
import {createRacePolishKit} from '../polish/racePolishKit.js';

const $=id=>document.getElementById(id);
const canvas=$('preview'),stage=$('stage'),status=$('state'),clock=$('clock'),error=$('error');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){error.textContent='No se pudo iniciar WebGL: '+e.message;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#718c9e');
scene.fog=new THREE.FogExp2('#718c9e',.0016);
const camera=new THREE.PerspectiveCamera(48,1,.1,2500);
camera.position.set(-361,12,43);camera.lookAt(-395,2,0);
const ambient=new THREE.HemisphereLight('#e8f2ff','#4d4435',2.2);scene.add(ambient);
const sun=new THREE.DirectionalLight('#ffe7bd',3.1);sun.position.set(-110,160,120);scene.add(sun);
const groundMaterial=new THREE.MeshStandardMaterial({color:'#6d543b',roughness:.95});
const track=new THREE.Mesh(new THREE.BoxGeometry(810,.25,38),groundMaterial);
track.position.set(0,-.12,0);scene.add(track);
const lawnMaterial=new THREE.MeshStandardMaterial({color:'#417149',roughness:1});
const lawn=new THREE.Mesh(new THREE.BoxGeometry(850,.15,230),lawnMaterial);
lawn.position.set(0,-.3,0);scene.add(lawn);
for(const z of [-20.2,20.2]){
 const metal=new THREE.MeshStandardMaterial({color:'#d7c7a1',metalness:.45,roughness:.48});
 const rail=new THREE.Mesh(new THREE.BoxGeometry(810,.11,.12),metal);
 rail.position.set(0,1.3,z);scene.add(rail);
}
for(let i=1;i<12;i++){
 const strip=new THREE.Mesh(new THREE.BoxGeometry(810,.02,.028),
  new THREE.MeshBasicMaterial({color:'#d2bd96'}));
 strip.position.set(0,.015,(i-5.5)*2.55-1.275);scene.add(strip);
}
const coats=['#6b4732','#bd8c54','#4b3b31','#d9b98e','#946540','#42342f',
 '#aa8c68','#8d8176','#a45e3f','#75614d','#e2cbaa','#383635'];
const colors=['#ea6045','#e4bd59','#60a8ce','#80a36c','#e9e9dd','#dd8e9d',
 '#ad8ed4','#58c3ae','#f39a3c','#91b7eb','#b5c875','#b8a68f'];
const entries=Array.from({length:12},(_,i)=>({symbol:['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX','LINK','DOT','LTC','UNI'][i],color:colors[i],coat:coats[i]}));
const gates=createBroadcastGates({THREE,entries,startX:-390,quality:'high'});
scene.add(gates.root);
attachGateNumbers({THREE,root:gates.root,entries,startX:-390});
const polish=createRacePolishKit({THREE,scene,quality:'balanced',horseCount:12,stadiumId:'satoshi'});
const horses=[];let elapsed=0,playing=false,finished=false,prev=performance.now();
function setStatus(text){status.textContent=text;}
function setAtmosphere(){
 const weather=$('weather').value,night=weather==='night',rain=weather==='rain';
 scene.background.set(night?'#0b1c2a':rain?'#6d8792':'#88a9c3');
 scene.fog.color.copy(scene.background);
 ambient.intensity=night?.60:rain?1.45:2.2;
 sun.intensity=night?.45:rain?1.25:3.1;
 sun.color.set(night?'#87a6cc':rain?'#e5ebee':'#ffe7bd');
 renderer.toneMappingExposure=night?.88:1.1;
 const surface=$('surface').value;
 groundMaterial.color.set(surface==='grass'?'#426f47':surface==='synthetic'?'#404d58':'#6d543b');
 polish.updateFrame({delta:0,weather,surface,wetness:rain?.8:0,localHour:night?22:17.5,racePhase:playing?'race':'presentation'});
}
function setQuality(){
 const q=$('quality').value;
 polish.setQuality(q);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,q==='eco'?1:q==='balanced'?1.4:1.8));
}
function reset(){
 playing=false;finished=false;elapsed=0;polish.beginRace();gates.reset();
 for(let i=0;i<horses.length;i++){
  horses[i].distance=0;horses[i].model.root.position.set(-390+horseStartOffset(-1),0,(i-5.5)*2.55);
  horses[i].model.play('Idle',.1);
 }
 clock.textContent='00:00';setStatus('Caballos esperando la largada');$('start').textContent='▶ LARGADA DEMO';
}
function start(){
 if(finished)reset();
 if(!playing){playing=true;for(const h of horses)h.model.play('Gallop',.16);}
 else{playing=false;for(const h of horses)h.model.play('Idle',.2);}
 $('start').textContent=playing?'Ⅱ PAUSAR':'▶ CONTINUAR';
}
$('start').addEventListener('click',start);$('reset').addEventListener('click',reset);
$('weather').addEventListener('change',setAtmosphere);
$('surface').addEventListener('change',setAtmosphere);
$('quality').addEventListener('change',setQuality);
function moveCamera(dt){
 const shot=$('camera').value,center=horses.reduce((acc,h)=>acc+h.model.root.position.x,0)/Math.max(1,horses.length);
 const goal=new THREE.Vector3(),target=new THREE.Vector3();
 if(shot==='start'){goal.set(-361,12,43);target.set(-395,2,0);}
 if(shot==='pack'){goal.set(center-3,7,38);target.set(center,2,0);}
 if(shot==='low'){goal.set(center+8,2.8,19);target.set(center-2,1.45,0);}
 if(shot==='aerial'){goal.set(center+30,115,105);target.set(center,0,0);}
 camera.position.lerp(goal,1-Math.exp(-Math.min(.1,dt)*2.8));
 camera.lookAt(target);
}
function animate(now){
 const dt=Math.min(.05,Math.max(0,(now-prev)/1000));prev=now;
 if(playing){
  elapsed=Math.min(60,elapsed+dt);
  gates.update({secondsSinceStart:elapsed,phase:'race'});
  for(let i=0;i<horses.length;i++){
   const h=horses[i],speed=12.4+2.4*Math.sin(elapsed*.18+i*1.2)+i*.13;
   h.distance+=dt*Math.max(7,speed);
   h.model.root.position.set(-390+h.distance+horseStartOffset(elapsed),0,(i-5.5)*2.55);
   polish.updateHorse(i,{horse:h.model,delta:dt,metersPerSecond:speed,referenceSpeed:14.1,
     elapsed,phase:'race',heading:0,position:h.model.root.position});
  }
  clock.textContent='00:'+String(Math.floor(elapsed)).padStart(2,'0');
  if(elapsed>=60){playing=false;finished=true;for(const h of horses)h.model.play('Idle',.25);setStatus('Fin de demostración visual');
   $('start').textContent='↺ VOLVER A LARGAR';}
 }else{
  for(let i=0;i<horses.length;i++)polish.updateHorse(i,{horse:horses[i].model,
    delta:dt,metersPerSecond:0,elapsed,phase:'presentation',position:horses[i].model.root.position});
  if(!finished)gates.update({secondsSinceStart:-1,phase:'presentation'});
 }
 polish.updateFrame({delta:dt,weather:$('weather').value,surface:$('surface').value,
  wetness:$('weather').value==='rain'?.78:0,
  localHour:$('weather').value==='night'?22:17.5,racePhase:playing?'race':'presentation'});
 moveCamera(dt);
 const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
 if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 renderer.render(scene,camera);requestAnimationFrame(animate);
}
async function init(){
 setStatus('Cargando 12 caballos animados…');
 const results=await Promise.allSettled(entries.map((entry,i)=>createHorse({
  coat:entry.coat,accent:entry.color,symbol:entry.symbol,height:2.85,mode:'Idle',phase:i*.07
 })));
 const failed=results.filter(r=>r.status==='rejected');
 if(failed.length)throw Error('Fallaron '+failed.length+' modelos. '+String(failed[0].reason));
 for(let i=0;i<results.length;i++){
  const model=results[i].value;scene.add(model.root);horses.push({model,distance:0});
 }
 $('start').disabled=$('reset').disabled=false;
 reset();setQuality();setAtmosphere();requestAnimationFrame(animate);
}
window.__cryptodromoAlpha21QA={
 snapshot:()=>({ready:horses.length===12,horseCount:horses.length,playing,elapsed,
  camera:$('camera').value,quality:$('quality').value,surface:$('surface').value,
  weather:$('weather').value,gateOpen:gates.openness,
  averageCadence:polish.locomotion.rates.reduce((a,b)=>a+b,0)/12,
  footDustInstances:polish.spray.capacity,followThroughBones:polish.body.channels,
  stadiumTheme:polish.stadium.theme.title,
  horseRootX:horses[0]?.model.root.position.x||null}),
 seek:(time)=>{const t=Math.max(0,Math.min(59.8,Number(time)||0));
  reset();start();elapsed=t;for(const h of horses)h.distance=t*14.1;
  gates.update({secondsSinceStart:t,phase:'race'});},
 reset
};
init().catch(e=>{console.error(e);error.textContent=String(e);setStatus('Error de carga 3D');});
