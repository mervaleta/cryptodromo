import * as THREE from 'three';
import './style.css';
import { getRaceFixture, RACES_PER_DAY, FIXTURE_DAYS, RACE_DURATION_SECONDS } from './data/raceFixture.js';

let absoluteRaceIndex = 0;
let currentRace = getRaceFixture(0, 0);
const racers = currentRace.entries;
const surfaceStyles = {
  grass: { track: 0x665d43, field: 0x49683e, rail: 0xe5d4ad, label: 'CÉSPED' },
  dirt: { track: 0x79503a, field: 0x344a31, rail: 0xe6d7bd, label: 'TIERRA' },
  sand: { track: 0xb49a67, field: 0x687347, rail: 0xf0e7ca, label: 'ARENA' },
};

const canvas = document.querySelector('#raceCanvas');
const wrap = document.querySelector('#sceneWrap');
const diagnostics=document.createElement('div');diagnostics.style.cssText='position:absolute;z-index:8;left:12px;bottom:12px;padding:5px 7px;border-radius:3px;background:#04100ddd;color:#45e0a8;font:9px monospace';diagnostics.textContent='INICIANDO THREE.JS';wrap.append(diagnostics);
window.addEventListener('error',e=>{diagnostics.textContent=`ERROR: ${e.message}`;diagnostics.style.color='#ff7b86';});
window.addEventListener('unhandledrejection',e=>{diagnostics.textContent=`ERROR: ${String(e.reason)}`;diagnostics.style.color='#ff7b86';});
let renderer, hasWebGL=true, fallbackCtx=null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); }
catch (error) {
  hasWebGL=false;fallbackCtx=canvas.getContext('2d');
  renderer={shadowMap:{},setPixelRatio(){},setSize(w,h){const dpr=Math.min(window.devicePixelRatio||1,1.75);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);},render(){},info:{render:{calls:0}}};
  diagnostics.textContent='VISTA 2D DE COMPATIBILIDAD · WEBGL NO DISPONIBLE';diagnostics.style.color='#ffcd7a';
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-18,18,9,-9,0.1,180);
camera.position.set(-7, 0, 34);
camera.lookAt(-7, 0, 0);
scene.fog = new THREE.Fog(0x9bb2ac, 43, 112);

const hemi = new THREE.HemisphereLight(0xd9efff, 0x3c4b32, 1.55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe3b5, 2.1); sun.position.set(-8,18,18); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-55; sun.shadow.camera.right=55; sun.shadow.camera.top=30; sun.shadow.camera.bottom=-30; scene.add(sun);
const fill = new THREE.DirectionalLight(0x8bb6c2, .42); fill.position.set(15,10,-20); scene.add(fill);

const skyMaterial = new THREE.ShaderMaterial({uniforms:{topColor:{value:new THREE.Color(0x5a91a7)},horizonColor:{value:new THREE.Color(0xc6b99c)}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 topColor;uniform vec3 horizonColor;varying vec2 vUv;void main(){vec3 c=mix(horizonColor,topColor,smoothstep(0.02,0.98,vUv.y));gl_FragColor=vec4(c,1.0);}',depthWrite:false,depthTest:false});
const skyPlane=new THREE.Mesh(new THREE.PlaneGeometry(170,42),skyMaterial);skyPlane.position.set(0,8,-40);skyPlane.renderOrder=-10;scene.add(skyPlane);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(160,18), new THREE.MeshStandardMaterial({color:0x49663f,roughness:1}));
ground.position.set(0,-15,-8);ground.receiveShadow=true;scene.add(ground);
const track = new THREE.Mesh(new THREE.PlaneGeometry(150,12), new THREE.MeshStandardMaterial({color:surfaceStyles.grass.track,roughness:1}));
track.position.set(0,0,0);track.receiveShadow=true;scene.add(track);
const laneMat = new THREE.MeshStandardMaterial({color:0xe7d7af,roughness:.9});
for(let i=0;i<=12;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(150,.025,.025),laneMat);line.position.set(0,-5.5+i*(11/12),.13);scene.add(line);}
const railMat=new THREE.MeshStandardMaterial({color:0xe7dcc5,roughness:.7});
for(const y of [-6.25,6.25]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(150,.12,.12),railMat);rail.position.set(0,y,.42);rail.castShadow=true;scene.add(rail);
  const lower=new THREE.Mesh(new THREE.BoxGeometry(150,.09,.1),railMat);lower.position.set(0,y+(y<0?.34:-.34),.42);scene.add(lower);
}
const postGeo=new THREE.BoxGeometry(.12,.82,.13),postInstances=new THREE.InstancedMesh(postGeo,railMat,76),postMatrix=new THREE.Matrix4();let postIndex=0;
for(const y of [-6.25,6.25])for(let x=-72;x<=72;x+=4){postMatrix.makeTranslation(x,y,.42);postInstances.setMatrixAt(postIndex++,postMatrix);}
postInstances.castShadow=true;scene.add(postInstances);

