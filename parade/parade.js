import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {trackPoint} from '../visual-lab/trackMath.js?v=alpha16-1';
import {createHorse} from '../race-lab/source/src/horse.js?v=alpha18-gaitmane-1';
import {createLiveStadiumDistrict} from '../visual-lab/stadiumDistrict.js?v=stadium-live-1';
import {createCloudLayer} from '../visual-lab/cloudLayer.js?v=alpha15-2';
import {createParadeController,PARADE_WAVES,WAVES} from './march.js?v=alpha16-1';
import {createDroneRig,droneInputs} from './drone.js?v=alpha17-1';
import {bindCameraPanel} from '../visual-lab/cameraPanel.js?v=alpha17-1';
import {createParadeVillage} from './scenery.js?v=alpha16-2';

const $=id=>document.getElementById(id),canvas=$('parade-canvas'),stage=$('stage');
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<780;
const softwareGPU=/SwiftShader|llvmpipe/i.test(navigator.userAgent);
const scene=new THREE.Scene();
scene.background=new THREE.Color('#8cb7b9');
scene.fog=new THREE.FogExp2('#9ec8c5',.00145);
const renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.07;
renderer.shadowMap.enabled=!mobile&&!softwareGPU;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(48,1,.2,2200);
const sky=new Sky();sky.scale.setScalar(1100);scene.add(sky);
sky.material.uniforms.turbidity.value=3.4;
sky.material.uniforms.rayleigh.value=1.8;
sky.material.uniforms.mieCoefficient.value=.005;
sky.material.uniforms.mieDirectionalG.value=.78;
const clouds=createCloudLayer(scene,{mobile,softwareGPU});
const hemi=new THREE.HemisphereLight('#b2d8ea','#3a4836',1.2);scene.add(hemi);
// Broad moon bounce preserves readable architecture at night while the
// detailed lamps remain emissive meshes. One shadowless directional light.
const moonFill=new THREE.DirectionalLight('#91b8e0',0);
moonFill.position.set(180,130,-80);moonFill.castShadow=false;scene.add(moonFill);
const sun=new THREE.DirectionalLight('#fff1dc',2.3);
sun.position.set(-75,140,70);sun.castShadow=renderer.shadowMap.enabled;
sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-225,right:225,top:165,bottom:-165,near:1,far:430});
sun.shadow.bias=-.00018;sun.shadow.normalBias=.019;
scene.add(sun,sun.target);
const materialGround=new THREE.MeshStandardMaterial({color:'#678c5e',roughness:.98});
const ground=new THREE.Mesh(new THREE.BoxGeometry(1220,.5,780),materialGround);
ground.position.y=-.44;ground.receiveShadow=renderer.shadowMap.enabled;scene.add(ground);
const trackMat=new THREE.MeshStandardMaterial({color:'#9d7958',roughness:.91,side:THREE.DoubleSide});
const railMat=new THREE.MeshStandardMaterial({color:'#dedad0',roughness:.44,metalness:.09});
function ovalTrack(){
 const root=new THREE.Group();root.name='Pista de desfile oval · sin marcador de carrera';scene.add(root);
 const positions=[],uvs=[],idx=[],count=400,width=43;
 for(let i=0;i<=count;i++){
  const point=trackPoint('oval',i/count);
  for(const side of [-1,1]){
   positions.push(point.x+side*point.sideX*width/2,.06,point.z+side*point.sideZ*width/2);
   uvs.push(i/count*28,side===-1?0:1);
  }
  if(i<count){let a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(idx);geometry.computeVertexNormals();
 const surface=new THREE.Mesh(geometry,trackMat);
 surface.receiveShadow=true;root.add(surface);
 for(const offset of [-22,22]){
  const points=Array.from({length:240},(_,i)=>{
   const t=trackPoint('oval',i/240);
   return new THREE.Vector3(t.x+t.sideX*offset,.86,t.z+t.sideZ*offset);
  });
  const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
  const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,360,.13,5,true),railMat);
  rail.castShadow=false;root.add(rail);
 }
 const guideMat=new THREE.LineBasicMaterial({color:'#e2c9a2',transparent:true,opacity:.23});
 for(const lane of [2,4,6,8,10]){
  const points=Array.from({length:240},(_,i)=>{
   const p=trackPoint('oval',i/240,lane);
   return new THREE.Vector3(p.x,.10,p.z);
  });
  const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),guideMat);
  root.add(line);
 }
 const start=trackPoint('oval',0);
 const gate=new THREE.Mesh(new THREE.PlaneGeometry(42,.65),
  new THREE.MeshBasicMaterial({color:'#ede3d5',side:THREE.DoubleSide,depthWrite:false}));
 gate.rotation.x=-Math.PI/2;
 gate.rotation.z=-Math.atan2(start.tangentZ,start.tangentX);
 gate.position.set(start.x,.12,start.z);gate.renderOrder=4;root.add(gate);
 return root;
}
ovalTrack();
const village=createParadeVillage(scene,{quality:'balanced'});
const district=createLiveStadiumDistrict({THREE,scene,stadiumId:'satoshi',quality:'balanced'});
const parade=createParadeController({pace:3.2});
const drone=createDroneRig({x:55,y:95,z:214,yaw:-.17,pitch:-.61,fov:48,speed:32});
const position=new THREE.Vector3(),target=new THREE.Vector3();
const pointerKeys=new Set(),keyboardKeys=new Set(),keys=new Set();
let waveIndex=-1,horseModels=[],isReady=false,selectedWalkClips=[];
let paradeManeWind=.5; // scenic breeze, independent of the Parade clock
Object.defineProperty(window,'__cryptodromoParadeQA',{configurable:false,value:Object.freeze({
 snapshot:()=>({parade:parade.snapshot(),drone:drone.snapshot(),ready:isReady,
  models:horseModels.length,maneEnabled:horseModels.filter(h=>h.maneWindEnabled).length,
  maneWind:paradeManeWind,maneMotion:horseModels.map(h=>h.maneMotion),walkClips:[...selectedWalkClips],village:village.stats,
  cameraPosition:camera.position.toArray(),cameraFov:camera.fov,
  targetCameraPosition:drone.view(cameraInterest).position,
  stage:{w:renderer.domElement.width,h:renderer.domElement.height}})
})});
let cameraInterest={id:'pista',name:'Óvalo y caballos',x:0,y:1,z:72};
const sights=[...village.sights,{id:'acceso',name:'Acceso y boleterías',x:0,y:10,z:-201},
{id:'paddock',name:'Paddock y veterinaria',x:-315,y:3,z:-176},
{id:'broadcast',name:'Centro de transmisión',x:359,y:9,z:-174}];
for(const sight of sights){
 const opt=document.createElement('option');opt.value=sight.id;opt.textContent=sight.name;
 $('sight').append(opt);
}
$('sight').value='pista';
for(let n=0;n<PARADE_WAVES;n++){
 const opt=document.createElement('option');opt.value=String(n);
 opt.textContent='Grupo '+(n+1)+' de '+PARADE_WAVES+' · '+WAVES[n].runners.length+' caballos';
 $('wave').append(opt);
}
function pickClip(clips){
 const find=name=>clips.find(n=>n.toLowerCase()===name.toLowerCase());
 return find('Walk')||clips.find(n=>/\bwalk\b/i.test(n))||
  find('Trot')||clips.find(n=>/\btrot\b/i.test(n))||
  find('Canter')||find('Gallop')||clips[0]||null;
}
function clockMinutes(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
 const [h,m]=parts.split(':').map(Number);return h*60+m;
}
function lighting(){
 const auto=$('daytime-auto').checked,minutes=auto?clockMinutes():Number($('daytime').value);
 if(auto)$('daytime').value=String(minutes);
 const h=minutes/60,mode=$('weather').value;
 const daylight=Math.max(0,Math.sin((h-6)/13*Math.PI));
 const night=mode==='night'||(mode!=='sunset'&&daylight<.05);
 const sunset=mode==='sunset'||daylight<.32;
 const wet=mode==='wet';
 const ambient=Number($('lights').value)/100;
 $('daytime-label').textContent=(auto?'AUTO · ':'')+String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
 $('light-label').textContent=$('lights').value+'%';
 const azimuth=(h-12)/12*Math.PI;
 sun.position.set(Math.sin(azimuth)*130,Math.max(10,145*daylight),Math.cos(azimuth)*120);
 sun.target.position.set(0,0,0);
 sky.material.uniforms.sunPosition.value.copy(sun.position);
 sky.visible=!night;
 sun.color.set(night?'#829eb4':sunset?'#ffbd84':'#fff1da');
 sun.intensity=(night?.05:.35+2.35*daylight)*(wet?.65:1)*ambient;
 sun.castShadow=!night&&renderer.shadowMap.enabled;
 hemi.intensity=(night?.92:.78+daylight*.7)*ambient;
 moonFill.intensity=(night?1.15:.10)*ambient;
 hemi.color.set(night?'#87a3d2':'#c2dce7');
 scene.background.set(night?'#263b50':wet?'#869b9d':sunset?'#b7a18d':'#8db9cb');
 scene.fog.color.set(night?'#334854':wet?'#8e9fa3':sunset?'#b7b2a6':'#a8c8c0');
 scene.fog.density=wet?.0032:.00145;
 trackMat.color.set(wet?'#685c4e':'#9d7958');
 trackMat.roughness=wet?.47:.91;
 renderer.toneMappingExposure=night?1.31:sunset?1.11:1.04;
 village.setEnvironment({night,wetness:wet?1:0,lightLevel:ambient});
 district.setEnvironment({hour:h,type:wet?'rain':night?'night':'clear',wetness:wet?1:0});
 paradeManeWind=wet?1.25:.5;
 clouds.configure({cover:wet?.8:night?.42:.34,night,rain:wet,sunset,wind:paradeManeWind});
 for(const horse of horseModels)horse.setWind?.(paradeManeWind);
}
for(const key of ['weather','daytime','daytime-auto','lights'])
 $(key).addEventListener('input',()=>{
  if(key==='daytime')$('daytime-auto').checked=false;
  lighting();
 });
