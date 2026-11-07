/**
 * BTC V22 · native hind-leg transplant for the Maya anatomical horse.
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


/**
 * Clip, rather than delete, boundary triangles of the actual Maya skinned
 * surface. The V20b centroid predicate produced jagged hanging polygons
 * exactly at the upper leg/rump junction.
 *
 * A triangle crossing the cut gets two new points on its existing edges.
 * Skin weights are interpolated by bone ID, then renormalised. Both sides
 * of a shared edge reuse the same intersection vertex (no T-junction).
 * This affects ONLY the posterior-limb cut zone.
 */
function cropMayaHind(anatomy){
 const geo=anatomy.geometry,idx=geo.getIndex(),pos=geo.getAttribute('position');
 const skinIndex=geo.getAttribute('skinIndex'),skinWeight=geo.getAttribute('skinWeight');
 if(!idx||!pos||!skinIndex||!skinWeight||!geo.groups?.length)
  throw Error('BTC V22 needs indexed skinned Maya coat and hoof groups');
 const old={index:idx,position:pos,skinIndex,skinWeight,
  normal:geo.getAttribute('normal'),groups:geo.groups.map(g=>({...g}))};
 const xyz=Array.from(pos.array),bones=Array.from(skinIndex.array),
  weights=Array.from(skinWeight.array);
 const originalCount=pos.count;
 const edgeCache=new Map(),next=[],groups=[];
 let fullyRemoved=0,clipped=0;
 // Positive means retained. Cut only rear, lateral, low-leg tissue,
 // preserving the centerline of the body and all front limbs.
 function distance(v){
  const x=xyz[v*3],y=xyz[v*3+1],z=xyz[v*3+2];
  return Math.max(z-.0208,.0052-y,.0015-Math.abs(x));
 }
 function intersection(a,b,da,db){
  const key=a<b?a+':'+b:b+':'+a;
  if(edgeCache.has(key))return edgeCache.get(key);
  const t=THREE.MathUtils.clamp(da/(da-db),0,1);
  const id=xyz.length/3;
  for(let k=0;k<3;k++)xyz.push(xyz[a*3+k]*(1-t)+xyz[b*3+k]*t);
  const influences=new Map();
  for(const [v,factor] of [[a,1-t],[b,t]])for(let k=0;k<4;k++){
   const w=weights[v*4+k]*factor;
   if(w<=1e-8)continue;
   const joint=bones[v*4+k];
   influences.set(joint,(influences.get(joint)||0)+w);
  }
  const top=[...influences].sort((x,y)=>y[1]-x[1]).slice(0,4);
  const sum=top.reduce((n,v)=>n+v[1],0)||1;
  for(let k=0;k<4;k++){bones.push(top[k]?.[0]||0);weights.push((top[k]?.[1]||0)/sum);}
  edgeCache.set(key,id);
  return id;
 }
 for(const group of old.groups){
  const start=next.length;
  for(let i=group.start;i<group.start+group.count;i+=3){
   const tri=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
   const d=tri.map(distance);
   const keep=d.map(v=>v>=0);
   if(keep.every(Boolean)){next.push(...tri);continue;}
   if(keep.every(v=>!v)){fullyRemoved++;continue;}
   clipped++;
   const boundary=[];
   for(let j=0;j<3;j++){
    const a=tri[j],b=tri[(j+1)%3],da=d[j],db=d[(j+1)%3];
    if(da>=0)boundary.push(a);
    if((da>=0)!==(db>=0))boundary.push(intersection(a,b,da,db));
   }
   for(let j=1;j<boundary.length-1;j++)
    next.push(boundary[0],boundary[j],boundary[j+1]);
  }
  groups.push({start,count:next.length-start,materialIndex:group.materialIndex});
 }
 if(fullyRemoved<1000||fullyRemoved>3600||clipped<15)
  throw Error('BTC V22 clipping outside known Maya anatomy: '+fullyRemoved+'/'+clipped);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setIndex(new THREE.Uint16BufferAttribute(next,1));
 geo.clearGroups();
 for(const g of groups)geo.addGroup(g.start,g.count,g.materialIndex);
 geo.deleteAttribute('normal');
 geo.computeVertexNormals();
 geo.computeBoundingSphere();
 return {removedMayaTriangles:fullyRemoved,cutTriangles:clipped,
  addedCutVertices:xyz.length/3-originalCount,keptMayaTriangles:next.length/3,
  seamMethod:'shared-edge-skinned-plane-clipping',
  restore(){
   geo.setAttribute('position',old.position);
   geo.setAttribute('skinIndex',old.skinIndex);
   geo.setAttribute('skinWeight',old.skinWeight);
   if(old.normal)geo.setAttribute('normal',old.normal);
   else geo.deleteAttribute('normal');
   geo.setIndex(old.index);geo.clearGroups();
   for(const g of old.groups)geo.addGroup(g.start,g.count,g.materialIndex);
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
 if(!hoof||hoof.skeleton?.bones?.length!==original.skeleton.bones.length||
  hoof.skeleton.bones.some((bone,i)=>bone.name!==original.skeleton.bones[i]?.name))
  throw Error('BTC V20 requires original GLB hoof mesh with identical bone order');
 // GLTFLoader creates separate Skeleton wrapper objects for sibling GLB
 // primitives even though both share the same 50 authored joint names.
 // Bind ALL donors to the Main skeleton to ensure matrix parity.
 const crop=cropMayaHind(anatomy);
 let donor=null,donorHooves=null,bodyCut=null,hoovesCut=null;
 try{
  bodyCut=clipNativeTriangles(original,(p)=>{
   const x=p.reduce((n,v)=>n+v[0],0)/3,
     y=p.reduce((n,v)=>n+v[1],0)/3,z=p.reduce((n,v)=>n+v[2],0)/3;
   // Full original Gallop joint topology from gaskin through fetlock.
   // Upper end tucks into the still-continuous Maya rump.
   return y>.00385&&z<.0268&&Math.abs(x)>.0010;
  });
  // Hide the unmatched Quaternius upper cut INSIDE the Maya croup.
  // V20b left this edge exposed; the posterior camera saw jagged shards.
  // The actual galloping hock, cannon and fetlock vertices BELOW z=.0208
  // are unchanged, as are every donor bone index and skin weight.
  const donorPos=bodyCut.geometry.getAttribute('position');
  let insetVertices=0;
  for(let i=0;i<donorPos.count;i++){
   const z=donorPos.getZ(i),y=donorPos.getY(i),x=donorPos.getX(i);
   if(z<=.0208||y<.0039||Math.abs(x)<.0010)continue;
   const u=THREE.MathUtils.clamp((z-.0208)/.0060,0,1);
   const t=u*u*(3-2*u);
   const centerX=Math.sign(x)*.0026;
   donorPos.setXYZ(i,
    centerX+(x-centerX)*(1-.91*t),
    .0116+(y-.0116)*(1-.72*t),
    z);
   insetVertices++;
  }
  donorPos.needsUpdate=true;
  bodyCut.geometry.deleteAttribute('normal');
  bodyCut.geometry.computeVertexNormals();
  bodyCut.geometry.computeBoundingSphere();
  bodyCut.insetVertices=insetVertices;
  hoovesCut=clipNativeTriangles(hoof,p=>{
   const cy=p.reduce((s,v)=>s+v[1],0)/3;
   return cy>.003;
  });
  if(bodyCut.triangles<280||hoovesCut.triangles<20)
   throw Error('BTC V20 native donor unexpectedly incomplete: '+bodyCut.triangles+'/'+hoovesCut.triangles);
  donor=attachNativeDonor(original,bodyCut.geometry,anatomy.materials[0],
   'BTC V20 original Gallop hind limbs with original skin weights');
  donorHooves=attachNativeDonor(original,hoovesCut.geometry,anatomy.materials[1],
   'BTC V20 original Gallop posterior hoof keratin');
 }catch(e){
  donor?.removeFromParent();donorHooves?.removeFromParent();
  bodyCut?.geometry.dispose();hoovesCut?.geometry.dispose();
  crop.restore();throw e;
 }
 let disposed=false;
 return {
  snapshot:{
   build:'btc-v22-continuous-hind-seam-20261107',
   originalNativeSkeleton:true,originalGallopPreserved:true,
   donorHindTriangles:bodyCut.triangles,
   donorHoofTriangles:hoovesCut.triangles,
   removedMayaTriangles:crop.removedMayaTriangles,
   cutTriangles:crop.cutTriangles,addedCutVertices:crop.addedCutVertices,
   seamMethod:crop.seamMethod,donorUpperInsetVertices:bodyCut.insetVertices,
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