function makeCanvasTexture(text, color){
  const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');
  ctx.fillStyle='#08120e';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.fillRect(0,0,9,c.height);
  ctx.font='800 56px Inter,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4faf6';ctx.fillText(text,c.width/2+4,c.height/2+2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function link(parent, a, b, radius, material, radial=8){
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va),mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.82,radius,delta.length(),radial),material);
  mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;
}
function makeLeg(horse,x,z,coat,phase){
  const pivot=new THREE.Group();pivot.position.set(x,.86,z);horse.add(pivot);
  link(pivot,[0,0,0],[-.02,-.72,0],.072,coat,6);
  const hoof=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.15),new THREE.MeshStandardMaterial({color:0x221e1b,roughness:.8}));hoof.position.set(.03,-.75,0);hoof.castShadow=true;pivot.add(hoof);
  return {pivot,phase};
}
function makeHorse(racer,index){
  const root=new THREE.Group();scene.add(root);
  const coat=new THREE.MeshStandardMaterial({color:racer.coat,roughness:.72});
  const coatLight=new THREE.MeshStandardMaterial({color:new THREE.Color(racer.coat).multiplyScalar(1.13),roughness:.7});
  const dark=new THREE.MeshStandardMaterial({color:0x241e1c,roughness:.9});
  const cloth=new THREE.MeshStandardMaterial({color:racer.color,roughness:.55,metalness:.08});
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),coat);body.scale.set(.83,.42,.31);body.position.set(-.04,1.18,0);body.castShadow=true;root.add(body);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),coatLight);chest.scale.set(.31,.42,.32);chest.position.set(.53,1.23,0);chest.castShadow=true;root.add(chest);
  link(root,[.42,1.36,0],[.72,1.99,0],.19,coatLight,10);
  const head=new THREE.Mesh(new THREE.SphereGeometry(1,14,12),coatLight);head.scale.set(.31,.24,.22);head.rotation.z=.22;head.position.set(.83,2.02,0);head.castShadow=true;root.add(head);
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({color:0x9b7460,roughness:.8}));muzzle.scale.set(.17,.12,.16);muzzle.position.set(1.06,1.9,0);root.add(muzzle);
  for(const z of [-.12,.12]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),dark);eye.position.set(.91,2.09,z);root.add(eye);const ear=new THREE.Mesh(new THREE.ConeGeometry(.065,.24,6),coat);ear.position.set(.74,2.27,z*.7);ear.rotation.z=-.16;root.add(ear);}
  // Mane is a row of small, individually reusable geometry pieces.
  for(let i=0;i<4;i++){const mane=new THREE.Mesh(new THREE.ConeGeometry(.13,.32,5),dark);mane.position.set(.39+i*.13,2.03-i*.09,(i%2?-.08:.08));mane.rotation.z=-.8;mane.castShadow=true;root.add(mane);}
  const saddle=new THREE.Mesh(new THREE.BoxGeometry(.45,.11,.43),cloth);saddle.position.set(-.05,1.6,0);saddle.castShadow=true;root.add(saddle);
  const saddlePad=new THREE.Mesh(new THREE.BoxGeometry(.6,.06,.48),new THREE.MeshStandardMaterial({color:0xf1e8d5,roughness:.85}));saddlePad.position.set(-.08,1.51,0);root.add(saddlePad);
  for(let i=0;i<2;i++){const tail=link(root,[-.77-i*.13,1.36-i*.12,0],[-1.03-i*.13,1.3-i*.12,0],.11-i*.025,dark,6);tail.castShadow=true;}
  const legs=[makeLeg(root,-.49,.2,racer.coat,0),makeLeg(root,-.49,-.2,racer.coat,Math.PI),makeLeg(root,.48,.2,racer.coat,Math.PI),makeLeg(root,.48,-.2,racer.coat,0)];
  const badge=new THREE.Mesh(new THREE.PlaneGeometry(.82,.35),new THREE.MeshBasicMaterial({map:makeCanvasTexture(racer.symbol,racer.color),transparent:false,side:THREE.DoubleSide}));badge.position.set(-.1,2.55,0);badge.rotation.x=-.35;root.add(badge);
  return {root,legs,racer,index,progress:0,position:0,base:0,delta:0,coat,coatLight,cloth,badge,latestMove:0};
}
let horses=racers.map(makeHorse);
horses.forEach((h,i)=>{h.laneY=5.35-i*.97;h.root.scale.y=.38;h.root.position.set(-14,h.laneY,.52);h.base=.111;});

