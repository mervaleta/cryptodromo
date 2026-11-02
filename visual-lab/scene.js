import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {coastDistance,coastSpeed,raceStatistics,narrateEvent,RUNOUT_SECONDS} from './raceBroadcast.js?v=alpha06-1';
import {buildRosterStats,horseBiography} from './rosterStats.js?v=alpha06-1';
import {createRaceAudio,createNarration} from './raceAudio.js?v=alpha06-1';
import {createNightLights} from './nightLights.js?v=alpha05-lighting-4';
import {createTrackSurfaceEffects} from './trackSurface.js?v=alpha07-1';
import {createHorse} from '/race-lab/source/src/horse.js?v=alpha07-brand-2';
import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS} from '/race-lab/source/src/data/raceFixture.js?v=alpha03-coats-2';
import {buildBroadcastProfiles,broadcastPosition,broadcastSpeed} from './raceChoreography.js?v=alpha05-cruise-1';
import {createOfficialRace,officialRanking} from '/race-lab/source/src/data/officialRace.js?v=crp-20261102';

// Alpha 05: +20% physical/visual course (410 → 492 units), same official race and 60s.
const VISUAL_START_X=-275,VISUAL_FINISH_X=275,VISUAL_SPAN=VISUAL_FINISH_X-VISUAL_START_X;
// Alpha 03: a real XZ-plane, Y-up stadium, not a vertical XY theater.
// Visual effects and frame rate are deliberately isolated from the finance engine.
const canvas=document.getElementById('raceCanvas'), stage=document.getElementById('stage');
const clockEl=document.getElementById('clock'),status=document.getElementById('status'),leaderEl=document.getElementById('leader');
const start=document.getElementById('start'),resetButton=document.getElementById('reset');
const nextButton=document.getElementById('next'),camSelect=document.getElementById('camera'),weatherSelect=document.getElementById('weather');
const standings=document.getElementById('standings'),msg=document.getElementById('message');
const resultsOverlay=document.getElementById('result-overlay'),resultList=document.getElementById('result-list');
const resultMeta=document.getElementById('result-meta'),narrationDisplay=document.getElementById('narrator-text');
const statContent=document.getElementById('race-stat-content'),bioContent=document.getElementById('race-biography');
const voiceButton=document.getElementById('voice'),soundButton=document.getElementById('sound');
const soundtrack=createRaceAudio(),narrator=createNarration();
voiceButton.addEventListener('click',()=>{
 narrator.toggle();voiceButton.setAttribute('aria-pressed',String(narrator.active));
 voiceButton.textContent=narrator.active?'🔊 SILENCIAR RELATO':'🔊 ACTIVAR RELATO';
 if(narrator.active)narrator.say(narrationDisplay.textContent);
});
soundButton.addEventListener('click',()=>{
 if(soundtrack.enabled){soundtrack.stop();soundButton.textContent='♫ AMBIENTE Y CASCOS';}
 else if(soundtrack.start())soundButton.textContent='♫ SILENCIAR AMBIENTE';
 soundButton.setAttribute('aria-pressed',String(soundtrack.enabled));
});
document.querySelector('#result-close').addEventListener('click',()=>{resultsOverlay.classList.remove('is-visible');resultsOverlay.hidden=true;});
const mobile=matchMedia('(max-width:700px)').matches;
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,powerPreference:'high-performance'});}
catch(e){status.textContent='NECESITÁS WEBGL PARA ESTA VISTA';msg.textContent=String(e);throw e;}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.2:1.65));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#a5bbc3');
scene.fog=new THREE.FogExp2(0xc9d2c6,.0036);
// Physical sky dome replaces the washed-out single-color prototype backdrop.
const sky=new Sky();sky.scale.setScalar(450);scene.add(sky);
sky.material.uniforms.turbidity.value=5.5;
sky.material.uniforms.rayleigh.value=2.1;
sky.material.uniforms.mieCoefficient.value=.005;
sky.material.uniforms.mieDirectionalG.value=.81;
const camera=new THREE.PerspectiveCamera(50,1,.1,700);
camera.position.set(-256,4.4,21);camera.lookAt(-236,2,0);
const hemi=new THREE.HemisphereLight(0xc1e2ff,0x39412e,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe0aa,3.6);
sun.position.set(-75,125,62);sun.castShadow=true;
sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
Object.assign(sun.shadow.camera,{left:-160,right:160,top:110,bottom:-110,near:1,far:320});
sun.shadow.bias=-.00014;sun.shadow.normalBias=.018;scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight(0x91c5df,.8);fill.position.set(30,20,-65);scene.add(fill);
function mat(c,rough=.8,metal=0){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});}
const C={
  ivory:mat('#eee7d5',.66),rail:mat('#f1e7d2',.48,.13),bronze:mat('#b8a174',.35,.6),
  stone:mat('#a4aa9b'),concrete:mat('#6d756a'),steel:mat('#334842',.42,.55),
  roof:mat('#193d32',.46,.25),glass:mat('#274e4a',.17,.35),
  green:mat('#175b42'), seat:mat('#284c44'), dark:mat('#0a1d19')
};
function mesh(geom,material,parent=scene){const m=new THREE.Mesh(geom,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,x,y,z,material,parent=scene){const o=mesh(new THREE.BoxGeometry(w,h,d),material,parent);o.position.set(x,y,z);return o;}
function cone(radius,height,x,y,z,material,parent=scene,segments=10){const o=mesh(new THREE.ConeGeometry(radius,height,segments),material,parent);o.position.set(x,y,z);return o;}
function cyl(rt,rb,h,x,y,z,material,parent=scene,sides=12){const o=mesh(new THREE.CylinderGeometry(rt,rb,h,sides),material,parent);o.position.set(x,y,z);return o;}
function shade(x){return (Math.sin(x*13.137)*43758.5453)%1;}
function seeded(seed){let a=seed>>>0;return ()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
function makeTexture(kind){
 const size=512,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');
 const img=ctx.createImageData(size,size),r=seeded(kind==='grass'?9182:65498);
 for(let i=0;i<img.data.length;i+=4){
  const x=(i/4)%size,z=Math.floor(i/(4*size)),wave=Math.sin(x*.16+z*.021)*.5+Math.sin(z*.61)*.35;
  const noise=(r()-.5)*36+wave*12;
  if(kind==='grass'){img.data[i]=Math.max(0,74+noise);img.data[i+1]=Math.max(0,105+noise);img.data[i+2]=Math.max(0,56+noise*.75);}
  else{img.data[i]=Math.max(0,122+noise);img.data[i+1]=Math.max(0,94+noise*.8);img.data[i+2]=Math.max(0,67+noise*.65);}
  img.data[i+3]=255;
 }
 ctx.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='grass'?20:28,kind==='grass'?9:6);t.anisotropy=8;return t;
}
const grassTexture=makeTexture('grass'),earthTexture=makeTexture('earth');
const grass=mat('#e0eed6',1);grass.map=grassTexture;
const earth=mat('#f0e2d4',.93);earth.map=earthTexture;
box(690,.35,260,0,-.33,0,grass);
box(568,.13,38,0,-.06,0,earth);
// Galloping ruts, run-off strips and painted distance marks.
const lanePaint=mat('#e2d0ae',1),sod=mat('#3e7f49',1);
for(const z of [-18,18])box(568,.12,4,0,.02,z,sod);
for(let i=0;i<12;i++){
 const z=-14.9+i*2.65;
 box(564,.016,.027,0,.025,z,lanePaint).castShadow=false;
}
for(let x=-275;x<=275;x+=20)for(const z of [-17,17]){
 const slab=box(.34,.017,1.3,x,.025,z,mat('#efe4c6'));slab.castShadow=false;
}
function rail(z){
 for(const y of [.65,1.23])box(568,.115,.115,0,y,z,C.rail);
 for(let x=-282;x<=282;x+=4)cyl(.055,.065,1.36,x,.60,z,C.rail);
}
rail(-20.2);rail(20.2);
// Outer track lawn, sculpted hedges and paddock fencing.
for(let x=-279;x<=279;x+=4){box(3.5,.65,2,x,.16,-22.9,C.green);}
for(let x=-279;x<=279;x+=8){box(.09,1.4,.10,x,.65,53,C.steel);}
box(568,.12,.13,0,1.25,53,C.steel);
// Tree silhouettes with actual 3D cones, variation in depth, no billboard.
const treeTrunk=mat('#655d47'),treeNeedle=mat('#315d3a'),treeLight=mat('#51784a');
const treeGroup=new THREE.Group();scene.add(treeGroup);
const treeN=mobile?90:155;
for(let i=0;i<treeN;i++){
 const r=seeded(i*761+49),x=r()*580-290,back=r()>.40,z=back?-74-r()*34:75+r()*25;
 const h=5+r()*9;
 cyl(.22,.4,h*.45,x,h*.21,z,treeTrunk,treeGroup,6);
 cone(h*.22,h*.64,x,h*.57,z,r()>.5?treeNeedle:treeLight,treeGroup,7);
 cone(h*.16,h*.53,x,h*.82,z,treeNeedle,treeGroup,7);
}
// Stadium Satoshi Nakamoto: concrete amphitheater, deep stands, VIP facade and twin spires.
const venue=new THREE.Group();venue.name='Estadio Satoshi Nakamoto · Pista Eadweard Muybridge';scene.add(venue);
box(575,2.6,36,0,1.2,-57,C.concrete,venue);
box(568,5.2,12,0,5,-73,C.stone,venue);
for(let row=0;row<17;row++){
 const y=3.4+row*.75,z=-38-row*1.8;
 box(564,.29,1.9,0,y,z,row%3===0?C.ivory:C.seat,venue);
 box(564,.15,.13,0,y+.3,z+.87,C.steel,venue);
}
for(let x=-276;x<=276;x+=9){
 box(.28,16,.4,x,11.0,-71,C.steel,venue);
 box(.28,9,.5,x,6.9,-33,C.steel,venue);
}
box(580,.55,24,0,22.5,-67,C.roof,venue);
box(580,.22,1.0,0,22.9,-54.6,C.bronze,venue);
for(let x=-280;x<=280;x+=8)box(.2,1.3,22,x,21.6,-65,C.steel,venue);
// Center VIP house framed with ornamental stone, patterned windows and copper roofing.
const vip=new THREE.Group();vip.position.set(0,0,-78);venue.add(vip);
box(69,13,9,0,11,0,C.ivory,vip);
box(71,.65,11,0,18.0,0,C.roof,vip);
for(let j=0;j<20;j++){
 const x=-32.5+j*3.4;
 for(const y of [9.5,14.4]){
  box(2.45,3.4,.22,x,y,4.62,C.glass,vip);
  box(2.75,.24,.45,x,y+1.83,4.79,C.ivory,vip);
  box(2.75,.22,.45,x,y-1.82,4.79,C.ivory,vip);
 }
 box(.22,12,.38,x,11,4.9,C.stone,vip);
}
box(71,1.5,9.5,0,20.1,-.4,C.roof,vip);
for(const x of [-24,24]){
 const tower=new THREE.Group();tower.position.set(x,19,3.5);vip.add(tower);
 cyl(3.0,3.0,.7,0,0,0,C.ivory,tower);
 cyl(2.5,2.75,6,0,3.35,0,C.ivory,tower,12);
 for(let j=0;j<8;j++){
  const a=j*Math.PI/4,r=2.52;
  const win=box(1.1,3.0,.25,Math.cos(a)*r,3.3,Math.sin(a)*r,C.glass,tower);win.rotation.y=-a;
 }
 cyl(3.2,2.95,.55,0,6.65,0,C.bronze,tower);
 cone(3.2,8.4,0,11.05,0,C.roof,tower,12);
 cyl(.11,.15,2,0,16.2,0,C.bronze,tower);
}
function sign(text,x,y,z,w=24,h=3,fg='#f3ecd7',bg='#0e3028'){
 const c=document.createElement('canvas');c.width=1024;c.height=148;const ctx=c.getContext('2d');
 ctx.fillStyle=bg;ctx.fillRect(0,0,1024,148);ctx.fillStyle='#cca969';ctx.fillRect(0,0,1024,9);
 ctx.font='900 71px system-ui';ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,83,960);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const surface=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}),venue);
 surface.position.set(x,y,z);return surface;
}
sign('CRYPTÓDROMO · SATOSHI NAKAMOTO',0,18.2,-72,64,4.7);
sign('PISTA EADWEARD MUYBRIDGE',0,3.1,-36,52,3.0);
// Spectators: shared-instanced bodies and heads, individual colors, multi-tier seating.
const crowdN=mobile?1400:3400,bodyG=new THREE.CylinderGeometry(.21,.26,.62,5),headG=new THREE.SphereGeometry(.21,7,5);
const crowds=[new THREE.InstancedMesh(bodyG,mat('#eeeeee'),crowdN),new THREE.InstancedMesh(headG,mat('#dbb78b'),crowdN)];
const dummy=new THREE.Object3D(),palette=['#c9ac88','#23816b','#a3caac','#f5e1bd','#cd7256','#388ba3','#264e5c','#ba957b','#e7e6dc'];
const rnd=seeded(641903);
for(let i=0;i<crowdN;i++){
 const row=Math.floor(rnd()*17),x=(rnd()-.5)*560,z=-37.8-row*1.8;
 const y=3.92+row*.75;
 dummy.position.set(x,y,z);dummy.rotation.y=(rnd()-.5)*.6;dummy.updateMatrix();crowds[0].setMatrixAt(i,dummy.matrix);
 dummy.position.y+=.52;dummy.updateMatrix();crowds[1].setMatrixAt(i,dummy.matrix);
 crowds[0].setColorAt(i,new THREE.Color(palette[Math.floor(rnd()*palette.length)]));
 crowds[1].setColorAt(i,new THREE.Color(rnd()>.55?'#d9b798':'#b99573'));
}
for(const inst of crowds){inst.castShadow=false;inst.receiveShadow=false;inst.instanceMatrix.needsUpdate=true;venue.add(inst);}
for(const x of [-285,285]){
 cyl(.35,.55,31,x,15,-33,C.steel,venue);
 const bank=box(11,.8,2.1,x,30,-33,C.ivory,venue);
 const lamp=new THREE.PointLight(0xffe5b5,0,70,2);lamp.position.set(x,30,-31);venue.add(lamp);bank.userData.lamp=lamp;
}
// Starting gates: 12 open, clearly separated stalls. Decorative, no collisions.
const gateFrames=new THREE.Group();gateFrames.name='12 starting gates';scene.add(gateFrames);
const gatesSteel=mat('#b3c9be',.5,.33),gateAccent=mat('#e6c17c',.56,.22);
for(let lane=0;lane<12;lane++){
 const z=(lane-5.5)*2.55,x=VISUAL_START_X-3.6;
 for(const offset of [-1.18,1.18])box(3.9,2.95,.12,x,1.48,z+offset,gatesSteel,gateFrames);
 box(4.25,.15,2.4,x,3.02,z,gatesSteel,gateFrames);
 box(.16,2.8,2.4,x-2.08,1.44,z,gatesSteel,gateFrames);
 box(.14,.42,1.4,x+2.11,2.65,z,gateAccent,gateFrames);
}
// Finish area: race arches, camera bridge and official marker.
box(.24,.07,40,VISUAL_FINISH_X,.07,0,C.ivory);
for(const z of [-21,21])box(.55,12,.55,VISUAL_FINISH_X,6,z,C.steel);
box(.7,1.6,42,VISUAL_FINISH_X,12.9,0,C.roof);
const finishSign=sign('META · FINISH',VISUAL_FINISH_X,13.0,-3,18,2.5);
const nightLights=createNightLights(scene,{start:VISUAL_START_X,finish:VISUAL_FINISH_X});
const trackFX=createTrackSurfaceEffects(scene,{start:VISUAL_START_X,finish:VISUAL_FINISH_X});
// Dust particles when running; no effect on outcomes.
const dustN=mobile?160:450,dustData=new Float32Array(dustN*3);
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustData,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xe4c69a,size:.23,transparent:true,opacity:.58,depthWrite:false}));
dust.visible=false;scene.add(dust);
const rainN=mobile?280:650,rainPos=new Float32Array(rainN*3),rr=seeded(624);
for(let i=0;i<rainN;i++){rainPos[i*3]=(rr()-.5)*580;rainPos[i*3+1]=rr()*32;rainPos[i*3+2]=(rr()-.5)*130;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xe1ecf0,size:.08,transparent:true,opacity:.52,depthWrite:false}));
rain.visible=false;scene.add(rain);

