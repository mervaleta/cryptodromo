import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {trackPoint} from './trackMath.js?v=alpha14-runout-2';
import {cameraBlend} from './cinematicCamera.js?v=alpha10-1';
import {reframeCamera,countdownVisibility} from './cameraRig.js?v=alpha17-1';
import {bindCameraPanel} from './cameraPanel.js?v=alpha17-1';
import {createBroadcastDirector} from '../alpha15/director.js?v=alpha15-1';
import {createFinishOrchestrator} from '../alpha15/finishOrchestrator.js?v=alpha15-1';
import {rendererSettings,createQualityGovernor} from '../alpha15/quality.js?v=alpha15-1';
import {createAlternativeTracks} from './trackVisuals.js?v=a12-curves-1';
import {createLiveStadiumDistrict} from './stadiumDistrict.js?v=stadium-live-1';
import {createStadiumDensity} from './stadiumDensity.js?v=alpha18-1';
import {createParadeVillage} from '../parade/scenery.js?v=alpha16-live-2';
import {createStadiumBackdrop} from './stadiumBackdrop.js?v=alpha16-village-1';
import {createCloudLayer} from './cloudLayer.js?v=alpha15-2';
import {liveSlot,formatCountdown,SLOT_SECONDS} from './liveSchedule.js?v=a08-1';
import {coastDistance,coastSpeed,broadcastRunoutDistance,raceStatistics,narrateEvent,RUNOUT_SECONDS} from './raceBroadcast.js?v=alpha15-runout-1';
import {broadcastPhase,PHASES,allRunnersCrossed,finishReveal} from './broadcastTimeline.js?v=alpha09-1';
import {buildRosterStats,horseBiography} from './rosterStats.js?v=alpha06-1';
import {createRaceAudio,createNarration} from './raceAudio.js?v=alpha09-cheer-1';
import {createNightLights} from './nightLights.js?v=alpha14-perimeter-1';
import {createTrackSurfaceEffects} from './trackSurface.js?v=alpha09-contact-1';
import {createHorse,selectedHorseRenderer} from './horseRenderer.js?v=alpha22-fidelity-1';
import {createCinematicLineup} from './cinematicLineup.js?v=home-cine-1';
import {installProceduralGround} from './proceduralGround.js?v=alpha20-procedural-2';
import {createBroadcastGates} from './broadcastGates.js?v=alpha20-1';
import {attachGateNumbers} from './broadcastGateNumbers.js?v=alpha20-1';
import {applyGateStaging} from './gateChoreography.js?v=alpha20-1';
import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS} from '/race-lab/source/src/data/raceFixture.js?v=alpha03-coats-2';
import {buildBroadcastProfiles,broadcastPosition,broadcastSpeed} from './raceChoreography.js?v=alpha05-cruise-1';
import {createOfficialRace,officialRanking} from '/race-lab/source/src/data/officialRace.js?v=crp-20261102';
import {mountTrackSplitsPanel} from './trackSplitsPanel.js?v=alpha15-splits-1';
import {createSplitTrackMarkers} from './trackSplitMarkers.js?v=alpha15-splits-1';

