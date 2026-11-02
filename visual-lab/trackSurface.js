import * as THREE from 'three';

/**
 * Lightweight contact and wet-weather visuals.
 * One instanced draw call for a ring buffer of dark hoof imprints.
 * Puddles are simple low-poly planes which dry gradually in sunlight.
 */
export function createTrackSurfaceEffects(scene,{start=-275,finish=275,lanes=12}={}){
 const hoofCount=780;
 const geometry=new THREE.PlaneGeometry(.40,.20);
 geometry.rotateX(-Math.PI/2);
 const material=new THREE.MeshBasicMaterial({
   color:'#493526',transparent:true,opacity:.24,depthWrite:false,
   polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
   side:THREE.DoubleSide
 });
 const marks=new THREE.InstancedMesh(geometry,material,hoofCount);
 marks.name='Track · real hoof contacts';marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 marks.frustumCulled=false;marks.renderOrder=2;
 scene.add(marks);
 const dummy=new THREE.Object3D();
 for(let i=0;i<hoofCount;i++){
  dummy.position.set(0,-4,0);dummy.scale.setScalar(.001);dummy.updateMatrix();
  marks.setMatrixAt(i,dummy.matrix);
 }
 marks.instanceMatrix.needsUpdate=true;
 let index=0,wetness=0;
 const lastX=new Float64Array(lanes);
 lastX.fill(-Infinity);
 const tick=new Int32Array(lanes);
 function stamp(lane,x,z,pace){
   if(!(x>start-2&&x<finish+40))return;
   if(x-lastX[lane]<Math.max(1.4,Math.min(3.8,pace*.19)))return;
   lastX[lane]=x;
   const heel=tick[lane]++%4;
   // Four-beat footprint choreography: hind/outside, hind/inside,
   // fore/outside, fore/inside. Low visual noise, no particles.
   const side=heel%2?-1:1,lag=heel<2?.53:0;
   dummy.position.set(x-lag,.061+index%3*.0007,z+side*.37);
   dummy.rotation.set(0,.08*(side===1?1:-1),0);
   dummy.scale.set(.65+pace*.009, .8, .85);
   dummy.updateMatrix();marks.setMatrixAt(index,dummy.matrix);
   index=(index+1)%hoofCount;marks.instanceMatrix.needsUpdate=true;
 }
 const puddleGeo=new THREE.CircleGeometry(1,20);
 puddleGeo.rotateX(-Math.PI/2);
 const puddleMat=new THREE.MeshPhysicalMaterial({
  color:'#55777e',metalness:.12,roughness:.08,clearcoat:1,clearcoatRoughness:.04,
  transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide
 });
 const puddles=new THREE.InstancedMesh(puddleGeo,puddleMat,65);
 puddles.name='Evaporating shallow track puddles';puddles.frustumCulled=false;puddles.renderOrder=3;
 let seed=27933;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<65;i++){
  const x=start+rand()*(finish-start),z=-16+rand()*32;
  dummy.position.set(x,.048+i%3*.0001,z);dummy.rotation.set(0,rand()*6.28,0);
  dummy.scale.set(1.2+rand()*2.5, .8+rand()*1.3,1);
  dummy.updateMatrix();puddles.setMatrixAt(i,dummy.matrix);
 }
 puddles.instanceMatrix.needsUpdate=true;scene.add(puddles);
 let enabled=true,lastWeather='golden';
 function update(dt,{weather='golden',sun=0.5}={}){
  const rain=weather==='rain';
  lastWeather=weather;
  if(rain)wetness=Math.min(1,wetness+dt*.11);
  else wetness=Math.max(0,wetness-dt*(sun>.5?.018:.004));
  puddleMat.opacity=wetness*.52;
  puddles.visible=wetness>.008;
  material.opacity=(.31-wetness*.10);
 }
 function reset(){
  lastX.fill(-Infinity);tick.fill(0);index=0;
  for(let i=0;i<hoofCount;i++){dummy.position.set(0,-4,0);dummy.scale.setScalar(.001);dummy.updateMatrix();marks.setMatrixAt(i,dummy.matrix);}
  marks.instanceMatrix.needsUpdate=true;
 }
 function dispose(){
  geometry.dispose();material.dispose();puddleGeo.dispose();puddleMat.dispose();
  marks.removeFromParent();puddles.removeFromParent();
 }
 return {stamp,update,reset,dispose,get wetness(){return wetness},puddles,marks};
}