let raceIndex=0,race=getRaceFixture(0,0),profiles=createOfficialRace(race.entries);
let broadcastProfiles=buildBroadcastProfiles(profiles);
let overtakeCount=0,previousOrder='';
let horses=[],running=false,finished=false,elapsed=0,last=performance.now(),raf;
let officialSnapshot=null,finishShown=false,lastNarrationSlot=-1,lastAnnouncedLeader='';
const biographyStats=buildRosterStats();
function speakBroadcast(phrase){narrationDisplay.textContent=phrase;narrator.say(phrase);}
function showBiography(token){
 if(!token)return;
 const stats=biographyStats.get(token.symbol);
 bioContent.textContent=horseBiography(token,stats);
 if(stats)bioContent.textContent+=' Posición media: '+stats.averagePlace.toFixed(2)+
   ' · mejor puesto: '+stats.bestPlace+' · '+stats.winRatePct.toFixed(1)+'% de victorias.';
}
function showOfficialResult(){
 if(finishShown)return;
 finishShown=true;finished=true;
 const stats=raceStatistics(profiles);officialSnapshot=stats;
 resultList.replaceChildren(...stats.entries.map(row=>{
   const el=document.createElement('div');el.className='result-row';
   el.innerHTML='<strong>'+String(row.place).padStart(2,'0')+'</strong><i style="background:'+row.color+
     ';width:7px;height:22px"></i><b>'+row.symbol+'</b><span>'+row.finishTime.toFixed(3)+' s</span>';
   return el;
 }));
 resultMeta.textContent='12 CABALLOS · VENTAJA '+stats.leadGapMeters.toFixed(2)+
   ' m · '+race.day+'ª JORNADA · DATOS SINTÉTICOS';
 resultsOverlay.hidden=false;requestAnimationFrame(()=>resultsOverlay.classList.add('is-visible'));
 start.textContent='▶ SIGUIENTE CARRERA';
 speakBroadcast(narrateEvent({type:'finish',leader:stats.leader}));
 status.textContent='RESULTADO OFICIAL · '+stats.leader+' GANADOR';
 msg.textContent='El resultado se congeló a 60 s; los caballos desaceleran después de la meta.';
 statContent.textContent='Ganador: '+stats.leader+' · margen '+stats.leadGapMeters.toFixed(2)+
    ' m · dispersión '+stats.spreadMeters.toFixed(2)+' m · variación media '+stats.averageChangePct.toFixed(3)+'%.';
 updateStandings(); // freeze HUD immediately on official result, independent of GPU frame rate
}
const horseCoats=['#6c4731','#b18053','#342a26','#d3b48f','#a65f36','#5d5d62','#a78c66','#332c2a','#a28467','#c49a74','#5b4134','#d4bda8'];
async function bootHorses(){
 const entries=race.entries;const results=await Promise.allSettled(entries.map((e,i)=>createHorse({
   coat:e.coat||horseCoats[i],accent:e.color,symbol:e.symbol,height:2.85,mode:'Gallop',phase:i*.13
 })));
 for(let i=0;i<12;i++){
  let model;
  if(results[i].status==='fulfilled')model=results[i].value;
  else {
   // visible fallback, never a silent blank canvas
   const root=new THREE.Group(),coat=mat(entries[i].coat||horseCoats[i]);
   const torso=mesh(new THREE.SphereGeometry(.95,12,9),coat,root);torso.scale.set(1.3,.55,.52);torso.position.set(0,1.43,0);
   box(.53,1.15,.54,.84,1.67,0,coat,root);
   mesh(new THREE.SphereGeometry(.39,12,10),coat,root).position.set(1.12,2.21,0);
   for(const x of [-.66,.66])for(const z of [-.28,.28])box(.14,1.08,.18,x,.72,z,coat,root);
   model={root,update(){},play(){},setAppearance(){}};
   console.warn('Caballo GLB de respaldo',i,results[i].reason);
  }
  model.root.position.set(VISUAL_START_X,0,(i-5.5)*2.55);
  // No floating symbol sprites: the marks are part of the 3D horse skin shader.
  scene.add(model.root);
  horses.push({model,index:i,entry:entries[i],progress:0,visualSpeed:1});
 }
 setRace(0);start.disabled=false;start.textContent='▶ INICIAR CARRERA';
 status.textContent='CAMPO PREPARADO · 12 CORREDORES';
}
function setRace(index){
 raceIndex=((index%(RACES_PER_DAY*FIXTURE_DAYS))+(RACES_PER_DAY*FIXTURE_DAYS))%(RACES_PER_DAY*FIXTURE_DAYS);
 race=getRaceFixture(raceIndex%RACES_PER_DAY,Math.floor(raceIndex/RACES_PER_DAY));
 profiles=createOfficialRace(race.entries);
 broadcastProfiles=buildBroadcastProfiles(profiles);
 overtakeCount=0;previousOrder='';elapsed=0;running=false;finished=false;finishShown=false;
 lastNarrationSlot=-1;lastAnnouncedLeader='';officialSnapshot=null;
 resultsOverlay.hidden=true;resultsOverlay.classList.remove('is-visible');trackFX.reset();
 clockEl.textContent='00:00';document.getElementById('raceName').textContent='GRAN PREMIO CRIPTO · CARRERA '+String(race.number).padStart(3,'0')+' / '+RACES_PER_DAY;
 if(horses.length){
  horses.forEach((h,i)=>{
   const e=race.entries[i];h.entry=e;h.progress=0;h.model.root.visible=true;h.model.root.position.set(VISUAL_START_X,0,(i-5.5)*2.55);
   h.model.setAppearance({coat:e.coat||horseCoats[i],accent:e.color,symbol:e.symbol});
   h.visualSpeed=1;h.model.play('Idle');
  });
 }
 status.textContent='A SUS MARCAS · DÍA '+race.day;
 narrationDisplay.textContent='LOS DOCE CORREDORES ESPERAN LA LARGADA';
 statContent.textContent='12 corredores · 9 dosis iniciales y 3 finales · dos precios sintéticos.';
 showBiography(race.entries[0]);
 start.textContent='▶ INICIAR CARRERA';updateStandings();
}
function updateStandings(){
 if(finished){
  // Post-finish movement is purely cinematic: positions and leader on
  // every broadcast scoreboard must remain the OFFICIAL 60-second result.
  const order=officialRanking(profiles);
  standings.innerHTML=order.map((p,i)=>'<li data-symbol="'+p.entry.symbol+
   '" title="Ver biografía" style="cursor:pointer"><i style="background:'+p.entry.color+
   '"></i><b>'+String(i+1).padStart(2,'0')+' '+p.entry.symbol+
   '</b><small>'+p.finishTime.toFixed(2)+' s</small></li>').join('');
  leaderEl.textContent=order[0].entry.symbol;
  return;
 }
 const order=horses.slice().sort((a,b)=>b.progress-a.progress||a.index-b.index);
 standings.innerHTML=order.map((h,i)=>'<li data-symbol="'+h.entry.symbol+'" title="Ver biografía" style="cursor:pointer"><i style="background:'+h.entry.color+'"></i><b>'+String(i+1).padStart(2,'0')+' '+h.entry.symbol+'</b><small>'+(h.progress*100).toFixed(1)+'%</small></li>').join('');
 const lead=order[0];leaderEl.textContent=lead?lead.entry.symbol:'—';
}
standings.addEventListener('click',event=>{
 const li=event.target.closest('li[data-symbol]');
 if(li){const entry=race.entries.find(e=>e.symbol===li.dataset.symbol);showBiography(entry);}
});
start.addEventListener('click',()=>{
 if(!horses.length)return;
 if(finished){setRace(raceIndex+1);resultsOverlay.hidden=true;}
 running=!running;for(const h of horses)h.model.play(running?'Gallop':'Idle');
 if(running&&elapsed===0)speakBroadcast(narrateEvent({type:'start'}));
 start.textContent=running?'Ⅱ PAUSAR':'▶ CONTINUAR';
 status.textContent=running?'CARRERA EN CURSO · DOS INPUTS DE PRECIO':'EN PAUSA';
});
resetButton.addEventListener('click',()=>setRace(raceIndex));
nextButton.addEventListener('click',()=>setRace(raceIndex+1));
function setWeather(mode){
 const night=mode==='night',wet=mode==='rain';
 sun.intensity=night?.28:wet?1.6:mode==='noon'?4.1:3.2;
 sun.color.set(night?'#769bc0':wet?'#b8c5d0':mode==='noon'?'#fff7e4':'#ffdaa7');
 const sunPos=night?[-100,-5,10]:wet?[-60,30,65]:mode==='noon'?[25,120,45]:[-100,43,100];
 sun.position.set(...sunPos);sky.material.uniforms.sunPosition.value.copy(sun.position);
 sky.visible=!night&&!wet;
 sky.material.uniforms.turbidity.value=wet?11:mode==='noon'?2.2:6.2;
 sky.material.uniforms.rayleigh.value=mode==='noon'?1.25:2.55;
 hemi.intensity=night?.5:wet?1.05:1.9;scene.background=new THREE.Color(night?'#101b2c':wet?'#849a9f':mode==='noon'?'#91c7e7':'#c1c9ba');
 scene.fog.color.set(night?'#172130':wet?'#92a6a8':'#b9c6b8');scene.fog.density=wet?.0075:.0036;
 rain.visible=wet;
 for(const x of venue.children){if(x.userData?.lamp)x.userData.lamp.intensity=night?90:0;}
 nightLights.configure({night});
}
weatherSelect.addEventListener('change',()=>setWeather(weatherSelect.value));setWeather('golden');
const trackType=document.querySelector('#surface'),cameraZoom=document.querySelector('#camera-zoom');
function setTrackType(type){
 if(type==='grass'){
  earth.map=grassTexture;earth.color.set('#bfd09f');earth.roughness=.90;
  trackFX.marks.material.color.set('#27451e');
 }else if(type==='synthetic'){
  earth.map=null;earth.color.set('#a5aaa2');earth.roughness=.66;
  trackFX.marks.material.color.set('#404945');
 }else{
  earth.map=earthTexture;earth.color.set('#f0e2d4');earth.roughness=.96;
  trackFX.marks.material.color.set('#493526');
 }
 earth.needsUpdate=true;
}
trackType.addEventListener('change',()=>setTrackType(trackType.value));
setTrackType(trackType.value);
cameraZoom.addEventListener('input',()=>{camera.fov=Number(cameraZoom.value);camera.updateProjectionMatrix();});