// Alpha 05: +20% physical/visual course (410 → 492 units), same official race and 60s.
const VISUAL_START_X=-390,VISUAL_FINISH_X=390,VISUAL_SPAN=VISUAL_FINISH_X-VISUAL_START_X;
// Alpha 03: a real XZ-plane, Y-up stadium, not a vertical XY theater.
// Visual effects and frame rate are deliberately isolated from the finance engine.
const canvas=document.getElementById('raceCanvas'), stage=document.getElementById('stage');
const horseEngineMode=selectedHorseRenderer(location.search);
// One public renderer, no UI or query-string backend switching.
const horseEngineControl=document.querySelector('#horse-engine');
if(horseEngineControl)horseEngineControl.value='fidelity';
const clockEl=document.getElementById('clock'),status=document.getElementById('status'),leaderEl=document.getElementById('leader');
const start=document.getElementById('start'),resetButton=document.getElementById('reset');
const nextButton=document.getElementById('next'),camSelect=document.getElementById('camera'),weatherSelect=document.getElementById('weather');
const standings=document.getElementById('standings'),msg=document.getElementById('message');
const resultsOverlay=document.getElementById('result-overlay'),resultList=document.getElementById('result-list');
const resultMeta=document.getElementById('result-meta'),narrationDisplay=document.getElementById('narrator-text');
const statContent=document.getElementById('race-stat-content'),bioContent=document.getElementById('race-biography');
const voiceButton=document.getElementById('voice'),soundButton=document.getElementById('sound');
const soundtrack=createRaceAudio(),narrator=createNarration();
let soundManuallyMuted=false,voiceManuallyMuted=false;
const volumeControl=document.querySelector('#audio-volume');
soundtrack.setVolume(Number(volumeControl.value)/100);
volumeControl.addEventListener('input',()=>soundtrack.setVolume(Number(volumeControl.value)/100));
function activateBroadcastAudio(){
 if(!soundManuallyMuted&&!soundtrack.enabled){soundtrack.start();soundButton.textContent='♫ SILENCIAR AMBIENTE';soundButton.setAttribute('aria-pressed','true');}
 if(!voiceManuallyMuted&&!narrator.active){narrator.toggle();voiceButton.textContent='🔊 SILENCIAR RELATO';voiceButton.setAttribute('aria-pressed','true');}
}
voiceButton.addEventListener('click',()=>{
 narrator.toggle();voiceManuallyMuted=!narrator.active;voiceButton.setAttribute('aria-pressed',String(narrator.active));
 voiceButton.textContent=narrator.active?'🔊 SILENCIAR RELATO':'🔊 ACTIVAR RELATO';
 if(narrator.active)narrator.say(narrationDisplay.textContent);
});
soundButton.addEventListener('click',()=>{
 if(soundtrack.enabled){soundManuallyMuted=true;soundtrack.stop();soundButton.textContent='♫ HABILITAR AUDIO';}
 else if(soundtrack.start()){soundManuallyMuted=false;soundButton.textContent='♫ SILENCIAR AMBIENTE';}
 soundButton.setAttribute('aria-pressed',String(soundtrack.enabled));
});
document.querySelector('#result-close').addEventListener('click',()=>{resultsOverlay.classList.remove('is-visible');resultsOverlay.hidden=true;});
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){status.textContent='NECESITÁS WEBGL PARA ESTA VISTA';msg.textContent=String(e);throw e;}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#a5bbc3');
scene.fog=new THREE.FogExp2(0xc9d2c6,.0036);
// Physical sky dome replaces the washed-out single-color prototype backdrop.
const sky=new Sky();sky.scale.setScalar(450);scene.add(sky);
sky.material.uniforms.turbidity.value=5.5;
sky.material.uniforms.rayleigh.value=2.1;
sky.material.uniforms.mieCoefficient.value=.005;
sky.material.uniforms.mieDirectionalG.value=.81;
const cloudLayer=createCloudLayer(scene,{mobile:false,softwareGPU:false});
const camera=new THREE.PerspectiveCamera(50,1,.1,700);
camera.position.set(-256,4.4,21);camera.lookAt(-236,2,0);
const hemi=new THREE.HemisphereLight(0xc1e2ff,0x39412e,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe0aa,3.6);
const sunDirection=new THREE.Vector3(-.46,.83,.30).normalize();
sun.position.set(-75,125,62);sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);
Object.assign(sun.shadow.camera,{left:-102,right:102,top:98,bottom:-98,near:1,far:320});
sun.shadow.camera.updateProjectionMatrix();
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
// Procedural mode uses analytic GPU materials, preserving the old look for comparison.
// Reuse the existing tile as a subtle height detail map: no extra network asset.
earth.bumpMap=earthTexture;earth.bumpScale=.047;
const proceduralGround=horseEngineMode!=='legacy'?installProceduralGround({grass,track:earth}):null;
box(850,.35,260,0,-.33,0,grass);
const straightSceneIndex=scene.children.length;
box(812,.13,38,0,-.06,0,earth);
// Galloping ruts, run-off strips and painted distance marks.
const lanePaint=mat('#e2d0ae',1),sod=mat('#3e7f49',1);
for(const z of [-18,18])box(812,.12,4,0,.02,z,sod);
for(let i=0;i<12;i++){
 const z=-14.9+i*2.65;
 box(809,.016,.027,0,.025,z,lanePaint).castShadow=false;
}
for(let x=-380;x<=380;x+=20)for(const z of [-17,17]){
 const slab=box(.34,.017,1.3,x,.025,z,mat('#efe4c6'));slab.castShadow=false;
}
function rail(z){
 for(const y of [.65,1.23])box(812,.115,.115,0,y,z,C.rail);
 for(let x=-402;x<=402;x+=4)cyl(.055,.065,1.36,x,.60,z,C.rail);
}
rail(-20.2);rail(20.2);
// Outer track lawn, sculpted hedges and paddock fencing.
for(let x=-399;x<=399;x+=4){box(3.5,.65,2,x,.16,-22.9,C.green);}
for(let x=-399;x<=399;x+=8){box(.09,1.4,.10,x,.65,53,C.steel);}
box(812,.12,.13,0,1.25,53,C.steel);
const straightCourse=new THREE.Group();straightCourse.name='Straight track assets';
const straightChildren=scene.children.slice(straightSceneIndex);scene.add(straightCourse);
straightChildren.forEach(child=>straightCourse.add(child));
// Tree silhouettes with actual 3D cones, variation in depth, no billboard.
const treeTrunk=mat('#655d47'),treeNeedle=mat('#315d3a'),treeLight=mat('#51784a');
createStadiumBackdrop(scene,{softwareGPU:false,mobile:false});
const treeGroup=new THREE.Group();scene.add(treeGroup);
const treeN=155;
for(let i=0;i<treeN;i++){
 const r=seeded(i*761+49),x=r()*820-410,back=r()>.40,z=back?-74-r()*34:75+r()*25;
 const h=5+r()*9;
 cyl(.22,.4,h*.45,x,h*.21,z,treeTrunk,treeGroup,6);
 cone(h*.22,h*.64,x,h*.57,z,r()>.5?treeNeedle:treeLight,treeGroup,7);
 cone(h*.16,h*.53,x,h*.82,z,treeNeedle,treeGroup,7);
}
// Alpha16: preserve Satoshi's landmark VIP pavilion but NOT its previous
// uninterrupted 810m tribune. Three short modular stands live in Parade Village.
// This also leaves gaps for the paddock, services, food court and drone vistas.
const venue=new THREE.Group();venue.name='Estadio Satoshi Nakamoto · Pabellón VIP y meta';scene.add(venue);
box(93,1.35,27,0,.65,-78,C.concrete,venue);
box(105,.35,11,0,1.15,-68,C.stone,venue);
const standCenters=[-210,-5,207],standWidths=[101,122,101];
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
const crowdN=980,bodyG=new THREE.CylinderGeometry(.21,.26,.62,5),headG=new THREE.SphereGeometry(.21,7,5);
const crowds=[new THREE.InstancedMesh(bodyG,mat('#eeeeee'),crowdN),new THREE.InstancedMesh(headG,mat('#dbb78b'),crowdN)];
const dummy=new THREE.Object3D(),palette=['#c9ac88','#23816b','#a3caac','#f5e1bd','#cd7256','#388ba3','#264e5c','#ba957b','#e7e6dc'];
const rnd=seeded(641903);
for(let i=0;i<crowdN;i++){
 const section=i%3,row=Math.floor(rnd()*7);
 const x=standCenters[section]+(rnd()-.5)*(standWidths[section]-8);
 const z=-107-row*2.6,y=4.62+row*.93;
 dummy.position.set(x,y,z);dummy.rotation.y=(rnd()-.5)*.6;dummy.updateMatrix();crowds[0].setMatrixAt(i,dummy.matrix);
 dummy.position.y+=.52;dummy.updateMatrix();crowds[1].setMatrixAt(i,dummy.matrix);
 crowds[0].setColorAt(i,new THREE.Color(palette[Math.floor(rnd()*palette.length)]));
 crowds[1].setColorAt(i,new THREE.Color(rnd()>.55?'#d9b798':'#b99573'));
}
for(const inst of crowds){inst.castShadow=false;inst.receiveShadow=false;inst.instanceMatrix.needsUpdate=true;venue.add(inst);}
// The stands erupt at the finish: 128 tiny waving pennants in one draw call.
const flagsN=128;
const flagGeom=new THREE.PlaneGeometry(.82,.55),flagMat=new THREE.MeshBasicMaterial({color:'#f1cf86',side:THREE.DoubleSide,transparent:true,opacity:.92});
const cheerFlags=new THREE.InstancedMesh(flagGeom,flagMat,flagsN),flagMatrix=new THREE.Object3D();
cheerFlags.frustumCulled=false;cheerFlags.visible=false;cheerFlags.name='Crowd · photo finish cheering';
const flagPositions=[];
for(let i=0;i<flagsN;i++){
 const section=i%3,row=(Math.floor(i/3)%7);
 const x=standCenters[section]+((i*71%101)/101-.5)*(standWidths[section]-10);
 const z=-107-row*2.6,y=5.1+row*.93;
 flagPositions.push({x,z,y,phase:i*.64});
 flagMatrix.position.set(x,y,z);flagMatrix.updateMatrix();cheerFlags.setMatrixAt(i,flagMatrix.matrix);
}
cheerFlags.instanceMatrix.needsUpdate=true;venue.add(cheerFlags);
for(const x of [-285,285]){
 cyl(.35,.55,31,x,15,-33,C.steel,venue);
 const bank=box(11,.8,2.1,x,30,-33,C.ivory,venue);
 const lamp=new THREE.PointLight(0xffe5b5,0,70,2);lamp.position.set(x,30,-31);venue.add(lamp);bank.userData.lamp=lamp;
}
// Alpha20: former decorative gateFrames replaced by a fixture-bound, time-synced gate kit.
// It is constructed after the official fixture, and never changes prices or scoring.
// Finish area: race arches, camera bridge and official marker.
box(.24,.07,40,VISUAL_FINISH_X,.07,0,C.ivory);
for(const z of [-21,21])box(.55,12,.55,VISUAL_FINISH_X,6,z,C.steel);
box(.7,1.6,42,VISUAL_FINISH_X,12.9,0,C.roof);
const finishSign=sign('META · FINISH',VISUAL_FINISH_X,13.0,-3,18,2.5);
// Light-weight golden photo-finish flare: one GPU points draw, 96 sparkles.
// No billboards around horse brands and no particle system per animal.
const burstN=96,burstPos=new Float32Array(burstN*3),burstGeo=new THREE.BufferGeometry();
burstGeo.setAttribute('position',new THREE.BufferAttribute(burstPos,3));
const finishBurst=new THREE.Points(burstGeo,new THREE.PointsMaterial({
 color:'#ffe3a0',size:.65,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending
}));
finishBurst.visible=false;finishBurst.frustumCulled=false;scene.add(finishBurst);
const finishGlow=new THREE.PointLight(0xffd68a,0,95,1.8);scene.add(finishGlow);
function updateFinishBurst(){
 const t=elapsed-60,active=running&&t>=0&&t<18.5&&!finishShown;
 finishBurst.visible=active;
 cheerFlags.visible=active;
 finishGlow.intensity=active?Math.max(0,22*(1-t/19)):0;
 if(active){
   for(let i=0;i<flagsN;i++){
     const p=flagPositions[i];
     flagMatrix.position.set(p.x,p.y+Math.sin(t*9+p.phase)*.24,p.z);
     flagMatrix.rotation.set(0,0,Math.sin(t*10+p.phase)*.75);
     flagMatrix.updateMatrix();cheerFlags.setMatrixAt(i,flagMatrix.matrix);
   }
   cheerFlags.instanceMatrix.needsUpdate=true;
 }
 if(!active)return;
 const f=trackPoint(layoutMode,1,5.5);finishGlow.position.set(f.x,6,f.z);
 const a=burstGeo.attributes.position;
 for(let i=0;i<burstN;i++){
  const angle=i*2.39996+(i%4)*.1,r=2.4+(i%17)*.61;
  a.setXYZ(i,f.x+Math.cos(angle)*r,1.6+t*(.7+i%3*.12)+(i%7)*.35,
    f.z+Math.sin(angle)*r);
 }
 a.needsUpdate=true;
 finishBurst.material.opacity=.68*Math.max(0,1-t/19);
}