// Finish gate and modular grandstand blocks.
const gateMat=new THREE.MeshStandardMaterial({color:0xf0e9d5,roughness:.6});
for(const x of [39,43]){const post=new THREE.Mesh(new THREE.BoxGeometry(.23,13,.35),gateMat);post.position.set(x,0,.55);post.castShadow=true;scene.add(post);}
const lintel=new THREE.Mesh(new THREE.BoxGeometry(4.3,.3,.6),new THREE.MeshStandardMaterial({color:0x0b1812,roughness:.6}));lintel.position.set(41,6.45,.55);scene.add(lintel);
const finishCanvas=document.createElement('canvas');finishCanvas.width=512;finishCanvas.height=128;const fctx=finishCanvas.getContext('2d');fctx.fillStyle='#092216';fctx.fillRect(0,0,512,128);fctx.fillStyle='#1bce91';fctx.font='900 66px Arial';fctx.textAlign='center';fctx.textBaseline='middle';fctx.fillText('FINISH',256,66);const finishTex=new THREE.CanvasTexture(finishCanvas);finishTex.colorSpace=THREE.SRGBColorSpace;
const finishSign=new THREE.Mesh(new THREE.PlaneGeometry(4.1,1),new THREE.MeshBasicMaterial({map:finishTex,side:THREE.DoubleSide}));finishSign.position.set(41,7.1,.72);scene.add(finishSign);
const finishLine=new THREE.Mesh(new THREE.PlaneGeometry(.6,12),new THREE.MeshStandardMaterial({color:0xf6efe2,roughness:.9}));finishLine.position.set(40.7,0,.21);scene.add(finishLine);
const stand=new THREE.Group();scene.add(stand);
for(let row=0;row<5;row++){
  const box=new THREE.Mesh(new THREE.BoxGeometry(35,.7,1.2),new THREE.MeshStandardMaterial({color:[0x252e2d,0x36403b,0x41433a][row%3],roughness:.92}));box.position.set(0,7.5+row*.52,-12-row*.2);box.castShadow=true;box.receiveShadow=true;stand.add(box);
}
const crowdGeo=new THREE.SphereGeometry(.12,5,4),crowdMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),crowdInstances=new THREE.InstancedMesh(crowdGeo,crowdMat,240),crowdMatrix=new THREE.Matrix4(),crowdColor=new THREE.Color();const crowdPalette=[0xf0b76f,0xe7e3d7,0x88bab1,0xa6a1d8,0xd07162];let crowdIndex=0;
for(let row=0;row<5;row++)for(let i=0;i<48;i++){crowdMatrix.makeScale(1,1,1);crowdMatrix.setPosition(-16.5+i*.7,7.9+row*.52,-12-row*.2);crowdInstances.setMatrixAt(crowdIndex,crowdMatrix);crowdInstances.setColorAt(crowdIndex,crowdColor.setHex(crowdPalette[(i*3+row)%5]));crowdIndex++;}crowdInstances.instanceMatrix.needsUpdate=true;stand.add(crowdInstances);
const cloudGroup=new THREE.Group();scene.add(cloudGroup);const cloudMat=new THREE.MeshStandardMaterial({color:0xf3f6f4,roughness:1,transparent:true,opacity:.88});
for(let i=0;i<12;i++){const cloud=new THREE.Group();const cx=(i%4)*14-20,cy=11+Math.floor(i/4)*2,cz=-24-(i%3)*4;for(let j=0;j<5;j++){const puff=new THREE.Mesh(new THREE.SphereGeometry(1,9,7),cloudMat.clone());puff.scale.set(2.2+(j%2)*.4,1+(j%3)*.15,1);puff.position.set((j-2)*1.6,(j%2)*.4,0);cloud.add(puff);}cloud.position.set(cx,cy,cz);cloudGroup.add(cloud);}
const weatherCount=1000;const weatherPositions=new Float32Array(weatherCount*3);const weatherVelocities=[];for(let i=0;i<weatherCount;i++){weatherPositions[i*3]=(Math.random()-.5)*80;weatherPositions[i*3+1]=Math.random()*30;weatherPositions[i*3+2]=(Math.random()-.5)*32;weatherVelocities.push(.08+Math.random()*.16);}
const weatherGeo=new THREE.BufferGeometry();weatherGeo.setAttribute('position',new THREE.BufferAttribute(weatherPositions,3));const weatherMat=new THREE.PointsMaterial({color:0xd7f4ff,size:.12,transparent:true,opacity:.75,sizeAttenuation:true});const weatherParticles=new THREE.Points(weatherGeo,weatherMat);weatherParticles.visible=false;scene.add(weatherParticles);