lighting();setInterval(()=>{if($('daytime-auto').checked)lighting();},30000);
function setQuality(name){
 const q=name==='eco'?{ratio:.65,shadows:512}:name==='cinematic'?{ratio:1.4,shadows:1536}:{ratio:1,shadows:1024};
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q.ratio));
 sun.shadow.mapSize.set(q.shadows,q.shadows);
 if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
 renderer.shadowMap.enabled=name!=='eco'&&!softwareGPU;
 sun.castShadow=renderer.shadowMap.enabled;
 village.setQuality(name);district.setQuality(name);
 resize();
}
$('quality').value=mobile||softwareGPU?'eco':'balanced';
$('quality').addEventListener('change',()=>setQuality($('quality').value));
function resize(){
 const w=Math.max(320,stage.clientWidth),h=Math.max(260,stage.clientHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize,{passive:true});
if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);
setQuality($('quality').value);
function loadWave(state){
 if(state.waveIndex===waveIndex)return;
 waveIndex=state.waveIndex;
 $('wave').value=String(waveIndex);
 $('wave-label').textContent='GRUPO '+(waveIndex+1)+' / '+PARADE_WAVES+
   ' · '+state.wave.runners.length+' CABALLOS';
 $('runner-list').replaceChildren();$('follow-horse').replaceChildren();
 for(let i=0;i<horseModels.length;i++){
  const model=horseModels[i];
  const runner=state.wave.runners[i];
  model.root.visible=Boolean(runner);
  if(!runner)continue;
  model.setAppearance({coat:runner.coat,accent:runner.color,symbol:runner.symbol});
  const badge=document.createElement('span');badge.className='pill-runner';
  const tag=document.createElement('b');tag.textContent=runner.symbol;
  badge.append(tag,document.createTextNode(' · '+runner.name));
  $('runner-list').append(badge);
  const opt=document.createElement('option');opt.value=runner.symbol;
  opt.textContent=runner.symbol+' · '+runner.name;$('follow-horse').append(opt);
 }
}
// Same control binding used by the cinematic LIVE camera panel.
const cameraPanel=bindCameraPanel($('parade-camera-deck'),{
 onChange:(key,value)=>{
  if(key==='reset'){resetDrone();return;}
  const attr={height:'y',yaw:'yaw',pitch:'pitch',fov:'fov',distance:'distance',
   lateral:'lateral',speed:'speed'}[key];
  if(!attr)return;
  drone.setPose({[attr]:key==='yaw'||key==='pitch'?value*Math.PI/180:value});
  syncControls();
 }
});
function syncControls(){
 const p=drone.snapshot();
 cameraPanel.sync({
  height:Math.round(p.y),yaw:Math.round(p.yaw*180/Math.PI),
  pitch:Math.round(p.pitch*180/Math.PI),fov:Math.round(p.fov),
  distance:Math.round(p.distance),speed:Math.round(p.speed),
  lateral:Math.round(p.lateral)
 });
 $('camera-readout').textContent=Math.round(p.y)+' m · '+Math.round(p.fov)+'° · '+p.mode.toUpperCase();
 $('camera-readout-panel').textContent='VISTA · '+$('camera-mode').options[$('camera-mode').selectedIndex].textContent;
}
$('camera-mode').addEventListener('change',()=>{
 const mode=$('camera-mode').value;
 drone.setMode(mode);
 if(mode==='crane')drone.setPose({pitch:-1.08,distance:210,y:115,fov:58,lateral:0});
 syncControls();
});
// Curated architectural establishing shots. They change ONLY camera
// orientation and framing; the user can immediately override them manually.
const shotPresets={
 tribunas:{yaw:0,pitch:-.32,distance:225,fov:51},
 comida:{yaw:0,pitch:-.37,distance:284,fov:55},
 carpas:{yaw:0,pitch:-.36,distance:250,fov:55},
 maquinas:{yaw:-.42,pitch:-.36,distance:165,fov:50},
 insumos:{yaw:-.24,pitch:-.43,distance:145,fov:48},
 pista:{yaw:0,pitch:-.28,distance:220,fov:53},
 acceso:{yaw:0,pitch:-.31,distance:186,fov:49},
 paddock:{yaw:0,pitch:-.38,distance:153,fov:49},
 broadcast:{yaw:0,pitch:-.36,distance:156,fov:49}
};
function flyToSight(){
 cameraInterest=sights.find(s=>s.id===$('sight').value)||sights[0];
 drone.setPose({...shotPresets[cameraInterest.id],mode:'orbit'});
 $('camera-mode').value='orbit';
 syncControls();
}
$('sight').addEventListener('change',flyToSight);
$('visit-sight').addEventListener('click',flyToSight);
function resetDrone(){
 drone.setPose({x:55,y:95,z:214,yaw:-.17,pitch:-.61,fov:48,speed:32,distance:95,lateral:0,mode:'free'});
 $('camera-mode').value='free';$('sight').value='pista';cameraInterest=sights[0];syncControls();
}
$('time-scale').addEventListener('input',()=>{
 parade.setTimeScale(Number($('time-scale').value));
 $('time-scale-label').textContent=$('time-scale').value+'×';
});
$('pause').addEventListener('click',()=>{
 const paused=parade.togglePause();$('pause').textContent=paused?'Reanudar desfile':'Pausar desfile';
});
$('next-wave').addEventListener('click',()=>loadWave(parade.nextWave()));
$('wave').addEventListener('change',()=>loadWave(parade.jumpTo(Number($('wave').value))));
$('reset-parade').addEventListener('click',()=>{
 parade.jumpTo(0);parade.setPaused(false);$('pause').textContent='Pausar desfile';loadWave(parade.snapshot());
});
const interactionKeys=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD',
 'KeyQ','KeyE','KeyR','KeyF','KeyT','KeyG','ShiftLeft','ShiftRight','PageUp','PageDown']);