// Independent exterior for the Satoshi alpha14 race, using three-venue shared presets.
// Does not recreate course, crowd, sky, horse assets, rain, spotlights or cameras.
const liveDistrict=createLiveStadiumDistrict({THREE,scene,stadiumId:'satoshi',
  quality:'cinematic'});
// Separate scene layers: original race/paddock geometry + compact public venue.
// The village never creates an alternative track, race horses or a clock.
const liveVillage=createParadeVillage(scene,{quality:'cinematic'});
const stadiumDensity=createStadiumDensity({THREE,scene,quality:'high',softwareGPU:false});
const nightLights=createNightLights(scene,{start:VISUAL_START_X,finish:VISUAL_FINISH_X});
const trackFX=createTrackSurfaceEffects(scene,{start:VISUAL_START_X,finish:VISUAL_FINISH_X});
const alternateTracks=createAlternativeTracks(scene,earth,C.rail);
let layoutMode='straight';
const trackSplitMarkers=createSplitTrackMarkers({THREE,scene,trackPoint,initialLayout:layoutMode});
// Dust particles when running; no effect on outcomes.
const dustN=450,dustData=new Float32Array(dustN*3);
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustData,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xe4c69a,size:.23,transparent:true,opacity:.58,depthWrite:false}));
dust.visible=false;scene.add(dust);
const rainN=1050,rainPos=new Float32Array(rainN*3),rr=seeded(624);
for(let i=0;i<rainN;i++){rainPos[i*3]=(rr()-.5)*820;rainPos[i*3+1]=rr()*32;rainPos[i*3+2]=(rr()-.5)*130;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xe1ecf0,size:.08,transparent:true,opacity:.52,depthWrite:false}));
rain.visible=false;scene.add(rain);

const initialQa=new URLSearchParams(location.search).get('finish-qa')==='alpha06';
const initialLiveSlot=liveSlot(new Date());
const initialRaceIndex=initialQa?0:
 broadcastPhase(initialLiveSlot.slotSeconds).phase===PHASES.PRESENTATION?
 initialLiveSlot.next.index:initialLiveSlot.index;
let raceIndex=initialRaceIndex,race=getRaceFixture(initialRaceIndex%RACES_PER_DAY,Math.floor(initialRaceIndex/RACES_PER_DAY)),
    profiles=createOfficialRace(race.entries);
