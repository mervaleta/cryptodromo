/**
 * Alpha22: original procedural equine. No imported horse models are loaded.
 * Entire horse geometry, mane, tail, markings and PBR surfaces are authored by
 * source functions, then animated by an independent 4-beat skeletal hierarchy.
 * +X forward, +Y up. The visual root is compatible with LIVE trackPoint.
 */
import {COAT_PRESETS,normalizeHorseProfile,horseAnatomy} from './horseProfiles.js';
import {addLoft,makeOrganicLoft,geometryBudget,geometryStats} from './horseGeometry.js';
import {createAnalyticFurMaterial,makeSurfaceMaterial,verifyTextureFreeMaterial} from './horseShader.js';
import {createProceduralGroom} from './horseGroom.js';
import {createGeometricRaceLivery} from './horseRaceLivery.js';
import {gallopLegPose} from './horseGaitIK.js';

const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const mix=(a,b,t)=>a+(b-a)*t;
export const HORSE_PROTOCOL=Object.freeze([
 'root','play','update','setAppearance','setWind','setWetness','setBank',
 'setVisualQuality','dispose','hoofPhase'
]);
function scaleParts(m,quality){return {...geometryBudget(quality),height:m.height};}
export function createProceduralHorse({THREE,profile={},coat,accent,quality}={}){
 if(!THREE?.Group||!THREE?.Mesh)throw Error('THREE required for procedural horse');
 const options=normalizeHorseProfile({...profile,...(coat?{coat}:{}),
  ...(accent?{accent}:{}),...(quality?{quality}:{})});
 const shape=horseAnatomy(options);
 const coatDef=COAT_PRESETS[options.coat];
 const root=new THREE.Group();root.name='CRP Alpha22 · fully procedural horse';
 const avatar=new THREE.Group();avatar.name='Native procedural proportions';
 avatar.scale.setScalar(options.height/2.85);root.add(avatar);
 const geometries=[],materials=[],meshes=[];
 const ownGeometry=g=>(geometries.push(g),g);
 const ownMaterial=m=>(materials.push(m),m);
 const skin=createAnalyticFurMaterial(THREE,{coat:coatDef.coat,wetness:options.wetness,
  mud:options.mud,seed:options.seed});
 const muzzle=ownMaterial(makeSurfaceMaterial(THREE,coatDef.muzzle,{roughness:.72,clearcoat:.14}));
 const hoof=ownMaterial(makeSurfaceMaterial(THREE,coatDef.hoof,{roughness:.54,clearcoat:.09}));
 const eye=ownMaterial(makeSurfaceMaterial(THREE,'#17191c',{roughness:.075,clearcoat:.96}));
 const iris=ownMaterial(makeSurfaceMaterial(THREE,'#654735',{roughness:.16,clearcoat:.82}));
 const glint=ownMaterial(makeSurfaceMaterial(THREE,'#f4eddb',{roughness:.07,clearcoat:.96}));
 const white=ownMaterial(makeSurfaceMaterial(THREE,'#e4daca',{roughness:.84}));
 const accentMat=ownMaterial(makeSurfaceMaterial(THREE,options.accent,{roughness:.58,clearcoat:.18}));
 const darkInner=ownMaterial(makeSurfaceMaterial(THREE,'#332a29',{roughness:.86}));
 const gq=options.quality;
 const loft=(parent,name,sections,material=skin.material,bulge=0)=>{
  const item=addLoft({THREE,parent,sections,material,quality:gq,name,bulge});
  ownGeometry(item.geometry);meshes.push(item);return item;
 };
 const sphere=(parent,name,where,scale,material,detail=14)=>{
  const geo=ownGeometry(new THREE.SphereGeometry(1,detail,Math.max(8,detail-3)));
  const obj=new THREE.Mesh(geo,material);obj.name=name;
  obj.position.set(...where);obj.scale.set(...scale);obj.castShadow=true;obj.receiveShadow=true;
  parent.add(obj);meshes.push(obj);return obj;
 };
 const bodyPivot=new THREE.Group();bodyPivot.name='Torso and shoulders pivot';
 bodyPivot.position.set(0,1.63,0);avatar.add(bodyPivot);
 const body=new THREE.Group();body.position.y=-1.63;bodyPivot.add(body);
 const torso=[
  [-1.05,1.67,0,.016,.02],
  [-.98,1.69,0,.29*shape.haunch,.32*shape.haunch],
  [-.73,1.70,0,.45*shape.haunch,.405*shape.haunch],
  [-.36,1.67,0,.435*shape.barrel,.41*shape.barrel],
  [.13,1.67,0,.43*shape.barrel,.405*shape.barrel],
  [.52,1.69,0,.455*shape.shoulder,.415*shape.shoulder],
  [.83,1.73,0,.28*shape.shoulder,.30*shape.shoulder],
  [.96,1.75,0,.016,.018]
 ];
 loft(body,'Organic barrel · shoulder and haunch',torso,skin.material,.05);
 loft(body,'Throatlatch and neck sweep',[
  [.48,1.77,0,.28,.29],
  [.61,1.96,0,.30*shape.neck,.27],
  [.77,2.18,0,.23*shape.neck,.215],
  [.98,2.39,0,.145*shape.neck,.17],
  [1.15,2.42,0,.065,.09]
 ],skin.material,.04);
 for(const side of [-1,1]){
  loft(body,'Shoulder muscle',[
   [.54,1.79,side*.305,.017,.02],
   [.59,1.55,side*.315,.22*shape.shoulder,.19],
   [.60,1.29,side*.29,.20*shape.shoulder,.15],
   [.69,1.08,side*.285,.075,.08]
  ],skin.material);
  loft(body,'Glute and gaskin muscle',[
   [-.76,1.74,side*.30,.02,.017],
   [-.77,1.50,side*.32,.23*shape.haunch,.20],
   [-.82,1.23,side*.29,.18*shape.haunch,.16],
   [-.85,1.05,side*.275,.06,.07]
  ],skin.material);
 }
 const headPivot=new THREE.Group();headPivot.position.set(1.08,2.39,0);
 body.add(headPivot);
 const local=(where)=>where.map((n,i)=>n-[1.08,2.39,0][i]);
 const headSections=[
  [1.01,2.40,0,.08,.135],
  [1.13,2.39,0,.18*shape.head,.175*shape.head],
  [1.31,2.32,0,.20*shape.head,.17*shape.head],
  [1.49,2.23,0,.15*shape.head,.138*shape.head],
  [1.70,2.17,0,.15,.16],
  [1.81,2.16,0,.10,.14],
  [1.87,2.16,0,.008,.01]
 ].map(([x,y,z,r,s])=>[x-1.08,y-2.39,z,r,s]);
 loft(headPivot,'Equine cheekbone / jaw / muzzle',headSections,skin.material,.025);
 for(const side of [-1,1]){
  const z=side*.162;
  sphere(headPivot,'Sclera rim',local([1.35,2.37,z]),[.086,.091,.043],skin.material,16);
  sphere(headPivot,'Iris',local([1.38,2.38,z+side*.033]),[.055,.056,.019],iris,16);
  sphere(headPivot,'Luminous eye',local([1.388,2.384,z+side*.048]),[.038,.042,.021],eye,16);
  sphere(headPivot,'Eye glimmer',local([1.4,2.404,z+side*.065]),[.010,.011,.008],glint,12);
  const earZ=side*.145;
  loft(headPivot,'Ear'+side,[
   [1.07-1.08,2.49-2.39,earZ,.075,.072],
   [1.05-1.08,2.66-2.39,earZ,.082,.068],
   [1.09-1.08,2.80-2.39,earZ,.032,.029],
   [1.11-1.08,2.83-2.39,earZ,.003,.005]
  ],skin.material);
  sphere(headPivot,'Ear inner',local([1.112,2.67,earZ+side*.024]),[.016,.07,.026],darkInner,10);
  const nz=side*.128;
  sphere(headPivot,'Nostril'+side,local([1.755,2.235,nz]),[.054,.034,.027],darkInner,12);
  sphere(headPivot,'Nostril wet edge'+side,local([1.76,2.248,nz+side*.004]),[.043,.009,.008],muzzle,10);
 }
 // The mouth is separated from the upper muzzle by an original thin lip curve.
 loft(headPivot,'Lower lips',[
  [1.54-1.08,2.07-2.39,0,.028,.075],
  [1.69-1.08,2.07-2.39,0,.064,.115],
  [1.78-1.08,2.08-2.39,0,.041,.082],
  [1.81-1.08,2.08-2.39,0,.003,.005]
 ],muzzle);
 const marking=new THREE.Group();marking.name='Face white markings';headPivot.add(marking);
 const star=sphere(marking,'Star white face',local([1.42,2.48,0]),[.042,.052,.121],white,10);
 const blaze=sphere(marking,'Blaze white face',local([1.57,2.36,0]),[.048,.20,.118],white,12);
 const snip=sphere(marking,'Snip white face',local([1.735,2.30,0]),[.045,.050,.129],white,10);
 function setMarking(value){
  star.visible=value==='star';
  blaze.visible=value==='blaze';
  snip.visible=value==='snip';
 }
 setMarking(options.marking);

 // Each leg is a three-joint animated hierarchy with organic loft geometry.
 const legs=[];
 for(const hind of [false,true])for(const side of [-1,1]){
  const index=legs.length,rootJoint=new THREE.Group();
  rootJoint.name=(hind?'Hind':'Fore')+(side<0?'Left':'Right')+'Shoulder';
  const startX=hind?-.79:.65,startY=hind?1.42:1.36;
  rootJoint.position.set(startX,startY,side*(hind?.32:.33));avatar.add(rootJoint);
  const topJoint=hind?[-.17,-.58,0]:[.07,-.59,0];
  const tipJoint=hind?[.19,-.67,0]:[-.015,-.62,0];
  const upper=hind?[
   [0,.06,0,.14,.12],[-.05,-.21,0,.215,.16],
   [-.13,-.46,0,.14,.12],[topJoint[0],topJoint[1],0,.08,.09]
  ]:[
   [0,.06,0,.16,.13],[.02,-.23,0,.16,.14],
   [.055,-.48,0,.10,.09],[topJoint[0],topJoint[1],0,.074,.074]
  ];
  loft(rootJoint,'Upper '+rootJoint.name,upper,skin.material,.045);
  const knee=new THREE.Group();knee.position.set(...topJoint);
  knee.name=(hind?'Hock':'Knee')+index;rootJoint.add(knee);
  const lower=hind?[
   [0,.03,0,.097,.105],[.02,-.18,0,.073,.072],
   [.14,-.48,0,.065,.062],[tipJoint[0],tipJoint[1],0,.074,.072]
  ]:[
   [0,.02,0,.082,.086],[-.005,-.16,0,.066,.069],
   [-.005,-.47,0,.060,.061],[tipJoint[0],tipJoint[1],0,.081,.081]
  ];
  loft(knee,'Cannon '+rootJoint.name,lower,skin.material);
  const fetlock=new THREE.Group();fetlock.position.set(...tipJoint);knee.add(fetlock);
  sphere(fetlock,'Pastern / fetlock',[-.01,-.012,0],[.108,.15,.105],skin.material,14);
  sphere(fetlock,'Cloven-free single hoof',[.075,-.112,0],[.182,.115,.145],hoof,16);
  sphere(fetlock,'Hoof coronet',[-.005,-.040,0],[.103,.045,.114],muzzle,12);
  const sock=sphere(knee,'Optional white stocking',[-.005,-.50,0],[.069,.16,.073],white,14);
  sock.visible=options.marking==='blaze'&&index===1;
  // Small original 3D accent around fetlock, no floating crypto sprite.
  const ring=sphere(fetlock,'Runner accent trim',[-.02,-.04,0],[.107,.022,.112],accentMat,12);
  legs.push({index,upper:rootJoint,knee,fetlock,offset:[.28,.43,.03,.14][index],
   hind,side,sock,ring});
 }
 // Groom hairs follow the torso (including neck and rump) without mesh images.
 const groom=createProceduralGroom({THREE,parent:body,quality:gq,seed:options.seed,
  maneStyle:options.maneStyle,tailStyle:options.tailStyle,color:coatDef.mane});
 const raceCloth=createGeometricRaceLivery({THREE,parent:body,quality:gq,
  number:Math.max(1,Math.min(99,Number(options.number)||1)),accent:options.accent});

 let mode='Idle',time=0,idleClock=0,hoofPhase=0,bankGoal=0,wind=.5,wetness=options.wetness,
  mud=options.mud,blend=0,disposed=false,
  gaitStyle=options.gaitStyle==='swing'?'swing':'ik',
  profileCurrent={...options,gaitStyle:options.gaitStyle==='swing'?'swing':'ik'};
 const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
 const maxGait=1.75;
 function update(delta=0,speed=1){
  if(disposed)return;
  const dt=clamp(Number(delta),0,.1);
  const rate=clamp(Number(speed),.15,maxGait);
  const target=mode==='Gallop'?1:mode==='Walk'?.33:0;
  blend+= (target-blend)*(1-Math.exp(-dt*(target>blend?5:8)));
  const cadence=mode==='Gallop'?rate/.583:mode==='Walk'?.88*rate:0;
  time+=dt*cadence;idleClock+=dt;
  hoofPhase=time%1;
  const phase=hoofPhase;
  const swing=Math.sin(TAU*phase);
  const flight=Math.max(0,Math.sin(TAU*(phase-.40)));
  const reduced=!!reducedMotion?.matches;
  const amount=blend*(reduced?.35:1);
  for(const leg of legs){
   const p=TAU*(phase-leg.offset),sin=Math.sin(p);
   const lift=Math.max(0,-Math.cos(p));
   let shoulder=(leg.hind?.34:.30)*sin;
   let bend=(leg.hind?-.55:.47)*lift;
   if(gaitStyle==='ik'){
    const pose=gallopLegPose(phase,leg.index,{speed:rate});
    // Physically planted hoof targets during stance; lifted foot during flight.
    // The 0..1 gait blend prevents snapping when walking or waiting.
    shoulder=clamp(pose.shoulder,-.84,.84);
    bend=clamp(pose.knee,-1.25,1.25);
   }
   leg.upper.rotation.z=amount*shoulder;
   leg.knee.rotation.z=amount*bend;
   leg.fetlock.rotation.z=-amount*(shoulder*.55+bend*.24);
  }
  const walkBreath=mode==='Idle'?.007*Math.sin(idleClock*2.0):0;
  bodyPivot.position.y=1.63+amount*(.024*swing+.025*flight)+walkBreath;
  bodyPivot.rotation.z=amount*.016*Math.sin(TAU*(phase+.12));
  bodyPivot.rotation.x+= (bankGoal-bodyPivot.rotation.x)*(1-Math.exp(-dt*4));
  headPivot.rotation.z=amount*.024*Math.sin(TAU*(phase-.2));
  const airflow=reduced?0:clamp(wind+.45*rate*amount,0,2);
  groom.update(dt,{phase,speed:amount*rate,windSpeed:airflow,activeMotion:!reduced});
 }
 function setAppearance({coat:nextCoat,accent:nextAccent,marking:nextMark,
  maneStyle:nextMane,tailStyle:nextTail,number:nextNumber,wetness:nextWet,mud:nextMud}={}){
  const coatKey=COAT_PRESETS[nextCoat]?nextCoat:profileCurrent.coat;
  const colors=COAT_PRESETS[coatKey];
  const customCoat=typeof nextCoat==='string'&&/^#[0-9a-f]{6}$/i.test(nextCoat)?nextCoat:null;
  skin.setLook({color:customCoat||colors.coat});
  muzzle.color.set(colors.muzzle);hoof.color.set(colors.hoof);
  if(nextAccent){accentMat.color.set(nextAccent);raceCloth.setAccent(nextAccent);}
  if(nextNumber!==undefined)raceCloth.setNumber(nextNumber);
  groom.setAppearance({maneColor:colors.mane,style:nextMane,tail:nextTail});
  if(nextMark!==undefined)setMarking(nextMark);
  profileCurrent={...profileCurrent,coat:coatKey,
   accent:nextAccent||profileCurrent.accent,
   marking:nextMark??profileCurrent.marking,
   maneStyle:nextMane||profileCurrent.maneStyle,
   tailStyle:nextTail||profileCurrent.tailStyle};
  if(nextWet!==undefined)setWetness(nextWet);
  if(nextMud!==undefined)setMud(nextMud);
 }
 function setWetness(v){wetness=clamp(Number(v),0,1);skin.setLook({wetness});
   muzzle.roughness=.72-wetness*.28;hoof.roughness=.54-wetness*.19;}
 function setMud(v){mud=clamp(Number(v),0,1);skin.setLook({mud});}
 function setVisualQuality(next){
  const mode=next==='performance'?'eco':next==='cinematic'?'high':next;
  if(['eco','balanced','high'].includes(mode)){
   groom.setQuality(mode);raceCloth.setQuality(mode);
  }
 }
 function setGaitStyle(value){gaitStyle=value==='swing'?'swing':'ik';
  profileCurrent.gaitStyle=gaitStyle;}
 function setCoatFinish(level=0){
  const finish=clamp(Number(level),0,1);
  skin.material.roughness=.77-finish*.10-wetness*.12;
  skin.material.clearcoat=.08+finish*.18;
 }
 function reset(){time=0;idleClock=0;hoofPhase=0;blend=0;bodyPivot.rotation.set(0,0,0);
  for(const leg of legs){leg.upper.rotation.z=0;leg.knee.rotation.z=0;leg.fetlock.rotation.z=0;}}
 function dispose(){
  if(disposed)return;disposed=true;groom.dispose();raceCloth.dispose();
  for(const g of geometries)g.dispose();
  skin.dispose();for(const mat of materials)mat.dispose();
  root.removeFromParent();root.clear();
 }
 const api={
  root,clips:['Idle','Walk','Gallop'],get hoofPhase(){return hoofPhase;},
  get profile(){return {...profileCurrent}},
  get procedural(){return true;},
  get shapeStats(){return {...geometryStats(root),hairStrands:groom.strandTotal}},
  get isTextureFree(){return verifyTextureFreeMaterial(root).textureFree},
  play(name='Gallop'){if(!['Idle','Walk','Gallop'].includes(name))return;mode=name;},
  setAppearance,setWetness,setMud,setVisualQuality,setCoatFinish,setGaitStyle,
  setWind(value){wind=clamp(Number(value),0,2);},
  setBank(radians){bankGoal=clamp(Number(radians),-.12,.12);},
  update,reset,dispose
 };
 return api;
}
