import * as THREE from 'three';
import {trackPoint} from './trackMath.js';

/** Three GPU instanced calls, no per-hoof mesh allocations:
 * worn hoofprints, contact shadow pads, surface puddles.
 * Contact follows traveled XZ distance, not X coordinate (works in corners).
 */
export function createTrackSurfaceEffects(scene,{start=-390,finish=390,lanes=12}={}){
 const count=850,stampGeo=new THREE.PlaneGeometry(.56,.39);stampGeo.rotateX(-Math.PI/2);
 const stampMat=new THREE.MeshBasicMaterial({color:'#3f2c20',transparent:true,opacity:.44,depthWrite:false,side:THREE.DoubleSide});
 const marks=new THREE.InstancedMesh(stampGeo,stampMat,count);marks.name='Contact · horse hoofprints';
 marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);marks.frustumCulled=false;marks.renderOrder=5;scene.add(marks);
 const shadeGeo=new THREE.CircleGeometry(1,16);shadeGeo.rotateX(-Math.PI/2);
 const shadeMat=new THREE.MeshBasicMaterial({color:'#10190d',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
 const shadows=new THREE.InstancedMesh(shadeGeo,shadeMat,lanes);shadows.name='Contact · underbody contact shadows';
 shadows.frustumCulled=false;shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(shadows);
 const puddleGeo=new THREE.CircleGeometry(1,20);puddleGeo.rotateX(-Math.PI/2);
 const puddleMat=new THREE.MeshPhysicalMaterial({color:'#79999c',metalness:.13,roughness:.11,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const puddles=new THREE.InstancedMesh(puddleGeo,puddleMat,78);
 puddles.frustumCulled=false;puddles.renderOrder=4;scene.add(puddles);
 const d=new THREE.Object3D(),lastPositions=Array.from({length:lanes},()=>({x:NaN,z:NaN}));
 const footprints=new Uint32Array(lanes);
 const disappear=(mesh,i)=>{d.position.set(0,-50,0);d.rotation.set(0,0,0);d.scale.setScalar(.0001);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);};
 for(let i=0;i<count;i++)disappear(marks,i);
 for(let i=0;i<lanes;i++)disappear(shadows,i);
 marks.instanceMatrix.needsUpdate=shadows.instanceMatrix.needsUpdate=true;
 let layout='straight',index=0,wetness=0;
 let seed=123840;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const setLayout=mode=>{
  layout=mode;
  for(let i=0;i<puddles.count;i++){
   const p=.025+rand()*.95,lane=rand()*11;
   const c=trackPoint(mode,p,lane);
   d.position.set(c.x,.126,c.z);d.rotation.set(0,rand()*6.28,0);
   d.scale.set(1.3+rand()*3.2,.75+rand()*1.9,1);d.updateMatrix();puddles.setMatrixAt(i,d.matrix);
  }
  puddles.instanceMatrix.needsUpdate=true;
  reset();
 };
 function stamp(lane,x,z,pace=1,heading=0){
  if(lane<0||lane>=lanes)return;
  const shadowY=layout==='straight'?.048:.128;
  d.position.set(x,shadowY,z);d.rotation.set(0,0,0);
  d.scale.set(1.85,1.05,1);d.updateMatrix();shadows.setMatrixAt(lane,d.matrix);
  shadows.instanceMatrix.needsUpdate=true;
  const prev=lastPositions[lane],distance=Math.hypot(x-prev.x,z-prev.z);
  const stride=Math.max(1.85,Math.min(3.25,2.45+pace*.13));
  if(Number.isFinite(distance)&&distance<stride)return;
  prev.x=x;prev.z=z;
  const beat=(footprints[lane]++%4),side=beat%2?-1:1;
  const dirX=Math.cos(heading),dirZ=-Math.sin(heading);
  const lateralX=-dirZ,lateralZ=dirX;
  const lag=beat<2?.67:.08;
  d.position.set(x-dirX*lag+lateralX*side*.36,shadowY+.009,z-dirZ*lag+lateralZ*side*.36);
  d.rotation.set(0,heading+(side===1?.10:-.10),0);
  d.scale.set(.77,.88,1);d.updateMatrix();
  marks.setMatrixAt(index,d.matrix);index=(index+1)%count;marks.instanceMatrix.needsUpdate=true;
 }
 function update(dt,{weather='golden',sun=.5}={}){
  const rain=weather==='rain';
  if(rain)wetness=Math.min(1,wetness+Math.max(0,dt)*.115);
  else wetness=Math.max(0,wetness-Math.max(0,dt)*(sun>.5?.022:.006));
  puddleMat.opacity=wetness*.57;puddles.visible=wetness>.015;
  stampMat.opacity=.45+wetness*.20;shadeMat.opacity=.20+wetness*.09;
 }
 function reset(){
  for(const p of lastPositions){p.x=NaN;p.z=NaN;}
  footprints.fill(0);index=0;
  for(let i=0;i<count;i++)disappear(marks,i);
  for(let i=0;i<lanes;i++)disappear(shadows,i);
  marks.instanceMatrix.needsUpdate=shadows.instanceMatrix.needsUpdate=true;
 }
 function dispose(){
  stampGeo.dispose();stampMat.dispose();shadeGeo.dispose();shadeMat.dispose();puddleGeo.dispose();puddleMat.dispose();
  marks.removeFromParent();shadows.removeFromParent();puddles.removeFromParent();
 }
 setLayout('straight');
 return {stamp,update,reset,dispose,setLayout,marks,puddles,shadows,get wetness(){return wetness}};
}
