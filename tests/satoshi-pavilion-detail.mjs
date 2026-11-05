import test from 'node:test';
import assert from 'node:assert/strict';
import {createSatoshiPavilionDetail,PAVILION_DETAIL_BOUNDS,PAVILION_DETAIL_ID}
 from '../visual-lab/satoshiPavilionDetail.js';
import {PAVILION_OFFSET_Z,clubhouseCourseClearance}
 from '../visual-lab/pavilionPlacement.js';

function fakeThree(){
 const owned=[];
 class Geometry {constructor(){this.disposed=false;owned.push(this);}dispose(){this.disposed=true;}}
 class Material {constructor(options){this.options=options;this.disposed=false;this.emissiveIntensity=0;this.roughness=options.roughness;owned.push(this);}dispose(){this.disposed=true;}}
 class Group{
  constructor(){this.children=[];this.parent=null;this.name='';this.visible=true;}
  add(...members){for(const item of members){this.children.push(item);item.parent=this;}}
  removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(item=>item!==this);this.parent=null;}
  clear(){this.children=[];}
 }
 class Object3D{
  constructor(){this.p=[0,0,0];this.s=[1,1,1];this.r=[0,0,0];
   this.position={set:(...a)=>{this.p=a}};
   this.scale={set:(...a)=>{this.s=a}};
   this.rotation={set:(...a)=>{this.r=a}};
  }
  updateMatrix(){this.matrix={position:[...this.p],scale:[...this.s],rotation:[...this.r]};}
 }
 class SpotLight{
  constructor(color,intensity,distance,angle,penumbra,decay){
   Object.assign(this,{color,intensity,distance,angle,penumbra,decay,castShadow:false,disposed:false});
   this.position={set(...coordinates){this.xyz=coordinates;}};
   this.target={position:{set(...coordinates){this.xyz=coordinates;}}};
  }
  dispose(){this.disposed=true;}
 }
 class InstancedMesh{
  constructor(geometry,material,count){this.geometry=geometry;this.material=material;this.count=count;this.matrices=[];
   this.instanceMatrix={needsUpdate:false};this.name='';this.visible=true;}
  setMatrixAt(i,m){this.matrices[i]={position:[...m.position],scale:[...m.scale]};}
  computeBoundingSphere(){this.boundingSphere={};}
 }
 const THREE={
  Group,Object3D,InstancedMesh,SpotLight,
  BoxGeometry:class extends Geometry{},
  CylinderGeometry:class extends Geometry{},
  MeshStandardMaterial:class extends Material{}
 };
 return {THREE,owned};
}
test('Satoshi architectural detail attaches to existing VIP, closes floating undercroft and stays in footprint',()=>{
 const {THREE,owned}=fakeThree(),vip=new THREE.Group();
 const details=createSatoshiPavilionDetail({THREE,parent:vip,quality:'balanced'});
 assert.equal(vip.children.length,1);
 assert.equal(details.stats.version,PAVILION_DETAIL_ID);
 assert.equal(details.stats.geometryOnly,true);
 assert.equal(details.stats.changesCourse,false);
 assert.equal(details.stats.tracksAffected,0);
 assert.equal(details.stats.foundationSupported,true);
 assert.equal(details.stats.hasGroundEntrance,true);
 assert.equal(details.stats.facadeLights,2);
 assert.equal(details.stats.shadowsAdded,0);
 assert.ok(details.stats.colonnade>=10);
 assert.ok(details.stats.batches<=12);
 assert.ok(details.stats.instances>=100);
 assert.ok(PAVILION_DETAIL_BOUNDS.minZ>=-13.5);
 assert.ok(PAVILION_DETAIL_BOUNDS.maxZ<=15.5);
 assert.ok(PAVILION_DETAIL_BOUNDS.minX>=-46.5&&PAVILION_DETAIL_BOUNDS.maxX<=46.5);
 assert.equal(PAVILION_OFFSET_Z,-67);
 assert.ok(clubhouseCourseClearance('oval')>30);
 const all=[];
 for(const layer of details.root.children)for(const object of layer.children){
  assert.equal(object.count,object.matrices.length,object.name+' batch complete');
  assert.ok(object.count>0);
  all.push(object.name);
 }
 assert.ok(all.some(name=>name.includes('ground floor')));
 assert.ok(all.some(name=>name.includes('columns')));
 assert.ok(all.some(name=>name.includes('roof')));
 assert.ok(all.some(name=>name.includes('glass')));
 details.setEnvironment({night:true,wetness:.8});
 assert.equal(details.environment.night,true);
 assert.equal(details.environment.wetness,.8);
 assert.ok(details.environment.washIntensity>0,'night lighting should illuminate stone facade');
 details.setQuality('eco');
 assert.equal(details.root.children[0].visible,true,'supports must survive economy mode');
 assert.equal(details.root.children[1].visible,false,'ornament can disappear in economy mode');
 assert.equal(details.environment.washIntensity,0,'mobile eco must disable additional spotlights');
 details.setQuality('high');
 assert.equal(details.root.children[1].visible,true);
 assert.ok(details.environment.washIntensity>0,'higher quality night uses local facade light');
 details.dispose();
 assert.equal(vip.children.length,0);
 assert.ok(owned.length>=8);
 assert.ok(owned.every(item=>item.disposed),'No detached GPU resources left alive');
});
test('Pavilion boundary and surface controls are deterministic and finite',()=>{
 const {THREE}=fakeThree(),vip=new THREE.Group();
 const one=createSatoshiPavilionDetail({THREE,parent:vip});
 const snapshot=one.stats;
 one.setEnvironment({night:false,wetness:5});
 assert.equal(one.environment.wetness,1);
 one.setEnvironment({night:false,wetness:-3});
 assert.equal(one.environment.wetness,0);
 const other=createSatoshiPavilionDetail({THREE,parent:vip});
 assert.deepEqual(other.stats,snapshot);
 one.dispose();other.dispose();
});