let running=false,finished=false,elapsed=0,raceTime=0,lastTick=-1,marketInput=0,cloudAmount=.32,wind=12,weather='clear',surface='grass',clockTimer=0,soundOn=false;
const callout=document.querySelector('#callout');const startButton=document.querySelector('#startButton');const standingList=document.querySelector('#standings');
function buildStandings(){standingList.innerHTML='';horses.forEach((h,i)=>{const li=document.createElement('li');li.className='runner-row';li.dataset.index=i;li.innerHTML=`<span class="runner-rank">${String(i+1).padStart(2,'0')}</span><span class="runner-identity"><i class="runner-token" style="background:${h.racer.color}">${h.racer.symbol.slice(0,1)}</i><span class="runner-name">${h.racer.name}</span><span class="runner-symbol">${h.racer.symbol}</span></span><span class="runner-change">+0.00%</span>`;standingList.append(li);});}
buildStandings();
function updateOrder(){const ordered=[...horses].sort((a,b)=>b.progress-a.progress);ordered.forEach((h,pos)=>{const row=standingList.querySelector(`[data-index="${h.index}"]`);if(!row)return;row.querySelector('.runner-rank').textContent=String(pos+1).padStart(2,'0');const val=h.latestMove;const out=row.querySelector('.runner-change');out.textContent=`${val>=0?'+':''}${val.toFixed(2)}%`;out.classList.toggle('down',val<0);standingList.append(row);});}
function updateRaceHeader(){
  const hour=Math.floor(currentRace.minute/60),minute=currentRace.minute%60;
  document.querySelector('#raceInfo').textContent=`CARRERA ${String(currentRace.number).padStart(3,'0')} / ${RACES_PER_DAY} · ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} UTC · 12 PARTICIPANTES`;
  document.querySelector('#raceStatus').textContent=`DÍA ${currentRace.day} · FIXTURE SINTÉTICO`;
  document.querySelector('#startButton').innerHTML=`<span>▶</span> INICIAR CARRERA ${String(currentRace.number).padStart(3,'0')}`;
}
function loadRace(index){
  absoluteRaceIndex=((index%(RACES_PER_DAY*FIXTURE_DAYS))+(RACES_PER_DAY*FIXTURE_DAYS))%(RACES_PER_DAY*FIXTURE_DAYS);
  currentRace=getRaceFixture(absoluteRaceIndex%RACES_PER_DAY,Math.floor(absoluteRaceIndex/RACES_PER_DAY));
  currentRace.entries.forEach((entry,i)=>{
    const horse=horses[i];
    horse.racer=entry;horse.progress=0;horse.delta=0;horse.latestMove=0;horse.input1=entry.input1;horse.input2=entry.input2;
    horse.coefficients1=entry.coefficients1;horse.coefficients2=entry.coefficients2;
    horse.coat.color.set(entry.coat);horse.coatLight.color.set(entry.coat).multiplyScalar(1.13);horse.cloth.color.set(entry.color);
    const oldTexture=horse.badge.material.map;horse.badge.material.map=makeCanvasTexture(entry.symbol,entry.color);horse.badge.material.needsUpdate=true;oldTexture?.dispose();
    horse.root.position.x=-14;horse.base=.111;
  });
  buildStandings();updateRaceHeader();updateOrder();
}
function resetRace(show=true){running=false;finished=false;elapsed=0;lastTick=-1;document.querySelector('#raceClock').textContent='00:00';document.querySelector('#progressFill').style.width='0%';startButton.innerHTML=`<span>▶</span> INICIAR CARRERA ${String(currentRace.number).padStart(3,'0')}`;horses.forEach((h)=>{h.progress=0;h.delta=0;h.latestMove=0;h.root.position.x=-14;h.base=.111;});updateOrder();if(show)flash('¡A SUS MARCAS!');}
function flash(text){callout.textContent=text;callout.classList.add('visible');window.clearTimeout(flash.timer);flash.timer=window.setTimeout(()=>callout.classList.remove('visible'),1650);}
function setRunning(value){running=value;startButton.innerHTML=running?'<span>Ⅱ</span> PAUSAR CARRERA':'<span>▶</span> CONTINUAR CARRERA';if(running)flash(elapsed===0?'¡LARGADA!':'CARRERA EN MARCHA');}
startButton.addEventListener('click',()=>{if(finished){loadRace(absoluteRaceIndex+1);resetRace(false);setRunning(true);}else setRunning(!running);});
document.querySelector('#resetRace').addEventListener('click',()=>resetRace());
document.querySelector('#marketMove').addEventListener('input',e=>{marketInput=Number(e.target.value)/1000;const label=document.querySelector('#moveValue');label.textContent=`${marketInput>=0?'+':''}${(marketInput*100).toFixed(1)}%`;label.style.color=marketInput<0?'#ff7580':'#1ce1a2';document.querySelector('#marketMessage').textContent=marketInput>.003?'Refuerzo alcista':marketInput<-.003?'Refuerzo bajista':'Usando fixture base';});
updateRaceHeader();