// The lighting console is its own accessible tab. It never touches race data.
const tabRace=document.querySelector('#tab-race'),tabLight=document.querySelector('#tab-light');
const panelRace=document.querySelector('#panel-race'),panelLight=document.querySelector('#panel-light');
function switchConsole(showLights){
 tabRace.classList.toggle('active',!showLights);
 tabLight.classList.toggle('active',showLights);
 tabRace.setAttribute('aria-selected',String(!showLights));
 tabLight.setAttribute('aria-selected',String(showLights));
 panelRace.hidden=showLights;panelLight.hidden=!showLights;
}
tabRace.addEventListener('click',()=>switchConsole(false));
tabLight.addEventListener('click',()=>switchConsole(true));
const lightPower=document.querySelector('#light-power');
const lightDimmer=document.querySelector('#light-dimmer');
const lightColor=document.querySelector('#light-color');
const lightPattern=document.querySelector('#light-pattern');
const lightLevel=document.querySelector('#light-level');
const lightStatus=document.querySelector('#light-status');
function applyLightingControls(){
 const intensity=Number(lightDimmer.value);
 lightLevel.textContent=intensity+'%';
 nightLights.configure({
  enabled:lightPower.checked,
  dimmer:intensity/100,
  color:lightColor.value,
  effect:lightPattern.value,
  night:weatherSelect.value==='night'
 });
 const mode=weatherSelect.value==='night'?'noche':'día';
 lightStatus.textContent=(lightPower.checked?'Reflectores activos':'Reflectores apagados')+
   ' · '+intensity+'% · '+mode+' · '+lightPattern.options[lightPattern.selectedIndex].textContent+
   ' · sin influencia en la clasificación.';
}
for(const input of [lightPower,lightDimmer,lightColor,lightPattern]){
 input.addEventListener('input',applyLightingControls);
 input.addEventListener('change',applyLightingControls);
}
document.querySelector('#light-preview').addEventListener('click',()=>{
 weatherSelect.value='night';
 setWeather('night');
 applyLightingControls();
});
weatherSelect.addEventListener('change',applyLightingControls);
applyLightingControls();
const target=new THREE.Vector3(),goal=new THREE.Vector3();
function adjustCamera(dt){
 const avg=horses.length?horses.reduce((a,h)=>a+h.model.root.position.x,0)/horses.length:-83;
 const follow=Math.min(VISUAL_FINISH_X+6,Math.max(VISUAL_START_X+6,avg));
 const camMode=camSelect.value;
 if(camMode==='aerial'){goal.set(0,290,155);target.set(0,0,0);}
 else if(camMode==='drone'){goal.set(follow-30,75,55);target.set(follow+20,0,-5);}
 else if(camMode==='finish'){goal.set(VISUAL_FINISH_X+6,7,31);target.set(VISUAL_FINISH_X-12,2,0);}
 else if(camMode==='rail'){goal.set(follow-6,2.75,14.5);target.set(follow+8,2.0,0);}
 else {goal.set(follow-3,5.4,32);target.set(follow+12,2.1,-17);}
 camera.position.lerp(goal,Math.min(1,dt*1.9));camera.lookAt(target);
}
function particles(dt){
 if(running&&horses.length){
  const attr=dustGeo.attributes.position;
  for(let i=0;i<dustN;i++){
   const h=horses[i%horses.length],r=seeded(i*13+Math.floor(elapsed*15));
   attr.setXYZ(i,h.model.root.position.x-1-r()*7,r()*.9,(h.index-5.5)*2.55+(r()-.5)*1.3);
  }
  attr.needsUpdate=true;dust.visible=true;
  dust.material.opacity=weatherSelect.value==='rain'?.08:(trackType.value==='grass'?.14:.48);
 }else dust.visible=false;
 if(rain.visible){const attr=rainGeo.attributes.position;for(let i=0;i<rainN;i++){
  let y=attr.getY(i)-dt*25;
  if(y<0)y=29;attr.setY(i,y);
 }attr.needsUpdate=true;}
}
function animate(now){
 const realSeconds=Math.max(0,(now-last)/1000),dt=Math.min(realSeconds,.08);last=now;
 if(running){
  // Runout is strictly VISUAL. At t=60 the score is frozen, but
  // all horses still travel and slow beyond the post until off-camera.
  elapsed=Math.min(60+RUNOUT_SECONDS,elapsed+realSeconds);
  const inRunout=elapsed>=60,leaderMeters=officialRanking(profiles)[0].distanceAt60;
  horses.forEach((h,i)=>{
   const p=broadcastProfiles[i];
   const exitVelocity=broadcastSpeed(p,59.99);
   const dist=inRunout?
     coastDistance(p.distanceAt60,exitVelocity,elapsed-60):
     broadcastPosition(p,elapsed);
   const meterSpeed=inRunout?coastSpeed(exitVelocity,elapsed-60):
     broadcastSpeed(p,elapsed);
   const pr=dist/leaderMeters;
   h.progress=pr;
   h.model.root.position.x=VISUAL_START_X+VISUAL_SPAN*pr;
   // Slightly faster hoof cadence makes 550 world units in 60s read as a sprint.
   h.visualSpeed=Math.max(.52,Math.min(2.65,1.62*meterSpeed/(leaderMeters/60)));
   // The GLB + eight corrective keyframes now provide the flight and impact;
   // avoid a second oversized global vertical bounce in the scene.
   // Never float the root above the track; footfall kick is applied to the ground.
   h.model.root.position.y=0;
   if(elapsed<60)trackFX.stamp(h.index,h.model.root.position.x,(h.index-5.5)*2.55,h.visualSpeed*7);
  });
  clockEl.textContent=elapsed>=60?'01:00':'00:'+String(Math.floor(Math.min(elapsed,59))).padStart(2,'0');
  if(!inRunout){
   const ranked=horses.slice().sort((a,b)=>b.progress-a.progress||a.index-b.index);
   const lead=ranked[0],currentOrder=ranked.map(h=>h.index).join(',');
   if(previousOrder&&currentOrder!==previousOrder){
    overtakeCount++;
    msg.textContent='ADELANTAMIENTOS '+overtakeCount+' · '+lead.entry.symbol+' al frente · dosis cada 5 s';
   }
   previousOrder=currentOrder;
   const slot=Math.floor(elapsed/5);
   if(slot>lastNarrationSlot){
    lastNarrationSlot=slot;
    if(slot>0){
     const phrase=slot>=11?narrateEvent({type:'close'}):
       narrateEvent({type:'dose',elapsed:slot*5});
     speakBroadcast(phrase);
    }
   }
   if(lead.entry.symbol!==lastAnnouncedLeader){
    if(lastAnnouncedLeader&&elapsed>3&&elapsed<55&&Math.floor(elapsed)%9===0){
     speakBroadcast(narrateEvent({type:'lead',leader:lead.entry.symbol,previous:lastAnnouncedLeader}));
    }
    lastAnnouncedLeader=lead.entry.symbol;
   }
   soundtrack.update(elapsed,weatherSelect.value,
     horses.reduce((total,h)=>total+h.visualSpeed,0)/Math.max(1,horses.length));
   if(Math.floor(elapsed)%5===0&&Math.floor((elapsed-realSeconds))!==Math.floor(elapsed)){
    statContent.textContent='Líder: '+lead.entry.symbol+' · adelantamientos '+overtakeCount+
     ' · dosis '+Math.min(12,slot+1)+'/12 · velocidad de crucero positiva.';
   }
  }
  if(inRunout){
   if(!finished){finished=true;updateStandings();}
   // Give the athletes a full second to cross and clear the camera.
   if(elapsed>=61)showOfficialResult();
   soundtrack.update(elapsed,weatherSelect.value,.65);
   if(elapsed>=60+RUNOUT_SECONDS){
    running=false;
    // The animals leave the shot; never leave twelve idle horses on the finish.
    for(const h of horses){h.model.root.visible=false;h.model.play('Idle');}
   }
  }
 }
 for(const h of horses)h.model.update(dt,running?h.visualSpeed:1);
 nightLights.update(now/1000);
 trackFX.update(realSeconds,{weather:weatherSelect.value,sun:weatherSelect.value==='night'?0:1});
 particles(dt);adjustCamera(dt);renderer.render(scene,camera);
 if(Math.floor(now/200)!==Math.floor((now-dt*1000)/200))updateStandings();
 raf=requestAnimationFrame(animate);
}
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();raf=requestAnimationFrame(animate);
// Opt-in QA seek for deterministic replay verification. Only present with
// ?finish-qa=alpha06 and never changes official prices, doses or ranking.
if(new URLSearchParams(location.search).get('finish-qa')==='alpha06'){
 window.__cryptodromoQA={
  jumpNearFinish(){if(!running)throw new Error('Start race before seeking');elapsed=59.7;},
  state(){return {elapsed,finished,finishShown,positions:horses.map(h=>h.model.root.position.x),
    winners:officialSnapshot?.entries?.map(x=>x.symbol)};}
 };
}
window.addEventListener('error',e=>{status.textContent='ERROR EN ESCENA';msg.textContent=e.message;});
window.addEventListener('unhandledrejection',e=>{status.textContent='ERROR EN ESCENA';msg.textContent=String(e.reason);});
bootHorses().catch(e=>{console.error(e);status.textContent='ERROR DE CARGA 3D';msg.textContent=String(e);});
