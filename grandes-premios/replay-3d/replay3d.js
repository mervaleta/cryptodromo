/**
 * Grand Prix 3D replay: additive, isolated from LIVE director.
 * The replayFrame function supplies all sporting positions.
 */
import * as THREE from 'three';
import {createHorse} from '../../race-lab/source/src/horse.js';
import {createStadiumVenue} from '../../race-lab/source/src/stadium/venue.js';
import {listGrandPrix,prepareGrandPrixReplay,replayFrame} from '../../sports/grandPrix.js';
import {liveSlot} from '../../visual-lab/liveSchedule.js';

const $=id=>document.getElementById(id);
const status=$('gp-status'),canvas=$('gp-three'),view=canvas.parentElement;
const params=new URLSearchParams(location.search);
const day=Number(params.get('day')),race=Number(params.get('race')),archive=params.get('archive')==='1';
const event=params.has('day')&&params.has('race')?listGrandPrix().find(e=>e.dayIndex===day&&e.slotIndex===race):null;
const now=liveSlot(),cutoff=now.index-(now.slotSeconds>=60?0:1);
const allowed=event&&(archive||event.absoluteIndex<=cutoff);
let replay,renderer,scene,camera,venue,actors=[],playing=false,lastTime=0,elapsed=0,frameId=0,disposed=false,lastPodium=false,ready=false;
const mobile=matchMedia('(max-width: 730px)').matches;
function fail(message){
 status.textContent=message;status.style.color='#ffd9a0';
 const a=document.createElement('a');a.href='/grandes-premios/?day='+encodeURIComponent(String(day))+'&race='+encodeURIComponent(String(race))+(archive?'&archive=1':'');a.textContent=' Volver al replay 2D';a.style.color='#ffe0a8';status.append(a);
}
function place(){
 const frames=replayFrame(replay,elapsed),bySymbol=new Map(frames.map(x=>[x.symbol,x]));
 actors.forEach(actor=>{
  const v=bySymbol.get(actor.symbol),p=venue.getLanePosition(.015+v.fraction*.955,actor.lane);
  actor.horse.root.position.set(p.x,p.y,p.z);actor.horse.root.rotation.y=p.heading;actor.horse.setBank(0);
 });
 const lead=[...frames].sort((a,b)=>b.meters-a.meters)[0];
 const leading=actors.find(h=>h.symbol===lead.symbol);
 const leader=leading?.horse.root.position,mode=$('gp-camera').value;
 if(mode==='aerial'){camera.position.lerp(new THREE.Vector3(0,560,215),.12);camera.lookAt(0,0,0);}
 else if(mode==='follow'&&leader){
  const yaw=leading.horse.root.rotation.y;
  camera.position.lerp(new THREE.Vector3(leader.x-25*Math.cos(yaw),leader.y+12,leader.z+25*Math.sin(yaw)),.11);
  camera.lookAt(leader.x+32*Math.cos(yaw),leader.y+2,leader.z-32*Math.sin(yaw));
 }else{camera.position.lerp(new THREE.Vector3(-125,42,155),.10);camera.lookAt(leader?.x||0,3,leader?.z||60);}
 if(elapsed>=60&&!lastPodium){lastPodium=true;playing=false;$('gp-play').textContent='▶ Reproducir';$('gp-podium').hidden=false;}
 $('gp-broadcast').textContent='REPLAY SINTÉTICO · '+elapsed.toFixed(1)+' s';
 $('gp-seek').value=String(elapsed);$('gp-time').textContent=elapsed.toFixed(1)+' / 60';
}
function draw(time){
 if(disposed)return;
 frameId=requestAnimationFrame(draw);
 const delta=lastTime?Math.min((time-lastTime)/1000,.07):0;lastTime=time;
 if(ready){
  if(playing)elapsed=Math.min(60,elapsed+delta*Number($('gp-speed').value));
  place();
  for(const actor of actors)actor.horse.update(delta,playing?Number($('gp-speed').value):0);
  venue.update(delta);
 }
 renderer.render(scene,camera);
}
function resize(){
 if(!renderer||!camera)return;
 const w=Math.max(320,view.clientWidth),h=Math.max(300,view.clientHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function displayClassification(){
 const ol=$('gp-places');
 for(const winner of replay.record.finish){
  const li=document.createElement('li'),s=document.createElement('span'),n=document.createElement('b'),a=document.createElement('a');
  s.className='swatch';s.style.background=winner.color;a.href='/racers/#'+encodeURIComponent(winner.symbol);
  a.textContent=winner.symbol;n.textContent=winner.place+'°';li.append(n,s,a);ol.append(li);
 }
 const medals=$('gp-medals');
 ['🥇','🥈','🥉'].forEach((medal,i)=>{
  const p=replay.record.finish[i],box=document.createElement('div'),b=document.createElement('strong'),name=document.createElement('small');
  b.textContent=medal+' '+p.symbol;name.textContent=p.name;box.append(b,name);medals.append(box);
 });
}
function setElapsed(value){
 elapsed=Math.max(0,Math.min(60,Number(value)||0));lastPodium=elapsed>=60;
 $('gp-podium').hidden=true;if(ready)place();
}
function cleanup(){
 if(disposed)return;disposed=true;cancelAnimationFrame(frameId);
 for(const {horse} of actors)horse.dispose();
 actors=[];venue?.dispose();renderer?.dispose();
}
async function init(){
 if(!allowed){fail('Carrera inexistente o todavía no completada. Los resultados futuros requieren archivo sintético explícito.');canvas.hidden=true;return;}
 replay=prepareGrandPrixReplay(event);
 $('gp-title').textContent=event.name+' · jornada '+(day+1);
 displayClassification();
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.15:1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=false;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x9ab3ad);scene.fog=new THREE.FogExp2(0x9ab3ad,.0012);
  camera=new THREE.PerspectiveCamera(46,1,.5,2200);camera.position.set(-120,42,155);
  scene.add(new THREE.HemisphereLight(0xf3f7ea,0x47624c,2.2));
  const sun=new THREE.DirectionalLight(0xffddaa,2);sun.position.set(-150,220,130);sun.castShadow=false;scene.add(sun);
  venue=createStadiumVenue({THREE,scene,stadiumId:'satoshi',quality:mobile?'low':'medium',weatherParticles:false});
  venue.setEnvironment({hour:17.5,type:'clear',wind:8});
  venue.setScoreboard?.({raceNumber:String(race+1),leader:replay.record.finish[0].symbol});
  resize();
  for(let i=0;i<replay.tracks.length;i++){
   const t=replay.tracks[i];
   const horse=await createHorse({symbol:t.symbol,coat:t.coat,accent:t.color,phase:i*.05,mode:'Gallop',maneMotion:true});
   if(disposed){horse.dispose();return;}
   horse.setWind(.5);scene.add(horse.root);actors.push({symbol:t.symbol,lane:i,horse});
   status.textContent='Preparando caballos 3D · '+(i+1)+'/12';
  }
  ready=true;['gp-play','gp-restart','gp-seek'].forEach(id=>$(id).disabled=false);
  status.textContent='ESTADIO SATOSHI NAKAMOTO · 12 CABALLOS 3D · REPLAY';
  $('gp-audit').textContent='Datos sintéticos, sin transmisión histórica observada. Motor CRP-DOSE-FAIR-V1. Replay: '+event.id;
  place();frameId=requestAnimationFrame(draw);
 }catch(error){console.error('Grand Prix 3D:',error);fail('No se pudo iniciar el replay 3D.');cleanup();}
}
$('gp-play').addEventListener('click',()=>{
 if(!ready)return;if(elapsed>=60)setElapsed(0);
 playing=!playing;$('gp-play').textContent=playing?'⏸ Pausar':'▶ Reproducir';if(playing)$('gp-podium').hidden=true;
});
$('gp-restart').addEventListener('click',()=>{playing=false;setElapsed(0);$('gp-play').textContent='▶ Reproducir';});
$('gp-seek').addEventListener('input',e=>{playing=false;setElapsed(e.target.value);$('gp-play').textContent='▶ Reproducir';});
$('gp-podium-dismiss').addEventListener('click',()=>{$('gp-podium').hidden=true;});
window.addEventListener('resize',resize);window.addEventListener('pagehide',cleanup);
window.__cryptodromoGPReplayQA={snapshot:()=>({ready,horseCount:actors.length,elapsed,playing,hasVenue:!!venue,hasRenderer:!!renderer,eventId:event?.id||null,synthetic:true,camera:$('gp-camera').value})};
init();
