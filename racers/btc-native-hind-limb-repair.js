/**
 * BTC V20 · native hind-leg transplant for the Maya anatomical horse.
 *
 * Root cause: the Maya 2017 hind vertices were transferred to a DIFFERENT
 * skeleton by nearest-neighbor weights. At the hock and stifle, their rest
 * surface has incompatible vertex rings, and Gallop collapses/tears these
 * joints in some poses even after weight smoothing (V16, V18).
 *
 * Replace ONLY posterior lower limbs with the exact authored Quaternius GLB
 * geometry and skin weights for the original 50-joint Gallop. Keep original
 * Maya torso, head, face, groom, material and rest of horse untouched.
 * This is genuine authored polygon geometry, NOT procedurally modeled legs.
 * An isolated lookdev candidate. Chromium screenshots must be reviewed.
 */
import * as THREE from 'three';

const isRearVertex=(x,y,z)=>y>.00425&&z<.0248&&Math.abs(x)>.0010;
const isRearTriangle=(a,b,c)=>{
 const cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3,
  cz=(a[2]+b[2]+c[2])/3;
 return isRearVertex(cx,cy,cz);
};

function cropMayaHind(anatomy) {
 const geo=anatomy.geometry,ix=geo.getIndex(),pos=geo.getAttribute('position');
 if(!ix||!pos||!geo.groups?.length)throw Error('BTC V20 requires indexed Maya surface and coat/hoof groups');
 const oldIndices=Uint16Array.from(ix.array),oldGroups=geo.groups.map(x=>({...x}));
 const next=[],groups=[];let removed=0,removedHooves=0;
 for(const group of oldGroups){
  const start=next.length;
  for(let i=group.start;i<group.start+group.count;i+=3){
   const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];
   const xyz=ids.map(v=>[pos.getX(v),pos.getY(v),pos.getZ(v)]);
   const cut=isRearTriangle(...xyz);
   if(cut){removed++;if(group.materialIndex===1)removedHooves++;continue;}
   next.push(...ids);
  }
  groups.push({start,count:next.length-start,materialIndex:group.materialIndex});
 }
 if(removed<150||removed>1500)throw Error('BTC V20 Maya posterior crop outside expected anatomy range: '+removed);
 geo.setIndex(new THREE.Uint16BufferAttribute(new Uint16Array(next),1));
 geo.clearGroups();
 for(const g of groups)geo.addGroup(g.start,g.count,g.materialIndex);
 geo.computeBoundingSphere();
 return {removedMayaTriangles:removed,removedMayaHoofTriangles:removedHooves,
  keptMayaTriangles:next.length/3,
  restore(){
   geo.setIndex(new THREE.Uint16BufferAttribute(oldIndices,1));geo.clearGroups();
   for(const g of oldGroups)geo.addGroup(g.start,g.count,g.materialIndex);
   geo.computeBoundingSphere();
  }};
}
function clipNativeTriangles(mesh,predicate){
 const geo=mesh.geometry,idx=geo.getIndex(),pos=geo.getAttribute('position');
 if(!idx||!pos||!geo.getAttribute('skinIndex')||!geo.getAttribute('skinWeight'))
  throw Error('BTC V20 only accepts native authored indexed skinned GLB meshes');
 const selected=[];
 for(let i=0;i<idx.count;i+=3){
  const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
  const pts=ids.map(id=>[pos.getX(id),pos.getY(id),pos.getZ(id)]);
  if(predicate(pts,ids,geo))selected.push(...ids);
 }
 if(!selected.length)throw Error('BTC V20 could not locate original hind limb polygons');
 const trimmed=geo.clone();
 trimmed.setIndex(selected);
 trimmed.clearGroups();
 trimmed.addGroup(0,selected.length,0);
 trimmed.computeBoundingSphere();
 return {geometry:trimmed,triangles:selected.length/3};
}
function attachNativeDonor(original,geometry,material,name) {
 const clone=new THREE.SkinnedMesh(geometry,material);
 clone.name=name;
 clone.bindMode=original.bindMode;clone.position.copy(original.position);
 clone.quaternion.copy(original.quaternion);clone.scale.copy(original.scale);
 original.parent.add(clone);
 clone.bind(original.skeleton,original.bindMatrix.clone());
 clone.bindMatrixInverse.copy(original.bindMatrixInverse);
 clone.frustumCulled=false;clone.castShadow=true;clone.receiveShadow=true;
 return clone;
}
function originalHoof(root) {
 let hoof=null;
 root.traverse(x=>{if(x.isSkinnedMesh&&[x.material].flat()[0]?.name==='Hooves')hoof=x;});
 return hoof;
}
export function createBTCNativeHindLimbRepair(root,original,anatomy) {
 if(!original.skeleton?.bones.some(b=>b.name.startsWith('BackLowerLeg')))
  throw Error('BTC V20 requires original GLB Gallop hock joints');
 const hoof=originalHoof(root);
 if(!hoof||hoof.skeleton!==original.skeleton)
  throw Error('BTC V20 requires original GLB hoof mesh on SAME rig');
 const crop=cropMayaHind(anatomy);
 let donor=null,donorHooves=null,bodyCut=null,hoovesCut=null;
 try{
  bodyCut=clipNativeTriangles(original,(p)=>{
   const x=p.reduce((n,v)=>n+v[0],0)/3,
     y=p.reduce((n,v)=>n+v[1],0)/3,z=p.reduce((n,v)=>n+v[2],0)/3;
   // Full original Gallop joint topology from gaskin through fetlock.
   // Upper end tucks into the still-continuous Maya rump.
   return y>.00385&&z<.0285&&Math.abs(x)>.0010;
  });
  hoovesCut=clipNativeTriangles(hoof,p=>{
   const cy=p.reduce((s,v)=>s+v[1],0)/3;
   return cy>.003;
  });
  if(bodyCut.triangles<280||hoovesCut.triangles<20)
   throw Error('BTC V20 native donor unexpectedly incomplete: '+bodyCut.triangles+'/'+hoovesCut.triangles);
  donor=attachNativeDonor(original,bodyCut.geometry,anatomy.materials[0],
   'BTC V20 original Gallop hind limbs with original skin weights');
  donorHooves=attachNativeDonor(hoof,hoovesCut.geometry,anatomy.materials[1],
   'BTC V20 original Gallop posterior hoof keratin');
 }catch(e){
  donor?.removeFromParent();donorHooves?.removeFromParent();
  bodyCut?.geometry.dispose();hoovesCut?.geometry.dispose();
  crop.restore();throw e;
 }
 let disposed=false;
 return {
  snapshot:{
   build:'btc-v20-native-hind-gallop-20261105',
   originalNativeSkeleton:true,originalGallopPreserved:true,
   donorHindTriangles:bodyCut.triangles,
   donorHoofTriangles:hoovesCut.triangles,
   removedMayaTriangles:crop.removedMayaTriangles,
   removedMayaHoofTriangles:crop.removedMayaHoofTriangles,
   sameOriginalSkeleton:donor.skeleton===original.skeleton&&donorHooves.skeleton===original.skeleton
  },
  dispose(){
   if(disposed)return;disposed=true;
   donor.removeFromParent();donorHooves.removeFromParent();
   bodyCut.geometry.dispose();hoovesCut.geometry.dispose();
   crop.restore();
  }
 };
}
