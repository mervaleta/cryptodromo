import test from 'node:test';
import assert from 'node:assert/strict';
import {createSatoshiGrandstandCrowd,GRANDSTAND_FIGURE_VERSION}
 from '../visual-lab/stadiumGrandstandCrowd.js';

function fakeThree(){
 const resources=[];
 class Geometry{constructor(){this.disposed=false;resources.push(this);}dispose(){this.disposed=true;}}
 class Material{constructor(o){this.params=o;this.disposed=false;resources.push(this);}dispose(){this.disposed=true;}}
 class Color{constructor(value){this.value=value;}}
 class Group{constructor(){this.children=[];this.parent=null;}
  add(item){this.children.push(item);item.parent=this;}
  removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
  clear(){this.children=[];}
 }
 class Object3D{constructor(){this.p=[0,0,0];this.r=[0,0,0];this.s=[1,1,1];
  this.position={set:(...a)=>{this.p=a;}};this.rotation={set:(...a)=>{this.r=a;}};
  this.scale={set:(...a)=>{this.s=a;}};
  }
  updateMatrix(){this.matrix={p:[...this.p],s:[...this.s],r:[...this.r]};}
 }
 class InstancedMesh{constructor(geometry,material,count){
  this.geometry=geometry;this.material=material;this.count=count;this.initialCapacity=count;
  this.matrices=[];this.colors=[];this.instanceMatrix={needsUpdate:false};this.instanceColor={needsUpdate:false};
  this.name='';this.visible=true;this.disposed=false;
  }
  setMatrixAt(i,m){this.matrices[i]={...m};}
  setColorAt(i,c){this.colors[i]=c.value;}
  computeBoundingSphere(){}
  dispose(){this.disposed=true;}
 }
 return {THREE:{Group,Object3D,InstancedMesh,Color,
  BoxGeometry:class extends Geometry{},CylinderGeometry:class extends Geometry{},
  SphereGeometry:class extends Geometry{},MeshStandardMaterial:class extends Material{}},resources};
}
const people=Array.from({length:90},(_,i)=>({
 x:-100+i*1.1,y:4.62+(i%7)*.93,z:-107-(i%7)*2.6,
 yaw:(i%5)*.09,coat:i%2?'#aabbcc':'#224466',skin:'#e2bd9c'
}));
test('all historical grandstand figures keep their original coordinates and have human silhouettes',()=>{
 const {THREE,resources}=fakeThree(),parent=new THREE.Group();
 const c=createSatoshiGrandstandCrowd({THREE,parent,people});
 assert.equal(c.stats.version,GRANDSTAND_FIGURE_VERSION);
 assert.equal(c.stats.people,people.length);
 assert.equal(c.stats.trackModified,false);
 assert.equal(c.stats.originalCoordinatesRetained,true);
 assert.equal(c.stats.parts,8);
 assert.equal(parent.children.length,1);
 const count=suffix=>c.meshes.find(m=>m.name.endsWith(suffix))?.count;
 assert.equal(count('torsos'),90);
 assert.equal(count('heads'),90);
 assert.equal(count('sleeves'),180);
 assert.equal(count('legs'),180);
 assert.equal(count('hands'),180);
 assert.equal(count('shoes'),180);
 assert.ok(count('hats')>0&&count('hats')<90);
 for(const mesh of c.meshes){
  assert.equal(mesh.matrices.length,mesh.initialCapacity);
  assert.equal(mesh.colors.length,mesh.initialCapacity);
  assert.ok(mesh.instanceMatrix.needsUpdate);
  assert.ok(mesh.instanceColor.needsUpdate);
 }
 c.setPopulation(22);
 assert.equal(c.visibleCount,22);
 assert.equal(count('torsos'),22);
 assert.equal(count('sleeves'),44);
 assert.ok(count('hats')<=22);
 c.setPopulation(90);
 assert.equal(count('torsos'),90);
 c.setPopulation(-100);
 assert.equal(count('torsos'),0);
 c.setPopulation(10000);
 assert.equal(count('torsos'),90);
 c.dispose();
 assert.equal(parent.children.length,0);
 assert.ok(resources.every(r=>r.disposed));
 assert.ok(c.meshes.every(m=>m.disposed));
});
test('rejects spectator coordinates within racing envelope',()=>{
 const {THREE}=fakeThree(),parent=new THREE.Group();
 assert.throws(()=>createSatoshiGrandstandCrowd({THREE,parent,people:[{x:0,y:3,z:0}]}),RangeError);
 assert.throws(()=>createSatoshiGrandstandCrowd({THREE,parent,people:[{x:0,y:3,z:NaN}]}),RangeError);
 assert.equal(parent.children.length,0);
});
