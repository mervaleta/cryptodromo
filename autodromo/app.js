import * as THREE from 'three';
import {createFormulaCar} from './car.js';
import {createCarCircuit} from './circuit.js?v=autodromo-pole-2';
import {trafficAt,trafficAudit,getTrafficPlan} from './traffic.js?v=autodromo-overtake-1';
import {CAR_TRACKS,CAR_ROSTER,carTrack,getCarSession,positionsAt,resultsAtFinish} from './logic.js?v=autodromo-pole-2';
import {tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';

const $=id=>document.getElementById(id);
const canvas=$('race-canvas'),wrapper=canvas.parentElement;
const numbers=new Map(CAR_ROSTER.map(car=>[car.symbol,car.number]));
const isMobile=matchMedia('(max-width: 800px)').matches;
const params=new URLSearchParams(location.search);
let selected=carTrack(params.get('track'))?.id||CAR_TRACKS[0].id;
let mode='program',demoElapsed=0,session=null,scene,renderer,camera,circuit;
let cars=[],lastFrame=0,lastUI=-1,oldSessionKey='',disposed=false,frameId=0;
let frameReady=false,sceneError='',lastClock=null,stagingGrid=false;
let hemi,sun;

function pretty(seconds){
 const s=Math.max(0,Math.floor(seconds));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
function element(tag,className,text){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(text!==undefined)el.textContent=String(text);
 return el;
}
function carFor(token){
 const identity=CAR_ROSTER.find(c=>c.symbol===token.symbol);
 return createFormulaCar(token,identity?.number||1);
}
function releaseCars(){
 for(const actor of cars)actor.car.dispose();
 cars=[];
}
function resetWorld(){
 if(!scene)return;
 releaseCars();
 circuit?.dispose();
 const track=carTrack(selected);
 scene.background=new THREE.Color(track.layout==='street'?'#10182d':'#839da5');
 scene.fog=new THREE.FogExp2(scene.background.clone(),track.layout==='street'?.00095:.00063);
 hemi.intensity=track.layout==='street'?1.45:2.35;
 sun.intensity=track.layout==='street'?.9:2.3;
 circuit=createCarCircuit(track);scene.add(circuit.root);
 oldSessionKey='';lastUI=-1;
}
function setSession(next){
 if(!next||next.key===oldSessionKey)return;
 releaseCars();
 session=next;oldSessionKey=next.key;lastUI=-1;
 // Build immutable, frame-rate-independent traffic paths for this one race.
 getTrafficPlan(session);
 if(scene){
  for(let i=0;i<session.fixture.entries.length;i++){
   const entry=session.fixture.entries[i],car=carFor(entry);
   scene.add(car.root);
   cars.push({symbol:entry.symbol,car,lastMeters:null});
  }
 }
 $('race-name').textContent=carTrack(selected).name;
 const pole=session.grid[0];
 $('pole-label').textContent='POLE · '+pole.symbol+' · '+(pole.qualifyingPct>=0?'+':'')+pole.qualifyingPct.toFixed(3)+'% (3 min previos)';
 $('race-count').textContent='Jornada '+session.fixture.day+' / carrera '+session.fixture.trackRaceNumber+
   ' · 12 autos · grilla 2×6 · 12 dosis / 5 s';
 $('source-label').textContent='Fuente: synthetic-v1 · '+session.fixture.fixtureVersion+' · sin precios reales';
}
function currentSession(date){
 return getCarSession(selected,date);
}
function selectTrack(id){
 if(!carTrack(id)||selected===id)return;
 selected=id;mode='program';demoElapsed=0;
 document.querySelectorAll('[data-track]').forEach(btn=>{
  const on=btn.dataset.track===id;btn.classList.toggle('selected',on);
  btn.setAttribute('aria-pressed',String(on));
 });
 const url=new URL(location.href);url.searchParams.set('track',id);
 history.replaceState(null,'',url.pathname+url.search);
 resetWorld();setSession(currentSession(new Date()));
 lastClock=null;
}
function showGarage(query=''){
 const needle=query.trim().toLocaleLowerCase().slice(0,70);
 const fragment=document.createDocumentFragment();
 for(const car of CAR_ROSTER){
  if(needle&&!((car.symbol+' '+car.name).toLocaleLowerCase().includes(needle)))continue;
  const card=element('div','car-card'),swatch=element('i'),body=element('div'),
    symbol=element('b',null,car.symbol),name=element('small',null,car.name),
    number=element('strong',null,'#'+String(car.number).padStart(3,'0'));
  swatch.style.background=car.color;body.append(symbol,name);card.append(swatch,body,number);fragment.append(card);
 }
 $('garage-grid').replaceChildren(fragment);
}
function showSchedule(date){
 const fragment=document.createDocumentFragment();
 for(const track of CAR_TRACKS){
  const clock=tripleLiveSlot(date,track.id);
  const b=element('button',track.id===selected?'active':'');
  b.type='button';b.dataset.channel=track.id;
  b.setAttribute('aria-label','Ver '+track.name);
  const left=element('span'),title=element('strong',null,track.name);
  const current=element('small',null,'Carrera '+(clock.slot+1)+'/480 · '+clock.label);
  left.append(title,current);
  const phase=clock.slotSeconds<60?'EN PISTA':'PRÓXIMA';
  const right=element('span'),status=element('small',null,phase),time=element('b',null,pretty(clock.slotSeconds<60?60-clock.slotSeconds:clock.secondsToNext));
  right.append(status,time);b.append(left,right);
  b.addEventListener('click',()=>selectTrack(track.id));
  fragment.append(b);
 }
 $('schedule').replaceChildren(fragment);
}
function showStandings(seconds){
 if(!session)return;
 const finished=seconds>=60;
 const standings=finished
   ?resultsAtFinish(session).map(x=>({...x,meters:1000,finished:true}))
   :positionsAt(session,seconds);
 const fragment=document.createDocumentFragment();
 standings.forEach((value,i)=>{
  const row=element('li'),pos=element('span','pos',i+1),
    swatch=element('i','color'),symbol=element('b','symbol',value.symbol),
    name=element('span','name',value.name),
    metres=element('span','meters',finished?'FINAL':seconds<1?'P'+value.gridPosition:value.meters.toFixed(1)+' m');
  swatch.style.background=value.color;
  row.append(pos,swatch,symbol,name,metres);fragment.append(row);
 });
 $('standings').replaceChildren(fragment);
 $('leader').textContent=standings[0]?.symbol||'···';
 $('entries-count').textContent=standings.length+' monoplazas';
 $('classification-note').textContent=finished
  ?'Llegada definitiva: clasificación del motor oficial CRP-DOSE-FAIR-V1; esta demo usa precios sintéticos.'
  :(seconds<1
    ?'Grilla de partida: pole calculada con las variaciones sintéticas de los 3 minutos anteriores. Seis filas escalonadas de dos autos.'
    :'Orden de pista basado en las doce dosis de cinco segundos y la posición de grilla. Las distancias oficiales y el ganador nunca se modifican.');
}
function updateBroadcast(seconds,clock){
 const finished=seconds>=60;
 $('track-label').textContent=carTrack(selected).name.toUpperCase();
 $('live-tag').textContent=mode==='test'?'PRUEBA REPRODUCIBLE':'PROGRAMACIÓN SINTÉTICA';
 $('phase-label').textContent=mode==='test'
   ?(finished?'RESULTADO OFICIAL':seconds<1?'GRILLA · POLE POSITION':'CARRERA DE PRUEBA')
   :(stagingGrid?'FORMACIÓN · POLE POSITION':clock.slotSeconds<60?'EN CARRERA':'PRÓXIMA LARGADA');
 $('clock').textContent=mode==='test'
   ?pretty(seconds)
   :(clock.slotSeconds<60?pretty(60-clock.slotSeconds):pretty(clock.secondsToNext));
}
function renderCarPositions(seconds,delta){
 if(!circuit||!session||!cars.length)return;
 const rows=trafficAt(session,seconds);
 const places=new Map(rows.map(r=>[r.symbol,r]));
 for(const actor of cars){
  const row=places.get(actor.symbol);
  if(!row)continue;
  // Camera and geometry consume only the visual projection; ranking stays official.
  const point=circuit.pose(row.visualMeters,row.sideMeters);
  actor.car.root.position.set(point.x,point.y,point.z);
  // The visual nose gently points into its lane change, rather than strafing.
  actor.car.root.rotation.y=point.heading+row.steering;
  if(actor.lastMeters!==null&&row.meters>=actor.lastMeters)
    actor.car.updateWheelRotation(row.meters-actor.lastMeters);
  actor.lastMeters=row.meters;
 }
 const leading=rows[0],leaderActor=cars.find(c=>c.symbol===leading?.symbol);
 const target=leaderActor?.car.root.position||new THREE.Vector3(0,0,0);
 const heading=leaderActor?.car.root.rotation.y||0;
 const mode=$('camera-mode').value;
 if(mode==='follow'){
  const direction=new THREE.Vector3(Math.cos(heading),0,-Math.sin(heading));
  const wanted=target.clone().addScaledVector(direction,-31).add(new THREE.Vector3(0,14,0));
  camera.position.lerp(wanted,Math.min(1,delta*3));
  camera.lookAt(target.clone().addScaledVector(direction,32));
 }else if(mode==='aerial'){
  const wanted=target.clone().add(new THREE.Vector3(2,165,115));
  camera.position.lerp(wanted,Math.min(1,delta*2.1));
  camera.lookAt(target);
 }else{
  if(seconds<10||stagingGrid){
   // Reveal the actual 2-by-6 starting grid, not twelve cars abreast.
   const p=circuit.pose(-42,0),direction=new THREE.Vector3(Math.cos(p.heading),0,-Math.sin(p.heading));
   const right=new THREE.Vector3(-direction.z,0,direction.x);
   const focus=new THREE.Vector3(p.x,1.6,p.z);
   const wanted=focus.clone().addScaledVector(right,82).addScaledVector(direction,-49).add(new THREE.Vector3(0,36,0));
   camera.position.lerp(wanted,Math.min(1,delta*3.8));camera.lookAt(focus);
  }else{
   const p=circuit.pose(185,6),wanted=new THREE.Vector3(p.x+87,58,p.z+87);
   camera.position.lerp(wanted,Math.min(1,delta*2.1));
   camera.lookAt(target.clone().add(new THREE.Vector3(0,2,0)));
  }
 }
}
function initThree(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile,powerPreference:'default',alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isMobile?1.1:1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=false;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(52,1,.5,2000);
  camera.position.set(-240,120,210);
  hemi=new THREE.HemisphereLight('#ddf4ff','#334e53',2.3);scene.add(hemi);
  sun=new THREE.DirectionalLight('#ffe3b7',2.2);sun.position.set(90,200,125);scene.add(sun);
  resize();resetWorld();frameReady=true;
 }catch(error){
  sceneError=String(error);
  $('canvas-fallback').hidden=false;
  console.error('Autódromo WebGL unavailable',error);
 }
}
function resize(){
 if(!renderer||!camera)return;
 const w=Math.max(320,wrapper.clientWidth),h=Math.max(350,wrapper.clientHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function animate(time){
 if(disposed)return;
 frameId=requestAnimationFrame(animate);
 const delta=lastFrame?Math.min((time-lastFrame)/1000,.12):0;lastFrame=time;
 const now=new Date(),clock=tripleLiveSlot(now,selected);
 lastClock=clock;
 let seconds;
 stagingGrid=false;
 if(mode==='test'){
  demoElapsed=Math.min(60,demoElapsed+delta*Number($('replay-speed').value));
  seconds=demoElapsed;
 }else if(clock.slotSeconds>=170){
  // Last ten seconds of the slot: display the NEXT race's 2x6 starting grid.
  const nextDate=new Date(now.getTime()+(clock.secondsToNext+0.2)*1000);
  const upcoming=currentSession(nextDate);
  if(upcoming.key!==oldSessionKey)setSession(upcoming);
  seconds=0;stagingGrid=true;
 }else{
  const clockKey=clock.dayIndex+':'+clock.minuteOfDay+':'+selected;
  if(clockKey!==oldSessionKey)setSession(currentSession(now));
  seconds=Math.min(60,clock.slotSeconds);
 }
 const tick=Math.floor(time/750);
 if(tick!==lastUI){
  lastUI=tick;showStandings(seconds);updateBroadcast(seconds,clock);showSchedule(now);
 }
 if(frameReady){
  renderCarPositions(seconds,delta);
  renderer.render(scene,camera);
 }
}
$('test-race').addEventListener('click',()=>{
 mode='test';demoElapsed=0;
 setSession(currentSession(new Date()));lastUI=-1;
 $('test-race').textContent='↻ Repetir carrera';
});
$('return-live').addEventListener('click',()=>{
 mode='program';demoElapsed=0;
 $('test-race').textContent='▶ Probar carrera ahora';
 lastUI=-1;setSession(currentSession(new Date()));
});
document.querySelectorAll('[data-track]').forEach(btn=>{
 btn.addEventListener('click',()=>selectTrack(btn.dataset.track));
 btn.setAttribute('aria-pressed',String(btn.dataset.track===selected));
 btn.classList.toggle('selected',btn.dataset.track===selected);
});
$('garage-filter').addEventListener('input',ev=>showGarage(ev.target.value));
window.addEventListener('resize',resize);
function cleanup(){
 disposed=true;cancelAnimationFrame(frameId);releaseCars();circuit?.dispose();renderer?.dispose();
}
window.addEventListener('pagehide',cleanup);
window.__cryptodromoAutodromoQA={
 snapshot:()=>({trackId:selected,mode,frameReady,sceneError,
    carCount:cars.length,rosterCount:CAR_ROSTER.length,sessionKey:oldSessionKey,
    elapsed:mode==='test'?demoElapsed:lastClock?.slotSeconds||0,
    fixtureVersion:session?.fixture.fixtureVersion,trackNames:CAR_TRACKS.map(x=>x.name),
    winner:session?.official[0]?.entry.symbol,pole:session?.grid[0]?.symbol,stagingGrid,
    grid:session?.grid.map(g=>({symbol:g.symbol,position:g.position,row:g.row,column:g.column,backMeters:g.backMeters})),
    overtakingSystem:'traffic-director-v1',
    synthetic:true}),
 inspectTraffic:(seconds)=>session?trafficAt(session,seconds).map(r=>({
   symbol:r.symbol,trackMeters:r.trackMeters,visualMeters:r.visualMeters,
   sideMeters:r.sideMeters,steering:r.steering,
   world:circuit?circuit.pose(r.visualMeters,r.sideMeters):null
 })):[],
 auditTraffic:(step=.2)=>session?trafficAudit(session,step):null
};
showGarage();initThree();setSession(currentSession(new Date()));
frameId=requestAnimationFrame(animate);