function timeColors(value){const hour=value/6;const stops=[{h:0,sky:0x07101d,sun:0x7a90d1,intensity:.3},{h:5,sky:0x382a4e,sun:0xf68a62,intensity:.72},{h:7,sky:0x86a9c0,sun:0xffd6a0,intensity:1.45},{h:12,sky:0x74b5d3,sun:0xfff3d4,intensity:2.15},{h:17,sky:0xe18463,sun:0xffac67,intensity:1.35},{h:20,sky:0x252e55,sun:0xc28ca7,intensity:.65},{h:24,sky:0x07101d,sun:0x7a90d1,intensity:.3}];let a=stops[0],b=stops[1];for(let i=0;i<stops.length-1;i++)if(hour>=stops[i].h&&hour<=stops[i+1].h){a=stops[i];b=stops[i+1];break;}const t=THREE.MathUtils.clamp((hour-a.h)/(b.h-a.h),0,1);return{sky:new THREE.Color(a.sky).lerp(new THREE.Color(b.sky),t),sun:new THREE.Color(a.sun).lerp(new THREE.Color(b.sun),t),intensity:THREE.MathUtils.lerp(a.intensity,b.intensity,t)};}
function duskColor(hour){if(hour<5||hour>=20)return 0x657397;if((hour>=5&&hour<8)||(hour>=16&&hour<20))return 0xe9a37a;return 0xd8e5dd;}
function updateEnvironment(){const time=Number(document.querySelector('#timeOfDay').value),hour=Math.floor(time/6),minute=(time%6)*10;document.querySelector('#timeReadout').textContent=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;cloudAmount=Number(document.querySelector('#clouds').value)/100;document.querySelector('#cloudReadout').textContent=`${Math.round(cloudAmount*100)}%`;wind=Number(document.querySelector('#wind').value);document.querySelector('#windReadout').textContent=`${wind} km/h`;weather=document.querySelector('#weather').value;surface=document.querySelector('#surface').value;const colors=timeColors(time);scene.background=colors.sky;skyMaterial.uniforms.topColor.value.copy(colors.sky.clone().multiplyScalar(.77));skyMaterial.uniforms.horizonColor.value.copy(colors.sky.clone().lerp(new THREE.Color(duskColor(hour)),.36));scene.fog.color.copy(colors.sky);sun.color.copy(colors.sun);sun.intensity=colors.intensity*(weather==='storm'?.58:weather==='cloudy'?.77:weather==='rain'?.83:1);hemi.intensity=weather==='fog'?1.05:1.5;cloudGroup.visible=weather==='cloudy'||weather==='storm'||weather==='rain'||cloudAmount>.13;cloudGroup.children.forEach((c,i)=>{const n=(i*17%31)/31;const alpha=weather==='storm'?.84:weather==='rain'?.64:THREE.MathUtils.clamp((cloudAmount-n)*2.3,0,.85);c.visible=alpha>.03;c.scale.setScalar(.7+alpha*.7);c.children.forEach(p=>{p.material.opacity=alpha;});});weatherParticles.visible=['rain','storm','snow'].includes(weather);weatherMat.color.set(weather==='snow'?0xffffff:0xbcdced);weatherMat.size=weather==='snow'?.2:.1;weatherMat.opacity=weather==='storm'?.9:.7;weatherParticles.material=weatherMat;weatherParticles.userData.kind=weather;track.material.color.set(surfaceStyles[surface].track);ground.material.color.set(surfaceStyles[surface].field);document.querySelector('#weatherLabel').textContent=`${surfaceStyles[surface].label} · ${weather==='clear'?'DESPEJADO':weather==='cloudy'?'NUBLADO':weather==='rain'?'LLUVIA':weather==='storm'?'TORMENTA':weather==='snow'?'NIEVE':'NEBLINA'}`;if(weather==='fog'){scene.fog.near=10;scene.fog.far=60;}else if(weather==='storm'){scene.fog.near=40;scene.fog.far=110;}else{scene.fog.near=43;scene.fog.far=112;}}
document.querySelectorAll('#timeOfDay,#clouds,#wind,#weather,#surface').forEach(el=>el.addEventListener('input',updateEnvironment));document.querySelectorAll('#weather,#surface').forEach(el=>el.addEventListener('change',updateEnvironment));
document.querySelector('#resetEnvironment').addEventListener('click',()=>{document.querySelector('#timeOfDay').value=105;document.querySelector('#clouds').value=32;document.querySelector('#wind').value=12;document.querySelector('#weather').value='clear';document.querySelector('#surface').value='grass';updateEnvironment();});
updateEnvironment();
document.querySelector('#fullscreen').addEventListener('click',()=>{if(!document.fullscreenElement)wrap.requestFullscreen?.();else document.exitFullscreen?.();});document.querySelector('#soundToggle').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.style.color=soundOn?'#25d69a':'';e.currentTarget.title=soundOn?'Audio ambiente activado (demo visual)':'Silenciar / activar audio';});

