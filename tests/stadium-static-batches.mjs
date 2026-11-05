import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createStraightCourseBatches,createForestBatches,SATOSHI_STATIC_BATCH_VERSION
} from '../visual-lab/stadiumStaticBatches.js';

function fakeThree(){
 const resources=[];
 class Geometry{constructor(){this.disposed=false;resources.push(this);}dispose(){this.disposed=true;}}
 class Material{constructor(){this.disposed=false;resources.push(this);}dispose(){this.disposed=true;}}
 class Group{
  constructor(){this.children=[];this.visible=true;this.parent=null;}
  add(mesh){this.children.push(mesh);mesh.parent=this;}
  removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
  clear(){this.children=[];}
 }
 class Object3D{
  constructor(){
   this.position={set:(...p)=>{this.p=p;}};
   this.scale={set:(...p)=>{this.s=p;}};
   this.rotation={set:(...p)=>{this.r=p;}};
  }
  updateMatrix(){this.matrix={p:[...this.p],s:[...this.s],r:[...this.r]};}
 }
 class InstancedMesh{
  constructor(geometry,material,count){
   this.geometry=geometry;this.material=material;this.count=count;this.transforms=[];
   this.instanceMatrix={needsUpdate:false};this.disposeCalled=false;
  }
  setMatrixAt(i,m){this.transforms[i]={p:[...m.p],s:[...m.s]};}
  computeBoundingSphere(){this.boundingSphere={};}
  dispose(){this.disposeCalled=true;}
 }
 const THREE={Group,Object3D,InstancedMesh,
  CylinderGeometry:class extends Geometry{},BoxGeometry:class extends Geometry{},
  ConeGeometry:class extends Geometry{},MeshStandardMaterial:class extends Material{}
 };
 return {THREE,resources};
}
test('Static rails, slabs and fence preserve legacy placement while removing 579 draw objects',()=>{
 const {THREE,resources}=fakeThree(),scene=new THREE.Group();
 const rail={name:'shared rail'},steel={name:'shared steel'};
 const kit=createStraightCourseBatches({THREE,parent:scene,railMaterial:rail,steelMaterial:steel});
 assert.equal(kit.stats.version,SATOSHI_STATIC_BATCH_VERSION);
 assert.deepEqual([kit.stats.railPosts,kit.stats.fencePosts,kit.stats.markingSlabs],[404,100,78]);
 assert.equal(kit.stats.previousObjectCount,582);
 assert.equal(kit.stats.instancedDrawGroups,3);
 assert.equal(kit.stats.racingSurfaceModified,false);
 const [posts,fence,slabs]=kit.meshes;
 assert.deepEqual(posts.transforms[0].p,[-402,.60,-20.2]);
 assert.deepEqual(posts.transforms[403].p,[402,.60,20.2]);
 assert.deepEqual(fence.transforms[0].p,[-399,.65,53]);
 assert.deepEqual(fence.transforms[99].p,[393,.65,53]);
 assert.deepEqual(slabs.transforms[0].p,[-380,.025,-17]);
 assert.deepEqual(slabs.transforms[77].p,[380,.025,17]);
 assert.deepEqual(fence.transforms[0].s,[.09,1.4,.10]);
 assert.deepEqual(slabs.transforms[0].s,[.34,.017,1.3]);
 for(const mesh of kit.meshes)assert.equal(mesh.instanceMatrix.needsUpdate,true);
 kit.dispose();
 assert.equal(scene.children.length,0);
 assert.ok(resources.every(x=>x.disposed));
 assert.ok(kit.meshes.every(x=>x.disposeCalled));
 assert.equal(rail.name,'shared rail','caller owns shared material');
});
test('Distant woodland keeps original tree proportions and colors in four batched groups',()=>{
 const {THREE,resources}=fakeThree(),scene=new THREE.Group();
 const materials=[{id:1},{id:2},{id:3}];
 const trees=[
  {x:-335,z:-169,h:12,light:true},
  {x:107,z:144,h:6,light:false},
  {x:201,z:-155,h:9,light:true}
 ];
 const woods=createForestBatches({THREE,parent:scene,trees,
  trunkMaterial:materials[0],needleMaterial:materials[1],lightMaterial:materials[2]});
 assert.equal(woods.stats.trees,3);
 assert.equal(woods.stats.previousObjectCount,9);
 assert.equal(woods.stats.instancedDrawGroups,4);
 assert.equal(woods.stats.courseModified,false);
 const trunks=woods.meshes[0];
 assert.deepEqual(trunks.transforms[0].p,[-335,2.52,-169]);
 assert.equal(trunks.transforms[0].s[1],5.4);
 assert.equal(woods.meshes.reduce((a,m)=>a+m.count,0),9);
 assert.ok(woods.meshes.every(m=>m.castShadow===false));
 woods.dispose();
 assert.equal(scene.children.length,0);
 assert.ok(resources.every(x=>x.disposed));
 assert.equal(materials[0].id,1,'shared forest materials still alive');
});
test('reject scenic geometry accidentally placed in race lanes',()=>{
 const {THREE}=fakeThree(),scene=new THREE.Group();
 assert.throws(()=>createForestBatches({THREE,parent:scene,trees:[{x:0,z:10,h:10}],
  trunkMaterial:{},needleMaterial:{},lightMaterial:{}}),RangeError);
 assert.equal(scene.children.length,0);
});
test('actual scene uses isolated instanced static props and preserves tree clearance',()=>{
 const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 assert.match(scene,/createStraightCourseBatches\(/);
 assert.match(scene,/createForestBatches\(/);
 assert.match(scene,/z=back\?-153-r\(\)\*16:132\+r\(\)\*22/);
 assert.match(scene,/straightChildren\.forEach\(child=>straightCourse\.add\(child\)\)/);
 assert.doesNotMatch(scene,/for\(let x=-399;x<=399;x\+=8\)\{box\(/);
 assert.doesNotMatch(scene,/for\(let x=-402;x<=402;x\+=4\)cyl\(/);
});