let broadcastProfiles=buildBroadcastProfiles(profiles);
const gateKit=createBroadcastGates({THREE,entries:race.entries,startX:VISUAL_START_X,quality:'high'});
scene.add(gateKit.root);
const gateLabels=attachGateNumbers({THREE,root:gateKit.root,entries:race.entries,startX:VISUAL_START_X});
const splitModeSelect=document.querySelector('#split-mode');
const splitPanel=mountTrackSplitsPanel(document.querySelector('#race-splits'),{mode:splitModeSelect.value});
splitPanel.setRace(broadcastProfiles,{mode:splitModeSelect.value});
splitModeSelect.addEventListener('change',()=>{
 splitPanel.setRace(broadcastProfiles,{mode:splitModeSelect.value});
 trackSplitMarkers.update({layout:layoutMode,splitMode:splitModeSelect.value});
 splitPanel.update(elapsed,{finishAuthorized:finishShown});
});
let overtakeCount=0,previousOrder='';
let horses=[],running=false,finished=false,elapsed=0,last=performance.now(),raf;
// Read-only diagnostics opt in, for repeatable browser comparisons, never for scoring.
if(horseEngineMode!=='legacy'&&new URLSearchParams(location.search).get('procedural-qa')==='alpha20'){
 window.__cryptodromoProceduralQA=Object.freeze({
  snapshot:()=>Object.freeze({
   ready:horses.length===12,generated:horses.filter(h=>h.model.generated||h.model.procedural).length,
   horses:horses.length,seeded:horses.map(h=>h.model.seed??h.model.profile?.seed??null),
   symbols:race.entries.map(e=>e.symbol),
   officialRanking:officialRanking(profiles).map(e=>e.symbol),gateCount:gateKit.entries?.length??12,
   renderer:horseEngineMode,drawCalls:renderer.info.render.calls
  })
 });
}
let maneWind=.55; // matches stadium cloud wind; never affects the race engine
let officialSnapshot=null,finishShown=false,lastNarrationSlot=-1,lastAnnouncedLeader='';
let lastCrossedAt=null,previousCrossCount=0,finishRoarPlayed=false;
const finishController=createFinishOrchestrator({holdAfterLast:2.4,maxVisualSeconds:19});
const tvDirector=createBroadcastDirector({minDwell:5.5});
let selectedTvShot='pack',lastDirectorUpdate=-Infinity;
const biographyStats=buildRosterStats();
function speakBroadcast(phrase){narrationDisplay.textContent=phrase;narrator.say(phrase,{urgent:phrase.includes('Largaron')||phrase.includes('Cruzaron')});}
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
 splitPanel.update(Math.max(60,elapsed),{finishAuthorized:true});
 const stats=raceStatistics(profiles);officialSnapshot=stats;
 resultList.replaceChildren(...stats.entries.map(row=>{
   const el=document.createElement('div');el.className='result-row';
   el.innerHTML='<strong>'+String(row.place).padStart(2,'0')+'</strong><i style="background:'+row.color+
     ';width:7px;height:22px"></i><b>'+row.symbol+'</b><span>'+row.finishTime.toFixed(3)+' s</span>';
   return el;
 }));
 finishCelebration.hidden=true;
 resultMeta.textContent='12 CABALLOS · VENTAJA '+stats.leadGapMeters.toFixed(2)+
   ' m · '+race.day+'ª JORNADA · DATOS SINTÉTICOS';
 resultsOverlay.hidden=false;requestAnimationFrame(()=>resultsOverlay.classList.add('is-visible'));
 if(!liveFollowing)start.textContent='▶ SIGUIENTE CARRERA';
 speakBroadcast(narrateEvent({type:'finish',leader:stats.leader}));
 status.textContent='RESULTADO OFICIAL · '+stats.leader+' GANADOR';
 msg.textContent='El resultado se congeló a 60 s; los caballos desaceleran después de la meta.';
 statContent.textContent='Ganador: '+stats.leader+' · margen '+stats.leadGapMeters.toFixed(2)+
    ' m · dispersión '+stats.spreadMeters.toFixed(2)+' m · variación media '+stats.averageChangePct.toFixed(3)+'%.';
 updateStandings(); // freeze HUD immediately on official result, independent of GPU frame rate
}
const horseCoats=['#6c4731','#b18053','#342a26','#d3b48f','#a65f36','#5d5d62','#a78c66','#332c2a','#a28467','#c49a74','#5b4134','#d4bda8'];
async function bootHorses(){
 const entries=race.entries;
 const models=await createCinematicLineup({entries,coats:horseCoats,createHorse});
 for(let i=0;i<models.length;i++){
  const model=models[i],initial=trackPoint(layoutMode,0,i);
  model.root.position.set(initial.x,0,initial.z);
  model.root.rotation.y=initial.heading;
  scene.add(model.root);
  model.setWind?.(maneWind);
  model.setVisualQuality?.('cinematic');
  horses.push({model,index:i,entry:entries[i],progress:0,visualSpeed:1});
 }
 setRace(raceIndex);start.disabled=false;start.textContent='▶ INICIAR CARRERA';
 lastLiveIndex=-1;lastPhase='';updateLiveProgram();syncControlMode();
 status.textContent='CAMPO PREPARADO · 12 CORREDORES · FIDELITY CINE';
 window.__cryptodromoCinematicReady={engine:'fidelity',quality:'cinematic',
  count:models.length,usesPlaceholders:false};
}
function setRace(index){
 raceIndex=((index%(RACES_PER_DAY*FIXTURE_DAYS))+(RACES_PER_DAY*FIXTURE_DAYS))%(RACES_PER_DAY*FIXTURE_DAYS);
 race=getRaceFixture(raceIndex%RACES_PER_DAY,Math.floor(raceIndex/RACES_PER_DAY));
 gateKit.setEntries(race.entries);gateLabels.setEntries(race.entries);
 profiles=createOfficialRace(race.entries);
 broadcastProfiles=buildBroadcastProfiles(profiles);
 splitPanel.setRace(broadcastProfiles,{mode:splitModeSelect.value});
 overtakeCount=0;previousOrder='';elapsed=0;running=false;finished=false;finishShown=false;
 lastNarrationSlot=-1;lastAnnouncedLeader='';officialSnapshot=null;
 lastCrossedAt=null;previousCrossCount=0;finishRoarPlayed=false;
 finishController.reset();tvDirector.reset();lastDirectorUpdate=-Infinity;selectedTvShot='pack';
 finishCelebration.hidden=true;presentation.hidden=true;stage.classList.remove('is-presenting');
 resultsOverlay.hidden=true;resultsOverlay.classList.remove('is-visible');trackFX.reset();
 clockEl.textContent='00:00';document.getElementById('raceName').textContent='GRAN PREMIO CRIPTO · CARRERA '+String(race.number).padStart(3,'0')+' / '+RACES_PER_DAY;
 if(horses.length){
  horses.forEach((h,i)=>{
   const e=race.entries[i];h.entry=e;h.progress=0;h.visualMeters=0;h.model.root.visible=true;const first=trackPoint(layoutMode,0,i);
    h.model.root.position.set(first.x,0,first.z);h.model.root.rotation.y=first.heading;
   h.model.setAppearance({coat:e.coat||horseCoats[i],accent:e.color,symbol:e.symbol,number:i+1});
   h.model.setBank?.(0);
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
 if(finished&&!finishShown)return; // Do not reveal official order before all twelve cross.
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
 activateBroadcastAudio();
 if(liveFollowing){liveFollowing=false;liveNowButton.textContent='● SINTONIZAR LIVE';}
 if(finished){setRace(raceIndex+1);resultsOverlay.hidden=true;}
 running=!running;for(const h of horses)h.model.play(running?'Gallop':'Idle');
 if(running&&elapsed===0)speakBroadcast(narrateEvent({type:'start'}));
 start.textContent=running?'Ⅱ PAUSAR':'▶ CONTINUAR';
 status.textContent=running?'CARRERA EN CURSO · DOS INPUTS DE PRECIO':'EN PAUSA';
});
resetButton.addEventListener('click',()=>{liveFollowing=false;setRace(raceIndex);});
nextButton.addEventListener('click',()=>{liveFollowing=false;setRace(raceIndex+1);});
const livePrevious=document.querySelector('#live-previous'),liveCurrent=document.querySelector('#live-current'),
      liveNextLabel=document.querySelector('#live-next-label'),liveCountdown=document.querySelector('#live-countdown'),
      liveState=document.querySelector('#live-state'),liveNowButton=document.querySelector('#live-now');
const replayButton=document.querySelector('#replay-mode'),autoLabel=document.querySelector('#automatic-label');
const presentation=document.querySelector('#presentation-overlay'),presentRoster=document.querySelector('#present-roster'),
      presentSymbol=document.querySelector('#present-symbol'),presentName=document.querySelector('#present-name'),
      presentBadge=document.querySelector('#present-badge'),presentRecord=document.querySelector('#present-record'),
      presentCountdown=document.querySelector('#present-countdown');
const finishCelebration=document.querySelector('#finish-celebration'),finishCrossCount=document.querySelector('#finish-cross-count');
const qaManual=initialQa;
let liveFollowing=!qaManual,lastLiveIndex=-1,lastPhase='',lastPresented=-1;
function syncControlMode(){
 const manual=!liveFollowing;
 if(manual)stage.classList.remove('is-presenting');
 for(const button of [start,resetButton,nextButton])button.hidden=!manual;
 autoLabel.hidden=manual;
 replayButton.textContent=manual?'● VOLVER A LIVE AUTOMÁTICO':'▶ MODO REPLAY MANUAL';
 liveNowButton.textContent=manual?'● SINTONIZAR LIVE':'● LIVE AUTOMÁTICO';
}
function showPresentation(nextRace,seconds){
 stage.classList.add('is-presenting');
 const slotIndex=Math.min(11,Math.floor(Math.max(0,seconds)/5));
 presentation.hidden=false;
 presentCountdown.textContent=formatCountdown(60-seconds);
 if(seconds>=55)presentCountdown.textContent='LARGADA EN '+Math.max(1,Math.ceil(60-seconds));
 // The presentation overlay owns the ONLY visible countdown in the stage.
 if(slotIndex===lastPresented)return;
 lastPresented=slotIndex;
 const token=nextRace.entries[slotIndex],stats=biographyStats.get(token.symbol);
 presentSymbol.textContent=token.symbol;presentSymbol.style.color=token.color;
 presentName.textContent=token.name;
 presentBadge.textContent=String(slotIndex+1).padStart(2,'0')+' / 12 · CABALLO '+(slotIndex+1);
 presentRecord.textContent=stats?'Ficha del campeonato · '+stats.starts+' participaciones · '+stats.wins+
   ' victorias · '+stats.podiums+' podios · mejor puesto '+stats.bestPlace:'Corredor del Cryptódromo';
 [...presentRoster.children].forEach((card,i)=>card.classList.toggle('active',i===slotIndex));
 showBiography(token);
 if(slotIndex===0||slotIndex===6||slotIndex===10)speakBroadcast(
  'Presentamos al corredor '+token.symbol+', '+token.name+'. '+(stats?stats.wins+' victorias en el campeonato ficticio.':''));
}
function buildPresentRoster(entries){
 const cards=entries.map((entry,i)=>{
  const el=document.createElement('div');
  el.textContent=entry.symbol;el.style.setProperty('--runner-color',entry.color);
  el.title=entry.name;el.dataset.runner=String(i);return el;
 });
 presentRoster.replaceChildren(...cards);lastPresented=-1;
}
function updateLiveProgram(){
 const now=liveSlot(new Date()),phase=broadcastPhase(now.slotSeconds);
 livePrevious.textContent=now.previous.label;liveCurrent.textContent=now.label;
 liveNextLabel.textContent=now.next.label;
 liveCountdown.textContent=formatCountdown(now.secondsToNext);
 const label=phase.phase===PHASES.RACE?'EN PISTA · '+Math.ceil(phase.secondsLeft)+' s':
   phase.phase===PHASES.RESULTS?'LLEGADA / ACTA OFICIAL':'PRESENTACIÓN Y CUENTA REGRESIVA';
 liveState.textContent='DÍA '+(now.dayIndex+1)+' / 7 · CARRERA '+String(now.slot+1).padStart(3,'0')+
  ' / 480 · '+label+' · REPLAY SINTÉTICO UTC−3';
 if(!liveFollowing||!horses.length)return;
 if(now.index!==lastLiveIndex){
  lastLiveIndex=now.index;lastPhase='';
  setRace(phase.phase===PHASES.PRESENTATION?now.next.index:now.index);
  buildPresentRoster(race.entries);
 }
 if(phase.phase!==lastPhase){
  lastPhase=phase.phase;
  if(phase.phase===PHASES.PRESENTATION){
   const upcoming=now.next.index;
   setRace(upcoming);buildPresentRoster(race.entries);
   running=false;finished=false;
   resultsOverlay.hidden=true;resultsOverlay.classList.remove('is-visible');
   finishCelebration.hidden=true;
   status.textContent='PRESENTACIÓN DE CORREDORES · PRÓXIMA LARGADA AUTOMÁTICA';
  }
  if(phase.phase===PHASES.RACE){
   presentation.hidden=true;finishCelebration.hidden=true;
   if(raceIndex!==now.index)setRace(now.index);
   running=true;horses.forEach(h=>h.model.play('Gallop'));
   status.textContent='● LIVE · CARRERA EN CURSO';speakBroadcast(narrateEvent({type:'start'}));
  }
 }
 if(phase.phase===PHASES.PRESENTATION){
  document.querySelector('.dial div').textContent='PRÓXIMA LARGADA';
  showPresentation(race,phase.time);
  return;
 }
 presentation.hidden=true;
 stage.classList.toggle('is-presenting',!countdownVisibility(phase.phase,!liveFollowing).dial);
 document.querySelector('.dial div').textContent=phase.phase===PHASES.RACE?'TIEMPO DE CARRERA':'ACTA DE LLEGADA';
 if(phase.phase===PHASES.RACE){
  running=true;if(Math.abs(elapsed-now.slotSeconds)>1)elapsed=now.slotSeconds;
 }else{
  // The clock stays at 60 for the scoring engine, but the last horse
  // continues crossing over the following seconds for cinematic delivery.
  if(now.slotSeconds<60+RUNOUT_SECONDS){
    if(!running)horses.forEach(h=>h.model.play('Gallop'));
    running=true;elapsed=Math.max(elapsed,now.slotSeconds);
  }
  else{
   running=false;elapsed=60+RUNOUT_SECONDS;
   // A spectator may tune in AFTER the last horse has already crossed.
   // Verify the complete synthetic runout deterministically instead of
   // leaving an empty result overlay or fabricating an unobserved finish.
   if(!finishController.state.revealed){
    const officialDistance=officialRanking(profiles)[0].distanceAt60;
    const positions=broadcastProfiles.map(p=>broadcastRunoutDistance(
      {...p,exitVelocity:broadcastSpeed(p,59.99)},officialDistance,RUNOUT_SECONDS));
    const gate=finishController.update({
      elapsed:60+RUNOUT_SECONDS,
      distances:positions,finishDistance:officialDistance
    });
    if(gate.allCrossed&&!gate.showOfficialResult){
      finishController.update({
        elapsed:60+RUNOUT_SECONDS+2.4,
        distances:positions,finishDistance:officialDistance
      });
    }
   }
   // Never publish an acta unless all 12 have actually crossed.
   const finishState=finishController.state;
   if(finishState.revealed&&!finishShown){
    showOfficialResult();
    for(const h of horses){h.model.root.visible=false;h.model.play('Idle');}
   }else if(!finishState.revealed)status.textContent='ESPERANDO CRUCE DE TODOS LOS CORREDORES';
  }
 }
}
function enterManualMode(){
 liveFollowing=false;
 presentation.hidden=true;finishCelebration.hidden=true;
 resultsOverlay.hidden=true;resultsOverlay.classList.remove('is-visible');
 setRace(raceIndex);syncControlMode();
}
liveNowButton.addEventListener('click',()=>{
 if(liveFollowing)enterManualMode();
 else{liveFollowing=true;lastLiveIndex=-1;lastPhase='';syncControlMode();updateLiveProgram();}
});
replayButton.addEventListener('click',()=>{
 if(liveFollowing)enterManualMode();
 else{liveFollowing=true;lastLiveIndex=-1;lastPhase='';syncControlMode();updateLiveProgram();}
});
for(const [id,offset] of [['#live-prev',-1],['#live-next',1]]){
 document.querySelector(id).addEventListener('click',()=>{
  enterManualMode();
  const now=liveSlot(new Date()),slot=offset===-1?now.previous:now.next;
  setRace(slot.index);
 });
}
syncControlMode();
updateLiveProgram();setInterval(updateLiveProgram,550);
const daytimeInput=document.querySelector('#daytime');
const daytimeAuto=document.querySelector('#daytime-auto');
const daytimeLabel=document.querySelector('#daytime-label');
const sunlightInput=document.querySelector('#sunlight');
const cloudCover=document.querySelector('#cloud-cover'),fogIntensity=document.querySelector('#fog-intensity');
const cloudCoverLabel=document.querySelector('#cloud-cover-label'),fogIntensityLabel=document.querySelector('#fog-intensity-label');
const sunlightLabel=document.querySelector('#sunlight-label');
const angleInput=document.querySelector('#camera-angle'),heightInput=document.querySelector('#camera-height');
const pitchInput=document.querySelector('#camera-pitch'),
  distanceInput=document.querySelector('#camera-distance'),
  lateralInput=document.querySelector('#camera-lateral');
const angleLabel=document.querySelector('#camera-angle-label'),heightLabel=document.querySelector('#camera-height-label');
const stadiumClock=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function currentStadiumMinutes(){
 const [hour,minute]=stadiumClock.format(new Date()).split(':').map(Number);
 return hour*60+minute;
}
function getSolarMinutes(){return daytimeAuto.checked?currentStadiumMinutes():Number(daytimeInput.value);}
function isSolarNight(){const hour=getSolarMinutes()/60;return hour<6||hour>=19;}
function setWeather(mode){
 const minute=getSolarMinutes(),hour=minute/60;
 if(daytimeAuto.checked)daytimeInput.value=String(minute);
 daytimeLabel.textContent=(daytimeAuto.checked?'AUTO · ':'')+String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
 const lightScale=Number(sunlightInput.value)/100;
 sunlightLabel.textContent=Math.round(lightScale*100)+'%';
 const wet=mode==='rain',solar=Math.max(0,Math.sin((hour-6)/13*Math.PI));
 const night=mode==='night'||(mode!=='noon'&&mode!=='golden'&&solar<.025);
 const illumination=mode==='night'?0:mode==='noon'?1:mode==='golden'?.34:solar;
 const azimuth=(hour-12)/12*Math.PI;
 const elevation=Math.max(-.12,Math.sin((hour-6)/13*Math.PI));
 sunDirection.set(Math.sin(azimuth)*115,120*Math.max(.045,elevation),Math.cos(azimuth)*110).normalize();
 sun.position.copy(sunDirection).multiplyScalar(135).add(sun.target.position);
 sky.material.uniforms.sunPosition.value.copy(sunDirection).multiplyScalar(150);
 sun.intensity=(night?.14:.3+3.7*illumination)*(wet?.55:1)*lightScale;
 renderer.toneMappingExposure=night?.94:wet?1.03:illumination<.35?1.10:1.15;
 sun.color.set(night?'#87a2c5':wet?'#bbccd6':illumination<.35?'#ffba7b':'#fff2d5');
 hemi.intensity=(night?.32:.5+1.6*illumination)*(wet?.77:1)*lightScale;
 sky.visible=!night&&!wet;
 sky.material.uniforms.turbidity.value=wet?12:illumination<.3?7:3.3;
 sky.material.uniforms.rayleigh.value=illumination<.3?3.0:1.7;
 const background=night?'#111a2c':wet?'#8499a5':illumination<.3?'#c17e73':'#8dbfdf';
 scene.background.set(background);
 scene.fog.color.set(night?'#152031':wet?'#899da5':illumination<.3?'#b5a39a':'#b3c9c6');
 const mistScale=Number(fogIntensity.value)/100;
 fogIntensityLabel.textContent=fogIntensity.value+'%';
 cloudCoverLabel.textContent=cloudCover.value+'%';
 scene.fog.density=Math.max(.0004,(wet?.0075:.0036)*mistScale);
 sun.castShadow=!night;
 maneWind=wet?1.6:.55;
 cloudLayer.configure({cover:Math.max(wet?.8:0,Number(cloudCover.value)/100),
   night,rain:wet,sunset:illumination<.38,wind:maneWind});
 for(const horse of horses)horse.model.setWind?.(maneWind);
 rain.visible=wet;
 for(const x of venue.children){if(x.userData?.lamp)x.userData.lamp.intensity=night?85:0;}
 nightLights.configure({night});
 liveDistrict.setEnvironment({hour,type:wet?'rain':night?'night':'clear',wetness:trackFX.wetness});
 liveVillage.setEnvironment({night,wetness:trackFX.wetness});
}
weatherSelect.value='auto';
weatherSelect.addEventListener('change',()=>{setWeather(weatherSelect.value);applyLightingControls();});
for(const el of [daytimeInput,daytimeAuto,sunlightInput,cloudCover,fogIntensity]){
 el.addEventListener('input',()=>{
  if(el===daytimeInput)daytimeAuto.checked=false;
  setWeather(weatherSelect.value);applyLightingControls();
 });
 el.addEventListener('change',()=>{setWeather(weatherSelect.value);applyLightingControls();});
}
setWeather('auto');
setInterval(()=>{if(daytimeAuto.checked)setWeather(weatherSelect.value);},30000);
const trackType=document.querySelector('#surface'),cameraZoom=document.querySelector('#camera-zoom');
const zoomLabel=document.querySelector('#camera-zoom-label');
const wetState=document.querySelector('#wet-state');
let earthBaseColor=earth.color.clone(),earthBaseRough=.96,lastWetUpdate=0;
const roofBase=C.roof.color.clone(),stoneBase=C.concrete.color.clone(),grassBase=grass.color.clone();
const layoutSelect=document.querySelector('#layout');
function setLayout(mode){
 layoutMode=mode;
 trackSplitMarkers.update({layout:mode,splitMode:splitModeSelect.value});
 straightCourse.visible=mode==='straight';
 alternateTracks.select(mode);
 gateKit.root.visible=mode==='straight';
 finishSign.visible=mode==='straight';
 treeGroup.visible=mode!=='oval';
 trackFX.setLayout(mode);
 if(horses.length){setRace(raceIndex);if(liveFollowing){lastLiveIndex=-1;updateLiveProgram();}}
}
layoutSelect.addEventListener('change',()=>setLayout(layoutSelect.value));
function setTrackType(type){
 if(type==='grass'){
  earth.map=grassTexture;earth.bumpMap=grassTexture;earth.bumpScale=.023;earth.color.set('#bfd09f');earth.roughness=.90;
  trackFX.marks.material.color.set('#27451e');
 }else if(type==='synthetic'){
  earth.map=null;earth.bumpMap=null;earth.bumpScale=0;earth.color.set('#a5aaa2');earth.roughness=.66;
  trackFX.marks.material.color.set('#404945');
 }else{
  earth.map=earthTexture;earth.bumpMap=earthTexture;earth.bumpScale=.047;earth.color.set('#f0e2d4');earth.roughness=.96;
  trackFX.marks.material.color.set('#493526');
 }
 proceduralGround?.setSurface(type);
 earthBaseColor=earth.color.clone();earthBaseRough=earth.roughness;
 earth.needsUpdate=true;
}
trackType.addEventListener('change',()=>setTrackType(trackType.value));
setTrackType(trackType.value);
// Quality changes affect ONLY rendering resources. Official time and scoring
// remain bound to the stadium wall clock and immutable price fixture.
const graphicsModeSelect=document.querySelector('#graphics-quality');
const graphicsFpsReadout=document.querySelector('#fps-readout');
// Fixed cinematic mode: FPS is diagnostic only, not a downgrade trigger.
graphicsModeSelect.value='cinematic';
const qualityGovernor=createQualityGovernor({initial:'cinematic',minSamples:50,cooldownMs:18000});
let activeQuality='',lastFpsReadout=-Infinity;
function applyQualityPreset(){
 if(activeQuality==='cinematic')return;
 const p=rendererSettings('cinematic',{devicePixelRatio:window.devicePixelRatio||1});
 renderer.setPixelRatio(p.pixelRatio);
 for(const inst of crowds)inst.count=crowdN;
 dustGeo.setDrawRange(0,dustN);
 rainGeo.setDrawRange(0,rainN);
 if(sun.shadow.mapSize.x!==p.shadowResolution){
  sun.shadow.mapSize.set(p.shadowResolution,p.shadowResolution);
  if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
  sun.shadow.needsUpdate=true;
 }
 activeQuality='cinematic';
 horses.forEach(h=>h.model.setVisualQuality?.('cinematic'));
 liveDistrict.setQuality('cinematic');
 liveVillage.setQuality('cinematic');
 stadiumDensity.setQuality('high');
 graphicsFpsReadout.textContent='CINE · FPS CALCULANDO';
 resize();
}
applyQualityPreset();
// Shared camera deck: the input IDs survive for existing browser tests.
const cameraPanel=bindCameraPanel(document.querySelector('#camera-deck'),{
 onChange:(key)=>{
  if(key==='fov'||key==='reset'){
   camera.fov=Number(cameraZoom.value);camera.updateProjectionMatrix();
  }
  const reading=document.querySelector('#camera-reading');
  reading.textContent='VISTA · '+camSelect.options[camSelect.selectedIndex].textContent;
 }
});
camSelect.addEventListener('change',()=>{
 cameraFocusReady=false;
 document.querySelector('#camera-reading').textContent='VISTA · '+
   camSelect.options[camSelect.selectedIndex].textContent;
});
camera.fov=cameraPanel.get('fov');camera.updateProjectionMatrix();
// Direct manual adjustment is always available from the camera tab.
for(const [id,mode] of [['camera-view-front','grandstand'],
 ['camera-view-top','aerial'],['camera-view-ground','low']]){
 document.getElementById(id).addEventListener('click',()=>{
  camSelect.value=mode;camSelect.dispatchEvent(new Event('change'));
  cameraPanel.restore();
 });
}
let cameraDrag=null;
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0)return;
 cameraDrag={x:event.clientX,y:event.clientY,pointerId:event.pointerId};
 canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
 if(!cameraDrag||cameraDrag.pointerId!==event.pointerId)return;
 const dx=event.clientX-cameraDrag.x,dy=event.clientY-cameraDrag.y;
 cameraDrag.x=event.clientX;cameraDrag.y=event.clientY;
 cameraPanel.nudge('yaw',dx*.32);
 cameraPanel.nudge('pitch',-dy*.27);
});
for(const eventName of ['pointerup','pointercancel','lostpointercapture'])
 canvas.addEventListener(eventName,()=>{cameraDrag=null;});
