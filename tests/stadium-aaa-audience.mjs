import test from 'node:test';
import assert from 'node:assert/strict';
import {createStadiumDensity,DENSITY_PRESETS,validateDensityLayout} from '../visual-lab/stadiumDensity.js';

function fakeThree(){
 const allocations=[];
 class Geometry {constructor(){this.disposed=false;allocations.push(this);} dispose(){this.disposed=true;}}
 class Material {constructor(options){this.options=options;this.disposed=false;allocations.push(this);} dispose(){this.disposed=true;}}
 class Color {constructor(value){this.value=value;}}
 class Group {
  constructor(){this.children=[];this.visible=true;this.parent=null;this.name='';}
  add(object){this.children.push(object);object.parent=this;}
  removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
  clear(){this.children.length=0;}
 }
 class Object3D {
  constructor(){
   this.p=[0,0,0];this.s=[1,1,1];this.r=[0,0,0];
   this.position={set:(...v)=>{this.p=v;}};
   this.scale={set:(...v)=>{this.s=v;}};
   this.rotation={set:(...v)=>{this.r=v;}};
  }
  updateMatrix(){this.matrix={position:[...this.p],scale:[...this.s],rotation:[...this.r]};}
 }
 class InstancedMesh {
  constructor(geometry,material,count){
   this.geometry=geometry;this.material=material;this.count=count;this.matrices=[];this.colors=[];
   this.instanceMatrix={needsUpdate:false};this.visible=true;this.name='';
  }
  setMatrixAt(i,m){this.matrices[i]={position:[...m.position],scale:[...m.scale],rotation:[...m.rotation]};}
  setColorAt(i,c){this.colors[i]=c.value;this.instanceColor={needsUpdate:false};}
 }
 return {THREE:{Group,Object3D,InstancedMesh,Color,
  BoxGeometry:class extends Geometry{},CylinderGeometry:class extends Geometry{},
  SphereGeometry:class extends Geometry{},MeshStandardMaterial:class extends Material{}},allocations};
}
test('crowd is composed of eight reusable articulated instanced groups with no track intrusion',()=>{
 assert.ok(validateDensityLayout());
 for(const quality of ['eco','balanced','high']){
  const {THREE,allocations}=fakeThree(),scene=new THREE.Group();
  const venue=createStadiumDensity({THREE,scene,quality});
  const n=DENSITY_PRESETS[quality].crowdPerStand*3;
  assert.equal(venue.stats.crowd,n);
  assert.equal(venue.stats.articulated,true);
  assert.equal(venue.stats.crowdDrawGroups,8);
  assert.equal(venue.stats.deterministic,true);
  const crowd=venue.root.children.filter(x=>x.name.startsWith('Stands · audience'));
  assert.equal(crowd.length,8);
  for(const part of crowd){
   assert.ok(part.count>0,part.name);
   assert.ok(part.matrices.every(m=>m.position[2]<-35),part.name+' must remain behind the spectator barrier');
   assert.ok(part.colors.length===part.count,part.name+' colors must be complete');
  }
  const count=label=>crowd.find(x=>x.name.endsWith(label)).count;
  assert.equal(count('torsos'),n);
  assert.equal(count('heads'),n);
  assert.equal(count('arms'),n*2);
  assert.equal(count('legs'),n*2);
  assert.equal(count('hands'),n*2);
  assert.equal(count('shoes'),n*2);
  assert.ok(venue.stats.instanceGroups<=20,'GPU batch budget');
  venue.setLayout('oval');assert.equal(venue.root.visible,false);
  venue.setLayout('straight');assert.equal(venue.root.visible,true);
  venue.setQuality('eco');
  assert.equal(venue.root.children.find(x=>x.name.endsWith('pennants')).visible,false);
  venue.dispose();
  assert.equal(scene.children.length,0);
  assert.ok(allocations.every(x=>x.disposed),'All geometry/material resources are released');
 }
});
test('repeated builds are deterministic and the pose system includes distinct cheering silhouettes',()=>{
 const build=()=>{
  const {THREE}=fakeThree(),scene=new THREE.Group();
  const out=createStadiumDensity({THREE,scene,quality:'balanced'});
  return {arms:out.root.children.find(x=>x.name.endsWith('arms')).matrices,
   coats:out.root.children.find(x=>x.name.endsWith('torsos')).colors};
 };
 const a=build(),b=build();assert.deepEqual(a,b);
 assert.ok(new Set(a.coats).size>=4,'Wardrobe color variation');
 assert.ok(a.arms.some(m=>m.position[1]>4.4),'Cheering posture visible');
 assert.ok(a.arms.some(m=>m.position[1]<4),'Resting posture visible');
});