addEventListener('keydown',event=>{
 if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,button'))return;
 if(interactionKeys.has(event.code)){event.preventDefault();keyboardKeys.add(event.code);}
});
addEventListener('keyup',event=>keyboardKeys.delete(event.code));
addEventListener('blur',()=>{keyboardKeys.clear();pointerKeys.clear();});
const pad=$('drone-pad'),padToggle=$('toggle-camera-pad');
function showCameraPad(visible){
 pad.classList.toggle('is-visible',visible);
 padToggle.setAttribute('aria-pressed',String(visible));
 padToggle.textContent=visible?'Ocultar mandos táctiles':'Mostrar mandos táctiles';
}
showCameraPad(matchMedia('(pointer:coarse)').matches);
padToggle.addEventListener('click',()=>showCameraPad(!pad.classList.contains('is-visible')));
for(const button of document.querySelectorAll('[data-move]')){
 const value=button.dataset.move;
 button.addEventListener('pointerdown',event=>{
  event.preventDefault();button.setPointerCapture(event.pointerId);
  pointerKeys.add(value);button.setAttribute('aria-pressed','true');
 });
 const release=()=>{pointerKeys.delete(value);button.setAttribute('aria-pressed','false');};
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
 button.addEventListener('lostpointercapture',release);
}
// Mouse layout: left = pan/strafe, right = look; touch = look.
const mouseScheme={lookButton:2,panButton:0,sensitivity:.0042,invertY:false};
const mouseDrag={active:false,id:-1,mode:'look',x:0,y:0};
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointerdown',event=>{
 const touch=event.pointerType==='touch';
 if(!touch&&event.button!==mouseScheme.lookButton&&event.button!==mouseScheme.panButton)return;
 mouseDrag.active=true;mouseDrag.id=event.pointerId;
 mouseDrag.mode=touch||event.button===mouseScheme.lookButton?'look':'pan';
 mouseDrag.x=event.clientX;mouseDrag.y=event.clientY;
 canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
 if(!mouseDrag.active||event.pointerId!==mouseDrag.id)return;
 const dx=event.clientX-mouseDrag.x,dy=event.clientY-mouseDrag.y;
 mouseDrag.x=event.clientX;mouseDrag.y=event.clientY;
 if(mouseDrag.mode==='look')drone.nudgeAim(dx*mouseScheme.sensitivity,(mouseScheme.invertY?1:-1)*dy*mouseScheme.sensitivity*.81);
 else {const s=drone.snapshot();drone.setPose({x:s.x-dx*.26*Math.cos(s.yaw),y:s.y+dy*.20,z:s.z-dx*.26*Math.sin(s.yaw)});}
 syncControls();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{
 if(event.pointerId===mouseDrag.id){mouseDrag.active=false;mouseDrag.id=-1}
});
window.crpCameraMouseSettings={
 setLookButton(button){mouseScheme.lookButton=button===0?0:2;mouseScheme.panButton=mouseScheme.lookButton===0?2:0;},
 setSensitivity(value){mouseScheme.sensitivity=Math.max(.001,Math.min(.012,Number(value)||.0042));},
 setInvertY(enabled){mouseScheme.invertY=Boolean(enabled);},
 get(){return {...mouseScheme}}
};
canvas.addEventListener('wheel',event=>{
 event.preventDefault();
 if(event.ctrlKey)drone.zoom(Math.sign(event.deltaY)*2.3);
 else drone.dolly(-Math.sign(event.deltaY)*8);
 syncControls();
},{passive:false});
for(const button of document.querySelectorAll('[data-camera-wheel]')){
 button.addEventListener('click',()=>{
  drone.dolly(Number(button.dataset.cameraWheel)||0);syncControls();
 });
}
addEventListener('keydown',event=>{
 if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,button'))return;
 if(event.code==='Equal'||event.code==='Minus'){
  event.preventDefault();
  drone.dolly(event.code==='Equal'?8:-8);syncControls();
 }
});
syncControls();
function selectFollowTarget(){
 const symbol=$('follow-horse').value;
 const model=horseModels.find(h=>h.userData.paradeSymbol===symbol);
 return model?{x:model.root.position.x,y:2,z:model.root.position.z}:cameraInterest;
}
let last=performance.now(),lastLabel=-Infinity,frames=0,frameSum=0;
const cameraAim=new THREE.Vector3();let droneFocusReady=false;
async function loadModels(){
 try{
  const created=await Promise.all(Array.from({length:12},async (_,i)=>{
   const runner=WAVES[0].runners[i];
   const horse=await createHorse({
    coat:runner?.coat||'#996b54',accent:runner?.color||'#e5c68e',
    symbol:runner?.symbol||'BTC',height:2.7,phase:i*.09,mode:'Walk',maneGait:'Walk'
   });
   horse.setWind?.(paradeManeWind);
   horse.userData={paradeSymbol:runner?.symbol||null};
   const clips=horse.clips||[];
   const clip=pickClip(clips);
   selectedWalkClips[i]=clip;
   if(clip)horse.play(clip,.1);
   if(!clips.some(x=>/walk/i.test(x)))console.warn('Walk not embedded in generated GLB; using',clip);
   scene.add(horse.root);return horse;
  }));
  horseModels=created;isReady=true;
  loadWave(parade.snapshot());
  $('parade-status').textContent='Desfile listo · caminata sin puntuación';
 }catch(error){
  console.error(error);
  $('parade-status').textContent='No se pudo cargar el modelo de caballo: '+error.message;
 }
}
loadModels();
function animate(now){
 requestAnimationFrame(animate);
 const realSeconds=Math.max(0,(now-last)/1000),dt=Math.min(.08,realSeconds);last=now;
 if(!isReady)return;
 const state=parade.update(dt);
 if(state.waveIndex!==waveIndex)loadWave(state);
 for(let i=0;i<horseModels.length;i++){
  const model=horseModels[i],pose=state.horses[i];
  if(!pose){model.root.visible=false;continue;}
  model.root.visible=true;
  const pos=trackPoint('oval',pose.progress,pose.lane);
  model.root.position.set(pos.x,0,pos.z);
  model.root.rotation.y=pos.heading;
  model.setBank?.(0);
  model.userData.paradeSymbol=pose.runner.symbol;
  const animateSpeed=parade.isPaused?0:Math.min(3,pose.speed/3.2*state.timeScale);
  model.update(parade.isPaused?0:dt,animateSpeed);
 }
 const inputs=droneInputs(new Set([...keyboardKeys,...pointerKeys]));
 const followTarget=selectFollowTarget();
 drone.update(dt,inputs,drone.snapshot().mode==='follow'?followTarget:cameraInterest);
 const v=drone.view(drone.snapshot().mode==='follow'?followTarget:cameraInterest);
 position.set(v.position.x,v.position.y,v.position.z);
 target.set(v.lookAt.x,v.lookAt.y,v.lookAt.z);
 const blend=1-Math.exp(-Math.min(.45,realSeconds)*5.5);
 if(!droneFocusReady){camera.position.copy(position);cameraAim.copy(target);droneFocusReady=true;}
 else{camera.position.lerp(position,blend);cameraAim.lerp(target,blend);}
 camera.lookAt(cameraAim);
 if(camera.fov!==v.fov){camera.fov=v.fov;camera.updateProjectionMatrix();}
 const seconds=now/1000;
 village.update(seconds);clouds.update(seconds);
 renderer.render(scene,camera);
 frames++;frameSum+=dt;
 if(now-lastLabel>800){
  lastLabel=now;
  const fraction=state.horses.reduce((sum,h)=>sum+h.lapCompletion,0)/(state.horses.length||1);
  const percent=Math.round(fraction*100);
  $('progress-inner').style.width=percent+'%';
  $('progress').setAttribute('aria-valuenow',String(percent));
  $('wave-progress').textContent='Vuelta '+percent+'% · restan '+Math.ceil(state.remaining/60)+' min de este grupo · '+state.totalParaders+' caballos en '+state.allWaves+' grupos';
  $('fps').textContent=(frameSum?Math.round(frames/frameSum):'…')+' FPS · '+$('quality').value.toUpperCase();
  frames=0;frameSum=0;syncControls();
 }
}
requestAnimationFrame(animate);