function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h;const viewH=24;camera.left=-viewH*aspect/2;camera.right=viewH*aspect/2;camera.top=viewH/2;camera.bottom=-viewH/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(wrap);resize();
const clock=new THREE.Clock();
function drawFallback(t){
  if(!fallbackCtx)return;const dpr=Math.min(window.devicePixelRatio||1,1.75),w=wrap.clientWidth,h=wrap.clientHeight,ctx=fallbackCtx;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const tm=Number(document.querySelector('#timeOfDay').value)/6;
  const night=tm<5||tm>20;const dusk=(tm>=16&&tm<=20)||(tm>=4&&tm<7);
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,night?'#101c38':dusk?'#c77d69':'#5d9fc0');sky.addColorStop(.53,night?'#354363':dusk?'#e8b07e':'#c8d7cb');sky.addColorStop(.56,surfaceStyles[surface].field.toString(16).padStart(6,'0').replace(/^/,'#'));ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  // Low-poly cloud bank and distant hills are generated with canvas paths.
  ctx.globalAlpha=.18+cloudAmount*.62;ctx.fillStyle=night?'#cbd9ec':'#f6f5eb';
  for(let i=0;i<7;i++){const x=((i*187-t*7*(.2+wind/80))%(w+260)+w+260)%(w+260)-120,y=h*(.14+(i%3)*.08);ctx.beginPath();ctx.ellipse(x,y,54+(i%4)*17,12+(i%3)*5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+35,y-8,36,17,0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  const horizon=h*.43;ctx.fillStyle=night?'#26353c':'#607454';ctx.beginPath();ctx.moveTo(0,horizon+25);for(let x=0;x<=w+30;x+=30)ctx.lineTo(x,horizon+8+Math.sin(x*.024)*20+Math.cos(x*.011)*14);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
  // Grandstand, crowd, track, lane markings, rails and finish line.
  const standY=h*.27;for(let r=0;r<4;r++){ctx.fillStyle=['#313e39','#445047','#38443e','#4c5145'][r];ctx.fillRect(w*.19,standY+r*11,w*.65,10);for(let i=0;i<42;i++){ctx.fillStyle=['#eeb878','#d9e2d8','#7fb8ab','#c78484','#b3acd9'][(i+r*3)%5];ctx.fillRect(w*.2+i*w*.015,standY+r*11+2,3,5);}}
  const trackTop=h*.42,trackBottom=h*.97;ctx.fillStyle=surfaceStyles[surface].track.toString(16).padStart(6,'0').replace(/^/,'#');ctx.fillRect(0,trackTop,w,trackBottom-trackTop);ctx.fillStyle=surfaceStyles[surface].field.toString(16).padStart(6,'0').replace(/^/,'#');ctx.fillRect(0,trackBottom,w,h-trackBottom);
  const cameraX=Math.max(-1,Math.min(22,horses.reduce((a,b)=>a+b.root.position.x,0)/horses.length+7));const scale=w/34;const toX=(world)=>w/2+(world-cameraX)*scale;
  ctx.strokeStyle='#eadfca99';ctx.lineWidth=1;for(let i=0;i<=12;i++){const y=trackTop+7+i*(trackBottom-trackTop)/13;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.fillStyle='#eee5d5';ctx.fillRect(0,trackTop-7,w,3);ctx.fillRect(0,trackTop-12,w,2);
  const finishX=toX(40.7);ctx.fillStyle='#eee8d9';ctx.fillRect(finishX-4,trackTop,8,trackBottom-trackTop);ctx.fillStyle='#0a1d14';ctx.fillRect(finishX-41,trackTop-45,82,22);ctx.fillStyle='#31d6a0';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillText('FINISH',finishX,trackTop-29);
  const laneH=(trackBottom-trackTop)/13;
  horses.forEach((horse,i)=>{
    const x=toX(horse.root.position.x),y=trackTop+laneH*(i+.5),s=Math.max(.28,Math.min(.58,laneH/37)),gallop=t*11+i*1.7;
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    // Modular, articulated vector horse fallback. The deployed WebGL path uses Three.js meshes.
    ctx.fillStyle=horse.racer.coat;ctx.beginPath();ctx.ellipse(-3,0,24,8,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(10,-4);ctx.lineTo(19,-14);ctx.lineTo(27,-17);ctx.lineTo(29,-12);ctx.lineTo(21,-7);ctx.lineTo(14,2);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.ellipse(29,-15,7,4,-.1,0,Math.PI*2);ctx.fill();ctx.fillStyle='#211d19';ctx.beginPath();ctx.moveTo(-25,-1);ctx.quadraticCurveTo(-35,Math.sin(gallop)*5,-34,11);ctx.lineWidth=3;ctx.strokeStyle=horse.racer.coat;ctx.stroke();
    ctx.strokeStyle=horse.racer.coat;ctx.lineWidth=3.3;for(let leg=0;leg<4;leg++){const lx=leg<2?-14:10,lz=(leg%2)*2,ang=Math.sin(gallop+(leg%2)*Math.PI+(leg<2?0:Math.PI))*.58;ctx.beginPath();ctx.moveTo(lx,lz+3);ctx.lineTo(lx+Math.sin(ang)*10,14+Math.cos(ang)*3);ctx.lineTo(lx+Math.sin(ang)*16,21+Math.cos(ang)*2);ctx.stroke();}
    ctx.fillStyle=horse.racer.color;ctx.fillRect(-6,-10,15,5);ctx.fillStyle='#eff7f1';ctx.font='bold 6px Arial';ctx.textAlign='center';ctx.fillText(horse.racer.symbol,1,-19);
    ctx.restore();
  });
  if(['rain','storm','snow'].includes(weather)){const count=weather==='snow'?70:120;ctx.globalAlpha=.62;ctx.strokeStyle=weather==='snow'?'#fff':'#bfdde7';ctx.fillStyle='#fff';for(let i=0;i<count;i++){const x=(i*83+t*(weather==='snow'?3:25)*(1+wind/30))%w,y=(i*47+t*(weather==='snow'?14:38))%h;if(weather==='snow'){ctx.beginPath();ctx.arc(x,y,1.3,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+9);ctx.stroke();}}ctx.globalAlpha=1;}
  if(weather==='fog'){ctx.fillStyle='#d8e1de44';ctx.fillRect(0,h*.35,w,h*.65);}
}
function animate(){
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(running){
    elapsed+=dt;
    const sampleStep=Math.min(11,Math.floor(elapsed/5));
    if(sampleStep!==lastTick){
      lastTick=sampleStep;
      horses.forEach(h=>{
        const lateInput=sampleStep>=9;
        const priceMove=lateInput?h.input2:h.input1;
        const coefficient=lateInput?h.coefficients2[sampleStep-9]:h.coefficients1[sampleStep];
        h.latestMove=priceMove+marketInput*100;
        h.delta=THREE.MathUtils.clamp((priceMove/100+marketInput)*coefficient*8,-4.8,4.8);
      });
      updateOrder();
    }
    horses.forEach(h=>{const priceFactor=1+h.delta*.08;h.progress=Math.min(1,h.progress+h.base*priceFactor*dt*.15);});
    const avg=horses.reduce((s,h)=>s+h.progress,0)/horses.length;
    document.querySelector('#progressFill').style.width=`${avg*100}%`;
    document.querySelector('#raceClock').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;
    if(elapsed>=RACE_DURATION_SECONDS){
      const leaderProgress=Math.max(...horses.map(h=>h.progress),.001);
      horses.forEach(h=>{h.progress=Math.min(1,h.progress/leaderProgress);});
      running=false;finished=true;document.querySelector('#raceStatus').textContent='FINALIZADA';startButton.innerHTML='<span>↺</span> SIGUIENTE CARRERA';updateOrder();
      flash(`¡${horses.slice().sort((a,b)=>b.progress-a.progress)[0].racer.symbol} GANA!`);
    }
  }
  let mean=0;horses.forEach(h=>{const phase=t*10+h.index*.62;const travel=-14+h.progress*54.7;mean+=travel;h.root.position.x=travel;h.root.position.y=h.laneY+Math.max(0,Math.sin(phase*2)*.028);h.legs.forEach(leg=>{const cyc=phase+leg.phase;leg.pivot.rotation.z=Math.sin(cyc)*.58;});});mean/=horses.length;
  camera.position.x=THREE.MathUtils.lerp(camera.position.x,Math.max(-7,Math.min(22,mean+7)),dt*.7);camera.lookAt(camera.position.x,0,0);
  cloudGroup.position.x-=wind*dt*.003;if(cloudGroup.position.x<-18)cloudGroup.position.x=12;
  if(weatherParticles.visible){const pos=weatherGeo.attributes.position;for(let i=0;i<weatherCount;i++){let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const kind=weatherParticles.userData.kind;if(kind==='snow'){y-=weatherVelocities[i]*dt*7;x+=Math.sin(t+i)*dt*.35;}else{y-=weatherVelocities[i]*dt*(kind==='storm'?31:22);x-=dt*(2+wind*.12);}if(y<-.2){y=22+Math.random()*8;x=(Math.random()-.5)*80;}if(x<-42)x=42;pos.setXYZ(i,x,y,z);}pos.needsUpdate=true;}
  if(weather==='fog'){scene.fog.density=.018+cloudAmount*.011;}else scene.fog.density=0;
  if(hasWebGL){renderer.render(scene,camera);if(t<1)diagnostics.textContent=`THREE OK · ${renderer.info.render.calls} DRAW CALLS · ${scene.children.length} OBJECTS`;}else drawFallback(t);requestAnimationFrame(animate);
}
animate();