canvas.addEventListener('wheel',event=>{
 event.preventDefault();
 cameraPanel.nudge(event.ctrlKey?'fov':'distance',Math.sign(event.deltaY)*(event.ctrlKey?2:10));
},{passive:false});

// The lighting console is its own accessible tab. It never touches race data.
const tabRace=document.querySelector('#tab-race'),
 tabLight=document.querySelector('#tab-light'),tabCamera=document.querySelector('#tab-camera');
const panelRace=document.querySelector('#panel-race'),
 panelLight=document.querySelector('#panel-light'),panelCamera=document.querySelector('#panel-camera');
function switchConsole(mode){
 for(const [kind,tab,panel] of [
  ['race',tabRace,panelRace],['light',tabLight,panelLight],['camera',tabCamera,panelCamera]
 ]){
  const active=mode===kind;
  tab.classList.toggle('active',active);
  tab.setAttribute('aria-selected',String(active));
  tab.tabIndex=active?0:-1;
  panel.hidden=!active;
 }
}
tabRace.addEventListener('click',()=>switchConsole('race'));
tabLight.addEventListener('click',()=>switchConsole('light'));
tabCamera.addEventListener('click',()=>switchConsole('camera'));
document.addEventListener('keydown',event=>{
 if(panelCamera.hidden||event.target.closest?.('input,select,textarea'))return;
 const actions={ArrowLeft:['yaw',-5],ArrowRight:['yaw',5],ArrowUp:['pitch',5],
  ArrowDown:['pitch',-5],Equal:['distance',-10],Minus:['distance',10],
  PageUp:['height',5],PageDown:['height',-5]};
 const action=actions[event.code];if(!action)return;
 event.preventDefault();cameraPanel.nudge(...action);
});
const lightPower=document.querySelector('#light-power');
const lightDimmer=document.querySelector('#light-dimmer');
const lightColor=document.querySelector('#light-color');
const lightPattern=document.querySelector('#light-pattern');
const lightSpread=document.querySelector('#light-spread'),lightAmbient=document.querySelector('#light-ambient');
const lightPerimeter=document.querySelector('#light-perimeter');
const spreadLabel=document.querySelector('#light-spread-label'),ambientLabel=document.querySelector('#light-ambient-label');
const lightLevel=document.querySelector('#light-level');
const lightStatus=document.querySelector('#light-status');
function applyLightingControls(){
 const intensity=Number(lightDimmer.value);
 lightLevel.textContent=intensity+'%';
 spreadLabel.textContent=lightSpread.value+'°';ambientLabel.textContent=lightAmbient.value+'%';
 nightLights.configure({
  enabled:lightPower.checked,
  dimmer:intensity/100,
  color:lightColor.value,
  effect:lightPattern.value,
  spread:Number(lightSpread.value),ambient:Number(lightAmbient.value)/100,perimeter:lightPerimeter.checked,
  night:isSolarNight()||weatherSelect.value==='night'
 });
 liveVillage.setEnvironment({
  night:isSolarNight()||weatherSelect.value==='night',
  wetness:trackFX.wetness,
  lightLevel:lightPower.checked?intensity/100:0
 });
 const mode=(isSolarNight()||weatherSelect.value==='night')?'noche':'día';
 lightStatus.textContent=(lightPower.checked?'Reflectores activos':'Reflectores apagados')+
   ' · '+intensity+'% · '+mode+' · '+lightPattern.options[lightPattern.selectedIndex].textContent+
   ' · sin influencia en la clasificación.';
}
for(const input of [lightPower,lightDimmer,lightColor,lightPattern,lightSpread,lightAmbient,lightPerimeter]){
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
const target=new THREE.Vector3(),goal=new THREE.Vector3(),cameraFocus=new THREE.Vector3();
let cameraFocusReady=false;
function adjustCamera(dt){
 const avg=horses.length?horses.reduce((a,h)=>a+Math.min(1.12,h.progress),0)/horses.length:0;
 const point=trackPoint(layoutMode,avg,5.5);
 const tx=point.tangentX,tz=point.tangentZ,nx=point.sideX,nz=point.sideZ;
 // A stabilized, camera-local shadow map follows the peloton instead of
 // allocating 1,536² pixels across the entire 780 m course.
 sun.target.position.set(point.x,0,point.z);
 sun.position.copy(sunDirection).multiplyScalar(135).add(sun.target.position);
 sun.target.updateMatrixWorld();
 const selectedMode=camSelect.value;
 let mode=selectedMode;
 if(selectedMode==='broadcast'){
   // Evaluate the director at most four times per second. The official
   // ranking and time stay untouched; camera choice is visual only.
   const phase=liveFollowing?(lastPhase||PHASES.RACE):
     (elapsed>=60?PHASES.RESULTS:PHASES.RACE);
   if(elapsed-lastDirectorUpdate>=.25||lastDirectorUpdate>elapsed){
     const sorted=horses.map(h=>h.visualMeters||0).sort((a,b)=>b-a);
     const margin=sorted.length>=2?sorted[0]-sorted[1]:100;
     selectedTvShot=tvDirector.frame({
       elapsed,phase,layout:layoutMode,progress:avg,
       leadMarginMeters:margin,overtakes:overtakeCount,
       reduceMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches
     }).shot;
     lastDirectorUpdate=elapsed;
   }
   mode=selectedTvShot;
 }
 if(mode==='paddock'){
   goal.set(point.x+nx*38,12,point.z+nz*38);
   target.set(point.x,2.1,point.z);
 }else if(mode==='aerial'){
   goal.set(0,layoutMode==='oval'?285:300,layoutMode==='oval'?145:155);
   target.set(0,0,layoutMode==='oval'?35:0);
 }else if(mode==='overview'){
   goal.set(85,142,290);target.set(0,4,5);
 }else if(mode==='low'){
   goal.set(point.x-tx*9+nx*11,1.65,point.z-tz*9+nz*11);
   target.set(point.x+tx*18,1.8,point.z+tz*18);
 }else if(mode==='side'){
   goal.set(point.x+nx*24,3.8,point.z+nz*24);
   target.set(point.x+tx*10,2.1,point.z+tz*10);
 }else if(mode==='reverse'){
   goal.set(point.x+tx*30-nx*19,12,point.z+tz*30-nz*19);
   target.set(point.x,2.1,point.z);
 }else if(mode==='startline'){
   const startPoint=trackPoint(layoutMode,0,5.5);
   goal.set(startPoint.x-startPoint.tangentX*21+startPoint.sideX*16,9,
     startPoint.z-startPoint.tangentZ*21+startPoint.sideZ*16);
   target.set(startPoint.x+startPoint.tangentX*18,2.0,
     startPoint.z+startPoint.tangentZ*18);
 }else if(mode==='finish'){
   const finish=trackPoint(layoutMode,1,5.5);
   goal.set(finish.x+finish.sideX*29,7,finish.z+finish.sideZ*29);
   target.set(finish.x-finish.tangentX*18,2,finish.z-finish.tangentZ*18);
 }else if(mode==='drone'){
   goal.set(point.x-tx*34+nx*47,48,point.z-tz*34+nz*47);
   target.set(point.x+tx*18,1.8,point.z+tz*18);
 }else if(mode==='rail'){
   goal.set(point.x-tx*8+nx*14,2.8,point.z-tz*8+nz*14);
   target.set(point.x+tx*11,2,point.z+tz*11);
 }else if(mode==='leader'){
   // Follow the actual leader, but never modify official positions.
   const lead=horses.reduce((best,h)=>!best||h.progress>best.progress?h:best,null);
   const focus=trackPoint(layoutMode,lead?Math.min(1.16,lead.progress):avg,lead?.index??5.5);
   goal.set(focus.x-focus.tangentX*24+focus.sideX*14,5.7,focus.z-focus.tangentZ*24+focus.sideZ*14);
   target.set(focus.x+focus.tangentX*9,2.2,focus.z+focus.tangentZ*9);
 }else if(mode==='pack'){
   goal.set(point.x-tx*52+nx*32,23,point.z-tz*52+nz*32);
   target.set(point.x+tx*8,1.8,point.z+tz*8);
 }else if(mode==='grandstand'){
   goal.set(0,27,-68);
   target.set(point.x,1.7,point.z);
 }else if(mode==='orbit'){
   const angle=elapsed*.09,offset=55;
   goal.set(point.x+Math.cos(angle)*offset,24,point.z+Math.sin(angle)*offset);
   target.set(point.x,2.0,point.z);
 }else{
   goal.set(point.x-tx*8+nx*29,4.2,point.z-tz*8+nz*29);
   target.set(point.x+tx*17,2.05,point.z+tz*17);
 }
 const blend=cameraBlend(dt,mode==='finish'?1.8:2.7);
 const composed=reframeCamera(goal,target,{
  yaw:Number(angleInput.value),pitch:Number(pitchInput.value),
  height:Number(heightInput.value),distance:Number(distanceInput.value),
  lateral:Number(lateralInput.value)
 });
 goal.set(composed.position.x,composed.position.y,composed.position.z);
 target.set(composed.focus.x,composed.focus.y,composed.focus.z);
 // On a throttled renderer or a director cut, catching up gradually can
 // leave the camera showing an empty stretch of track while the pack is far
 // away. Treat large displacements as a TV cut, not a long camera drift.
 if(!cameraFocusReady||camera.position.distanceToSquared(goal)>85*85){
  camera.position.copy(goal);
  cameraFocus.copy(target);
  cameraFocusReady=true;
 }else{
  camera.position.lerp(goal,blend);
  cameraFocus.lerp(target,cameraBlend(dt,3.8));
 }
 camera.lookAt(cameraFocus);
}
function particles(dt){
 if(running&&horses.length){
  const attr=dustGeo.attributes.position;
  for(let i=0;i<dustN;i++){
   const h=horses[i%horses.length],r=seeded(i*13+Math.floor(elapsed*15));
   const direction=trackPoint(layoutMode,h.progress,h.index);
    const trail=1+r()*7,lateral=(r()-.5)*1.3;
    attr.setXYZ(i,h.model.root.position.x-direction.tangentX*trail+direction.sideX*lateral,
      r()*.40,h.model.root.position.z-direction.tangentZ*trail+direction.sideZ*lateral);
  }
  attr.needsUpdate=true;dust.visible=true;
  dust.material.opacity=weatherSelect.value==='rain'?.08:(trackType.value==='grass'?.14:.48);
 }else dust.visible=false;
 if(rain.visible){const attr=rainGeo.attributes.position;for(let i=0;i<rainN;i++){
  let y=attr.getY(i)-dt*25;
  if(y<0)y=29;attr.setY(i,y);
 }attr.needsUpdate=true;}
}
let environmentLast=performance.now();
function updateEnvironment(){
 const now=performance.now(),environmentSeconds=Math.min(2,Math.max(0,(now-environmentLast)/1000));
 environmentLast=now;
  trackFX.update(environmentSeconds,{weather:weatherSelect.value,sun:(isSolarNight()||weatherSelect.value==='night'||weatherSelect.value==='rain')?0:Math.max(0,Math.sin((getSolarMinutes()/60-6)/13*Math.PI))});
  if(now-lastWetUpdate>230){
   lastWetUpdate=now;
   const wet=trackFX.wetness;
   // All stadium surfaces retain accumulated dampness even after rain stops.
   earth.color.copy(earthBaseColor).lerp(new THREE.Color('#34342e'),wet*.49);
   earth.roughness=Math.max(.19,earthBaseRough-wet*.57);
   earth.bumpScale=(trackType.value==='grass'?.023:trackType.value==='synthetic'?0:.047)*(1-wet*.62);
   grass.color.copy(grassBase).lerp(new THREE.Color('#536147'),wet*.41);
   C.roof.color.copy(roofBase).lerp(new THREE.Color('#1c2825'),wet*.38);
   C.roof.roughness=.46-wet*.24;
   C.concrete.color.copy(stoneBase).lerp(new THREE.Color('#333e3d'),wet*.26);
    liveDistrict.setEnvironment({hour:getSolarMinutes()/60,
      type:weatherSelect.value==='rain'?'rain':isSolarNight()?'night':'clear',wetness:wet});
   liveVillage.setEnvironment({
    night:isSolarNight()||weatherSelect.value==='night',wetness:wet,
    lightLevel:lightPower.checked?Number(lightDimmer.value)/100:0
   });
   proceduralGround?.setWetness(wet);
   for(const horse of horses)horse.model.setWetness?.(wet);
   wetState.textContent='Humedad del estadio '+Math.round(wet*100)+'% · '+
     (weatherSelect.value==='rain'?'acumulando agua':wet>.03?'secándose gradualmente':'superficie seca');
  }

}
setInterval(updateEnvironment,180);
let lastRenderedAt=performance.now();
function animate(now,draw=true){
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
     broadcastRunoutDistance({...p,exitVelocity},leaderMeters,elapsed-60):
     broadcastPosition(p,elapsed);
   const meterSpeed=inRunout?coastSpeed(exitVelocity,elapsed-60):
     broadcastSpeed(p,elapsed);
   const pr=dist/leaderMeters;
   h.progress=pr;h.visualMeters=dist;
   const world=trackPoint(layoutMode,pr,i);
   h.model.root.position.set(world.x,0,world.z);h.model.root.rotation.y=world.heading;
   // Bank gently with the actual XZ path curvature; zero lean after the finish.
   const a=trackPoint(layoutMode,Math.min(1,Math.max(0,pr-.001)),i);
   const b=trackPoint(layoutMode,Math.min(1,pr+.001),i);
   const turn=Math.atan2(a.tangentX*b.tangentZ-a.tangentZ*b.tangentX,
     a.tangentX*b.tangentX+a.tangentZ*b.tangentZ);
   h.model.setBank?.(pr>=1?0:Math.max(-.12,Math.min(.12,-turn*2.4)));
   // Slightly faster hoof cadence makes 550 world units in 60s read as a sprint.
   h.visualSpeed=Math.max(.64,Math.min(3.15,1.86*meterSpeed/(leaderMeters/60)));
   // The GLB + eight corrective keyframes now provide the flight and impact;
   // avoid a second oversized global vertical bounce in the scene.
   // Never float the root above the track; footfall kick is applied to the ground.
   h.model.root.position.y=0;
   if(elapsed<60+RUNOUT_SECONDS)trackFX.stamp(h.index,world.x,world.z,h.visualSpeed*7,world.heading);
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
     horses.reduce((total,h)=>total+h.visualSpeed,0)/Math.max(1,horses.length),trackType.value);
   if(Math.floor(elapsed)%5===0&&Math.floor((elapsed-realSeconds))!==Math.floor(elapsed)){
    statContent.textContent='Líder: '+lead.entry.symbol+' · adelantamientos '+overtakeCount+
     ' · dosis '+Math.min(12,slot+1)+'/12 · velocidad de crucero positiva.';
   }
  }
  if(inRunout){
   if(!finished){finished=true;updateStandings();}
   const gate=finishController.update({
     elapsed,distances:horses.map(h=>h.visualMeters),finishDistance:leaderMeters
   });
   const count=gate.crossedCount;
   if(count>previousCrossCount){previousCrossCount=count;finishCrossCount.textContent=count+' / 12';}
   if(!finishShown)finishCelebration.hidden=false;
   if(!finishRoarPlayed){
     finishRoarPlayed=true;
     status.textContent='¡META! · EL PÚBLICO SE PONE DE PIE';
     msg.textContent='Esperamos el cruce del último corredor para mostrar el acta.';
     soundtrack.celebrate?.();
   }
   if(gate.allCrossed&&lastCrossedAt===null)lastCrossedAt=gate.lastCrossAt;
   if(gate.showOfficialResult)showOfficialResult();
   if(gate.overdue)status.textContent='ALERTA: VERIFICAR EL CRUCE DEL ÚLTIMO CABALLO';
   soundtrack.update(elapsed,weatherSelect.value,.65,trackType.value);
   if(elapsed>=60+RUNOUT_SECONDS){
    // Fail closed: never reveal the official overlay based on time alone.
    if(finishController.state.revealed&&!finishShown)showOfficialResult();
    running=false;
    // The animals leave the shot; never leave twelve idle horses on the finish.
    for(const h of horses){h.model.root.visible=false;h.model.play('Idle');}
   }
  }
 }
 // Keep cinematic staging separate from the official distance engine.
 // In presentation/manual-ready, horses wait behind closed doors. During the
 // first 1.2s of a race they rejoin their already-calculated official path.
 if(layoutMode==='straight')applyGateStaging({horses,gate:gateKit,
   phase:running||elapsed>0?'race':'presentation',elapsed,layoutMode,trackPoint,live:running});
 for(const h of horses)h.model.update(dt,running?h.visualSpeed:1);
 if(draw){
  nightLights.update(now/1000);
  cloudLayer.update(now/1000);
  liveVillage.update(now/1000);
  updateFinishBurst();particles(dt);adjustCamera(Math.min(.45,realSeconds));renderer.render(scene,camera);
  const feedback=qualityGovernor.sample(Math.max(1,now-lastRenderedAt),now);
  lastRenderedAt=now;
  // Cinematic quality is locked; no adaptive visual downgrade.
  if(now-lastFpsReadout>900){
   lastFpsReadout=now;
   const fps=Number.isFinite(feedback.fps)?Math.round(feedback.fps):'…';
   graphicsFpsReadout.textContent=fps+' FPS · '+activeQuality.toUpperCase()+
     ' · CINE';
  }
 }
 // Rendering is throttled by the panel to 2Hz, and finish results remain gated.
 splitPanel.update(elapsed,{finishAuthorized:finishShown});
 if(Math.floor(now/200)!==Math.floor((now-dt*1000)/200))updateStandings();
 if(draw)raf=requestAnimationFrame(animate);
}
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();raf=requestAnimationFrame(animate);
// Gameplay ticker is a safety net if an integrated GPU/browser throttles rAF:
// all horses still advance on wall time and the 60-second official result holds.
setInterval(()=>{
 const now=performance.now();
 if(running&&now-last>140)animate(now,false);
},85);
// Opt-in QA seek for deterministic replay verification. Only present with
// ?finish-qa=alpha06 and never changes official prices, doses or ranking.
// Opt-in staging-only diagnostics. Never activates without the query token.
if(new URLSearchParams(location.search).get('camera-qa')==='alpha17'){
 window.__cryptodromoCameraQA=Object.freeze({
  state:()=>({
   position:camera.position.toArray(),lookAt:cameraFocus.toArray(),
   stagePresenting:stage.classList.contains('is-presenting'),
   presentCount:presentCountdown.textContent,
   presentationVisible:!presentation.hidden,
   clock:clockEl.textContent,view:camSelect.value
  }),
  previewPresentation:(seconds=30)=>{
   liveFollowing=false;running=false;
   showPresentation(race,Math.max(0,Math.min(59,Number(seconds)||0)));
   return this;
  },
  resume:()=>{
   presentation.hidden=true;stage.classList.remove('is-presenting');
   liveFollowing=true;lastLiveIndex=-1;updateLiveProgram();
  }
 });
}
if(new URLSearchParams(location.search).get('finish-qa')==='alpha06'){
 window.__cryptodromoQA={
  jumpNearFinish(){if(!running)throw new Error('Start race before seeking');elapsed=59.7;},
  state(){return {elapsed,finished,finishShown,positions:horses.map(h=>h.model.root.position.x),
    crossed:horses.filter(h=>h.visualMeters>=officialRanking(profiles)[0].distanceAt60).length,
    lastCrossedAt,winners:officialSnapshot?.entries?.map(x=>x.symbol)};}
 };
}
window.addEventListener('error',e=>{status.textContent='ERROR EN ESCENA';msg.textContent=e.message;});
window.addEventListener('unhandledrejection',e=>{status.textContent='ERROR EN ESCENA';msg.textContent=String(e.reason);});
bootHorses().catch(e=>{console.error(e);status.textContent='ERROR DE CARGA FIDELITY';msg.textContent=String(e);window.__cryptodromoCinematicReady={engine:'fidelity',quality:'cinematic',count:0,usesPlaceholders:false,error:String(e)};});
