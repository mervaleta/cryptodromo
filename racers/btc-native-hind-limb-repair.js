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

// Isolated geometry A/B: lower the paired Maya/donor posterior cut by 1 mm.
// The previous 20 mm cross-section left a 4.31 mm maximum rim mismatch in real WebGL.
// This is a candidate parameter, not a numbered or approved version.
const BTC_SEAM_CUT_Z = 0.0190;


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
 // Preserve the Maya source rest coordinates alongside the sculpted runtime
 // positions. Hoof flare can make two originally disconnected five-face
 // scraps appear coincident in deformed space; topology must be classified
 // in source space, before the sculpt can weld those fragments by accident.
 const restSource=anatomy.restPositions;
 if(!restSource||restSource.length!==pos.array.length)
  throw Error('BTC posterior cleanup requires original Maya rest-space positions');
 const restXYZ=Array.from(restSource);
 // Preserve authored Maya surface normals on the open posterior cut.
 // Recomputing normals from the cropped, open triangles tilts the rim
 // toward the exposed interior and creates dark wedge-shaped shading.
 const nativeNormals=old.normal?Array.from(old.normal.array):null;
 const originalCount=pos.count;
 const edgeCache=new Map(),next=[],groups=[];
 let fullyRemoved=0,clipped=0;
 // Exact original Maya face signatures of the two five-face posterior
 // scraps found by running this same crop in unsculpted rest space. Runtime
 // hoof flare can move their vertices across the cut and reconnect them to
 // the retained shell, so post-sculpt component detection alone is too late.
 // Remove these source faces before clipping, while preserving every other
 // Maya face and its authored skin weights.
 const auditedScrapFaces=new Map([
  ['2565:2570:2571',-1],['2524:2525:2571',-1],
  ['2525:2570:2571',-1],['2565:2571:2572',-1],
  ['2524:2571:2572',-1],
  ['4163:4167:4168',1],['4163:4168:4322',1],
  ['4168:4322:4325',1],['4167:4168:4285',1],
  ['4168:4285:4325',1]
 ]);
 const removedScrapFaces=new Set(),removedScrapSides=new Set();
 // Exact polygon difference for the two convex posterior-limb crop lobes.
 // Each face is partitioned by the three boundary planes; the surviving
 // pieces are triangulated independently, so hidden centerline islands
 // cannot be bridged by an edge with two crossings.
 const planes=[
  {id:'z',f:v=>BTC_SEAM_CUT_Z-xyz[3*v+2]},
  // P0 anatomy A/B: remove low hanging Maya rump flaps up to 5.2 mm,
  // leaving the upper haunch untouched. Must be judged on real WebGL
  // rear/threeQuarter frames against artifact 14135961152; not approved.
  {id:'y',f:v=>xyz[3*v+1]-.0052},
  // Real WebGL A/B of run 43703166983 against 43649277060 shows
  // larger triangular tears at the rump and stifle with x=0.00010.
  // Restore the conservative 1.5 mm native midline strip while
  // retaining the improved distal-foot cut and topology safeguards.
  {id:'L',f:v=>-xyz[3*v]-.0015},
  {id:'R',f:v=>xyz[3*v]-.0015},
  // The old Maya hind-foot debris straddles the sagittal x cut. Below
  // the hock (y <= .0095) AND at z <= .002, cut the residual rear-foot tip, including the centerline
  // strip that the bilateral x-threshold leaves behind.
  {id:'footZ',f:v=>.002-xyz[3*v+2]},
  {id:'footY',f:v=>.0095-xyz[3*v+1]}
 ];
 function crossing(a,b,p){
  const da=p.f(a),db=p.f(b);
  if(Math.abs(da)<1e-12)return a;
  if(Math.abs(db)<1e-12)return b;
  const key=p.id+':'+Math.min(a,b)+':'+Math.max(a,b);
  if(edgeCache.has(key))return edgeCache.get(key);
  const t=da/(da-db),v=xyz.length/3;
  if(t<0||t>1||!Number.isFinite(t))throw Error('BTC invalid crop plane crossing');
  for(let k=0;k<3;k++){
   xyz.push(xyz[a*3+k]*(1-t)+xyz[b*3+k]*t);
   restXYZ.push(restXYZ[a*3+k]*(1-t)+restXYZ[b*3+k]*t);
  }
  if(nativeNormals){
   const n=[0,1,2].map(k=>nativeNormals[3*a+k]*(1-t)+nativeNormals[3*b+k]*t);
   const len=Math.hypot(...n)||1;
   nativeNormals.push(...n.map(c=>c/len));
  }
  const blend=new Map();
  for(const [u,f] of [[a,1-t],[b,t]])for(let k=0;k<4;k++){
   const weight=weights[4*u+k]*f;
   if(weight>1e-9){const joint=bones[4*u+k];blend.set(joint,(blend.get(joint)||0)+weight);}
  }
  const top=[...blend].sort((x,y)=>y[1]-x[1]).slice(0,4);
  const sum=top.reduce((s,x)=>s+x[1],0)||1;
  for(let k=0;k<4;k++){bones.push(top[k]?.[0]||0);weights.push((top[k]?.[1]||0)/sum);}
  edgeCache.set(key,v);return v;
 }
 function clip(poly,p,inside){
  if(poly.length<3)return [];
  const keep=v=>inside?p.f(v)>=-1e-12:p.f(v)<=1e-12;
  const out=[];
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],ia=keep(a),ib=keep(b);
   if(ia)out.push(a);
   if(ia!==ib)out.push(crossing(a,b,p));
  }
  const unique=[];
  for(const v of out)if(unique.at(-1)!==v)unique.push(v);
  if(unique.length>1&&unique[0]===unique.at(-1))unique.pop();
  return unique;
 }
 function subtract(poly,side){
  let active=poly;const kept=[];
  for(const plane of [planes[0],planes[1],side]){
   if(active.length<3)break;
   // A coplanar polygon belongs to the positive side only. Otherwise
   // both clip() calls retain the same boundary face and generate
   // coincident triangles, dark seams and non-manifold cut surfaces.
   const signs=active.map(plane.f);
   if(signs.every(v=>v>=-1e-12))continue;
   if(signs.every(v=>v<=-1e-12)){kept.push(active);active=[];break;}
   const outside=clip(active,plane,false);
   if(outside.length>=3)kept.push(outside);
   active=clip(active,plane,true);
  }
  return kept;
 }
 function area(poly){
  if(poly.length<3)return 0;
  const a=poly[0],ax=xyz[a*3],ay=xyz[a*3+1],az=xyz[a*3+2];
  let sum=0;
  for(let i=1;i<poly.length-1;i++){
   const b=poly[i],c=poly[i+1],bx=xyz[b*3]-ax,by=xyz[b*3+1]-ay,bz=xyz[b*3+2]-az,
    cx=xyz[c*3]-ax,cy=xyz[c*3+1]-ay,cz=xyz[c*3+2]-az;
   sum+=Math.hypot(by*cz-bz*cy,bz*cx-bx*cz,bx*cy-by*cx)/2;
  }
  return sum;
 }
 for(const group of old.groups){
  const start=next.length;
  for(let i=group.start;i<group.start+group.count;i+=3){
   const tri=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
   const sourceFaceKey=tri.slice().sort((a,b)=>a-b).join(':');
   if(auditedScrapFaces.has(sourceFaceKey)){
    const side=auditedScrapFaces.get(sourceFaceKey);
    const center=[0,1,2].map(k=>(restXYZ[3*tri[0]+k]+restXYZ[3*tri[1]+k]+restXYZ[3*tri[2]+k])/3);
    if(Math.sign(center[0])!==side||Math.abs(center[0])<.0012||
       Math.abs(center[0])>.0018||center[1]<.007||center[1]>.011||
       center[2]<0||center[2]>=.0015)
     throw Error('BTC audited Maya scrap face moved outside its original rest-space signature: '+sourceFaceKey);
    if(removedScrapFaces.has(sourceFaceKey))
     throw Error('BTC audited Maya scrap face appears more than once: '+sourceFaceKey);
    removedScrapFaces.add(sourceFaceKey);removedScrapSides.add(side);
    fullyRemoved++;
    continue;
   }
   let polys=subtract(tri,planes[2]);
   polys=polys.flatMap(p=>subtract(p,planes[3]));
   // Surgical removal of the residual original low hind-foot strip.
   // This is a genuine cut of Maya polygons, not a synthetic island count.
   polys=polys.flatMap(p=>{
    let active=p,kept=[];
    for(const plane of [planes[4],planes[5]]){
     if(active.length<3)break;
     const signs=active.map(plane.f);
     if(signs.every(v=>v>=-1e-12))continue;
     if(signs.every(v=>v<=-1e-12)){kept.push(active);active=[];break;}
     const outside=clip(active,plane,false);
     if(outside.length>=3)kept.push(outside);
     active=clip(active,plane,true);
    }
    return kept;
   });
   let retained=0;
   for(const p of polys){
    if(area(p)<1e-18)continue;
    retained+=area(p);
    for(let j=1;j<p.length-1;j++)next.push(p[0],p[j],p[j+1]);
   }
   const original=area(tri);
   if(retained<Math.max(1e-18,original*1e-8))fullyRemoved++;
   else if(retained<original*(1-1e-7))clipped++;
  }
  groups.push({start,count:next.length-start,materialIndex:group.materialIndex});
 }
 if(removedScrapFaces.size!==10||removedScrapSides.size!==2)
  throw Error('BTC original Maya posterior scraps were not all found and removed: '+
   removedScrapFaces.size+'/10 faces across '+removedScrapSides.size+'/2 sides');
 if(fullyRemoved<1000||fullyRemoved>3600||clipped<15)
  throw Error('BTC V22 clipping outside known Maya anatomy: '+fullyRemoved+'/'+clipped);
 // A complete edge clip can leave tiny DISCONNECTED hoof islands from
 // the old Maya posterior feet. Two five-face components survive around
 // y≈.009, z≈.0005 and appear as airborne polygon shrapnel in actual
 // Chromium profile/rear captures. Prune only those separate components,
 // never connected flesh, caps, or donor GLB limbs.
 // Connected surface components must be joined by a SHARED EDGE, not
 // merely a vertex index: two shells touching at one point are not one
 // watertight surface. The old vertex union silently joined these hanging
 // foot scraps to the torso and the pruning gate could never see them.
 const triangleCount=next.length/3;
 const parent=Array.from({length:triangleCount},(_,i)=>i);
 const root=(id)=>{
  while(parent[id]!==id){parent[id]=parent[parent[id]];id=parent[id];}
  return id;
 };
 const join=(a,b)=>{a=root(a);b=root(b);if(a!==b)parent[a]=b;};
 // Maya can split vertex IDs at material/UV seams even where positions
 // coincide. Shared-edge classification by index alone misses real spatial
 // neighbors and can incorrectly identify skin fragments as independent.
 // Weld only for TOPOLOGICAL CONNECTIVITY, never alter geometry or weights.
 const welded=new Map(),edgeOwner=new Map();
 function weldedId(v){
  const key=[restXYZ[3*v],restXYZ[3*v+1],restXYZ[3*v+2]]
   .map(n=>Math.round(n*1e7)).join(':');
  if(!welded.has(key))welded.set(key,welded.size);
  return welded.get(key);
 }
 for(let i=0;i<next.length;i+=3){
  const tri=i/3,vs=[next[i],next[i+1],next[i+2]].map(weldedId);
  for(let k=0;k<3;k++){
   const a=vs[k],b=vs[(k+1)%3];
   if(a===b)continue;
   const key=a<b?a+':'+b:b+':'+a;
   if(edgeOwner.has(key))join(tri,edgeOwner.get(key));
   else edgeOwner.set(key,tri);
  }
 }
 const counts=new Map(),limits=new Map();
 for(let i=0;i<next.length;i+=3){
  const r=root(i/3);counts.set(r,(counts.get(r)||0)+1);
  const l=limits.get(r)||{x:0,y:0,z:0,n:0};
  for(let k=0;k<3;k++){
   const v=next[i+k];
   l.x+=restXYZ[v*3];l.y+=restXYZ[v*3+1];l.z+=restXYZ[v*3+2];l.n++;
  }
  limits.set(r,l);
 }
 const posteriorComponentAudit=[];
 for(const [r,count] of counts){
  const l=limits.get(r),x=l.x/l.n,y=l.y/l.n,z=l.z/l.n;
  // The ten authored source scrap faces are removed above. Exact clipping
  // then leaves four disconnected descendants in the same original
  // rest-space island: 5- and 11-triangle fragments on each flank. These
  // are still the two measured Maya hind-foot scraps, not connected flesh.
  if(count<=32&&Math.abs(x)>=.0010&&Math.abs(x)<=.0020&&
     y>=.0060&&y<=.0120&&z>=0&&z<.0020){
   posteriorComponentAudit.push({root:r,triangles:count,side:Math.sign(x),center:[x,y,z]});
  }
 }
 // Fail closed unless the residual geometry is exactly the bilateral,
 // mirrored 5+11-triangle split observed after the ten source faces are
 // removed. A new component, changed anatomy, or one-sided remnant must
 // be inspected rather than silently culled.
 if(posteriorComponentAudit.length){
  const bySide=new Map([[-1,[]],[1,[]]]);
  for(const c of posteriorComponentAudit)bySide.get(c.side)?.push(c);
  const left=bySide.get(-1).sort((a,b)=>a.triangles-b.triangles);
  const right=bySide.get(1).sort((a,b)=>a.triangles-b.triangles);
  const valid=posteriorComponentAudit.length===4&&left.length===2&&right.length===2&&
   left.every((c,i)=>c.triangles===[5,11][i]&&
    Math.abs(c.center[0])>=.0015&&Math.abs(c.center[0])<=.0018&&
    c.center[1]>=.0095&&c.center[1]<=.0107&&c.center[2]>=0&&c.center[2]<.0010)&&
   right.every((c,i)=>c.triangles===[5,11][i]&&
    Math.abs(c.center[0])>=.0015&&Math.abs(c.center[0])<=.0018&&
    c.center[1]>=.0095&&c.center[1]<=.0107&&c.center[2]>=0&&c.center[2]<.0010)&&
   [0,1].every(i=>Math.abs(Math.abs(left[i].center[0])-Math.abs(right[i].center[0]))<.00008&&
    Math.abs(left[i].center[1]-right[i].center[1])<.00008&&
    Math.abs(left[i].center[2]-right[i].center[2])<.00008);
  if(!valid)
   throw Error('BTC unexpected posterior remnants after exact Maya scrap-face removal: '+
    JSON.stringify(posteriorComponentAudit));
 }
 const posteriorFragmentRoots=new Set(posteriorComponentAudit.map(c=>c.root));
 const pruned=[],cleanGroups=[];
 let residualTrianglesRemoved=0;
 for(const group of groups){
  const start=pruned.length;
  for(let i=group.start;i<group.start+group.count;i+=3){
   if(posteriorFragmentRoots.has(root(i/3))){residualTrianglesRemoved++;continue;}
   pruned.push(next[i],next[i+1],next[i+2]);
  }
  cleanGroups.push({start,count:pruned.length-start,materialIndex:group.materialIndex});
 }
 const isolatedTrianglesRemoved=removedScrapFaces.size+residualTrianglesRemoved;
 geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setIndex(new THREE.Uint16BufferAttribute(pruned,1));
 geo.clearGroups();
 for(const g of cleanGroups)geo.addGroup(g.start,g.count,g.materialIndex);
 if(nativeNormals){
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nativeNormals,3));
 }else{
  geo.deleteAttribute('normal');
  geo.computeVertexNormals();
 }
 geo.computeBoundingSphere();
 return {removedMayaTriangles:fullyRemoved,cutTriangles:clipped,
  addedCutVertices:xyz.length/3-originalCount,keptMayaTriangles:pruned.length/3,
  isolatedMayaPosteriorIslandsRemoved:removedScrapSides.size,
  isolatedMayaPosteriorTrianglesRemoved:isolatedTrianglesRemoved,
  isolatedMayaPosteriorComponentAudit:posteriorComponentAudit,
  isolatedMayaPosteriorSourceFaceKeys:[...removedScrapFaces].sort(),
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
 // The authored GLB duplicates vertex indices along UV/hard-normal seams.
 // Connectivity by raw indices misclassifies real limb surfaces as scraps.
 // Weld ONLY for component classification, not geometry or skin weights.
 // Discard tiny disconnected posterior polygons introduced by the centroid
 // extraction. Keep every large limb/hoof component intact.
 const welded=new Map(),componentEdge=new Map();
 const findKey=id=>{
  const key=[pos.getX(id),pos.getY(id),pos.getZ(id)]
   .map(v=>Math.round(v*1e6)).join(':');
  if(!welded.has(key))welded.set(key,welded.size);
  return welded.get(key);
 };
 const parent=Array.from({length:selected.length/3},(_,i)=>i);
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const join=(a,b)=>{a=root(a);b=root(b);if(a!==b)parent[a]=b;};
 for(let i=0;i<selected.length;i+=3){
  const tri=i/3;
  // Only shared welded EDGES join surface triangles. A one-point
  // contact between a discarded fragment and a leg is not a skin seam.
  const verts=[0,1,2].map(k=>findKey(selected[i+k]));
  for(let k=0;k<3;k++){
   const a=verts[k],b=verts[(k+1)%3];
   if(a===b)continue;
   const edge=a<b?a+':'+b:b+':'+a;
   if(componentEdge.has(edge))join(tri,componentEdge.get(edge));
   else componentEdge.set(edge,tri);
  }
 }
 const sizes=new Map();
 for(let i=0;i<selected.length/3;i++){
  const key=root(i);sizes.set(key,(sizes.get(key)||0)+1);
 }
 // Real 3/4 WebGL captures still contain a detached keratin shard below
 // the hind hooves. The earlier <=8-face filter misses larger scraps
 // created by centroid extraction. Only reject isolated <=32-face shells;
 // the existing 10% safety limit prevents loss of a substantial hoof.
 // The native GLB hoof primitive has only 44 triangles TOTAL, split
 // between two legitimate hind-hoof shells (~22 faces each). A uniform
 // 32-face debris cutoff erased BOTH real hooves and aborted WebGL startup.
 // Use a small, source-specific cutoff; preserve the two authored hooves.
 const isHoofPrimitive=[mesh.material].flat().some(m=>m?.name==='Hooves');
 const tinyLimit=isHoofPrimitive?3:32;
 const tiny=new Set([...sizes].filter(([,count])=>count<=tinyLimit).map(([key])=>key));
 const cleaned=[];
 for(let i=0;i<selected.length;i+=3){
  if(!tiny.has(root(i/3)))cleaned.push(selected[i],selected[i+1],selected[i+2]);
 }
 // Fail closed if the selection was mostly debris or if a valid limb
 // could have been misclassified as a small disconnected component.
 if(cleaned.length<selected.length*.9)
  throw Error('BTC donor component surgery exceeds safe 10% limit');
 const trimmed=geo.clone();
 trimmed.setIndex(cleaned);
 trimmed.clearGroups();
 trimmed.addGroup(0,cleaned.length,0);
 trimmed.computeBoundingSphere();
 return {geometry:trimmed,triangles:cleaned.length/3,discardedTinyDonorTriangles:(selected.length-cleaned.length)/3};
}

/**
 * Subdivide the ACTUAL rigged GLB donor surface, not a fake cylinder drawn
 * over it. Quaternius splits 3D vertices at UV/hard-normal seams:
 * 3086 triangle-corner vertices represent only ~827 spatial locations.
 * Weld those coincident native points (the coat has no UV dependence here),
 * then apply two conservative Loop subdivision passes to round the limbs.
 * Preserve all native Gallop bone indices at old vertices; interpolate
 * influences at new edge vertices. No separately animated skeleton.
 */

/**
 * Candidate posterior donor boundary: cut ACTUAL skinned triangles at the
 * anatomical planes. The old centroid selection kept whole triangles whose
 * corners protruded into the rump, producing a sawtooth Quaternius skirt.
 * This is an isolated BTC lookdev change, not a V23 approval.
 */
function clipNativeBodyHindExact(mesh){
 const src=mesh.geometry,idx=src.getIndex(),pos=src.getAttribute('position'),
  ji=src.getAttribute('skinIndex'),jw=src.getAttribute('skinWeight');
 if(!idx||!pos||!ji||!jw)throw Error('BTC exact hind donor needs skinned indexed geometry');
 const xyz=Array.from(pos.array),bones=Array.from(ji.array),weights=Array.from(jw.array);
 const faces=[],edgePoints=new Map();
 const planes=[
  // Match the three exact planes of cropMayaHind's upper posterior
  // subtraction. Previously the donor began 0.25 mm above and ahead of
  // the host opening and 0.50 mm farther inward on each flank. Those
  // mismatched cuts create an unfillable dark band before any rig motion.
  // The donor remains an isolated candidate until rear/3Q WebGL A/B.
  {id:'y',f:v=>xyz[3*v+1]-.0052},
  {id:'z',f:v=>BTC_SEAM_CUT_Z-xyz[3*v+2]},
  {id:'R',f:v=>xyz[3*v]-.0015},
  {id:'L',f:v=>-xyz[3*v]-.0015}
 ];
 function intersection(a,b,plane){
  const fa=plane.f(a),fb=plane.f(b);
  if(Math.abs(fa)<1e-12)return a;
  if(Math.abs(fb)<1e-12)return b;
  const key=plane.id+':'+Math.min(a,b)+':'+Math.max(a,b);
  if(edgePoints.has(key))return edgePoints.get(key);
  const t=fa/(fa-fb);
  if(!Number.isFinite(t)||t<0||t>1)
   throw Error('BTC donor exact crop invalid edge crossing '+plane.id);
  const v=xyz.length/3;
  for(let k=0;k<3;k++)xyz.push(xyz[3*a+k]*(1-t)+xyz[3*b+k]*t);
  const influence=new Map();
  for(const [id,factor] of [[a,1-t],[b,t]])for(let k=0;k<4;k++){
   const w=weights[4*id+k]*factor;
   if(w>1e-9){const j=bones[4*id+k];influence.set(j,(influence.get(j)||0)+w);}
  }
  const sorted=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const total=sorted.reduce((sum,x)=>sum+x[1],0)||1;
  for(let k=0;k<4;k++){
   bones.push(sorted[k]?.[0]||0);
   weights.push((sorted[k]?.[1]||0)/total);
  }
  edgePoints.set(key,v);return v;
 }
 function clip(poly,plane){
  if(poly.length<3)return [];
  const out=[];
  for(let k=0;k<poly.length;k++){
   const a=poly[k],b=poly[(k+1)%poly.length],
    ia=plane.f(a)>=-1e-12,ib=plane.f(b)>=-1e-12;
   if(ia)out.push(a);
   if(ia!==ib)out.push(intersection(a,b,plane));
  }
  const unique=[];
  for(const v of out)if(unique.at(-1)!==v)unique.push(v);
  if(unique.length>1&&unique[0]===unique.at(-1))unique.pop();
  return unique;
 }
 let sourceFaces=0,cutFaces=0;
 for(let i=0;i<idx.count;i+=3){
  const tri=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
  // The two disjoint flanks share the height and longitudinal cuts.
  const common=clip(clip(tri,planes[0]),planes[1]);
  if(common.length<3)continue;
  sourceFaces++;
  for(const side of [planes[2],planes[3]]){
   const poly=clip(common,side);
   if(poly.length<3)continue;
   if(poly.length!==3||poly.some(v=>!tri.includes(v)))cutFaces++;
   for(let j=1;j<poly.length-1;j++){
    const a=poly[0],b=poly[j],c=poly[j+1];
    if(a===b||b===c||a===c)continue;
    const ux=xyz[3*b]-xyz[3*a],uy=xyz[3*b+1]-xyz[3*a+1],uz=xyz[3*b+2]-xyz[3*a+2];
    const vx=xyz[3*c]-xyz[3*a],vy=xyz[3*c+1]-xyz[3*a+1],vz=xyz[3*c+2]-xyz[3*a+2];
    const areaSq=(uy*vz-uz*vy)**2+(uz*vx-ux*vz)**2+(ux*vy-uy*vx)**2;
    if(areaSq>1e-24)faces.push(a,b,c);
   }
  }
 }
 if(faces.length<300||cutFaces===0)
  throw Error('BTC exact donor crop produced insufficient real geometry '+faces.length+'/'+cutFaces);
 // The exact donor clip runs AFTER the old centroid-based fragment cleanup.
 // Cutting a triangle at the posterior planes can create NEW detached
 // slivers which the old cleanup never sees. Remove only tiny, truly
 // disconnected low-body components; do not remove the authored hoof mesh.
 // Weld spatially for classification (UV seams have duplicate IDs), but
 // preserve every actual skinned vertex and all accepted large surfaces.
 const parent=Array.from({length:faces.length/3},(_,i)=>i);
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[a]=b;};
 const physicalVertex=new Map(),edgeOwner=new Map();
 const keyFor=v=>{
  const key=[xyz[3*v],xyz[3*v+1],xyz[3*v+2]]
   .map(x=>Math.round(x*1e7)).join(':');
  if(!physicalVertex.has(key))physicalVertex.set(key,physicalVertex.size);
  return physicalVertex.get(key);
 };
 for(let i=0;i<faces.length;i+=3){
  const t=i/3,ids=[keyFor(faces[i]),keyFor(faces[i+1]),keyFor(faces[i+2])];
  for(let k=0;k<3;k++){
   const a=ids[k],b=ids[(k+1)%3];
   if(a===b)continue;
   const edge=a<b?a+':'+b:b+':'+a;
   if(edgeOwner.has(edge))union(t,edgeOwner.get(edge));
   else edgeOwner.set(edge,t);
  }
 }
 const components=new Map();
 for(let i=0;i<faces.length;i+=3){
  const id=find(i/3),c=components.get(id)||{count:0,y:0,n:0};
  c.count++;
  for(let k=0;k<3;k++){
   c.y+=xyz[3*faces[i+k]+1];c.n++;
  }
  components.set(id,c);
 }
 const debris=new Set([...components].filter(([,c])=>
  c.count<=8&&c.y/c.n<.012).map(([id])=>id));
 const cleaned=[];
 let removedDonorSliverTriangles=0;
 for(let i=0;i<faces.length;i+=3){
  if(debris.has(find(i/3))){removedDonorSliverTriangles++;continue;}
  cleaned.push(faces[i],faces[i+1],faces[i+2]);
 }
 if(removedDonorSliverTriangles>20)
  throw Error('BTC exact donor cleanup would remove legitimate anatomy: '+removedDonorSliverTriangles);
 const out=new THREE.BufferGeometry();
 out.setIndex(cleaned);
 out.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 out.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 out.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 out.computeVertexNormals();out.computeBoundingSphere();
 return {geometry:out,triangles:cleaned.length/3,
  discardedTinyDonorTriangles:removedDonorSliverTriangles,exactCutFaces:cutFaces,sourceFaces};
}

function refineSkinnedDonor(source,passes=2){
 const pos=source.getAttribute('position'),joints=source.getAttribute('skinIndex'),
  weights=source.getAttribute('skinWeight'),index=source.getIndex();
 if(!index||!joints||!weights)throw Error('BTC V22 cannot refine a non-rigged donor');
 const unique=new Map(),vertices=[],faces=[];
 const getVertex=id=>{
  const point=[pos.getX(id),pos.getY(id),pos.getZ(id)];
  const key=point.map(x=>Math.round(x*1e7)).join(':');
  // UV/hard-normal seam duplicates can carry DIFFERENT skin influences.
  // The old positional weld retained the first corner's weights and silently
  // discarded every other source vertex at that same location. During Gallop
  // this assigns an arbitrary bone to the entire welded ring. Accumulate each
  // distinct authored source vertex exactly once before subdivision.
  let v=unique.get(key);
  if(v===undefined){
   v=vertices.length;
   vertices.push({p:point,w:new Map(),sources:new Set()});
   unique.set(key,v);
  }
  const target=vertices[v];
  if(!target.sources.has(id)){
   target.sources.add(id);
   for(let k=0;k<4;k++){
    const w=weights.getComponent(id,k);
    if(w>1e-8){
     const bone=joints.getComponent(id,k);
     target.w.set(bone,(target.w.get(bone)||0)+w);
    }
   }
  }
  return v;
 };
 for(let i=0;i<index.count;i+=3){
  const tri=[getVertex(index.getX(i)),getVertex(index.getX(i+1)),getVertex(index.getX(i+2))];
  if(new Set(tri).size===3)faces.push(tri);
 }
 // Average all coincident authored influences, independent of how often
 // each vertex appeared in the triangle index buffer. Retain a normalized
 // convex blend; downstream subdivision still interpolates bone weights.
 for(const v of vertices){
  const n=v.sources.size;
  if(!n)throw Error('BTC welded donor vertex has no skin sources');
  for(const [bone,w] of v.w)v.w.set(bone,w/n);
  delete v.sources;
 }
 let vs=vertices,fs=faces;
 const combine=(parts)=>{
  const p=[0,0,0],w=new Map();
  for(const [v,factor] of parts){
   for(let a=0;a<3;a++)p[a]+=v.p[a]*factor;
   for(const [joint,amount] of v.w)w.set(joint,(w.get(joint)||0)+amount*factor);
  }
  return {p,w};
 };
 for(let pass=0;pass<passes;pass++){
  const adj=Array.from({length:vs.length},()=>new Set()),edges=new Map();
  const edge=(a,b,opp)=>{
   const key=a<b?a+':'+b:b+':'+a;
   const info=edges.get(key)||{a:Math.min(a,b),b:Math.max(a,b),opp:[]};
   info.opp.push(opp);edges.set(key,info);
   adj[a].add(b);adj[b].add(a);
  };
  for(const [a,b,d] of fs){edge(a,b,d);edge(b,d,a);edge(d,a,b);}
  const boundary=Array.from({length:vs.length},()=>new Set());
  for(const e of edges.values())if(e.opp.length===1){
   boundary[e.a].add(e.b);boundary[e.b].add(e.a);
  }
  const next=[];
  for(let i=0;i<vs.length;i++){
   const near=Array.from(boundary[i]),valence=adj[i].size;
   // Interior vertices on an exact clipping plane must be pinned too.
   // Previous Loop smoothing constrained open-rim vertices and cut-plane
   // edge midpoints, but could still pull a shared interior cut vertex
   // off the plane. That bends adjacent triangles into the host surface
   // and makes a visible serrated wedge at the Maya/GLB rump join.
   const onExactCutPlane=[
    [1,.0052],[2,BTC_SEAM_CUT_Z],[0,.0015],[0,-.0015]
   ].some(([axis,value])=>Math.abs(vs[i].p[axis]-value)<1e-7);
   if(near.length>0||onExactCutPlane){
    // Every vertex incident to an open boundary is constrained, including
    // cut corners with one or three boundary neighbors. Leaving those
    // corners in the interior smoothing branch distorts the exact seam.
    // A cut rim is a geometric constraint, not a free Loop boundary.
    // Smoothing it inward moves the clipped thigh skirt away from the
    // intended anatomical cut and opens a visible dark seam in WebGL.
    // Keep the original boundary vertex fixed on BOTH subdivision passes;
    // boundary edge midpoints below remain exact linear interpolations.
    next.push(vs[i]);
   }else if(valence>=3){
    const beta=valence===3?3/16:3/(8*valence);
    const terms=[[vs[i],1-valence*beta],...Array.from(adj[i],v=>[vs[v],beta])];
    next.push(combine(terms));
   }else next.push(vs[i]);
  }
  const mid=new Map();
  for(const [key,e] of edges){
   const [a,b]=[vs[e.a],vs[e.b]];
   // Cut-plane constraints apply to EDGES as well as vertices. An edge
   // between two points on the same exact y/z/x clipping plane can have
   // two adjacent faces; ordinary Loop's opposite-vertex stencil then
   // pushes its midpoint off the plane and reopens the rump/limb seam.
   // Preserve a linear midpoint on all such coplanar cut edges.
   const onCutPlane=(p,q)=>[
    [1,.0052],[2,BTC_SEAM_CUT_Z],[0,.0015],[0,-.0015]
   ].some(([axis,value])=>Math.abs(p[axis]-value)<1e-7&&
                            Math.abs(q[axis]-value)<1e-7);
   const constrained=e.opp.length!==2||onCutPlane(a.p,b.p);
   const m=constrained
    ?combine([[a,.5],[b,.5]])
    :combine([[a,.375],[b,.375],[vs[e.opp[0]],.125],[vs[e.opp[1]],.125]]);
   mid.set(key,next.length);next.push(m);
  }
  const find=(a,b)=>mid.get(a<b?a+':'+b:b+':'+a);
  const tris=[];
  for(const [a,b,d] of fs){
   const ab=find(a,b),bd=find(b,d),da=find(d,a);
   tris.push([a,ab,da],[b,bd,ab],[d,da,bd],[ab,bd,da]);
  }
  vs=next;fs=tris;
 }
 const p=[],sk=[],sw=[],facesOut=[];
 for(const v of vs){
  p.push(...v.p);
  const top=[...v.w].filter(([,w])=>w>1e-8).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const total=top.reduce((s,e)=>s+e[1],0)||1;
  for(let k=0;k<4;k++){sk.push(top[k]?.[0]||0);sw.push((top[k]?.[1]||0)/total);}
 }
 for(const tri of fs)facesOut.push(...tri);
 // Reject invalid topology before it can enter the GPU skinning path.
 // A collapsed face or non-manifold edge must never be hidden by shading.
 const edgeUses=new Map();
 for(const [a,b,c] of fs){
  const pa=vs[a]?.p,pb=vs[b]?.p,pc=vs[c]?.p;
  if(!pa||!pb||!pc||[...pa,...pb,...pc].some(v=>!Number.isFinite(v)))
   throw Error('BTC V22 donor subdivision produced non-finite geometry');
  const ab=pb.map((v,k)=>v-pa[k]),ac=pc.map((v,k)=>v-pa[k]);
  const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  if(cross.reduce((sum,v)=>sum+v*v,0)<1e-24)
   throw Error('BTC V22 donor subdivision produced a degenerate triangle');
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const key=u<v?u+':'+v:v+':'+u;
   const count=(edgeUses.get(key)||0)+1;
   if(count>2)throw Error('BTC V22 donor subdivision has a non-manifold edge');
   edgeUses.set(key,count);
  }
 }
 const out=new THREE.BufferGeometry();
 out.setIndex(facesOut);
 out.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 out.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(sk,4));
 out.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
 out.computeVertexNormals();out.computeBoundingSphere();
 return {geometry:out,sourceTriangles:faces.length,triangles:fs.length,
  vertices:vs.length,passes};
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
 const originalHostGeometry=anatomy.geometry;
 const originalMeshMaterial=anatomy.mesh.material;
 const crop=cropMayaHind(anatomy);
 let donorHooves=null,bodyCut=null,hoovesCut=null,combinedGeometry=null,donorMaterial=null;
 try{
  bodyCut=clipNativeBodyHindExact(original);

  // Refine the actual skinned GLB limb before sewing its upper edge.
  // Results are visibly rounded geometry, not a lighting-only cosmetic.
  const refined=refineSkinnedDonor(bodyCut.geometry,2);
  bodyCut.geometry.dispose();
  bodyCut.geometry=refined.geometry;
  bodyCut.sourceTriangles=refined.sourceTriangles;
  bodyCut.triangles=refined.triangles;
  bodyCut.refinedVertices=refined.vertices;
  bodyCut.subdivisionPasses=refined.passes;
  // Topological seam alignment, not a polygon spike tucked in arbitrarily:
  // Pull the UPPER donor vertices toward the nearest retained Maya surface
  // of the same flank, and transfer the equivalent Maya skin influence.
  // Native GLB positions/weights stay intact BELOW the junction.
  const donorGeo=bodyCut.geometry,donorPos=donorGeo.getAttribute('position');
  const donorSkin=donorGeo.getAttribute('skinIndex'),donorWeights=donorGeo.getAttribute('skinWeight');
  const hostGeo=anatomy.geometry,hostPos=hostGeo.getAttribute('position'),
   hostSkin=hostGeo.getAttribute('skinIndex'),hostWeights=hostGeo.getAttribute('skinWeight');
  // Only attach to triangles that survived the Maya crop. BufferGeometry
  // retains orphaned vertex attributes after setIndex(), and searching all
  // hostPos vertices can snap the donor to REMOVED posterior tissue.
  const liveHostVertices=new Set();
  const hostIndex=hostGeo.getIndex();
  if(!hostIndex)throw Error('BTC V22 cropped Maya host lost its index');
  for(let j=0;j<hostIndex.count;j++)liveHostVertices.add(hostIndex.getX(j));
  // Project the donor collar onto ACTUAL retained Maya triangles, rather
  // than averaging four unrelated vertices across a thigh/tail crease.
  // Closest-point barycentrics also transfer the host triangle's skinned
  // influences continuously over the surface.
  const attachment=[];
  const va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3();
  for(let j=0;j<hostIndex.count;j+=3){
   const ids=[hostIndex.getX(j),hostIndex.getX(j+1),hostIndex.getX(j+2)];
   const pts=ids.map(id=>new THREE.Vector3(
    hostPos.getX(id),hostPos.getY(id),hostPos.getZ(id)));
   const cx=(pts[0].x+pts[1].x+pts[2].x)/3;
   const cy=(pts[0].y+pts[1].y+pts[2].y)/3;
   const cz=(pts[0].z+pts[1].z+pts[2].z)/3;
   if(cz<=BTC_SEAM_CUT_Z-.0001||cz>=.032||cy<=.0042||Math.abs(cx)<=.0012)continue;
   if(pts.some(p=>Math.sign(p.x)!==Math.sign(cx)))continue;
   // The centroid can lie in the rump while one corner extends deep
   // into the excised hind leg. Projecting a donor collar onto such a
   // triangle bridges the actual cut and produces a dark thigh wedge.
   // Restrict attachment to entirely retained, local host faces; this
   // changes the 3D collar projection, not an acceptance threshold.
   if(pts.some(p=>p.z<BTC_SEAM_CUT_Z-.0001||p.y<.0038||Math.abs(p.x)<.0010))continue;
   attachment.push({ids,pts,side:Math.sign(cx)});
  }
  if(attachment.length<30)throw Error('BTC V23 host rump triangles missing');
  const donorPoint=new THREE.Vector3(),closest=new THREE.Vector3(),
   bary=new THREE.Vector3(),triangle=new THREE.Triangle();
  // Real geometry safeguard: collar projection now reaches farther local
  // host triangles, but every move is backtracked against live face winding,
  // area and aspect quality. The wider 2.4 mm falloff distributes the join
  // instead of concentrating deformation in a thin 1.8 mm strip.
  const localMinEdge=new Float32Array(donorPos.count).fill(Infinity);
  const donorFaces=donorGeo.getIndex();
  for(let j=0;j<donorFaces.count;j+=3){
   const ids=[donorFaces.getX(j),donorFaces.getX(j+1),donorFaces.getX(j+2)];
   for(const [a,b] of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){
    const length=Math.hypot(donorPos.getX(a)-donorPos.getX(b),
     donorPos.getY(a)-donorPos.getY(b),donorPos.getZ(a)-donorPos.getZ(b));
    if(length>1e-9){
     localMinEdge[a]=Math.min(localMinEdge[a],length);
     localMinEdge[b]=Math.min(localMinEdge[b],length);
    }
   }
  }
  // Prevent independently projected collar vertices from folding a shared
  // thigh face. Evaluate each move against the LIVE indexed donor geometry.
  const collarFaces=Array.from({length:donorPos.count},()=>[]);
  for(let j=0;j<donorFaces.count;j+=3){
   const tri=[donorFaces.getX(j),donorFaces.getX(j+1),donorFaces.getX(j+2)];
   for(const v of tri)collarFaces[v].push(tri);
  }
  const collarNormal=(a,b,c)=>{
   const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];
   const vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
   return [uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
  };
  const collarPoint=v=>[donorPos.getX(v),donorPos.getY(v),donorPos.getZ(v)];
  const collarQuality=points=>{
   const n=collarNormal(...points);
   const lengths=[
    points[0].reduce((sum,v,k)=>sum+(v-points[1][k])**2,0),
    points[1].reduce((sum,v,k)=>sum+(v-points[2][k])**2,0),
    points[2].reduce((sum,v,k)=>sum+(v-points[0][k])**2,0)
   ];
   const perimeter=lengths.reduce((sum,v)=>sum+v,0);
   return perimeter>1e-18?2*Math.sqrt(3)*Math.hypot(...n)/perimeter:0;
  };
  // The sequential seam projection must preserve the ORIGINAL face winding,
  // not just the face from the immediately preceding accepted displacement.
  // Several individually small turns can otherwise accumulate into a fold.
  const collarRestNormals=new Map(),collarRestQuality=new Map();
  for(const faces of collarFaces)for(const tri of faces){
   const key=tri.join(':');
   if(!collarRestNormals.has(key)){
    const points=tri.map(collarPoint);
    collarRestNormals.set(key,collarNormal(...points));
    collarRestQuality.set(key,collarQuality(points));
   }
  }
  let collarRejectedMoves=0,collarBacktrackedMoves=0;
  // UV/material splits duplicate vertices at identical rest positions.
  // A per-index host projection tears these coincident seam copies apart:
  // one copy can move toward the Maya rump while its twin stays behind.
  // Group physical points BEFORE any movement and sew them atomically.
  const collarSpatial=new Map(),collarTwins=Array.from({length:donorPos.count});
  for(let v=0;v<donorPos.count;v++){
   const key=[donorPos.getX(v),donorPos.getY(v),donorPos.getZ(v)]
    .map(n=>Math.round(n*1e7)).join(':');
   if(!collarSpatial.has(key))collarSpatial.set(key,[]);
   collarSpatial.get(key).push(v);
  }
  for(const group of collarSpatial.values())
   for(const v of group)collarTwins[v]=group;
  let insetVertices=0,reattachedWeights=0;
  for(let i=0;i<donorPos.count;i++){
   const twins=collarTwins[i];
   if(i!==twins[0])continue;
   const z=donorPos.getZ(i),y=donorPos.getY(i),x=donorPos.getX(i);
   // Actual donor triangles satisfy z<=.0145 after exact clipping. The
   // former collar range [.0208,.0226) was entirely OUTSIDE that mesh,
   // so almost no donor vertices could be attached to the Maya rump.
   // Project the real 1.8mm strip immediately BELOW the cut rim instead;
   // keep the projection strongest on z=BTC_SEAM_CUT_Z and fade toward the leg.
   if(z<BTC_SEAM_CUT_Z-.0024||z>BTC_SEAM_CUT_Z-.0002+1e-7||y<.0039||Math.abs(x)<.0010)continue;
   const u=THREE.MathUtils.clamp((BTC_SEAM_CUT_Z-.0002-z)/.0022,0,1);
   // Attachment is strongest on the z=BTC_SEAM_CUT_Z cut and fades into the
   // actual retained donor leg at z=.0130.
   // The old ascending smoothstep did the opposite, dragging interior
   // triangles toward the rump while leaving the actual rim unsown.
   // This is a geometric candidate, not V23 visual approval.
   const t=1-u*u*(3-2*u),side=Math.sign(x);
   donorPoint.set(x,y,z);
   let best=null,bestDist=Infinity;
   // Do not sew the outward donor thigh onto the BACK of a Maya rump
   // triangle. Nearest-point alone is blind to the facing direction at
   // overlapping flank folds and can create inverted, black WebGL wedges.
   const donorNormal=donorGeo.getAttribute('normal');
   const donorFacing=donorNormal?new THREE.Vector3(
    donorNormal.getX(i),donorNormal.getY(i),donorNormal.getZ(i)):null;
   for(const face of attachment){
    if(face.side!==side)continue;
    triangle.set(...face.pts);
    if(donorFacing&&donorFacing.lengthSq()>1e-12){
     const hostFacing=triangle.getNormal(new THREE.Vector3());
     if(hostFacing.lengthSq()>1e-12&&
        hostFacing.dot(donorFacing)<-.25)continue;
    }
    triangle.closestPointToPoint(donorPoint,closest);
    const dx=closest.x-x,dy=closest.y-y,dz=closest.z-z;
    // Reject nonlocal attachments. The old 8.7 mm spherical search
    // could snap a skinned thigh collar to the far croup/tail crease,
    // stretching triangles into the dark spikes seen in rear WebGL.
    // These limits are in the model's native (metre-scaled) coordinates.
    if(Math.abs(dx)>.0040||Math.abs(dy)>.0040||Math.abs(dz)>.0040)
     continue;
    const dist=dx*dx+dy*dy+2.4*dz*dz;
    if(dist<bestDist){
     bestDist=dist;
     best={face,point:closest.clone()};
    }
   }
   // Do not invent a bridge across an anatomically unrelated surface.
   // Leave the authored donor vertex in place when no LOCAL Maya host exists.
   if(!best||bestDist>.000025)continue;
   triangle.set(...best.face.pts);
   THREE.Triangle.getBarycoord(best.point,...best.face.pts,bary);
   if(![bary.x,bary.y,bary.z].every(Number.isFinite))continue;
   // Visual candidate: widen the collar search while keeping the final 0.2 mm
   // below the exact z=BTC_SEAM_CUT_Z cut rim untouched. The previous wider projection
   // moved donor vertices across the cut plane and split the left donor rim
   // into three open chains before the zipper. The face-quality and live
   // backtracking guards remain active for all interior collar vertices.
   const blend=t*.90;
      // P0 seam A/B: reduce the 0.22 mm inward projection offset to 0.08 mm.
   // The larger offset displaced the upper thigh laterally into the host
   // surface and left a dark folded wedge in rear/3Q real WebGL images.
   // This is a geometry candidate only; do not credit V23 until the new
   // 16-phase/six-camera PNG artifact is compared with #14157413825.
const targetX=THREE.MathUtils.lerp(x,best.point.x-side*.00008,blend);
   const targetY=THREE.MathUtils.lerp(y,best.point.y,blend);
   // BTC isolated geometric seam candidate: align the upper donor collar
   // more closely with the real retained Maya rump along the fore-aft axis.
   // The existing 3D displacement and face-orientation guards remain active.
   const targetZ=Math.min(THREE.MathUtils.lerp(z,best.point.z,blend*.90),BTC_SEAM_CUT_Z-.0002);
   const deltaX=targetX-x,deltaY=targetY-y,deltaZ=targetZ-z;
   const displacement=Math.hypot(deltaX,deltaY,deltaZ);
   const twinMinEdge=Math.min(...twins.map(v=>localMinEdge[v]).filter(Number.isFinite));
   const maxDisplacement=Math.min(.00120,Number.isFinite(twinMinEdge)
    ?Math.max(.00012,twinMinEdge*.82):.00120);
   const safe=displacement>maxDisplacement?maxDisplacement/displacement:1;
   const origin=[x,y,z],delta=[deltaX*safe,deltaY*safe,deltaZ*safe];
   let accepted=null,backtracked=false;
   for(let factor=1;factor>=1/64;factor/=2){
    const candidate=origin.map((v,k)=>v+delta[k]*factor);
    let valid=true;
    const checkedFaces=new Set();
    for(const twin of twins)for(const tri of collarFaces[twin]){
     const faceKey=tri.join(':');
     if(checkedFaces.has(faceKey))continue;
     checkedFaces.add(faceKey);
     const before=tri.map(collarPoint);
     const after=tri.map(v=>twins.includes(v)?candidate:collarPoint(v));
     const n0=collarNormal(...before),n1=collarNormal(...after);
     const sq0=n0.reduce((sum,v)=>sum+v*v,0);
     const sq1=n1.reduce((sum,v)=>sum+v*v,0);
     const dot=n0.reduce((sum,v,k)=>sum+v*n1[k],0);
     const rest=collarRestNormals.get(tri.join(':'));
     const restSq=rest.reduce((sum,v)=>sum+v*v,0);
     const restDot=rest.reduce((sum,v,k)=>sum+v*n1[k],0);
     // Both incremental and rest-space tests are required: the first
     // rejects a sudden flip, the second cumulative drift and collapsed
     // triangles that render as black wedges during Gallop.
     const restQuality=collarRestQuality.get(tri.join(':'))||0;
     const currentQuality=collarQuality(after);
     if(sq0<1e-24||restSq<1e-24||sq1<Math.max(sq0,restSq)*.55||
        currentQuality<Math.max(.012,restQuality*.52)||
        dot<=0||restDot<=0){valid=false;break;}
    }
    if(valid){accepted=candidate;backtracked=factor<1;break;}
   }
   if(!accepted){collarRejectedMoves++;continue;}
   if(backtracked)collarBacktrackedMoves++;
   for(const twin of twins)donorPos.setXYZ(twin,...accepted);
   // Candidate P0: the sewn rim can use nearly 100% host skinning
   // while its immediate interior retained only 5%, producing an abrupt
   // deformation gradient and a dark triangular shear in gallop phases.
   // Ramp the host share continuously over the existing 1.5 mm collar;
   // retain 100% donor influence below z=.0130 and never alter the hock.
   // This is an unapproved animation/geometry A/B, not a V23 milestone.
   // The cut boundary must deform with the Maya host surface, not with a
   // nearest-neighbour donor approximation. Use 100% host skin at z=BTC_SEAM_CUT_Z
   // and decay smoothly to the donor's authored limb weights over 1.8 mm.
   const mayaFactor=1.0*t*t,influences=new Map();
   // Coincident UV/material copies can have DIFFERENT source skin weights.
   // Using only the first copy and broadcasting its four influences to all
   // copies creates an abrupt gallop deformation seam. Average each distinct
   // source vertex once, then give the welded collar one coherent rig blend.
   // This changes real skinned animation, not a synthetic QA counter.
   const donorShare=(1-mayaFactor)/twins.length;
   for(const twin of twins)for(let k=0;k<4;k++){
    const w=donorShare*donorWeights.getComponent(twin,k);
    if(w>1e-8){
     const bone=donorSkin.getComponent(twin,k);
     influences.set(bone,(influences.get(bone)||0)+w);
    }
   }
   for(let v=0;v<3;v++){
    const factor=mayaFactor*bary.getComponent(v);
    const id=best.face.ids[v];
    for(let k=0;k<4;k++){
     const w=factor*hostWeights.getComponent(id,k);
     if(w>1e-8){
      const bone=hostSkin.getComponent(id,k);
      influences.set(bone,(influences.get(bone)||0)+w);
     }
    }
   }
   const top=[...influences].sort((p,q)=>q[1]-p[1]).slice(0,4);
   const total=top.reduce((sum,p)=>sum+p[1],0)||1;
   for(const twin of twins)for(let k=0;k<4;k++){
    donorSkin.setComponent(twin,k,top[k]?.[0]||0);
    donorWeights.setComponent(twin,k,(top[k]?.[1]||0)/total);
   }
   insetVertices+=twins.length;reattachedWeights+=twins.length;
  }
  // The exact donor cut creates an open rim at z=BTC_SEAM_CUT_Z, while the
  // existing closest-triangle collar projection now targets the 1.8 mm band below z=BTC_SEAM_CUT_Z.
  // Therefore it cannot sew the actual cut edge. Align ONLY donor rim
  // vertices with nearby surviving Maya cut edges on the SAME flank.
  // This is a small geometry candidate, not visual acceptance.
  {
   // Detect the physical open boundary, not the raw GLB/Maya index
   // boundary. Both sources duplicate positions at UV/material seams.
   // Counting those duplicates as open edges previously snapped interior
   // triangles toward the host, while missing actual rim counterparts.
   const seamKey=(attribute,id)=>[
    attribute.getX(id),attribute.getY(id),attribute.getZ(id)
   ].map(v=>Math.round(v*1e7)).join(':');
   function physicalBoundary(index,position){
    const edges=new Map(),byPosition=new Map();
    for(let id=0;id<position.count;id++){
     const key=seamKey(position,id);
     if(!byPosition.has(key))byPosition.set(key,[]);
     byPosition.get(key).push(id);
    }
    for(let j=0;j<index.count;j+=3){
     const ids=[index.getX(j),index.getX(j+1),index.getX(j+2)];
     for(const [a,b] of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){
      const ak=seamKey(position,a),bk=seamKey(position,b);
      if(ak===bk)continue;
      const key=ak<bk?ak+'|'+bk:bk+'|'+ak;
      const entry=edges.get(key)||{a,b,n:0};
      entry.n++;
      edges.set(key,entry);
     }
    }
    return {edges:[...edges.values()].filter(e=>e.n===1),byPosition};
   }
   const hostBoundary=physicalBoundary(hostIndex,hostPos);
   // The cut is a three-plane boundary, not just the rear z plane:
   // z=BTC_SEAM_CUT_Z, y=.0052 and the bilateral x=+/-.0015 flank planes.
   // Stitching only z left the visible pale slit at the top of each hind
   // thigh because the y/x cut arcs remained open in real WebGL.
   const seamPlaneTolerance=.00003;
   const classifySeamEdge=(position,e)=>{
    const a=[position.getX(e.a),position.getY(e.a),position.getZ(e.a)];
    const b=[position.getX(e.b),position.getY(e.b),position.getZ(e.b)];
    const sideA=Math.sign(a[0]),sideB=Math.sign(b[0]);
    if(!sideA||sideA!==sideB||Math.abs(a[0])<=.0014||Math.abs(b[0])<=.0014)return null;
    const near=(p,axis,value)=>Math.abs(p[axis]-value)<=seamPlaneTolerance;
    if(near(a,2,BTC_SEAM_CUT_Z)&&near(b,2,BTC_SEAM_CUT_Z)&&a[1]>=.0050&&b[1]>=.0050)return 'z';
    if(near(a,1,.0052)&&near(b,1,.0052)&&
       a[2]<=BTC_SEAM_CUT_Z+seamPlaneTolerance&&b[2]<=BTC_SEAM_CUT_Z+seamPlaneTolerance)return 'y';
    if(near(a,0,sideA*.0015)&&near(b,0,sideB*.0015)&&
       a[1]>=.0050&&b[1]>=.0050&&
       a[2]<=BTC_SEAM_CUT_Z+seamPlaneTolerance&&b[2]<=BTC_SEAM_CUT_Z+seamPlaneTolerance)
     return sideA<0?'x-':'x+';
    return null;
   };
   const hostRim=hostBoundary.edges.flatMap(e=>{
    const plane=classifySeamEdge(hostPos,e,'host');
    return plane?[{...e,plane}]:[];
   });
   const di=donorGeo.getIndex();
   const donorBoundary=physicalBoundary(di,donorPos);
   const donorRim=new Set(),donorRimPlanes=new Map(),donorRimEdges=[];
   for(const e of donorBoundary.edges){
    const plane=classifySeamEdge(donorPos,e,'donor');
    if(!plane)continue;
    donorRimEdges.push({...e,plane});
    for(const vertex of [e.a,e.b]){
     const key=seamKey(donorPos,vertex);
     for(const id of donorBoundary.byPosition.get(key)||[]){
      donorRim.add(id);
      const planes=donorRimPlanes.get(id)||new Set();
      planes.add(plane);donorRimPlanes.set(id,planes);
     }
    }
   }
   const countByPlane=edges=>Object.fromEntries(['z','y','x-','x+'].map(p=>
    [p,edges.filter(e=>e.plane===p).length]));
   bodyCut.hostRimEdges=hostRim.length;
   bodyCut.donorRimVertices=donorRim.size;
   bodyCut.hostRimEdgesByPlane=countByPlane(hostRim);
   bodyCut.donorRimEdgesByPlane=countByPlane(donorRimEdges);
   // The previous rim snap bypassed the incident-face orientation gate:
   // a 0.18 mm move could invert a tiny subdivided collar triangle.
   // Use LIVE neighboring positions and backtrack each proposed snap.
   const rimFaces=Array.from({length:donorPos.count},()=>[]);
   for(let j=0;j<di.count;j+=3){
    const face=[di.getX(j),di.getX(j+1),di.getX(j+2)];
    for(const v of face)rimFaces[v].push(face);
   }
   const rimPoint=v=>[donorPos.getX(v),donorPos.getY(v),donorPos.getZ(v)];
   const rimNormal=(a,b,c)=>{
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    const v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   };
   // Freeze the unsewn collar as a geometric reference. Sequential rim
   // snaps must not each pass locally while collectively flattening or
   // reversing the same shared triangle.
   const rimReference=Array.from({length:donorPos.count},(_,v)=>rimPoint(v));
   let sewn=0;
   // A UV/material seam may contain several vertex IDs at precisely the
   // same rest-space position. Snapping only one ID opens a real crack
   // even though the physical boundary classifier correctly welded them.
   // Treat all coincident rim IDs as one anatomical vertex and validate
   // every incident face before moving the group.
   const processedRim=new Set();
   for(const id of donorRim){
    if(processedRim.has(id))continue;
    const coincident=(donorBoundary.byPosition.get(seamKey(donorPos,id))||[])
     .filter(v=>donorRim.has(v));
    const rimGroup=coincident.length?coincident:[id];
    for(const v of rimGroup)processedRim.add(v);
    const x=donorPos.getX(id),y=donorPos.getY(id),z=donorPos.getZ(id);
    const allowedPlanes=donorRimPlanes.get(id)||new Set();
    let nearest=null,distSq=Infinity;
    for(const e of hostRim){
     if(!allowedPlanes.has(e.plane))continue;
     const ax=hostPos.getX(e.a),ay=hostPos.getY(e.a),az=hostPos.getZ(e.a);
     if(Math.sign(ax)!==Math.sign(x))continue;
     const dx=hostPos.getX(e.b)-ax,dy=hostPos.getY(e.b)-ay,
      dz=hostPos.getZ(e.b)-az;
     const lenSq=dx*dx+dy*dy+dz*dz;
     if(lenSq<1e-18)continue;
     const t=THREE.MathUtils.clamp(((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/lenSq,0,1);
     const px=ax+t*dx,py=ay+t*dy,pz=az+t*dz;
     const d=(px-x)**2+(py-y)**2+(pz-z)**2;
     if(d<distSq){distSq=d;nearest=[px,py,pz];}
    }
    // Do not bridge nonmatching topologies. Bound the move to 0.18 mm
    // and let the existing orientation/area gate reject damaged faces.
    if(!nearest||distSq>.0012**2)continue;
    // Full geometric coincidence is essential for a shared skinned rim.
    // The former 0.18 mm capped motion left a persistent rest-space
    // gap on donor vertices 0.18–1.2 mm away from the host boundary.
    // Try the actual host point first; the existing per-face winding
    // and area backtracking below rejects unsafe projection.
    const dist=Math.sqrt(distSq),blend=1;
    const origin=[x,y,z],delta=nearest.map((v,k)=>(v-origin[k])*blend);
    let accepted=null;
    for(let factor=1;factor>=1/64;factor/=2){
     const candidate=origin.map((v,k)=>v+delta[k]*factor);
     const groupSet=new Set(rimGroup);
     const incident=new Set(rimGroup.flatMap(v=>rimFaces[v]));
     const safe=[...incident].every(face=>{
      const prior=face.map(rimPoint);
      const moved=face.map(v=>groupSet.has(v)?candidate:rimPoint(v));
      const a=rimNormal(...prior),b=rimNormal(...moved);
      const reference=rimNormal(...face.map(v=>rimReference[v]));
      const area0=a.reduce((n,v)=>n+v*v,0);
      const area1=b.reduce((n,v)=>n+v*v,0);
      const referenceArea=reference.reduce((n,v)=>n+v*v,0);
      const dot=a.reduce((n,v,k)=>n+v*b[k],0);
      const referenceDot=reference.reduce((n,v,k)=>n+v*b[k],0);
      return area0>1e-24&&referenceArea>1e-24&&
       area1>=area0*.55&&area1>=referenceArea*.36&&
       dot>0&&referenceDot>0;
     });
     if(safe){accepted=candidate;break;}
    }
    if(!accepted)continue;
    for(const v of rimGroup)donorPos.setXYZ(v,...accepted);
    // A position-only seam snap cannot survive Gallop: donor and Maya
    // skin influences move the same rest-space point differently. Blend
    // the rim influences toward the ACTUAL closest host edge, weighted
    // by the measured separation. This affects only open donor rim
    // vertices and leaves the stifle, hock and all other horses intact.
    // Candidate geometry/animation only, NOT V23 visual acceptance.
    let hostEdge=null,hostEdgeT=0,hostEdgeDist=Infinity;
    for(const e of hostRim){
     if(!allowedPlanes.has(e.plane))continue;
     const ax=hostPos.getX(e.a),ay=hostPos.getY(e.a),az=hostPos.getZ(e.a);
     if(Math.sign(ax)!==Math.sign(x))continue;
     const dx=hostPos.getX(e.b)-ax,dy=hostPos.getY(e.b)-ay,dz=hostPos.getZ(e.b)-az;
     const lenSq=dx*dx+dy*dy+dz*dz;
     if(lenSq<1e-18)continue;
     const t=THREE.MathUtils.clamp(((accepted[0]-ax)*dx+(accepted[1]-ay)*dy+
      (accepted[2]-az)*dz)/lenSq,0,1);
     const d=(ax+t*dx-accepted[0])**2+(ay+t*dy-accepted[1])**2+
      (az+t*dz-accepted[2])**2;
     if(d<hostEdgeDist){hostEdgeDist=d;hostEdge=e;hostEdgeT=t;}
    }
    if(hostEdge&&hostEdgeDist<.0012**2){
     // The donor and Maya coat currently use different transferred
     // influence distributions even where their cut rims coincide.
     // A 60% host share still permits the donor rim to peel open as the
     // hind legs load. Match the host skin EXACTLY at coincidence, and
     // taper to the previous 15% host share over 1.2 mm. Interior donor
     // vertices remain unchanged. This changes actual Gallop deformation.
     // The sewn cut rim is a shared deforming boundary, not a blend zone.
     // A nonzero donor share at the exact rim pulls coincident vertices
     // apart as Gallop bends the hock. Use the host's interpolated skin
     // influences for every genuinely matched rim vertex. The donor
     // interior retains its native weights; only the seam ring changes.
     // A backtracked snap may stop short of the host edge. Copying 100%
     // Maya skinning to a rim point still separated by up to 1.2 mm
     // shears the limb during Gallop: the donor vertex follows the rump
     // despite never reaching its surface. Match host weights only when
     // the accepted position is physically coincident (<= 0.03 mm).
     // Otherwise taper the transfer to zero over the local 0.30 mm seam.
     // This changes actual deformation, not a synthetic acceptance gate.
     const separation=Math.sqrt(hostEdgeDist);
     const hostShare=separation<=.00003?1:
      separation>=.00030?0:
      1-((separation-.00003)/.00027)**2*
       (3-2*((separation-.00003)/.00027));
     const donorShare=1-hostShare;
     const influence=new Map();
     for(let k=0;k<4;k++){
      const w=donorWeights.getComponent(id,k)*donorShare;
      if(w>1e-9){const joint=donorSkin.getComponent(id,k);
       influence.set(joint,(influence.get(joint)||0)+w);}
     }
     for(const [hostId,fraction] of [[hostEdge.a,1-hostEdgeT],[hostEdge.b,hostEdgeT]]){
      for(let k=0;k<4;k++){
       const w=hostWeights.getComponent(hostId,k)*fraction*hostShare;
       if(w>1e-9){const joint=hostSkin.getComponent(hostId,k);
        influence.set(joint,(influence.get(joint)||0)+w);}
      }
     }
     const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
     const total=top.reduce((sum,item)=>sum+item[1],0)||1;
     for(const v of rimGroup)for(let k=0;k<4;k++){
      donorSkin.setComponent(v,k,top[k]?.[0]||0);
      donorWeights.setComponent(v,k,(top[k]?.[1]||0)/total);
     }
    }
    sewn+=rimGroup.length;
   }
   // No artificial acceptance counters: this is diagnostic only.
   bodyCut.sewnRimVertices=sewn;

   // Match the donor and Maya cut rims as ordered closed loops. Independent
   // nearest-edge projection jumped across adjacent limb folds (28 skipped
   // cells in the prior WebGL artifact). Arc-length correspondence preserves
   // cyclic order and creates one continuous skinned strip per flank.
   const bridgePositions=[],bridgeNormals=[],bridgeJoints=[],bridgeWeights=[],bridgeIndices=[];
   const projected=new Map(),layerProjected=new Map(),donorBase=donorPos.count;
   const assertBridgeSkinArrays=stage=>{
    const vertices=bridgePositions.length/3;
    const shape={stage,positionValues:bridgePositions.length,normalValues:bridgeNormals.length,
     jointValues:bridgeJoints.length,weightValues:bridgeWeights.length,vertices,
     jointVertexCount:bridgeJoints.length/4,weightVertexCount:bridgeWeights.length/4};
    if(bridgePositions.length%3||bridgeNormals.length!==bridgePositions.length||
       bridgeJoints.length!==vertices*4||bridgeWeights.length!==vertices*4)
     throw Error('BTC seam bridge attribute arrays diverged during '+stage+': '+JSON.stringify(shape));
   };
   const bridgeEndpointInfo=new Map();
   // The collar relaxation runs after the first loft build. Keep the source
   // correspondence so the curved rings can be reprojected onto the final
   // relaxed donor surface instead of retaining stale pre-relax tangents.
   const bridgeVertexSpecs=new Map(),donorRimNeighborsById=new Map();
   let donorBoundaryInward=new Map(),hostBoundaryInward=new Map();
   let donorRimTangentById=new Map(),hostRimTangentById=new Map();
   // Keep the host-side zipper samples as real subdivisions of the Maya
   // boundary. A separate bridge ending at points inside an unsplit host
   // edge creates a T-junction even when its coordinates and weights match.
   // The host edge must use the exact same interpolated points as the strip.
   const hostBoundarySplitSamples=new Map();
   const hostNormal=hostGeo.getAttribute('normal'),donorNormal=donorGeo.getAttribute('normal');
   let bridgeMaxGap=0,bridgeGapTotal=0,bridgeGapCount=0,bridgeEdges=0,
    bridgeUnmatchedVertices=0,bridgeUnmatchedEdges=0,bridgeSingleTriangleEdges=0,
    bridgeMaxHostStep=0,bridgeLoopPairs=0,bridgeZipperMovesDonor=0,
    bridgeZipperMovesHost=0,bridgeZipperFallbackLoops=0,
    bridgeZipperQualitySum=0,bridgeZipperQualityCount=0,bridgeZipperMinQuality=Infinity,
    bridgeZipperResampledLoops=0,bridgeZipperLayers=0,bridgeZipperCenterFanCells=0,
    bridgeZipperAdaptiveLoops=0,bridgeZipperAdaptiveTriangles=0,
    bridgeZipperAdaptiveSourceTriangles=0,bridgeZipperAdaptiveRejects=0,bridgeZipperAdaptiveCenterFanCells=0,
    bridgeZipperAdaptiveCapFanTriangles=0,bridgeZipperAdaptiveTriangleFanCells=0,
    bridgeZipperMaxAdaptiveTriangles=0,
    bridgeOrientationFlips=0,bridgeOrientationComponents=0;
   let seamWarpFactor=1,seamWarpMaxMove=0,seamWarpMeanMove=0,seamWarpMaxResidualGap=0;
   let seamWarpAcceptedGroups=0,seamWarpRejectedGroups=0;
   const bridgeTrianglesByPlane={z:0,y:0,'x-':0,'x+':0};
   const bridgeEdgesByPlane={z:0,y:0,'x-':0,'x+':0};
   const bridgeUnmatchedByPlane={z:0,y:0,'x-':0,'x+':0};
   const distance3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
   const pointAt=(position,id)=>[position.getX(id),position.getY(id),position.getZ(id)];
   // Each clipping plane exposes an OPEN seam chain whose endpoints lie
   // on the adjacent cut planes. Treating every plane independently as a
   // closed ring falsely labels those legitimate endpoints as branches.
   // Preserve every physical boundary edge and classify each component as
   // either one simple closed loop or one simple open chain. True junctions
   // (degree > 2), dangling singletons and malformed endpoint counts remain
   // hard failures; no edge is discarded to make the zipper pass.
   function orderedBoundaryPaths(edges,position,plane,side){
    const adjacency=new Map(),representative=new Map();
    for(const edge of edges){
     if(edge.plane!==plane)continue;
     const pa=pointAt(position,edge.a),pb=pointAt(position,edge.b);
     if(Math.sign(pa[0])!==side||Math.sign(pb[0])!==side)continue;
     const a=seamKey(position,edge.a),b=seamKey(position,edge.b);
     if(a===b)continue;
     if(!adjacency.has(a))adjacency.set(a,new Set());
     if(!adjacency.has(b))adjacency.set(b,new Set());
     adjacency.get(a).add(b);adjacency.get(b).add(a);
     if(!representative.has(a))representative.set(a,edge.a);
     if(!representative.has(b))representative.set(b,edge.b);
    }
    const paths=[],visited=new Set();
    for(const first of adjacency.keys()){
     if(visited.has(first))continue;
     const component=[],stack=[first],members=new Set();
     while(stack.length){
      const key=stack.pop();
      if(members.has(key))continue;
      members.add(key);component.push(key);
      for(const neighbor of adjacency.get(key)||[])
       if(!members.has(neighbor))stack.push(neighbor);
     }
     const endpoints=component.filter(key=>adjacency.get(key)?.size===1);
     const branches=component.filter(key=>(adjacency.get(key)?.size||0)>2);
     const malformed=component.filter(key=>{
      const degree=adjacency.get(key)?.size||0;
      return degree<1||degree>2;
     });
     if(branches.length||malformed.length||
        (endpoints.length!==0&&endpoints.length!==2))
      return {paths:[],degreeErrors:branches.length+malformed.length+
       (endpoints.length!==0&&endpoints.length!==2?1:0)};
     const closed=endpoints.length===0;
     const start=closed?first:endpoints[0];
     const path=[],localVisited=new Set();
     let previous=null,current=start,finished=false;
     for(let step=0;step<=component.length;step++){
      if(closed&&current===start&&path.length){finished=true;break;}
      if(localVisited.has(current))break;
      localVisited.add(current);path.push(representative.get(current));
      const neighbors=[...(adjacency.get(current)||[])].filter(key=>key!==previous);
      if(!neighbors.length){
       if(!closed&&adjacency.get(current)?.size===1){finished=true;break;}
       break;
      }
      const next=neighbors[0];
      if(closed&&next===start){current=start;finished=true;break;}
      const validDegree=previous===null&&closed
       ?neighbors.length===2:neighbors.length===1;
      if(!validDegree||localVisited.has(next))break;
      previous=current;current=next;
     }
     if(!finished||path.length<(closed?3:2))
      return {paths:[],degreeErrors:1};
     for(const key of component)visited.add(key);
     paths.push({ids:path,closed});
    }
    return {paths,degreeErrors:0};
   }
   function pathCentroid(path,position){
    const sum=[0,0,0];
    for(const id of path.ids){const p=pointAt(position,id);for(let k=0;k<3;k++)sum[k]+=p[k];}
    return sum.map(v=>v/path.ids.length);
   }
   function pairBoundaryPaths(donorPaths,hostPaths,plane,side){
    const describe=(paths,position)=>paths.map(path=>{
     const points=path.ids.map(id=>pointAt(position,id));
     let length=0;
     for(let i=1;i<points.length;i++)length+=distance3(points[i-1],points[i]);
     const bounds=[0,1,2].map(k=>[
      Math.min(...points.map(p=>p[k])),Math.max(...points.map(p=>p[k]))
     ]);
     return {closed:path.closed,vertices:path.ids.length,length,
      first:points[0],last:points[points.length-1],
      center:pathCentroid(path,position),bounds,
      virtualClosureGap:path.virtualClosureGap??null};
    });
    const mergeOneLocalOpenPair=(paths,position)=>{
     let best=null;
     const segmentLength=ids=>{
      let total=0;
      for(let i=1;i<ids.length;i++)
       total+=distance3(pointAt(position,ids[i-1]),pointAt(position,ids[i]));
      return total;
     };
     const direction=(a,b)=>{
      const p=pointAt(position,a),q=pointAt(position,b);
      const v=q.map((x,k)=>x-p[k]),length=Math.hypot(...v)||1;
      return v.map(x=>x/length);
     };
     const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
     const simpleLoop=(ids)=>{
      const axes=plane==='z'?[0,1]:plane==='y'?[0,2]:[1,2];
      const points=ids.map(id=>pointAt(position,id)).map(p=>[p[axes[0]],p[axes[1]]]);
      const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
       if(j===i+1||(i===0&&j===points.length-1))continue;
       const a=points[i],b=points[(i+1)%points.length],
        c=points[j],d=points[(j+1)%points.length];
       const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
       if(o1*o2< -1e-18&&o3*o4< -1e-18)return false;
      }
      return true;
     };
     for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){
      const a=paths[i],b=paths[j];
      if(a.closed||b.closed)continue;
      // Complementary cut arcs can both be long. Endpoint proximity,
      // tangent continuity and a non-self-intersecting projection are the
      // safety tests; vertex-count and length-ratio heuristics hid the real
      // closed anatomical loop behind two equally substantial open chains.
      const steps=[];
      for(const ids of [a.ids,b.ids])for(let k=1;k<ids.length;k++)
       steps.push(distance3(pointAt(position,ids[k-1]),pointAt(position,ids[k])));
      steps.sort((x,y)=>x-y);
      const median=steps[Math.floor(steps.length/2)]||0;
      const maxGap=Math.max(.0012,median*2.5);
      for(const reverseA of [false,true])for(const reverseB of [false,true]){
       const aIds=reverseA?a.ids.slice().reverse():a.ids.slice();
       const bIds=reverseB?b.ids.slice().reverse():b.ids.slice();
       const aFirst=pointAt(position,aIds[0]),aLast=pointAt(position,aIds[aIds.length-1]);
       const bFirst=pointAt(position,bIds[0]),bLast=pointAt(position,bIds[bIds.length-1]);
       const joinGap=distance3(aLast,bFirst),closeGap=distance3(bLast,aFirst);
       if(joinGap>maxGap||closeGap>maxGap)continue;
       const joinDirection=direction(aIds[aIds.length-1],bIds[0]);
       const closeDirection=direction(bIds[bIds.length-1],aIds[0]);
       const turns=[
        dot(direction(aIds[aIds.length-2],aIds[aIds.length-1]),joinDirection),
        dot(joinDirection,direction(bIds[0],bIds[1])),
        dot(direction(bIds[bIds.length-2],bIds[bIds.length-1]),closeDirection),
        dot(closeDirection,direction(aIds[0],aIds[1]))
       ];
       const minTurn=Math.min(...turns);
       if(minTurn<-.95)continue;
       const ids=[...aIds,...bIds];
       if(!simpleLoop(ids))continue;
       const score=joinGap+closeGap+(1-minTurn)*.0002;
       if(!best||score<best.score)best={i,j,ids,aIds,bIds,joinGap,closeGap,score};
      }
     }
     return best;
    };
    let donors=donorPaths.slice(),hosts=hostPaths.slice();
    const recordVirtualClosure=(merge,position,surface)=>{
     const describe=id=>({id,position:pointAt(position,id)});
     seamBoundaryClosureDiagnostics.push({
      plane,side,surface,joinGap:merge.joinGap,closeGap:merge.closeGap,
      join:[describe(merge.aIds.at(-1)),describe(merge.bIds[0])],
      close:[describe(merge.bIds.at(-1)),describe(merge.aIds[0])]
     });
    };
    const mergeAllLocalOpenPairs=(paths,position,surface)=>{
     let current=paths.slice(),closures=0,maxGap=0;
     while(current.length>1){
      const merge=mergeOneLocalOpenPair(current,position);
      if(!merge)break;
      recordVirtualClosure(merge,position,surface);
      const gap=Math.max(merge.joinGap,merge.closeGap);
      const joined={ids:merge.ids,closed:true,virtualClosureGap:gap,
       virtualClosureGaps:[merge.joinGap,merge.closeGap],mergedBoundaryFragments:2};
      current.splice(merge.j,1);
      current.splice(merge.i,1,joined);
      closures++;maxGap=Math.max(maxGap,gap);
     }
     return {paths:current,closures,maxGap};
    };
    // Close complementary open arcs on BOTH surfaces before matching them.
    // Adopting only one side would manufacture a topology mismatch, so the
    // paired closure is accepted only when donor and Maya produce the same
    // number of local, geometrically valid loop closures.
    const donorJoined=mergeAllLocalOpenPairs(donors,donorPos,'donor');
    const hostJoined=mergeAllLocalOpenPairs(hosts,hostPos,'host');
    if(donorJoined.closures>0&&
       donorJoined.closures===hostJoined.closures&&
       donorJoined.paths.length===hostJoined.paths.length){
     donors=donorJoined.paths;
     hosts=hostJoined.paths;
    }
    const targetCount=Math.min(donors.length,hosts.length);
    while(donors.length>targetCount){
     const merge=mergeOneLocalOpenPair(donors,donorPos);
     if(!merge)break;
     recordVirtualClosure(merge,donorPos,'donor');
     const path={ids:merge.ids,closed:true,
      virtualClosureGap:Math.max(merge.joinGap,merge.closeGap),
      virtualClosureGaps:[merge.joinGap,merge.closeGap],
      mergedBoundaryFragments:2};
     donors.splice(merge.j,1);
     donors.splice(merge.i,1,path);
    }
    while(hosts.length>targetCount){
     const merge=mergeOneLocalOpenPair(hosts,hostPos);
     if(!merge)break;
     recordVirtualClosure(merge,hostPos,'host');
     const path={ids:merge.ids,closed:true,
      virtualClosureGap:Math.max(merge.joinGap,merge.closeGap),
      virtualClosureGaps:[merge.joinGap,merge.closeGap],
      mergedBoundaryFragments:2};
     hosts.splice(merge.j,1);
     hosts.splice(merge.i,1,path);
    }
    if(donors.length!==hosts.length)
     throw Error('BTC ordered seam path count mismatch on '+plane+' side '+side+
      ': donor='+JSON.stringify(describe(donors,donorPos))+
      ' Maya='+JSON.stringify(describe(hosts,hostPos)));
    const remaining=hosts.slice();
    const promoteShortOpenPath=(path,position,label)=>{
     const points=path.ids.map(id=>pointAt(position,id));
     const steps=[];
     for(let i=0;i<points.length-1;i++)steps.push(distance3(points[i],points[i+1]));
     steps.sort((a,b)=>a-b);
     const median=steps[Math.floor(steps.length/2)]||0;
     const closureGap=distance3(points[0],points[points.length-1]);
     // A clipped donor ring can lose exactly one physical boundary edge at
     // a material/UV seam. Close it only when the missing chord is local to
     // the ring; a long chord would fabricate an anatomical surface and is
     // still rejected. The new zipper triangles then own this closure edge.
     const maxClosureGap=Math.max(.0012,median*2.5);
     if(closureGap>maxClosureGap)
      throw Error('BTC '+label+' seam endpoint gap is not a local ring closure: '+
       closureGap.toFixed(6)+' m > '+maxClosureGap.toFixed(6)+' m');
     path.closed=true;path.virtualClosureGap=closureGap;
     return path;
    };
    const pairs=[];
    for(const donorPath of donors){
     let best=-1,bestDistance=Infinity;
     const center=pathCentroid(donorPath,donorPos);
     for(let i=0;i<remaining.length;i++){
      const hostCenter=pathCentroid(remaining[i],hostPos);
      const d=distance3(center,hostCenter);
      if(d<bestDistance){bestDistance=d;best=i;}
     }
     if(best<0)throw Error('BTC ordered seam path has no host counterpart');
     const hostPath=remaining.splice(best,1)[0];
     if(donorPath.closed!==hostPath.closed){
      if(!donorPath.closed)promoteShortOpenPath(donorPath,donorPos,'donor');
      else promoteShortOpenPath(hostPath,hostPos,'Maya host');
     }
     if(!donorPath.closed){
      const donor=donorPath.ids,host=hostPath.ids;
      const forward=distance3(pointAt(donorPos,donor[0]),pointAt(hostPos,host[0]))+
       distance3(pointAt(donorPos,donor[donor.length-1]),pointAt(hostPos,host[host.length-1]));
      const reverse=distance3(pointAt(donorPos,donor[0]),pointAt(hostPos,host[host.length-1]))+
       distance3(pointAt(donorPos,donor[donor.length-1]),pointAt(hostPos,host[0]));
      if(reverse<forward)hostPath.ids=host.slice().reverse();
     }
     pairs.push({donorPath,hostPath});
    }
    return pairs;
   }
   function rotateLoop(loop,start){
    return loop.slice(start).concat(loop.slice(0,start));
   }
   function arcTable(loop,position,closed=true){
    const points=loop.map(id=>pointAt(position,id)),lengths=[0];
    const segments=closed?loop.length:loop.length-1;
    for(let i=0;i<segments;i++)
     lengths.push(lengths[i]+distance3(points[i],points[(i+1)%loop.length]));
    return {loop,points,lengths,total:lengths[lengths.length-1],closed};
   }
   function sampleArc(table,u){
    const segments=table.lengths.length-1;
    const value=Math.max(0,Math.min(1,u));
    const target=(table.closed?Math.min(.999999999,value):value)*table.total;
    let edge=segments-1;
    if(target<table.total){
     let low=0,high=segments-1;
     while(low<high){
      const middle=(low+high)>>1;
      if(table.lengths[middle+1]<target)low=middle+1;
      else high=middle;
     }
     edge=low;
    }
    const span=table.lengths[edge+1]-table.lengths[edge];
    const t=span>1e-12?(target-table.lengths[edge])/span:0;
    const next=table.closed?(edge+1)%table.loop.length:edge+1;
    const a=table.points[edge],b=table.points[next];
    return {a:table.loop[edge],b:table.loop[next],t,
     point:a.map((v,k)=>v+(b[k]-v)*t)};
   }
   function findBestLoopAlignment(donorLoop,hostLoop){
    const donorCount=donorLoop.length,hostCount=hostLoop.length;
    const donorStride=Math.max(1,Math.ceil(donorCount/24));
    const hostStride=Math.max(1,Math.ceil(hostCount/24));
    const sampleStride=Math.max(1,Math.floor(donorCount/24));
    function makeCandidates(loop,position,starts){
     return [...starts].map(start=>{
      const rotated=rotateLoop(loop,start),arc=arcTable(rotated,position);
      return arc.total>1e-10?{start,loop:rotated,arc}:null;
     }).filter(Boolean);
    }
    function scorePair(donor,host,step){
     let sumSq=0,maxGap=0,count=0,minQuality=1,qualitySum=0,qualityCount=0;
     const triangleQuality=points=>{
      const u=points[1].map((v,k)=>v-points[0][k]);
      const v=points[2].map((x,k)=>x-points[0][k]);
      const cross=[
       u[1]*v[2]-u[2]*v[1],
       u[2]*v[0]-u[0]*v[2],
       u[0]*v[1]-u[1]*v[0]
      ];
      const twiceArea=Math.hypot(...cross);
      const edgeSq=distance3(points[0],points[1])**2+
       distance3(points[1],points[2])**2+
       distance3(points[2],points[0])**2;
      if(!Number.isFinite(twiceArea)||twiceArea<1e-9||edgeSq<1e-18)return 0;
      return Math.min(1,(2*Math.sqrt(3)*twiceArea)/edgeSq);
     };
     for(let i=0;i<donorCount;i+=step){
      const next=(i+step)%donorCount;
      const u0=donor.arc.lengths[i]/donor.arc.total;
      let u1=donor.arc.lengths[next]/donor.arc.total;
      if(next<=i)u1+=1;
      u1-=Math.floor(u1);
      const h0=sampleArc(host.arc,u0).point;
      const h1=sampleArc(host.arc,u1).point;
      const d0=donor.arc.points[i],d1=donor.arc.points[next];
      const gap=distance3(d0,h0);
      sumSq+=gap*gap;maxGap=Math.max(maxGap,gap);count++;
      // A low-distance correspondence can still twist the zipper into
      // needle triangles. Score both quad diagonals and use their better
      // bottleneck quality when choosing the cyclic start and winding.
      // This makes the alignment search optimize the actual bridge surface,
      // not only the Euclidean distance between unrelated loop samples.
      const q0=Math.min(
       triangleQuality([d0,d1,h0]),
       triangleQuality([d1,h1,h0])
      );
      const q1=Math.min(
       triangleQuality([d0,d1,h1]),
       triangleQuality([d0,h1,h0])
      );
      const quality=Math.max(q0,q1);
      minQuality=Math.min(minQuality,quality);
      qualitySum+=quality;qualityCount++;
     }
     const meanSq=sumSq/Math.max(1,count);
     const meanQuality=qualitySum/Math.max(1,qualityCount);
     // Keep gap as the primary objective, but penalize an alignment whose
     // worst sampled bridge cell is nearly degenerate. The penalty is scaled
     // to the measured gap energy so it cannot dominate a clearly superior
     // anatomical match merely because of one noisy sample.
     const score=meanSq+maxGap*maxGap*.35+
      meanSq*2.5*(1-minQuality)+meanSq*.35*(1-meanQuality);
     return {meanSq,maxGap,minQuality,meanQuality,score};
    }
    const donorCoarseStarts=new Set();
    for(let i=0;i<donorCount;i+=donorStride)donorCoarseStarts.add(i);
    const donorCoarse=makeCandidates(donorLoop,donorPos,donorCoarseStarts);
    let best=null;
    // Arc tables are built once per candidate start, not once per pair.
    // This bounds the circular alignment search even after Loop subdivision.
    for(const reverseHost of [false,true]){
     const hostSource=reverseHost?hostLoop.slice().reverse():hostLoop;
     const hostCoarseStarts=new Set();
     for(let i=0;i<hostCount;i+=hostStride)hostCoarseStarts.add(i);
     const hostCoarse=makeCandidates(hostSource,hostPos,hostCoarseStarts);
     for(const donor of donorCoarse){
      for(const host of hostCoarse){
       const score=scorePair(donor,host,sampleStride);
       if(!best||score.score<best.score.score)best={donor,host,reverseHost,score};
      }
     }
    }
    if(!best)return null;
    // Refine only around the best orientation/phase, with cached arc tables.
    const donorRefineStarts=new Set(),hostRefineStarts=new Set();
    for(let delta=-donorStride;delta<=donorStride;delta++)
     donorRefineStarts.add((best.donor.start+delta+donorCount)%donorCount);
    for(let delta=-hostStride;delta<=hostStride;delta++)
     hostRefineStarts.add((best.host.start+delta+hostCount)%hostCount);
    const donorRefine=makeCandidates(donorLoop,donorPos,donorRefineStarts);
    const hostSource=best.reverseHost?hostLoop.slice().reverse():hostLoop;
    const hostRefine=makeCandidates(hostSource,hostPos,hostRefineStarts);
    const refineStride=Math.max(1,Math.floor(donorCount/48));
    for(const donor of donorRefine){
     for(const host of hostRefine){
      const score=scorePair(donor,host,refineStride);
      if(score.score<best.score.score)best={donor,host,reverseHost:best.reverseHost,score};
     }
    }
    const donor=best.donor.loop,host=best.host.loop;
    const donorArc=best.donor.arc,hostArc=best.host.arc;
    const samples=[];let sumSq=0,maxGap=0;
    for(let i=0;i<donorCount;i++){
     const sample=sampleArc(hostArc,donorArc.lengths[i]/donorArc.total);
     const gap=distance3(donorArc.points[i],sample.point);
     samples.push(sample);sumSq+=gap*gap;maxGap=Math.max(maxGap,gap);
    }
    const meanSq=sumSq/Math.max(1,donorCount);
    return {donor,host,samples,score:meanSq+maxGap*maxGap*.35,maxGap,meanSq,
     donorArc,hostArc,closed:true};
   }
   function findBestBoundaryAlignment(donorPath,hostPath){
    if(donorPath.closed!==hostPath.closed)return null;
    if(donorPath.closed)
     return findBestLoopAlignment(donorPath.ids,hostPath.ids);
    const donor=donorPath.ids.slice(),host=hostPath.ids.slice();
    const donorArc=arcTable(donor,donorPos,false),hostArc=arcTable(host,hostPos,false);
    if(donorArc.total<=1e-10||hostArc.total<=1e-10)return null;
    const samples=[];let sumSq=0,maxGap=0;
    for(let i=0;i<donor.length;i++){
     const u=donorArc.lengths[i]/donorArc.total;
     const sample=sampleArc(hostArc,u);
     const gap=distance3(donorArc.points[i],sample.point);
     samples.push(sample);sumSq+=gap*gap;maxGap=Math.max(maxGap,gap);
    }
    const meanSq=sumSq/Math.max(1,donor.length);
    return {donor,host,samples,score:meanSq+maxGap*maxGap*.35,
     maxGap,meanSq,donorArc,hostArc,closed:false};
   }
   function bridgeVertex(sample){
    const t=Math.max(0,Math.min(1,sample.t));
    const key=[sample.a,sample.b,Math.round(t*1e8)].join(':');
    const hostSourceId=sample.a===sample.b?sample.a:null;
    if(projected.has(key)){
     const existing=projected.get(key);
     bridgeEndpointInfo.set(existing,{hostSourceId});
     return existing;
    }
    const influence=new Map();
    for(const [hostId,factor] of [[sample.a,1-t],[sample.b,t]]){
     for(let k=0;k<4;k++){
      const weight=hostWeights.getComponent(hostId,k)*factor;
      if(weight>1e-9){
       const joint=hostSkin.getComponent(hostId,k);
       influence.set(joint,(influence.get(joint)||0)+weight);
      }
     }
    }
    const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
    const total=top.reduce((sum,x)=>sum+x[1],0)||1;
    let n=[0,1,0];
    if(hostNormal){
     n=[0,1,2].map(k=>hostNormal.getComponent(sample.a,k)*(1-t)+hostNormal.getComponent(sample.b,k)*t);
     const length=Math.hypot(...n)||1;n=n.map(v=>v/length);
    }
    const index=donorBase+bridgePositions.length/3;
    bridgePositions.push(...sample.point);bridgeNormals.push(...n);
    bridgeJoints.push(...Array.from({length:4},(_,k)=>top[k]?.[0]||0));
    bridgeWeights.push(...Array.from({length:4},(_,k)=>(top[k]?.[1]||0)/total));
    assertBridgeSkinArrays('host endpoint');
    projected.set(key,index);
    bridgeEndpointInfo.set(index,{hostSourceId});
    return index;
   }
   // Recover the cross-boundary tangent from the actual adjacent source
   // faces. A normal x rim-tangent estimate is ambiguous when the two cut
   // rims are separated mostly along their normals; it can collapse the
   // Hermite derivative to zero and leave a visible hard collar.
   function boundaryInteriorMap(edges,index,position){
    const boundary=new Set(edges.map(edge=>edge.a<edge.b?
     edge.a+':'+edge.b:edge.b+':'+edge.a));
    const sums=new Map();
    const add=(id,other)=>{
     const key=seamKey(position,id),a=pointAt(position,id),b=pointAt(position,other);
     const entry=sums.get(key)||{vector:[0,0,0],count:0};
     for(let k=0;k<3;k++)entry.vector[k]+=b[k]-a[k];
     entry.count++;sums.set(key,entry);
    };
    for(let j=0;j<index.count;j+=3){
     const ids=[index.getX(j),index.getX(j+1),index.getX(j+2)];
     for(let k=0;k<3;k++){
      const a=ids[k],b=ids[(k+1)%3],opposite=ids[(k+2)%3];
      const key=a<b?a+':'+b:b+':'+a;
      if(!boundary.has(key))continue;
      add(a,opposite);add(b,opposite);
     }
    }
    return new Map([...sums].map(([key,value])=>[
     key,{vector:value.vector.map(v=>v/value.count),count:value.count}
    ]));
   }
   // Shape the zipper as a tangent-aware Hermite loft. The old linear
   // interpolation plus sin(pi*t) bulge left a non-zero normal derivative at
   // both source rims, which reads as a raised flap even when the indices weld.
   // Project each endpoint tangent into its own source surface and make the
   // normal bulge have zero slope at both ends.
   // A seam path must keep one coherent tangent orientation. Flipping each
   // sample independently against its local gap made neighboring Hermite
   // derivatives alternate across the curved rump, producing a twisted,
   // dark collar even when the zipper indices were manifold.
   let seamTangentOrientation={donor:1,host:1};
   function tangentHermiteBridgePoint(donorPoint,hostPoint,donorN,hostN,t,
    donorRimTangent=null,hostRimTangent=null,
    donorSurfaceInward=null,hostSurfaceInward=null){
    const gap=hostPoint.map((v,k)=>v-donorPoint[k]);
    const gapLength=Math.hypot(...gap);
    const unit=normal=>{
     const length=Math.hypot(...normal)||1;
     return normal.map(v=>v/length);
    };
    const n0=unit(donorN),n1=unit(hostN);
    const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
    const projectSurfaceDirection=(surface,rimTangent,sign)=>{
     if(!surface?.vector||!rimTangent)return null;
     const tangentLength=Math.hypot(...rimTangent);
     if(tangentLength<1e-10)return null;
     const tangent=rimTangent.map(v=>v/tangentLength);
     const source=surface.vector.slice();
     const along=dot(source,tangent);
     const projected=source.map((v,k)=>v-tangent[k]*along);
     const reach=Math.hypot(...projected);
     if(reach<1e-8)return null;
     return {direction:projected.map(v=>v/reach*sign),reach};
    };
    let tangent0=null,tangent1=null,usedSurfaceTangents=false,reach0=0,reach1=0;
    if(donorRimTangent&&hostRimTangent){
     // The donor derivative leaves its own one-ring; the host derivative
     // enters the host one-ring. Their signs are chosen ONCE per connected
     // boundary path, not independently per vertex, so the loft cannot twist
     // when a local gap vector crosses a near-perpendicular tangent.
     const donorOut=projectSurfaceDirection(donorSurfaceInward,donorRimTangent,-seamTangentOrientation.donor);
     const hostIn=projectSurfaceDirection(hostSurfaceInward,hostRimTangent,seamTangentOrientation.host);
     if(donorOut&&hostIn){
      // Keep the conservative 30% reach floor: the 45% experiment improved
      // mean quality but halved the worst triangle quality and did not remove
      // the visible rump slit. Preserve per-face inversion and area guards.
      reach0=Math.min(gapLength*.55,Math.max(gapLength*.30,donorOut.reach*.85));
      reach1=Math.min(gapLength*.55,Math.max(gapLength*.30,hostIn.reach*.85));
      tangent0=donorOut.direction.map(v=>v*reach0);
      tangent1=hostIn.direction.map(v=>v*reach1);
      usedSurfaceTangents=true;
     }
    }
    if(!tangent0||!tangent1){
     // Fail-safe for an incomplete boundary neighborhood: retain the prior
     // normal/tangent estimate rather than inventing a direction or NaN.
     const fallbackDirection=(normal,rimTangent,toward)=>{
      if(!rimTangent)return null;
      const length=Math.hypot(...rimTangent);
      if(length<1e-10)return null;
      const tangent=rimTangent.map(v=>v/length);
      let direction=[
       normal[1]*tangent[2]-normal[2]*tangent[1],
       normal[2]*tangent[0]-normal[0]*tangent[2],
       normal[0]*tangent[1]-normal[1]*tangent[0]
      ];
      const size=Math.hypot(...direction);
      if(size<1e-9)return null;
      direction=direction.map(v=>v/size);
      if(dot(direction,toward)<0)direction=direction.map(v=>-v);
      return direction;
     };
     const donorFallback=fallbackDirection(n0,donorRimTangent,gap);
     const hostFallback=fallbackDirection(n1,hostRimTangent,gap.map(v=>-v));
     if(donorFallback&&hostFallback){
      tangent0=donorFallback.map(v=>v*gapLength*.45);
      tangent1=hostFallback.map(v=>-v*gapLength*.45);
     }else{
      tangent0=gap.map((v,k)=>v-n0[k]*dot(gap,n0)).map(v=>v*.45);
      tangent1=gap.map((v,k)=>v-n1[k]*dot(gap,n1)).map(v=>v*.45);
     }
    }
    const t2=t*t,t3=t2*t;
    const h00=2*t3-3*t2+1,h10=t3-2*t2+t,
     h01=-2*t3+3*t2,h11=t3-t2;
    const smooth=t2*(3-2*t);
    const blended=n0.map((v,k)=>v*(1-smooth)+n1[k]*smooth);
    const blendedLength=Math.hypot(...blended)||1;
    const outward=blended.map(v=>v/blendedLength);
    const bulge=Math.min(.0009,gapLength*.22)*Math.sin(Math.PI*t)**2;
    const point=donorPoint.map((v,k)=>
     v*h00+tangent0[k]*h10+hostPoint[k]*h01+tangent1[k]*h11+outward[k]*bulge);
    return {point,outward,usedSurfaceTangents,reach0,reach1};
   }
   function bridgeLayerVertex(donorId,sample,fraction,donorRimTangent=null,hostRimTangent=null,
    donorSurfaceInward=null,hostSurfaceInward=null){
    const key=[donorId,sample.a,sample.b,Math.round(sample.t*1e8),Math.round(fraction*1e8)].join(':');
    if(layerProjected.has(key))return layerProjected.get(key);
    const donorPoint=pointAt(donorPos,donorId),hostPoint=sample.point;
    const donorN=donorNormal?[0,1,2].map(k=>donorNormal.getComponent(donorId,k)):[0,1,0];
    let hostN=hostNormal?[0,1,2].map(k=>
     hostNormal.getComponent(sample.a,k)*(1-sample.t)+
     hostNormal.getComponent(sample.b,k)*sample.t):[0,1,0];
    const hostLength=Math.hypot(...hostN)||1;
    hostN=hostN.map(v=>v/hostLength);
    const bridge=tangentHermiteBridgePoint(
     donorPoint,hostPoint,donorN,hostN,fraction,donorRimTangent,hostRimTangent,
     donorSurfaceInward,hostSurfaceInward);
    const {point,outward}=bridge;
    if(!bridge.usedSurfaceTangents)seamBridgeSurfaceTangentFallbacks++;
    else{
     seamBridgeTangentReachSum+=bridge.reach0+bridge.reach1;
     seamBridgeTangentReachCount+=2;
    }
    const influence=new Map();
    for(let k=0;k<4;k++){
     const weight=donorWeights.getComponent(donorId,k)*(1-fraction);
     if(weight>1e-9){
      const joint=donorSkin.getComponent(donorId,k);
      influence.set(joint,(influence.get(joint)||0)+weight);
     }
    }
    const t=Math.max(0,Math.min(1,sample.t));
    for(const [hostId,factor] of [[sample.a,1-t],[sample.b,t]]){
     for(let k=0;k<4;k++){
      const weight=hostWeights.getComponent(hostId,k)*factor*fraction;
      if(weight>1e-9){
       const joint=hostSkin.getComponent(hostId,k);
       influence.set(joint,(influence.get(joint)||0)+weight);
      }
     }
    }
    const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
    const total=top.reduce((sum,item)=>sum+item[1],0)||1;
    const index=donorBase+bridgePositions.length/3;
    bridgePositions.push(...point);bridgeNormals.push(...outward);
    bridgeJoints.push(...Array.from({length:4},(_,k)=>top[k]?.[0]||0));
    bridgeWeights.push(...Array.from({length:4},(_,k)=>(top[k]?.[1]||0)/total));
    assertBridgeSkinArrays('Hermite layer');
    bridgeVertexSpecs.set(index,{
     donorId,
     sample:{a:sample.a,b:sample.b,t},
     fraction,
     hostRimTangent:hostRimTangent?.slice()||null,
     hostSurfaceInward:hostSurfaceInward?.vector?
      {vector:hostSurfaceInward.vector.slice()}:null,
     orientation:{...seamTangentOrientation}
    });
    layerProjected.set(key,index);
    return index;
   }
   // A skewed seam quad can defeat both diagonals even when its surface
   // is otherwise valid. Add a skinned center vertex and fan the cell into
   // four smaller faces; this refines the transition patch without accepting
   // a needle triangle or relaxing the quality floor.
   function bridgeCellCenterVertex(ids){
    const points=ids.map(positionFor),normals=ids.map(normalFor);
    const dot=(a,b)=>a.reduce((sum,value,k)=>sum+value*b[k],0);
    const cross=(a,b,c)=>{
     const u=b.map((value,k)=>value-a[k]),v=c.map((value,k)=>value-a[k]);
     return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    };
    const normalize=value=>{
     const length=Math.hypot(...value);
     return length>1e-12?value.map(v=>v/length):[0,1,0];
    };
    let geometric=[0,0,0];
    if(ids.length===3)geometric=cross(points[0],points[1],points[2]);
    else if(ids.length===4){
     const first=cross(points[0],points[1],points[2]);
     const second=cross(points[0],points[2],points[3]);
     geometric=first.map((value,k)=>value+second[k]);
    }
    const reference=[0,1,2].map(k=>
     normals.reduce((sum,n)=>sum+n[k],0));
    if(Math.hypot(...geometric)<1e-10)geometric=reference.slice();
    if(dot(geometric,reference)<0)geometric=geometric.map(value=>-value);
    const outward=normalize(geometric);
    const quality=(a,b,c)=>{
     const n=cross(a,b,c),twiceArea=Math.hypot(...n);
     const edgeSq=distance3(a,b)**2+distance3(b,c)**2+distance3(c,a)**2;
     if(!Number.isFinite(twiceArea)||twiceArea<1e-9||edgeSq<1e-18)return 0;
     return Math.min(1,(2*Math.sqrt(3)*twiceArea)/edgeSq);
    };
    const factorsCandidates=[];
    if(ids.length===3){
     const lengths=[
      distance3(points[1],points[2]),
      distance3(points[2],points[0]),
      distance3(points[0],points[1])
     ];
     const perimeter=lengths.reduce((sum,value)=>sum+value,0)||1;
     factorsCandidates.push(lengths.map(value=>value/perimeter));
     factorsCandidates.push([1/3,1/3,1/3]);
     for(const heavy of [0,1,2]){
      const factors=[.375,.375,.375];
      factors[heavy]=.25;
      const total=factors.reduce((sum,value)=>sum+value,0);
      factorsCandidates.push(factors.map(value=>value/total));
     }
     for(const heavy of [0,1,2]){
      const factors=[.2,.2,.2];
      factors[heavy]=.6;
      factorsCandidates.push(factors);
     }
    }else{
     for(const u of [.2,.3,.4,.5,.6,.7,.8])for(const v of [.2,.3,.4,.5,.6,.7,.8])
      factorsCandidates.push([(1-u)*(1-v),u*(1-v),u*v,(1-u)*v]);
     factorsCandidates.push([.25,.25,.25,.25]);
    }
    // A small outward Steiner lift keeps the fan away from a nearly collapsed
    // boundary plane; the candidate search chooses the point that maximizes
    // the worst child-triangle quality without relaxing the .015 floor.
    const cellScale=Math.max(...points.map((point,i)=>distance3(point,points[(i+1)%points.length])));
    const lift=Math.min(.00024,Math.max(.00012,cellScale*.18));
    let best=null;
    for(const factors of factorsCandidates){
     const base=[0,1,2].map(k=>
      points.reduce((sum,p,i)=>sum+p[k]*factors[i],0));
     const point=base.map((value,k)=>value+outward[k]*lift);
     const childQualities=[],orientation=[];
     for(let i=0;i<ids.length;i++){
      const a=points[i],b=points[(i+1)%ids.length];
      const n=cross(a,b,point);
      childQualities.push(quality(a,b,point));
      orientation.push(dot(n,outward));
     }
     if(orientation.some(value=>value<=1e-14))continue;
     const minimum=Math.min(...childQualities);
     const average=childQualities.reduce((sum,value)=>sum+value,0)/childQualities.length;
     const score=minimum+average*.02;
     if(!best||score>best.score)best={factors,point,score,minimum};
    }
    if(!best){
     const factors=ids.length===3?[1/3,1/3,1/3]:ids.map(()=>1/ids.length);
     const point=[0,1,2].map(k=>
      points.reduce((sum,p,i)=>sum+p[k]*factors[i],0)+outward[k]*lift);
     best={factors,point,score:-1,minimum:0};
    }
    const factors=best.factors,point=best.point;
    const influence=new Map();
    for(let i=0;i<ids.length;i++)for(let k=0;k<4;k++){
     const id=ids[i],offset=(id-donorBase)*4;
     const joint=id<donorBase?donorSkin.getComponent(id,k):bridgeJoints[offset+k];
     const weight=(id<donorBase?donorWeights.getComponent(id,k):bridgeWeights[offset+k])*factors[i];
     if(weight>1e-9)influence.set(joint,(influence.get(joint)||0)+weight);
    }
    const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
    const total=top.reduce((sum,item)=>sum+item[1],0)||1;
    const index=donorBase+bridgePositions.length/3;
    bridgePositions.push(...point);bridgeNormals.push(...outward);
    bridgeJoints.push(...Array.from({length:4},(_,k)=>top[k]?.[0]||0));
    bridgeWeights.push(...Array.from({length:4},(_,k)=>(top[k]?.[1]||0)/total));
    assertBridgeSkinArrays('Steiner center');
    return index;
   }
   function splitHostBoundaryEdges(samplesByEdge){
    const index=hostGeo.getIndex();
    if(!index)throw Error('BTC seam host subdivision requires indexed Maya geometry');
    const entries=Object.entries(hostGeo.attributes);
    const originals=new Map(entries.map(([name,attr])=>[name,Array.from(attr.array)]));
    const arrays=new Map(entries.map(([name,attr])=>[name,Array.from(attr.array)]));
    const skinIndex=hostGeo.getAttribute('skinIndex');
    const skinWeight=hostGeo.getAttribute('skinWeight');
    if(!skinIndex||!skinWeight||skinIndex.itemSize!==4||skinWeight.itemSize!==4)
     throw Error('BTC seam host subdivision lost four-weight skin attributes');
    const vertexStart=hostPos.count,vertexCache=new Map();
    const appendVertex=(ids,factors,cacheKey)=>{
     if(cacheKey&&vertexCache.has(cacheKey))return vertexCache.get(cacheKey);
     const influence=new Map();
     for(let i=0;i<ids.length;i++)for(let k=0;k<4;k++){
      const joint=skinIndex.array[ids[i]*4+k];
      const weight=skinWeight.array[ids[i]*4+k]*factors[i];
      if(weight>1e-9)influence.set(joint,(influence.get(joint)||0)+weight);
     }
     const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
     const total=top.reduce((sum,item)=>sum+item[1],0)||1;
     for(const [name,attr] of entries){
      const target=arrays.get(name),size=attr.itemSize;
      if(name==='skinIndex'){
       for(let k=0;k<4;k++)target.push(top[k]?.[0]||0);
      }else if(name==='skinWeight'){
       for(let k=0;k<4;k++)target.push((top[k]?.[1]||0)/total);
      }else{
       const values=[];
       for(let c=0;c<size;c++){
        let value=0;
        for(let i=0;i<ids.length;i++)
         value+=originals.get(name)[ids[i]*size+c]*factors[i];
        values.push(value);
       }
       if(name==='normal'&&size>=3){
        const length=Math.hypot(values[0],values[1],values[2])||1;
        values[0]/=length;values[1]/=length;values[2]/=length;
       }
       const integer=!(attr.array instanceof Float32Array)&&!(attr.array instanceof Float64Array);
       for(const value of values)target.push(integer?Math.round(value):value);
      }
     }
     const id=arrays.get('position').length/hostGeo.getAttribute('position').itemSize-1;
     if(cacheKey)vertexCache.set(cacheKey,id);
     return id;
    };
    const splitLists=new Map();
    for(const [key,values] of samplesByEdge){
     const sorted=values.slice().sort((a,b)=>a-b),unique=[];
     for(const t of sorted)if(t>1e-5&&t<1-1e-5&&
       (!unique.length||Math.abs(t-unique[unique.length-1])>1e-6))unique.push(t);
     if(unique.length)splitLists.set(key,unique);
    }
    const originalGroups=hostGeo.groups.length?hostGeo.groups.slice():
     [{start:0,count:index.count,materialIndex:0}];
    const nextIndices=[],nextGroups=[],seenEdges=new Set();
    for(const group of originalGroups){
     const start=nextIndices.length;
     for(let offset=group.start;offset<group.start+group.count;offset+=3){
      if(offset+2>=index.count)throw Error('BTC seam host subdivision found a partial triangle');
      const ids=[index.getX(offset),index.getX(offset+1),index.getX(offset+2)];
      const polygon=[],faceSplits=[];
      for(let edge=0;edge<3;edge++){
       const a=ids[edge],b=ids[(edge+1)%3];
       polygon.push(a);
       const ka=seamKey(hostPos,a),kb=seamKey(hostPos,b);
       if(ka===kb)continue;
       const key=ka<kb?ka+'|'+kb:kb+'|'+ka;
       const values=splitLists.get(key);
       if(!values?.length)continue;
       seenEdges.add(key);faceSplits.push(key);
       const forward=ka<kb;
       const ordered=forward?values:values.slice().reverse();
       for(const canonicalT of ordered){
        const t=forward?canonicalT:1-canonicalT;
        const fromLowId=a<b?t:1-t;
        const cacheKey=[Math.min(a,b),Math.max(a,b),Math.round(fromLowId*1e8)].join(':');
        polygon.push(appendVertex([a,b],[1-t,t],cacheKey));
       }
      }
      if(!faceSplits.length){nextIndices.push(...ids);continue;}
      // A center fan handles one, two or three subdivided edges without
      // changing the original triangle's planar footprint or winding.
      const center=appendVertex(ids,[1/3,1/3,1/3],'face:'+offset+':'+group.materialIndex);
      for(let i=0;i<polygon.length;i++)
       nextIndices.push(center,polygon[i],polygon[(i+1)%polygon.length]);
     }
     if(nextIndices.length>start)
      nextGroups.push({start,count:nextIndices.length-start,materialIndex:group.materialIndex});
    }
    let missing=0;
    for(const key of splitLists.keys())if(!seenEdges.has(key))missing++;
    if(missing)throw Error('BTC seam host subdivision could not resolve '+missing+' sampled Maya rim edges');
    const vertexCount=arrays.get('position').length/hostGeo.getAttribute('position').itemSize;
    for(const [name,attr] of entries){
     const C=attr.array.constructor;
     const replacement=new THREE.BufferAttribute(new C(arrays.get(name)),attr.itemSize,attr.normalized);
     if(attr.usage!==undefined)replacement.setUsage(attr.usage);
     hostGeo.setAttribute(name,replacement);
    }
    const IndexArray=vertexCount>65535?Uint32Array:Uint16Array;
    hostGeo.setIndex(new THREE.BufferAttribute(new IndexArray(nextIndices),1));
    hostGeo.clearGroups();
    for(const group of nextGroups)hostGeo.addGroup(group.start,group.count,group.materialIndex);
    hostGeo.setDrawRange(0,nextIndices.length);
    hostGeo.computeBoundingBox();hostGeo.computeBoundingSphere();
    return {points:vertexCount-vertexStart,edges:seenEdges.size,missing};
   }
   const positionFor=id=>id<donorBase?pointAt(donorPos,id):
    bridgePositions.slice((id-donorBase)*3,(id-donorBase)*3+3);
   const normalFor=id=>id<donorBase?
    (donorNormal?[0,1,2].map(k=>donorNormal.getComponent(id,k)):[0,1,0]):
    bridgeNormals.slice((id-donorBase)*3,(id-donorBase)*3+3);
   function bridgeBetweenVertices(donorId,hostId,fraction,cache){
    const t=Math.max(0,Math.min(1,fraction));
    if(t<=1e-8)return donorId;
    if(t>=1-1e-8)return hostId;
    const key=donorId+':'+hostId+':'+Math.round(t*1e8);
    if(cache.has(key))return cache.get(key);
    const donorPoint=positionFor(donorId),hostPoint=positionFor(hostId);
    const donorNormal=normalFor(donorId),hostNormal=normalFor(hostId);
    const hostSourceId=bridgeEndpointInfo.get(hostId)?.hostSourceId;
    const donorSurface=donorBoundaryInward.get(seamKey(donorPos,donorId))||null;
    const hostSurface=Number.isInteger(hostSourceId)?
     hostBoundaryInward.get(seamKey(hostPos,hostSourceId))||null:null;
    const bridge=tangentHermiteBridgePoint(
     donorPoint,hostPoint,donorNormal,hostNormal,t,
     donorRimTangentById.get(donorId)||null,
     Number.isInteger(hostSourceId)?hostRimTangentById.get(hostSourceId)||null:null,
     donorSurface,hostSurface);
    const {point,outward}=bridge;
    if(!bridge.usedSurfaceTangents)seamBridgeSurfaceTangentFallbacks++;
    else{
     seamBridgeTangentReachSum+=bridge.reach0+bridge.reach1;
     seamBridgeTangentReachCount+=2;
    }
    const influence=new Map();
    for(const [id,factor] of [[donorId,1-t],[hostId,t]]){
     const offset=(id-donorBase)*4;
     for(let k=0;k<4;k++){
      const joint=id<donorBase?donorSkin.getComponent(id,k):bridgeJoints[offset+k];
      const weight=(id<donorBase?donorWeights.getComponent(id,k):bridgeWeights[offset+k])*factor;
      if(weight>1e-9)influence.set(joint,(influence.get(joint)||0)+weight);
     }
    }
    const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
    const total=top.reduce((sum,item)=>sum+item[1],0)||1;
    const index=donorBase+bridgePositions.length/3;
    bridgePositions.push(...point);bridgeNormals.push(...outward);
    bridgeJoints.push(...Array.from({length:4},(_,k)=>top[k]?.[0]||0));
    bridgeWeights.push(...Array.from({length:4},(_,k)=>(top[k]?.[1]||0)/total));
    assertBridgeSkinArrays('cross-boundary interpolation');
    cache.set(key,index);
    return index;
   }
   function registerHostBoundarySamples(alignment){
    for(const sample of alignment.samples){
     const ka=seamKey(hostPos,sample.a),kb=seamKey(hostPos,sample.b);
     if(ka===kb||sample.t<=1e-5||sample.t>=1-1e-5)continue;
     const forward=ka<kb,key=forward?ka+'|'+kb:kb+'|'+ka;
     const t=forward?sample.t:1-sample.t;
     const list=hostBoundarySplitSamples.get(key)||[];
     list.push(t);hostBoundarySplitSamples.set(key,list);
    }
   }
   function bridgeTriangle(ids,fallbackNormal){
    const points=ids.map(positionFor);
    const u=points[1].map((v,k)=>v-points[0][k]);
    const v=points[2].map((x,k)=>x-points[0][k]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const areaSq=cross.reduce((sum,x)=>sum+x*x,0);
    if(areaSq<1e-18)return null;
    const normals=ids.map(normalFor);
    let target=[0,1,2].map(k=>normals[0][k]+normals[1][k]+normals[2][k]);
    if(Math.hypot(...target)<1e-8)target=fallbackNormal||[0,1,0];
    if(Math.hypot(...target)<1e-8)
     target=normals.find(n=>Math.hypot(...n)>1e-8)||[0,1,0];
    const alignment=cross.reduce((sum,x,k)=>sum+x*target[k],0);
    const oriented=ids.slice();
    if(alignment<0)[oriented[1],oriented[2]]=[oriented[2],oriented[1]];
    return {ids:oriented,areaSq};
   }
   function addBridgeQuad(a,b,pa,pb,hostStep){
    const donorFallback=[0,1,2].map(k=>normalFor(a)[k]+normalFor(b)[k]);
    const hostFallback=[0,1,2].map(k=>normalFor(pa)[k]+normalFor(pb)[k]);
    const first=[bridgeTriangle([a,b,pa],donorFallback),bridgeTriangle([b,pb,pa],hostFallback)];
    const second=[bridgeTriangle([a,b,pb],donorFallback),bridgeTriangle([a,pb,pa],hostFallback)];
    const pairs=[first,second].filter(pair=>pair.every(Boolean));
    if(pairs.length){
     pairs.sort((p,q)=>Math.min(q[0].areaSq,q[1].areaSq)-
      Math.min(p[0].areaSq,p[1].areaSq));
     for(const tri of pairs[0])bridgeIndices.push(...tri.ids);
     return 2;
    }
    if(hostStep<=.00001){
     const tri=bridgeTriangle([a,b,pa])||bridgeTriangle([a,b,pb]);
     if(tri){bridgeIndices.push(...tri.ids);return 1;}
    }
    return 0;
   }
   // The prior zipper oriented every triangle independently against local
   // averaged normals. Across a curved hind rim that can flip neighboring
   // faces independently, leaving same-direction shared edges and backface
   // holes even though every triangle is nondegenerate. Orient the entire
   // connected strip as one manifold, then choose its outward side once.
   function orientBridgeStrip(source){
    const triangles=source.map(ids=>ids.slice());
    const uses=new Map();
    for(let face=0;face<triangles.length;face++){
     const ids=triangles[face];
     for(const [from,to] of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){
      const key=from<to?from+':'+to:to+':'+from;
      const list=uses.get(key)||[];
      list.push({face,from,to});uses.set(key,list);
     }
    }
    const links=Array.from({length:triangles.length},()=>[]);
    for(const [edge,list] of uses){
     if(list.length>2)
      throw Error('BTC seam bridge has a non-manifold indexed edge '+edge+
       ' used by '+list.length+' faces');
     if(list.length!==2)continue;
     const [a,b]=list;
     const same=a.from===b.from&&a.to===b.to;
     const toggle=same?1:0;
     links[a.face].push({face:b.face,toggle});
     links[b.face].push({face:a.face,toggle});
    }
    const state=new Int8Array(triangles.length);state.fill(-1);
    const components=[];
    for(let start=0;start<triangles.length;start++){
     if(state[start]!==-1)continue;
     const component=[],stack=[start];state[start]=0;
     while(stack.length){
      const face=stack.pop();component.push(face);
      for(const link of links[face]){
       const expected=state[face]^link.toggle;
       if(state[link.face]===-1){
        state[link.face]=expected;stack.push(link.face);
       }else if(state[link.face]!==expected){
        throw Error('BTC seam bridge winding conflict across connected zipper strip');
       }
      }
     }
     components.push(component);
    }
    // A coherent component can still be globally inward. Use its actual
    // skinned vertex normals to select the outward orientation once.
    for(const component of components){
     let score=0;
     for(const face of component){
      const ids=triangles[face],oriented=state[face]?
       [ids[0],ids[2],ids[1]]:ids;
      const p=oriented.map(positionFor);
      const u=p[1].map((v,k)=>v-p[0][k]),v=p[2].map((x,k)=>x-p[0][k]);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      // The bridge is sewn to the Maya host surface. Donor normals can
      // be locally inconsistent at the cut after independent GLB subdivision,
      // so select the component's global side from host-side normals only.
      const hostSide=oriented.filter(id=>id>=donorBase);
      const target=[0,1,2].map(k=>(hostSide.length?hostSide:oriented)
       .reduce((sum,id)=>sum+normalFor(id)[k],0));
      score+=n.reduce((sum,value,k)=>sum+value*target[k],0);
     }
     if(score<0)for(const face of component)state[face]^=1;
    }
    for(let face=0;face<triangles.length;face++)if(state[face]){
     [triangles[face][1],triangles[face][2]]=
      [triangles[face][2],triangles[face][1]];
     bridgeOrientationFlips++;
    }
    bridgeOrientationComponents+=components.length;
    return triangles;
   }
   function zipperTriangleQuality(triangle,scale,progressError){
    const p=triangle.ids.map(positionFor);
    const lengths=[
     distance3(p[0],p[1]),distance3(p[1],p[2]),distance3(p[2],p[0])
    ];
    const edgeSq=lengths.reduce((sum,v)=>sum+v*v,0);
    const u=p[1].map((v,k)=>v-p[0][k]),v=p[2].map((x,k)=>x-p[0][k]);
    const cross=[
     u[1]*v[2]-u[2]*v[1],
     u[2]*v[0]-u[0]*v[2],
     u[0]*v[1]-u[1]*v[0]
    ];
    const twiceArea=Math.hypot(...cross);
    if(!Number.isFinite(twiceArea)||twiceArea<1e-9||edgeSq<1e-18)return null;
    const quality=Math.min(1,(2*Math.sqrt(3)*twiceArea)/edgeSq);
    if(!Number.isFinite(quality)||quality<1e-5)return null;
    const edgePenalty=edgeSq/(3*scale*scale);
    const cost=(1-quality)+.08*edgePenalty+.35*progressError*progressError;
    return {quality,cost};
   }
   const planes=['z','y','x-','x+'];
   const seamBoundaryClosureDiagnostics=[];
   let seamOpenPaths=0,seamClosedLoops=0,seamVirtualClosures=0,
    seamVirtualClosureMaxGap=0,seamBridgeSurfaceTangentFallbacks=0,
    seamBridgeTangentDirectionFlips=0,seamBridgeTangentReachSum=0,seamBridgeTangentReachCount=0;
   let seamDonorRimWeightOverrides=0;
   // Record why the DP loft is rejected so the next geometry pass targets the failed cell.
   const seamBridgeZipperAdaptiveRejectReasons=[];
   for(const plane of planes)for(const side of [-1,1]){
    const hostPaths=orderedBoundaryPaths(hostRim,hostPos,plane,side);
    const donorPaths=orderedBoundaryPaths(donorRimEdges,donorPos,plane,side);
    if(hostPaths.degreeErrors||donorPaths.degreeErrors)
     throw Error('BTC seam boundary has a true non-manifold branch on '+plane+
      ' side '+side+' (host errors '+hostPaths.degreeErrors+', donor errors '+donorPaths.degreeErrors+')');
    if(!hostPaths.paths.length&&!donorPaths.paths.length)continue;
    const pairs=pairBoundaryPaths(donorPaths.paths,hostPaths.paths,plane,side);
    for(const {donorPath,hostPath} of pairs){
     const alignment=findBestBoundaryAlignment(donorPath,hostPath);
     if(!alignment)throw Error('BTC seam path has no nondegenerate arc-length alignment');
     bridgeLoopPairs++;
     if(alignment.closed)seamClosedLoops++;else seamOpenPaths++;
     for(const path of [donorPath,hostPath])if(Number.isFinite(path.virtualClosureGap)){
      seamVirtualClosures++;
      seamVirtualClosureMaxGap=Math.max(seamVirtualClosureMaxGap,path.virtualClosureGap);
     }
     const donor=alignment.donor,host=alignment.host;
    // Rebuild physical UV/material twins after the earlier guarded rim snap;
    // donorBoundary.byPosition keys still describe the pre-snap coordinates.
    const currentDonorGroups=new Map();
    for(let id=0;id<donorPos.count;id++){
     const key=seamKey(donorPos,id),group=currentDonorGroups.get(key)||[];
     group.push(id);currentDonorGroups.set(key,group);
    }
    // The zipper's host-side vertices use interpolated Maya skin weights.
    // The donor-side boundary must use those SAME weights at corresponding
    // arc-length samples or the strip peels open when Gallop bends the hock.
    // Transfer only the physical cut-rim vertices (including UV/material
    // duplicates); keep the donor's interior limb weights untouched.
    for(let i=0;i<donor.length;i++){
     const donorId=donor[i],sample=alignment.samples[i];
     const physicalKey=seamKey(donorPos,donorId);
     const twins=currentDonorGroups.get(physicalKey)||[donorId];
     const influence=new Map(),t=Math.max(0,Math.min(1,sample.t));
     for(const [hostId,factor] of [[sample.a,1-t],[sample.b,t]]){
      for(let k=0;k<4;k++){
       const weight=hostWeights.getComponent(hostId,k)*factor;
       if(weight>1e-9){
        const joint=hostSkin.getComponent(hostId,k);
        influence.set(joint,(influence.get(joint)||0)+weight);
       }
      }
     }
     const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4);
     const total=top.reduce((sum,item)=>sum+item[1],0);
     if(total<1e-8)throw Error('BTC seam correspondence has no host skin influences');
     for(const twin of twins)for(let k=0;k<4;k++){
      donorSkin.setComponent(twin,k,top[k]?.[0]||0);
      donorWeights.setComponent(twin,k,(top[k]?.[1]||0)/total);
     }
     seamDonorRimWeightOverrides+=twins.length;
    }
    // Conform the donor cut rim to the actual Maya boundary instead of
    // leaving a 3-4 mm floating zipper sheet between two unrelated curves.
    // The displacement is distributed over a 24 mm geodesic-like collar
    // using local spatial samples, then backtracked as one deformation so
    // no donor triangle can invert or collapse.
    {
     const side=Math.sign(pointAt(donorPos,donor[0])[0]);
     const radius=.024,sigma=.0096,radiusSq=radius*radius;
     // A full projection asks the coarse donor collar to absorb a 3-4 mm
     // shape mismatch in one pass. Its face-preserving line search accepted
     // under 10% of that motion. Start with a controlled 35% conform target;
     // the skinned zipper carries the remaining measured gap.
     const seamWarpTargetFraction=.35;
     const targets=donor.map((id,i)=>{
      const sample=alignment.samples[i],t=Math.max(0,Math.min(1,sample.t));
      let normal=hostNormal?[0,1,2].map(k=>
       hostNormal.getComponent(sample.a,k)*(1-t)+hostNormal.getComponent(sample.b,k)*t
      ):[0,1,0];
      const normalLength=Math.hypot(...normal);
      normal=normalLength>1e-10?normal.map(v=>v/normalLength):[0,1,0];
      const target=sample.point.map((v,k)=>v+normal[k]*.00012);
      const origin=pointAt(donorPos,id);
      const delta=target.map((v,k)=>(v-origin[k])*seamWarpTargetFraction);
      return {id,key:seamKey(donorPos,id),origin,target,delta,normal};
     });
     const exact=new Map(targets.map(item=>[item.key,item.delta]));
     const warp=Array.from({length:donorPos.count},()=>[0,0,0]);
     const moved=new Uint8Array(donorPos.count);
     for(const [key,ids] of currentDonorGroups){
      const representative=ids[0],point=pointAt(donorPos,representative);
      if(Math.sign(point[0])!==side)continue;
      let nearestSq=Infinity,weightSum=0;
      const sum=[0,0,0];
      for(const target of targets){
       const dx=point[0]-target.origin[0],dy=point[1]-target.origin[1],
        dz=point[2]-target.origin[2];
       const d2=dx*dx+dy*dy+dz*dz;
       if(d2>radiusSq)continue;
       nearestSq=Math.min(nearestSq,d2);
       const weight=Math.exp(-d2/(2*sigma*sigma));
       weightSum+=weight;
       for(let k=0;k<3;k++)sum[k]+=target.delta[k]*weight;
      }
      if(nearestSq>radiusSq||weightSum<1e-10)continue;
      const delta=exact.get(key)||(()=>{
       const u=Math.max(0,Math.min(1,1-Math.sqrt(nearestSq)/radius));
       const falloff=u*u*(3-2*u);
       return sum.map(v=>v/weightSum*falloff);
      })();
      for(const id of ids){warp[id]=delta.slice();moved[id]=1;}
     }
     const base=Array.from({length:donorPos.count},(_,id)=>pointAt(donorPos,id));
     const positions=base.map(point=>point.slice());
     const faces=[],incident=Array.from({length:donorPos.count},()=>[]);
     for(let j=0;j<di.count;j+=3){
      const face=[di.getX(j),di.getX(j+1),di.getX(j+2)];
      const faceIndex=faces.length;
      faces.push(face);
      for(const id of face)incident[id].push(faceIndex);
     }
     const normalOf=(a,b,c)=>{
      const u=b.map((v,k)=>v-a[k]),v=c.map((x,k)=>x-a[k]);
      return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
     };
     const edgeSquares=points=>[0,1,2].map(k=>
      points[k].reduce((sum,v,d)=>sum+(v-points[(k+1)%3][d])**2,0));
     // The old global line search let ONE difficult triangle clamp the entire
     // 24 mm collar to 1/16 displacement. Move welded UV twins locally instead:
     // each group backtracks against its live incident faces and the original
     // sculpt, so safe regions can meet the Maya contour without folding a
     // distant face elsewhere on the rump.
     const groups=[];
     let requestedMove=0,acceptedMove=0,acceptedGroups=0,rejectedGroups=0;
     for(const [key,ids] of currentDonorGroups){
      const representative=ids[0];
      if(!moved[representative])continue;
      const requested=Math.hypot(...warp[representative]);
      if(requested<=1e-10)continue;
      groups.push({key,ids,representative,requested});
      requestedMove+=requested;
     }
     // Interior, low-displacement vertices move first. The cut rim moves last,
     // after its supporting collar has already absorbed the deformation.
     groups.sort((a,b)=>a.requested-b.requested||a.representative-b.representative);
     let totalMove=0;
     for(const group of groups){
      const {ids,representative,requested}=group;
      const affectedSet=new Set();
      for(const id of ids)for(const faceIndex of incident[id])affectedSet.add(faceIndex);
      const affected=[...affectedSet].map(faceIndex=>faces[faceIndex]);
      let accepted=null,acceptedFactor=0;
      for(const factor of [1,.75,.5,.375,.25,.125,.0625,.03125]){
       const delta=warp[representative].map(value=>value*factor);
       const nextById=new Map(ids.map(id=>[
        id,positions[id].map((value,k)=>value+delta[k])
       ]));
       let safe=true;
       for(const face of affected){
        const before=face.map(id=>positions[id]);
        const after=face.map(id=>nextById.get(id)||positions[id]);
        const reference=face.map(id=>base[id]);
        const n0=normalOf(...before),n1=normalOf(...after),nr=normalOf(...reference);
        const oldSq=n0.reduce((sum,value)=>sum+value*value,0);
        const newSq=n1.reduce((sum,value)=>sum+value*value,0);
        const refSq=nr.reduce((sum,value)=>sum+value*value,0);
        if(oldSq<1e-24||refSq<1e-24||newSq<oldSq*.20||
           newSq<refSq*.36||nr.reduce((sum,value,k)=>sum+value*n1[k],0)<=0||
           n0.reduce((sum,value,k)=>sum+value*n1[k],0)<=0){
         safe=false;break;
        }
        const oldEdges=edgeSquares(before),newEdges=edgeSquares(after),
         refEdges=edgeSquares(reference);
        const oldMin=Math.min(...oldEdges),newMin=Math.min(...newEdges),
         refMin=Math.min(...refEdges);
        const oldAspect=oldMin/Math.max(...oldEdges,1e-24),
         newAspect=newMin/Math.max(...newEdges,1e-24),
         refAspect=refMin/Math.max(...refEdges,1e-24);
        if(newMin<oldMin*.20||newMin<refMin*.25||
           newAspect<oldAspect/3||newAspect<refAspect/3){
         safe=false;break;
        }
       }
       if(safe){accepted=nextById;acceptedFactor=factor;break;}
      }
      if(!accepted){rejectedGroups++;continue;}
      const applied=requested*acceptedFactor;
      acceptedMove+=applied;totalMove+=applied;acceptedGroups++;
      seamWarpMaxMove=Math.max(seamWarpMaxMove,applied);
      for(const [id,next] of accepted){
       positions[id]=next;
       donorPos.setXYZ(id,...next);
      }
     }
     seamWarpFactor=Math.min(seamWarpFactor,
      requestedMove>1e-10?acceptedMove/requestedMove:0);
     seamWarpMeanMove=acceptedGroups?totalMove/acceptedGroups:0;
     seamWarpAcceptedGroups+=acceptedGroups;
     seamWarpRejectedGroups+=rejectedGroups;
     donorGeo.computeVertexNormals();
     let gapTotal=0,gapMax=0;
     for(let i=0;i<donor.length;i++){
      const gap=distance3(pointAt(donorPos,donor[i]),alignment.samples[i].point);
      gapTotal+=gap;gapMax=Math.max(gapMax,gap);
     }
     seamWarpMaxResidualGap=Math.max(seamWarpMaxResidualGap,gapMax);
     bridgeMaxGap=Math.max(bridgeMaxGap,gapMax);
     bridgeGapTotal+=gapTotal;
     bridgeGapCount+=donor.length;
    }
     const m=donor.length,n=host.length;
      const donorRimTangents=donor.map((id,i)=>{
       const previous=alignment.closed?donor[(i-1+m)%m]:donor[Math.max(0,i-1)];
       const next=alignment.closed?donor[(i+1)%m]:donor[Math.min(m-1,i+1)];
       donorRimNeighborsById.set(id,[previous,next]);
       const a=pointAt(donorPos,previous),b=pointAt(donorPos,next);
       return b.map((v,k)=>v-a[k]);
      });
      const hostPathRimTangents=host.map((id,i)=>{
       const previous=alignment.closed?host[(i-1+n)%n]:host[Math.max(0,i-1)];
       const next=alignment.closed?host[(i+1)%n]:host[Math.min(n-1,i+1)];
       const a=pointAt(hostPos,previous),b=pointAt(hostPos,next);
       return b.map((v,k)=>v-a[k]);
      });
      const hostRimTangents=alignment.samples.map(sample=>{
       const a=pointAt(hostPos,sample.a),b=pointAt(hostPos,sample.b);
       return b.map((v,k)=>v-a[k]);
      });
      donorBoundaryInward=boundaryInteriorMap(donorRimEdges,di,donorPos);
      hostBoundaryInward=boundaryInteriorMap(hostRim,hostIndex,hostPos);
      const donorSurfaceInwards=donor.map(id=>
       donorBoundaryInward.get(seamKey(donorPos,id))||null);
      const hostSurfaceInwards=alignment.samples.map(sample=>{
       const a=hostBoundaryInward.get(seamKey(hostPos,sample.a));
       const b=hostBoundaryInward.get(seamKey(hostPos,sample.b));
       if(!a||!b)return null;
       const t=Math.max(0,Math.min(1,sample.t));
       return {vector:a.vector.map((v,k)=>v*(1-t)+b.vector[k]*t)};
      });
      // Pick a single orientation for each entire donor/host boundary pair.
      // This uses the aggregate projected one-ring directions against the
      // measured gap, then keeps that sign fixed along the path. It avoids
      // the old per-sample sign flips that curled adjacent loft cells in
      // opposite directions near the stifle and rump.
      const tangentDot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
      const projectedDirection=(surface,rimTangent,sign)=>{
       if(!surface?.vector||!rimTangent)return null;
       const length=Math.hypot(...rimTangent);
       if(length<1e-10)return null;
       const tangent=rimTangent.map(v=>v/length),source=surface.vector;
       const along=tangentDot(source,tangent);
       const projected=source.map((v,k)=>v-tangent[k]*along);
       const magnitude=Math.hypot(...projected);
       return magnitude<1e-8?null:{direction:projected.map(v=>v/magnitude*sign)};
      };
      let donorOrientationScore=0,hostOrientationScore=0;
      for(let i=0;i<m;i++){
       const donorPoint=pointAt(donorPos,donor[i]);
       const gap=alignment.samples[i].point.map((v,k)=>v-donorPoint[k]);
       const donorDirection=projectedDirection(donorSurfaceInwards[i],donorRimTangents[i],-1);
       const hostDirection=projectedDirection(hostSurfaceInwards[i],hostRimTangents[i],1);
       if(donorDirection)donorOrientationScore+=tangentDot(donorDirection.direction,gap);
       if(hostDirection)hostOrientationScore+=tangentDot(hostDirection.direction,gap);
      }
      seamTangentOrientation={
       donor:donorOrientationScore>=0?1:-1,
       host:hostOrientationScore>=0?1:-1
      };
      if(seamTangentOrientation.donor<0)seamBridgeTangentDirectionFlips++;
      if(seamTangentOrientation.host<0)seamBridgeTangentDirectionFlips++;
      donorRimTangentById=new Map(donor.map((id,i)=>[id,donorRimTangents[i]]));
      hostRimTangentById=new Map(host.map((id,i)=>[id,hostPathRimTangents[i]]));
     const donorArc=arcTable(donor,donorPos,alignment.closed),
      hostArc=arcTable(host,hostPos,alignment.closed);
     const donorSteps=alignment.closed?m:m-1;
     const hostSteps=alignment.closed?n:n-1;
     const hostIds=host.map(id=>bridgeVertex({
      a:id,b:id,t:0,point:pointAt(hostPos,id)
     }));
     const meanStep=(donorArc.total/Math.max(1,donorSteps)+
      hostArc.total/Math.max(1,hostSteps))*.5;
     const scale=Math.max(meanStep,1e-6);
     let zipperPath=null;
     if(donorSteps>=1&&hostSteps>=1){
      const costs=Array.from({length:donorSteps+1},()=>Array(hostSteps+1).fill(Infinity));
      // Optimize the worst bridge face first. The previous sum-only DP could
      // accept a path with a few near-zero-area slivers because many good
      // triangles hid them in the total score. Keep the best bottleneck
      // quality at each monotone state, then use the original cost as tie-break.
      const minimums=Array.from({length:donorSteps+1},()=>Array(hostSteps+1).fill(0));
      const previous=Array.from({length:donorSteps+1},()=>Array(hostSteps+1).fill(null));
      costs[0][0]=0;
      minimums[0][0]=1;
      for(let i=0;i<=donorSteps;i++)for(let j=0;j<=hostSteps;j++){
       const base=costs[i][j];
       if(!Number.isFinite(base)||(i===donorSteps&&j===hostSteps))continue;
       const d0=donor[i%m],h0=hostIds[j%n];
       if(i<donorSteps){
        const d1=donor[(i+1)%m];
        const tri=bridgeTriangle([d0,d1,h0],
         [0,1,2].map(k=>normalFor(d0)[k]+normalFor(d1)[k]));
        if(tri){
         const td=donorArc.lengths[i+1]/donorArc.total;
         const th=hostArc.lengths[j]/hostArc.total;
         const q=zipperTriangleQuality(tri,scale,Math.abs(td-th));
         if(q){
          const next=base+q.cost;
          const bottleneck=Math.min(minimums[i][j],q.quality);
          if(bottleneck>minimums[i+1][j]+1e-9||
             (Math.abs(bottleneck-minimums[i+1][j])<=1e-9&&next<costs[i+1][j])){
           minimums[i+1][j]=bottleneck;
           costs[i+1][j]=next;
           previous[i+1][j]={i,j,tri,move:'donor',quality:q.quality};
          }
         }
        }
       }
       if(j<hostSteps){
        const h1=hostIds[(j+1)%n];
        const tri=bridgeTriangle([d0,h1,h0],
         [0,1,2].map(k=>normalFor(h0)[k]+normalFor(h1)[k]));
        if(tri){
         const td=donorArc.lengths[i]/donorArc.total;
         const th=hostArc.lengths[j+1]/hostArc.total;
         const q=zipperTriangleQuality(tri,scale,Math.abs(td-th));
         if(q){
          const next=base+q.cost;
          const bottleneck=Math.min(minimums[i][j],q.quality);
          if(bottleneck>minimums[i][j+1]+1e-9||
             (Math.abs(bottleneck-minimums[i][j+1])<=1e-9&&next<costs[i][j+1])){
           minimums[i][j+1]=bottleneck;
           costs[i][j+1]=next;
           previous[i][j+1]={i,j,tri,move:'host',quality:q.quality};
          }
         }
        }
       }
      }
      if(Number.isFinite(costs[donorSteps][hostSteps])){
       const path=[];let i=donorSteps,j=hostSteps;
       while(i||j){
        const step=previous[i][j];
        if(!step){path.length=0;break;}
        path.push(step);i=step.i;j=step.j;
       }
       if(path.length===donorSteps+hostSteps)zipperPath=path.reverse();
      }
     }
     // Build a curved, skinned transition surface instead of one flat
     // ribbon. The previous balanced quad was rejected whenever its 3–4 mm
     // collar gap produced a near-line triangle, then the lower-quality
     // single-strip DP path was used. Four intermediate rings distribute
     // that real gap, blend normals and retain the shared Gallop skeleton.
     let adaptiveBridge=false,resampledBridge=false,adaptiveRejectReason=null;
     // Use the monotone DP zipper correspondence as the actual surface map.
     // Equal arc-length resampling can pair anatomically different points when
     // the Maya and donor rims have different local vertex densities. Subdivide
     // each DP triangle along its donor-to-host edges so the adaptive mapping
     // retains a rounded, skinned transition without creating T-junctions.
     if(zipperPath?.length){
      const indexStart=bridgeIndices.length;
      const positionStart=bridgePositions.length,normalStart=bridgeNormals.length,
       jointStart=bridgeJoints.length,weightStart=bridgeWeights.length;
      const crossCache=new Map(),candidateTriangles=[],qualityValues=[];
      let valid=true;
      // Three wider Hermite bands give the skewed DP end cells more area per face;
      // keep the existing per-triangle quality floor and manifold checks unchanged.
      const fractions=[0,1/3,2/3,1];
      const makeCandidate=(ids,fallback)=>{
       const triangle=bridgeTriangle(ids,fallback);
       if(!triangle)return null;
       const quality=zipperTriangleQuality(triangle,scale,0);
       if(!quality||quality.quality<.015)return null;
       return {ids:triangle.ids,quality:quality.quality};
      };
      let adaptiveCenterFanCells=0,adaptiveCapFanTriangles=0,adaptiveQuadTriangleFanCells=0;
      const addTriangle=(ids,fallback,fanKind='cap')=>{
       const candidate=makeCandidate(ids,fallback);
       if(candidate){candidateTriangles.push(candidate);qualityValues.push(candidate.quality);return true;}
       // Subdivide a slender DP end cap into a skinned fan before rejecting
       // the entire loop. Each child still meets the original quality floor.
       const starts=[bridgePositions.length,bridgeNormals.length,
        bridgeJoints.length,bridgeWeights.length];
       const center=bridgeCellCenterVertex(ids);
       const fan=[
        makeCandidate([ids[0],ids[1],center],fallback),
        makeCandidate([ids[1],ids[2],center],fallback),
        makeCandidate([ids[2],ids[0],center],fallback)
       ];
       if(fan.every(Boolean)){
        for(const item of fan){candidateTriangles.push(item);qualityValues.push(item.quality);}
        if(fanKind==='quad')adaptiveQuadTriangleFanCells++;
        else adaptiveCapFanTriangles++;
        return true;
       }
       bridgePositions.length=starts[0];bridgeNormals.length=starts[1];
       bridgeJoints.length=starts[2];bridgeWeights.length=starts[3];
       if(fanKind==='cap')adaptiveRejectReason||='end-cap fan failed;quality='+fan.map(item=>item?.quality??'degenerate').join(',')+';ids='+ids.join(',');
       return false;
      };
      const addQuad=(a0,b0,a1,b1,fallback)=>{
       const pairs=[
        [[a0,b0,a1],[b0,b1,a1]],
        [[a0,b0,b1],[a0,b1,a1]]
       ].map(pair=>pair.map(ids=>makeCandidate(ids,fallback)));
       const accepted=pairs.filter(pair=>pair.every(Boolean)).sort((left,right)=>{
        const l=Math.min(...left.map(item=>item.quality));
        const r=Math.min(...right.map(item=>item.quality));
        return r-l;
       })[0];
       if(accepted){
        for(const item of accepted){candidateTriangles.push(item);qualityValues.push(item.quality);}
        return true;
       }
       // A curved DP strip can contain one skewed quad even when its neighboring
       // cells are healthy. Match the resampled bridge's center-fan fallback:
       // the center is skinned from the four boundary samples and every face
       // still has to meet the unchanged minimum triangle-quality threshold.
       // If a diagonal pair contains one poor triangle, subdivide that triangle
       // alone instead of forcing a four-face fan over the whole twisted quad.
       // This preserves the quad boundary and lets each child meet the same .015 floor.
       const trianglePairs=[
        [[a0,b0,a1],[b0,b1,a1]],
        [[a0,b0,b1],[a0,b1,a1]]
       ];
       let bestTrianglePair=null;
       for(const pair of trianglePairs){
        const starts=[bridgePositions.length,bridgeNormals.length,
         bridgeJoints.length,bridgeWeights.length];
        const candidateStart=candidateTriangles.length,qualityStart=qualityValues.length;
        const fanStart=adaptiveQuadTriangleFanCells;
        const accepted=addTriangle(pair[0],fallback,'quad')&&addTriangle(pair[1],fallback,'quad');
        if(accepted){
         const values=qualityValues.slice(qualityStart);
         const minimum=Math.min(...values),average=values.reduce((sum,value)=>sum+value,0)/values.length;
         const score=minimum+average*.02;
         if(!bestTrianglePair||score>bestTrianglePair.score){
          bestTrianglePair={
           score,
           positions:bridgePositions.slice(starts[0]),
           normals:bridgeNormals.slice(starts[1]),
           joints:bridgeJoints.slice(starts[2]),
           weights:bridgeWeights.slice(starts[3]),
           candidates:candidateTriangles.slice(candidateStart),
           qualities:values,
           fanCells:adaptiveQuadTriangleFanCells-fanStart
          };
         }
        }
        bridgePositions.length=starts[0];bridgeNormals.length=starts[1];
        bridgeJoints.length=starts[2];bridgeWeights.length=starts[3];
        candidateTriangles.length=candidateStart;qualityValues.length=qualityStart;
        adaptiveQuadTriangleFanCells=fanStart;
       }
       if(bestTrianglePair){
        bridgePositions.push(...bestTrianglePair.positions);
        bridgeNormals.push(...bestTrianglePair.normals);
        bridgeJoints.push(...bestTrianglePair.joints);
        bridgeWeights.push(...bestTrianglePair.weights);
        assertBridgeSkinArrays('accepted adaptive quad fan');
        candidateTriangles.push(...bestTrianglePair.candidates);
        qualityValues.push(...bestTrianglePair.qualities);
        adaptiveQuadTriangleFanCells+=bestTrianglePair.fanCells;
        return true;
       }
       const starts=[bridgePositions.length,bridgeNormals.length,
        bridgeJoints.length,bridgeWeights.length];
       const center=bridgeCellCenterVertex([a0,b0,b1,a1]);
       const fan=[
        makeCandidate([a0,b0,center],fallback),
        makeCandidate([b0,b1,center],fallback),
        makeCandidate([b1,a1,center],fallback),
        makeCandidate([a1,a0,center],fallback)
       ];
       if(fan.every(Boolean)){
        for(const item of fan){candidateTriangles.push(item);qualityValues.push(item.quality);}
        adaptiveCenterFanCells++;
        return true;
       }
       bridgePositions.length=starts[0];bridgeNormals.length=starts[1];
       bridgeJoints.length=starts[2];bridgeWeights.length=starts[3];
       adaptiveRejectReason||='quad fan failed;quality='+fan.map(item=>item?.quality??'degenerate').join(',')+';ids='+[a0,b0,b1,a1].join(',');
       return false;
      };
      for(const step of zipperPath){
       const ids=step.tri.ids;
       const donors=ids.filter(id=>id<donorBase);
       const hosts=ids.filter(id=>id>=donorBase);
       if(!((donors.length===2&&hosts.length===1)||(donors.length===1&&hosts.length===2))){
        valid=false;break;
       }
       const fallback=[0,1,2].map(k=>ids.reduce((sum,id)=>sum+normalFor(id)[k],0));
       const edgeA=(fraction)=>bridgeBetweenVertices(donors[0],hosts[0],fraction,crossCache);
       const edgeB=(fraction)=>bridgeBetweenVertices(
        donors.length===2?donors[1]:donors[0],
        donors.length===2?hosts[0]:hosts[1],fraction,crossCache
       );
       for(let band=0;band<fractions.length-1;band++){
        const f0=fractions[band],f1=fractions[band+1];
        const a0=edgeA(f0),b0=edgeB(f0),a1=edgeA(f1),b1=edgeB(f1);
        if(donors.length===1&&band===0){
         if(!addTriangle([donors[0],a1,b1],fallback)){valid=false;break;}
        }else if(donors.length===2&&band===fractions.length-2){
         if(!addTriangle([a0,b0,hosts[0]],fallback)){valid=false;break;}
        }else if(!addQuad(a0,b0,a1,b1,fallback)){
         valid=false;break;
        }
       }
       if(!valid)break;
      }
      assertBridgeSkinArrays('adaptive strip completion');
      if(valid&&candidateTriangles.length&&candidateTriangles.length===qualityValues.length){
       try{
        const oriented=orientBridgeStrip(candidateTriangles.map(item=>item.ids));
        for(const triangle of oriented)bridgeIndices.push(...triangle);
        bridgeZipperAdaptiveLoops++;
        bridgeZipperAdaptiveCenterFanCells+=adaptiveCenterFanCells;
        bridgeZipperAdaptiveCapFanTriangles+=adaptiveCapFanTriangles;
        bridgeZipperAdaptiveTriangleFanCells+=adaptiveQuadTriangleFanCells;
        bridgeZipperAdaptiveTriangles+=oriented.length;
        bridgeZipperAdaptiveSourceTriangles+=zipperPath.length;
        bridgeZipperMovesDonor+=zipperPath.filter(step=>step.move==='donor').length;
        bridgeZipperMovesHost+=zipperPath.filter(step=>step.move==='host').length;
        bridgeZipperQualitySum+=qualityValues.reduce((sum,value)=>sum+value,0);
        bridgeZipperQualityCount+=qualityValues.length;
        bridgeZipperMinQuality=Math.min(bridgeZipperMinQuality,Math.min(...qualityValues));
        bridgeZipperLayers=Math.max(bridgeZipperLayers,fractions.length);
        bridgeEdges+=oriented.length;
        bridgeEdgesByPlane[plane]+=oriented.length;
        bridgeTrianglesByPlane[plane]+=oriented.length;
        bridgeZipperMaxAdaptiveTriangles=Math.max(bridgeZipperMaxAdaptiveTriangles,oriented.length);
        adaptiveBridge=true;
       }catch(error){
        valid=false;
        adaptiveRejectReason='orientation failure: '+(error?.message||String(error));
       }
      }
      if(!adaptiveBridge){
       bridgeIndices.length=indexStart;
       bridgePositions.length=positionStart;bridgeNormals.length=normalStart;
       bridgeJoints.length=jointStart;bridgeWeights.length=weightStart;
       bridgeZipperAdaptiveRejects++;
       seamBridgeZipperAdaptiveRejectReasons.push(adaptiveRejectReason||'adaptive strip rejected without a local cell reason');
      }
     }
     assertBridgeSkinArrays('boundary loop completion');
     // Only the arc-length fallback inserts host edge points. The adaptive DP
     // patch terminates on original Maya vertices and must leave those edges
     // unsplit so the bridge and host share the exact same indexed boundary.
     if(!adaptiveBridge){
      registerHostBoundarySamples(alignment);
      const indexStart=bridgeIndices.length;
      const positionStart=bridgePositions.length,normalStart=bridgeNormals.length,
       jointStart=bridgeJoints.length,weightStart=bridgeWeights.length;
      const projectedBefore=new Set(projected.keys());
      const layerProjectedBefore=new Set(layerProjected.keys());
      const projectedIds=alignment.samples.map(bridgeVertex);
const fractions=[.2,.4,.6,.8];
      const rows=[donor];
      for(const fraction of fractions)
       rows.push(donor.map((id,i)=>bridgeLayerVertex(id,alignment.samples[i],fraction,
        donorRimTangents[i],hostRimTangents[i],donorSurfaceInwards[i],hostSurfaceInwards[i])));
      rows.push(projectedIds);
      const triangles=[],qualityValues=[];
      let valid=donorSteps>0,centerFanCells=0;
      for(let band=0;band<rows.length-1&&valid;band++){
       const inner=rows[band],outer=rows[band+1];
       for(let i=0;i<donorSteps&&valid;i++){
        const next=alignment.closed?(i+1)%m:i+1;
        const a=inner[i],b=inner[next],pa=outer[i],pb=outer[next];
        const donorFallback=[0,1,2].map(k=>normalFor(a)[k]+normalFor(b)[k]);
        const hostFallback=[0,1,2].map(k=>normalFor(pa)[k]+normalFor(pb)[k]);
        const pairs=[
         [bridgeTriangle([a,b,pa],donorFallback),
          bridgeTriangle([b,pb,pa],hostFallback)],
         [bridgeTriangle([a,b,pb],donorFallback),
          bridgeTriangle([a,pb,pa],hostFallback)]
        ].filter(pair=>pair.every(Boolean)).map(pair=>{
         const quality=pair.map(triangle=>zipperTriangleQuality(triangle,scale,0));
         if(quality.some(value=>!value))return null;
         return {pair,quality,min:Math.min(...quality.map(value=>value.quality)),
          sum:quality.reduce((total,value)=>total+value.quality,0)};
        }).filter(Boolean).sort((left,right)=>
         right.min-left.min||right.sum-left.sum);
        const best=pairs[0];
        if(best&&best.min>=.015){
         triangles.push(...best.pair.map(triangle=>triangle.ids));
         qualityValues.push(...best.quality.map(value=>value.quality));
         continue;
        }
        const cellPositionStart=bridgePositions.length,cellNormalStart=bridgeNormals.length,
         cellJointStart=bridgeJoints.length,cellWeightStart=bridgeWeights.length;
        const center=bridgeCellCenterVertex([a,b,pb,pa]);
        const fan=[
         bridgeTriangle([a,b,center],donorFallback),
         bridgeTriangle([b,pb,center],hostFallback),
         bridgeTriangle([pb,pa,center],hostFallback),
         bridgeTriangle([pa,a,center],donorFallback)
        ];
        const fanQuality=fan.map(triangle=>
         triangle?zipperTriangleQuality(triangle,scale,0):null);
        if(fan.every(Boolean)&&fanQuality.every(value=>value&&value.quality>=.015)){
         triangles.push(...fan.map(triangle=>triangle.ids));
         qualityValues.push(...fanQuality.map(value=>value.quality));
         centerFanCells++;
        }else{
         bridgePositions.length=cellPositionStart;bridgeNormals.length=cellNormalStart;
         bridgeJoints.length=cellJointStart;bridgeWeights.length=cellWeightStart;
         valid=false;break;
        }
       }
      }
      const expectedCells=donorSteps*(rows.length-1);
      if(valid&&triangles.length===qualityValues.length&&qualityValues.length>=expectedCells*2){
       const oriented=orientBridgeStrip(triangles);
       bridgeIndices.length=indexStart;
       for(const triangle of oriented)bridgeIndices.push(...triangle);
       const minQuality=Math.min(...qualityValues);
       bridgeZipperCenterFanCells+=centerFanCells;
       bridgeZipperResampledLoops++;
       bridgeZipperMovesDonor+=donorSteps*(rows.length-1);
       bridgeZipperMovesHost+=donorSteps*(rows.length-1);
       bridgeZipperQualitySum+=qualityValues.reduce((sum,value)=>sum+value,0);
       bridgeZipperQualityCount+=qualityValues.length;
       bridgeZipperMinQuality=Math.min(bridgeZipperMinQuality,minQuality);
       bridgeEdges+=oriented.length;
       bridgeEdgesByPlane[plane]+=oriented.length;
       bridgeTrianglesByPlane[plane]+=oriented.length;
       bridgeZipperLayers=Math.max(bridgeZipperLayers,rows.length);
       for(let i=0;i<donorSteps;i++){
        const next=alignment.closed?(i+1)%projectedIds.length:i+1;
        bridgeMaxHostStep=Math.max(bridgeMaxHostStep,
         distance3(positionFor(projectedIds[i]),positionFor(projectedIds[next])));
       }
       resampledBridge=true;
      }else{
       bridgeIndices.length=indexStart;
       for(const key of [...projected.keys()])if(!projectedBefore.has(key))projected.delete(key);
       for(const key of [...layerProjected.keys()])
        if(!layerProjectedBefore.has(key))layerProjected.delete(key);
       bridgePositions.length=positionStart;
       bridgeNormals.length=normalStart;
       bridgeJoints.length=jointStart;
       bridgeWeights.length=weightStart;
      }
     }
     if(adaptiveBridge){
      // Adaptive DP correspondence subdivided the same monotone zipper surface.
     }else if(resampledBridge){
      // Balanced arc-length strip accepted; its shared edges were globally oriented.
     }else if(zipperPath){
      let localDonorMoves=0,localHostMoves=0,qualitySum=0,qualityMin=1;
      const orientedTriangles=orientBridgeStrip(zipperPath.map(step=>step.tri.ids));
      for(let k=0;k<zipperPath.length;k++){
       const step=zipperPath[k];
       bridgeIndices.push(...orientedTriangles[k]);
       qualitySum+=step.quality;qualityMin=Math.min(qualityMin,step.quality);
       if(step.move==='donor')localDonorMoves++;
       else localHostMoves++;
      }
      bridgeZipperMovesDonor+=localDonorMoves;
      bridgeZipperMovesHost+=localHostMoves;
      bridgeZipperQualitySum+=qualitySum;
      bridgeZipperQualityCount+=zipperPath.length;
      bridgeZipperMinQuality=Math.min(bridgeZipperMinQuality,qualityMin);
      bridgeEdges+=zipperPath.length;
      bridgeEdgesByPlane[plane]+=zipperPath.length;
      bridgeTrianglesByPlane[plane]+=zipperPath.length;
      for(let j=0;j<hostSteps;j++){
       const step=distance3(pointAt(hostPos,host[j]),pointAt(hostPos,host[(j+1)%n]));
       bridgeMaxHostStep=Math.max(bridgeMaxHostStep,step);
      }
     }else{
      // Preserve a diagnostic strip without inventing a closing edge on an
      // open cut chain. Every original donor boundary segment is considered.
      bridgeZipperFallbackLoops++;
      const projectedIds=alignment.samples.map(bridgeVertex);
      for(let i=0;i<donorSteps;i++){
       const a=donor[i],b=donor[(i+1)%m];
       const nextIndex=alignment.closed?(i+1)%projectedIds.length:i+1;
       const pa=projectedIds[i],pb=projectedIds[nextIndex];
       const hostStep=distance3(positionFor(pa),positionFor(pb));
       bridgeMaxHostStep=Math.max(bridgeMaxHostStep,hostStep);
       const made=addBridgeQuad(a,b,pa,pb,hostStep);
       if(!made){bridgeUnmatchedEdges++;bridgeUnmatchedByPlane[plane]++;continue;}
       bridgeEdges++;bridgeEdgesByPlane[plane]++;
       bridgeTrianglesByPlane[plane]+=made;
       if(made===1)bridgeSingleTriangleEdges++;
      }
     }
    }
   }
   const hostBoundarySplit=splitHostBoundaryEdges(hostBoundarySplitSamples);
   bodyCut.seamHostBoundarySplitPoints=hostBoundarySplit.points;
   bodyCut.seamHostBoundarySplitEdges=hostBoundarySplit.edges;
   bodyCut.seamHostBoundarySplitMissing=hostBoundarySplit.missing;
   bodyCut.seamDonorRimWeightOverrides=seamDonorRimWeightOverrides;
   bodyCut.seamWarpFactor=seamWarpFactor;
   bodyCut.seamWarpTargetFraction=.35;
   bodyCut.seamWarpMaxMove=seamWarpMaxMove;
   bodyCut.seamWarpMeanMove=seamWarpMeanMove;
   bodyCut.seamWarpAcceptedGroups=seamWarpAcceptedGroups;
   bodyCut.seamWarpRejectedGroups=seamWarpRejectedGroups;
   bodyCut.seamWarpMaxResidualGap=seamWarpMaxResidualGap;
   bodyCut.seamBridgeMethod=bridgeZipperAdaptiveLoops?
    'curved-dp-adaptive-zipper':'curved-multi-ring-zipper-open-chain';
   bodyCut.seamBridgeZipperAdaptiveLoops=bridgeZipperAdaptiveLoops;
   bodyCut.seamBridgeZipperAdaptiveTriangles=bridgeZipperAdaptiveTriangles;
   bodyCut.seamBridgeZipperAdaptiveSourceTriangles=bridgeZipperAdaptiveSourceTriangles;
   bodyCut.seamBridgeZipperAdaptiveRejects=bridgeZipperAdaptiveRejects;
   bodyCut.seamBridgeZipperAdaptiveRejectReasons=seamBridgeZipperAdaptiveRejectReasons;
   bodyCut.seamBridgeZipperAdaptiveCenterFanCells=bridgeZipperAdaptiveCenterFanCells;
   bodyCut.seamBridgeZipperAdaptiveCapFanTriangles=bridgeZipperAdaptiveCapFanTriangles;
   bodyCut.seamBridgeZipperAdaptiveTriangleFanCells=bridgeZipperAdaptiveTriangleFanCells;
   bodyCut.seamBridgeZipperMaxAdaptiveTriangles=bridgeZipperMaxAdaptiveTriangles;
   bodyCut.seamBridgeLayerCount=bridgeZipperLayers;
   bodyCut.seamBridgeLoopPairs=bridgeLoopPairs;
   bodyCut.seamBridgeOpenPaths=seamOpenPaths;
   bodyCut.seamBridgeClosedLoops=seamClosedLoops;
   bodyCut.seamBridgeVirtualClosures=seamVirtualClosures;
   bodyCut.seamBridgeVirtualClosureMaxGap=seamVirtualClosureMaxGap;
   bodyCut.seamBridgeVirtualClosureDiagnostics=seamBoundaryClosureDiagnostics;
   bodyCut.seamBridgeSurfaceTangentFallbacks=seamBridgeSurfaceTangentFallbacks;
   bodyCut.seamBridgeTangentDirectionFlips=seamBridgeTangentDirectionFlips;
   bodyCut.seamBridgeMeanTangentReach=seamBridgeTangentReachCount?
    seamBridgeTangentReachSum/seamBridgeTangentReachCount:0;
   bodyCut.seamBridgeZipperMovesDonor=bridgeZipperMovesDonor;
   bodyCut.seamBridgeZipperMovesHost=bridgeZipperMovesHost;
   bodyCut.seamBridgeZipperResampledLoops=bridgeZipperResampledLoops;
   bodyCut.seamBridgeZipperCenterFanCells=bridgeZipperCenterFanCells;
   bodyCut.seamBridgeZipperFallbackLoops=bridgeZipperFallbackLoops;
   bodyCut.seamBridgeZipperMeanQuality=bridgeZipperQualityCount?
    bridgeZipperQualitySum/bridgeZipperQualityCount:0;
   bodyCut.seamBridgeZipperMinQuality=Number.isFinite(bridgeZipperMinQuality)?
    bridgeZipperMinQuality:0;
   bodyCut.seamBridgeOrientationFlips=bridgeOrientationFlips;
   bodyCut.seamBridgeOrientationComponents=bridgeOrientationComponents;
   bodyCut.seamBridgeTriangles=bridgeIndices.length/3;
   bodyCut.seamBridgeMaxGap=bridgeMaxGap;
   bodyCut.seamBridgeMeanGap=bridgeGapCount?bridgeGapTotal/bridgeGapCount:0;
   bodyCut.seamBridgeEdges=bridgeEdges;
   bodyCut.seamBridgeVertices=bridgePositions.length/3;
   bodyCut.seamBridgeUnmatchedVertices=bridgeUnmatchedVertices;
   bodyCut.seamBridgeUnmatchedEdges=bridgeUnmatchedEdges;
   bodyCut.seamBridgeSingleTriangleEdges=bridgeSingleTriangleEdges;
   bodyCut.seamBridgeMaxHostStep=bridgeMaxHostStep;
   bodyCut.seamBridgeTrianglesByPlane=bridgeTrianglesByPlane;
   bodyCut.seamBridgeEdgesByPlane=bridgeEdgesByPlane;
   bodyCut.seamBridgeUnmatchedByPlane=bridgeUnmatchedByPlane;
   if(bridgeIndices.length>=12){
    bodyCut.seamBridgeData={positions:bridgePositions,normals:bridgeNormals,
     joints:bridgeJoints,weights:bridgeWeights,indices:bridgeIndices,
     donorBase,
     hostEndpointVertices:[...new Set([...projected.values()].map(id=>id-donorBase))],
     // Preserve the exact Maya vertex selected by orderedBoundaryPaths.
     // A position-only lookup can silently choose a coincident UV/material
     // twin that is not referenced by the cut boundary faces, leaving the
     // bridge floating even though its coordinates and weights match.
     hostEndpointSources:[...new Map([...projected.values()]
      .map(id=>[id-donorBase,bridgeEndpointInfo.get(id)?.hostSourceId])
      .filter(([,source])=>Number.isInteger(source)))],
     donorEndpointVertices:[...new Set(bridgeIndices.filter(id=>id<donorBase))]};
   }
   // Every zipper step advances exactly one ordered boundary edge. A
   // successful loop therefore covers both rims without skipped cells.
   // Keep the seam-build scope alive through collar relaxation so the
   // curved bridge can be reprojected onto the final donor surface.
   // No donor rim edge is skipped for a distance threshold. The monotone
   // loop correspondence must close every edge or fail visibly in QA.
  // BTC collar curvature relax (candidate, not a version): smooth only
  // the refined donor's upper transition, where the four-neighbor host
  // projection creates alternating triangular peaks in rear WebGL.
  // Preserve the lower hock/fetlock and the exact outer rim endpoints.
  // Shared indexed vertices receive the same displacement, so this cannot
  // introduce a new T-junction. Validate all faces below before rendering.
  {
   const edges=Array.from({length:donorPos.count},()=>new Set());
   const indices=donorGeo.getIndex(),edgeUses=new Map();
   for(let j=0;j<indices.count;j+=3){
    const a=indices.getX(j),b=indices.getX(j+1),c=indices.getX(j+2);
    edges[a].add(b);edges[a].add(c);
    edges[b].add(a);edges[b].add(c);
    edges[c].add(a);edges[c].add(b);
    for(const [u,v] of [[a,b],[b,c],[c,a]]){
     const key=Math.min(u,v)+':'+Math.max(u,v);
     edgeUses.set(key,(edgeUses.get(key)||0)+1);
    }
   }
   // Preserve the *actual open cut rim* of the authored limb. The old
   // Laplacian pass moved rim vertices and stretched triangles toward the
   // Maya croup, creating dark triangular flaps in rear WebGL views.
   // A vertex adjacent to a boundary receives a tapered correction,
   // while boundary vertices remain at their original sewn positions.
   // GLB authoring may duplicate indices along UV/material seams. Those
   // seams are not physical cut rims: pinning them creates a serrated,
   // unrelaxed band in the posterior collar. Count edge incidence using
   // coincident spatial vertices, but keep the actual skinned vertex IDs
   // unchanged. A true open cut still has only one incident face.
   const spatialIds=new Map(),spatialVertex=[];
   for(let v=0;v<donorPos.count;v++){
    const key=[donorPos.getX(v),donorPos.getY(v),donorPos.getZ(v)]
     .map(n=>Math.round(n*1e7)).join(':');
    if(!spatialIds.has(key))spatialIds.set(key,spatialIds.size);
    spatialVertex[v]=spatialIds.get(key);
   }
   const physicalEdges=new Map(),physicalVertices=new Map();
   for(let j=0;j<indices.count;j+=3){
    const vs=[indices.getX(j),indices.getX(j+1),indices.getX(j+2)];
    for(const v of vs){
     const id=spatialVertex[v];
     if(!physicalVertices.has(id))physicalVertices.set(id,new Set());
     physicalVertices.get(id).add(v);
    }
    for(let k=0;k<3;k++){
     const a=spatialVertex[vs[k]],b=spatialVertex[vs[(k+1)%3]];
     if(a===b)continue;
     const key=Math.min(a,b)+':'+Math.max(a,b);
     physicalEdges.set(key,(physicalEdges.get(key)||0)+1);
    }
   }
   const rim=new Set();
   for(const [key,count] of physicalEdges){
    // Keep the existing raw-index manifold rejection; coincident GLB shells
    // can legitimately share a position without sharing a surface edge.
    if(count===1)for(const id of key.split(':').map(Number))
     for(const v of physicalVertices.get(id)||[])rim.add(v);
   }
   // Geometry surgery: each tangential collar relaxation must preserve the
   // oriented incident faces. A near-tangent Laplacian step can still flip
   // a tiny triangle and produce a black wedge in rear WebGL. Use a
   // per-vertex backtracking line search against the pre-step triangles.
   const incident=Array.from({length:donorPos.count},()=>[]);
   for(let j=0;j<indices.count;j+=3){
    const tri=[indices.getX(j),indices.getX(j+1),indices.getX(j+2)];
    for(const v of tri)incident[v].push(tri);
   }
   const faceNormal=(a,b,c)=>{
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];
    const vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    return [uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
   };
   const original=Array.from({length:donorPos.count},(_,i)=>[
    donorPos.getX(i),donorPos.getY(i),donorPos.getZ(i)
   ]);
   // Recompute the normals AFTER the host projection and again after each
   // relaxation pass. Otherwise the tangent projector uses the PRE-SEWN
   // Quaternius normal, pushing the new collar across its actual surface.
   // This changes the skinned donor geometry, not just its shading.
   donorGeo.computeVertexNormals();
   // The donor body is clipped at z <= .0200. The old smoothing window
   // [.0148,.0170] was empty, leaving the jagged upper thigh untreated.
   // Relax only the actual 1.8 mm collar below the physical cut rim;
   // pin the open boundary and retain the face-orientation backtracking.
   for(let pass=0;pass<2;pass++){
    const positions=Array.from({length:donorPos.count},(_,i)=>[
     donorPos.getX(i),donorPos.getY(i),donorPos.getZ(i)
    ]);
    for(let i=0;i<positions.length;i++){
     const [x,y,z]=positions[i];
     // UV/material seams may duplicate the same physical vertex. Moving
     // only one copy opens a real crack in the skinned thigh. Relax each
     // spatially welded group atomically, or leave the whole group pinned.
     const twins=[...(physicalVertices.get(spatialVertex[i])||[i])];
     if(i!==Math.min(...twins)||twins.some(v=>rim.has(v))||
        z<=BTC_SEAM_CUT_Z-.0018||z>=BTC_SEAM_CUT_Z||y<=.0041)continue;
     // A UV split lowers the representative's indexed valence even when
     // the welded physical one-ring is well formed. Use the physical
     // neighbor count below, not edges[i].size, to decide eligibility.
     // Pin the transition's endpoints AND the true open rim. Attenuate
     // the smoothing one edge inward to avoid a hard displacement step.
     const u=(z-(BTC_SEAM_CUT_Z-.0018))/.0018;
     const taper=Math.sin(Math.PI*u)**2;
     const rimNeighbor=[...edges[i]].some(v=>rim.has(v));
     const alpha=.28*taper*(rimNeighbor?.18:1);
     // A UV seam splits the same anatomical point into several vertex
     // indices. Average its COMPLETE physical one-ring, not only the
     // representative UV island. Otherwise the tangent relax biases the
     // thigh toward one material side and creates a triangular crease.
     const physicalNeighbors=new Map();
     for(const twin of twins)for(const v of edges[twin]){
      const key=spatialVertex[v];
      if(key!==spatialVertex[i]&&!physicalNeighbors.has(key))
       physicalNeighbors.set(key,v);
     }
     if(physicalNeighbors.size<3)continue;
     const avg=[0,0,0];
     for(const v of physicalNeighbors.values())
      for(let k=0;k<3;k++)avg[k]+=positions[v][k];
     for(let k=0;k<3;k++)avg[k]/=physicalNeighbors.size;
     // Limit the smoothing to a small fraction of a millimetre per pass.
     // A stronger laplacian reduces sharp collar ridges without letting
     // long adjacent triangles collapse into the Maya rump.
     // Move only in the local surface tangent plane. The former full
     // Laplacian moved upper-thigh vertices inward along their normals,
     // flattening the croup and creating visible dark folded triangles.
     // A tangential relax reduces collar zig-zags without collapsing
     // the original sculpt's volume or pulling the cut rim out of place.
     const raw=positions[i].map((v,k)=>alpha*(avg[k]-v));
     // The mesh changes vertex by vertex. A normal cached before this
     // pass no longer describes the actual collar tangent plane. Rebuild
     // this vertex's area-weighted normal from the CURRENT incident faces,
     // so sequential relaxation cannot drift through the newly sewn skin.
     const liveNormal=[0,0,0];
     // At a UV/material seam the representative vertex sees only ONE
     // side's faces, although its spatial twins move atomically. Build
     // the tangent plane from all incident faces of that welded vertex,
     // de-duplicating coincident triangles so a split UV island cannot
     // bias the direction and pull the opposite side into a dark fold.
     const seenPhysicalFaces=new Set();
     for(const twin of twins)for(const tri of incident[twin]){
      const faceKey=tri.map(v=>spatialVertex[v]).sort((a,b)=>a-b).join(':');
      if(seenPhysicalFaces.has(faceKey))continue;
      seenPhysicalFaces.add(faceKey);
      const face=faceNormal(...tri.map(v=>positions[v]));
      for(let k=0;k<3;k++)liveNormal[k]+=face[k];
     }
     const nlen=Math.hypot(...liveNormal);
     // When welded UV faces cancel or become degenerate, the local
     // tangent plane is undefined. Do not apply an unprojected Laplacian:
     // that can shrink the croup through its sewn skin and create wedges.
     if(nlen<=1e-12)continue;
     const dot=raw.reduce((sum,v,k)=>sum+v*liveNormal[k],0)/(nlen*nlen);
     for(let k=0;k<3;k++)raw[k]-=dot*liveNormal[k];
     const norm=Math.hypot(...raw);
     const factor=norm>.00012?.00012/norm:1;
     const target=positions[i].map((v,k)=>v+raw[k]*factor);
     // Avoid crossing the sagittal midline, or drifting into the tail cap.
     if(Math.sign(target[0])!==Math.sign(original[i][0]))continue;
     // Reject orientation flips relative to this pass's actual geometry.
     // Shrink only this vertex's motion, never delete faces or relax QA.
     let accepted=null;
     for(let shrink=1;shrink>=1/32;shrink/=2){
      const candidate=positions[i].map((v,k)=>v+(target[k]-v)*shrink);
      let safe=true;
      for(const tri of twins.flatMap(v=>incident[v])){
       const oldPts=tri.map(v=>positions[v]);
       const newPts=tri.map(v=>twins.includes(v)
        ?positions[v].map((p,k)=>p+candidate[k]-positions[i][k])
        :positions[v]);
       const n0=faceNormal(...oldPts),n1=faceNormal(...newPts);
       const oldSq=n0.reduce((sum,v)=>sum+v*v,0);
       const newSq=n1.reduce((sum,v)=>sum+v*v,0);
       // Guard against cumulative thinning across sequential vertices
       // and both passes. A locally valid move can still collapse a face
       // relative to its original, pre-relaxation anatomical shape.
       const refNormal=faceNormal(...tri.map(v=>original[v]));
       const refSq=refNormal.reduce((sum,v)=>sum+v*v,0);
       const refDot=refNormal.reduce((sum,v,k)=>sum+v*n1[k],0);
       // Preserve triangle shape, not just area: a long, needle-like
       // rump triangle can keep 36% of its area while its shortest
       // edge nearly vanishes. Such needles flicker as dark wedges
       // in rear/three-quarter Gallop frames.
       const refPts=tri.map(v=>original[v]);
       const squaredEdges=pts=>[0,1,2].map(k=>{
        const a=pts[k],b=pts[(k+1)%3];
        return a.reduce((sum,x,d)=>sum+(x-b[d])**2,0);
       });
       const refEdges=squaredEdges(refPts);
       const newEdges=squaredEdges(newPts);
       const minRef=Math.min(...refEdges),minNew=Math.min(...newEdges);
       const maxRef=Math.max(...refEdges),maxNew=Math.max(...newEdges);
       // Aspect ratio is squared-length based and dimensionless.
       // A 3x deterioration of the shortest-to-longest edge ratio
       // is rejected, without altering any regression assertion.
       const refAspect=minRef/Math.max(maxRef,1e-24);
       const newAspect=minNew/Math.max(maxNew,1e-24);
       if(oldSq<1e-24||refSq<1e-24||newSq<oldSq*.20||
          newSq<refSq*.36||refDot<=0||
          minNew<minRef*.25||newAspect<refAspect/3||
          n0.reduce((sum,v,k)=>sum+v*n1[k],0)<=0){safe=false;break;}
      }
      if(safe){accepted=candidate;break;}
     }
     if(accepted){
      // Subsequent vertices must test against the ALREADY deformed
      // neighboring faces. Testing every move against the frozen pass
      // snapshot can approve individually safe steps that collectively
      // fold a triangle across the rump/thigh seam.
      const delta=accepted.map((p,k)=>p-positions[i][k]);
      for(const v of twins){
       const moved=positions[v].map((p,k)=>p+delta[k]);
       donorPos.setXYZ(v,...moved);
       positions[v]=moved;
      }
     }
    }
    // The second pass must follow the deformed surface, not stale normals.
    donorGeo.computeVertexNormals();
   }
   donorPos.needsUpdate=true;
   donorGeo.computeVertexNormals();
   donorGeo.computeBoundingSphere();
  }
  // Fail closed before WebGL: a malformed influence or inverted/vanished
  // donor face can otherwise render as a long spike during Gallop.
  // This is a regression gate, NOT visual acceptance of V23.
  for(let i=0;i<donorPos.count;i++){
   const x=donorPos.getX(i),y=donorPos.getY(i),z=donorPos.getZ(i);
   if(![x,y,z].every(Number.isFinite))
    throw Error('BTC V23 donor contains non-finite vertex '+i);
   let total=0;
   for(let k=0;k<4;k++){
    const w=donorWeights.getComponent(i,k),bone=donorSkin.getComponent(i,k);
    if(!Number.isFinite(w)||w<0||!Number.isInteger(bone)||
       bone<0||bone>=original.skeleton.bones.length)
     throw Error('BTC V23 donor invalid skin influence '+i+':'+k);
    total+=w;
   }
   if(Math.abs(total-1)>0.002)
    throw Error('BTC V23 donor weights not normalized at '+i+': '+total);
  }
  const finalIndex=donorGeo.getIndex();
  for(let j=0;j<finalIndex.count;j+=3){
   const a=finalIndex.getX(j),b=finalIndex.getX(j+1),c=finalIndex.getX(j+2);
   if(a===b||b===c||c===a)
    throw Error('BTC V23 donor collapsed triangle '+j/3);
   const ab=new THREE.Vector3(donorPos.getX(b)-donorPos.getX(a),
    donorPos.getY(b)-donorPos.getY(a),donorPos.getZ(b)-donorPos.getZ(a));
   const ac=new THREE.Vector3(donorPos.getX(c)-donorPos.getX(a),
    donorPos.getY(c)-donorPos.getY(a),donorPos.getZ(c)-donorPos.getZ(a));
   if(ab.cross(ac).lengthSq()<1e-24)
    throw Error('BTC V23 donor zero-area triangle '+j/3);
  }
  donorPos.needsUpdate=true;donorSkin.needsUpdate=true;donorWeights.needsUpdate=true;
  donorGeo.deleteAttribute('normal');donorGeo.computeVertexNormals();
  // Quaternius uses UV split vertices. Blend normals across coincident
  // points to remove visible "wooden boot" facets without flattening form.
  const smoothNormals=(geometry)=>{
   const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),
    groups=new Map();
   for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1000000)).join('/');
    const bucket=groups.get(key)||[];bucket.push(i);groups.set(key,bucket);
   }
   for(const ids of groups.values()){
    if(ids.length<2)continue;
    const v=new THREE.Vector3();
    for(const id of ids)v.add(new THREE.Vector3(n.getX(id),n.getY(id),n.getZ(id)));
    if(v.lengthSq()<1e-9)continue;
    v.normalize();
    for(const id of ids)n.setXYZ(id,v.x,v.y,v.z);
   }
   n.needsUpdate=true;
   return groups.size;
  };
  const uniqueSurfacePoints=smoothNormals(donorGeo);
  donorGeo.computeBoundingSphere();
  // The loft above was first constructed against the pre-relax donor
  // collar. The guarded two-pass relaxation then changes the donor's
  // one-ring tangents and surface normals while leaving its open rim pinned.
  // Re-evaluate every curved bridge ring against that FINAL donor surface;
  // otherwise the first 20% ring can retain an obsolete tangent and expose
  // a dark slit even though both endpoint loops are indexed and welded.
  let seamBridgePostRelaxMaxShift=0;
  if(bridgeVertexSpecs.size){
   const refreshedInward=boundaryInteriorMap(donorRimEdges,di,donorPos);
   const refreshedNormal=donorGeo.getAttribute('normal');
   const refreshedHostNormal=hostGeo.getAttribute('normal');
   for(const [index,spec] of bridgeVertexSpecs){
    const neighbors=donorRimNeighborsById.get(spec.donorId);
    if(!neighbors)throw Error('BTC post-relax seam bridge lost donor rim neighbors for '+spec.donorId);
    const [previous,next]=neighbors;
    const donorPoint=pointAt(donorPos,spec.donorId);
    const previousPoint=pointAt(donorPos,previous),nextPoint=pointAt(donorPos,next);
    const donorTangent=nextPoint.map((value,k)=>value-previousPoint[k]);
    const t=Math.max(0,Math.min(1,spec.sample.t));
    const hostA=pointAt(hostPos,spec.sample.a),hostB=pointAt(hostPos,spec.sample.b);
    const hostPoint=hostA.map((value,k)=>value+(hostB[k]-value)*t);
    const donorN=refreshedNormal?
     [0,1,2].map(k=>refreshedNormal.getComponent(spec.donorId,k)):[0,1,0];
    let hostN=refreshedHostNormal?
     [0,1,2].map(k=>refreshedHostNormal.getComponent(spec.sample.a,k)*(1-t)+
      refreshedHostNormal.getComponent(spec.sample.b,k)*t):[0,1,0];
    const hostLength=Math.hypot(...hostN)||1;
    hostN=hostN.map(value=>value/hostLength);
    const donorSurface=refreshedInward.get(seamKey(donorPos,spec.donorId))||null;
    seamTangentOrientation=spec.orientation;
    const bridge=tangentHermiteBridgePoint(
     donorPoint,hostPoint,donorN,hostN,spec.fraction,
     donorTangent,spec.hostRimTangent,donorSurface,spec.hostSurfaceInward);
    const offset=(index-donorBase)*3;
    const previousPointOnBridge=bridgePositions.slice(offset,offset+3);
    seamBridgePostRelaxMaxShift=Math.max(seamBridgePostRelaxMaxShift,
     distance3(previousPointOnBridge,bridge.point));
    for(let k=0;k<3;k++){
     bridgePositions[offset+k]=bridge.point[k];
     bridgeNormals[offset+k]=bridge.outward[k];
    }
   }
  }
  bodyCut.seamBridgePostRelaxReprojectedVertices=bridgeVertexSpecs.size;
  bodyCut.seamBridgePostRelaxMaxShift=seamBridgePostRelaxMaxShift;
  bodyCut.collarRejectedMoves=collarRejectedMoves;
  bodyCut.collarBacktrackedMoves=collarBacktrackedMoves;
  bodyCut.insetVertices=insetVertices;
  bodyCut.reattachedWeights=reattachedWeights;
  bodyCut.uniqueSurfacePoints=uniqueSurfacePoints;
  }
  hoovesCut=clipNativeTriangles(hoof,p=>{
   const cy=p.reduce((s,v)=>s+v[1],0)/3;
   const cz=p.reduce((s,v)=>s+v[2],0)/3;
   // The original GLB Hooves primitive includes fore and hind keratin.
   // Only the posterior hooves belong to this transplant. The previous
   // height-only selection duplicated fore-hoof polygons on the BTC host
   // and could leave stray skinned fragments during Gallop.
   return cy>.003&&cz<.0208;
  });
  if(bodyCut.triangles<280||hoovesCut.triangles<20)
   throw Error('BTC V20 native donor unexpectedly incomplete: '+bodyCut.triangles+'/'+hoovesCut.triangles);
  const smoothHooves=refineSkinnedDonor(hoovesCut.geometry,1);
  hoovesCut.geometry.dispose();hoovesCut.geometry=smoothHooves.geometry;
  hoovesCut.sourceTriangles=smoothHooves.sourceTriangles;
  hoovesCut.triangles=smoothHooves.triangles;
  // Materialize the zipper vertices and faces in the donor geometry before
  // remapping it into the unified host+donor index space. seamBridgeData uses
  // virtual IDs offset by donorBase; without this append, those IDs are outside
  // donorGeo.position.count and the unified weld cannot resolve them.
  if(bodyCut.seamBridgeData){
   const geo=bodyCut.geometry,data=bodyCut.seamBridgeData;
   const position=geo.getAttribute('position'),normal=geo.getAttribute('normal');
   const skin=geo.getAttribute('skinIndex'),weight=geo.getAttribute('skinWeight'),index=geo.getIndex();
   if(!position||!normal||!skin||!weight||!index)
    throw Error('BTC seam bridge cannot merge into the skinned donor body');
   const bridgeShape={
    donorPositionCount:position.count,donorBase:data.donorBase,
    bridgePositionValues:data.positions.length,bridgeNormalValues:data.normals.length,
    bridgeJointValues:data.joints.length,bridgeWeightValues:data.weights.length,
    bridgeIndexValues:data.indices.length,positionRemainder:data.positions.length%3,
    normalDelta:data.normals.length-data.positions.length,
    jointDelta:data.joints.length-data.positions.length/3*4,
    weightDelta:data.weights.length-data.positions.length/3*4
   };
   if(position.count!==data.donorBase||data.positions.length%3!==0||
      data.joints.length!==data.positions.length/3*4||
      data.weights.length!==data.positions.length/3*4||
      data.normals.length!==data.positions.length)
    throw Error('BTC seam bridge virtual index base or skinned attributes are inconsistent: '+JSON.stringify(bridgeShape));
   const bridgeVertexCount=data.positions.length/3;
   for(const id of data.hostEndpointVertices)
    if(!Number.isInteger(id)||id<0||id>=bridgeVertexCount)
     throw Error('BTC host seam endpoint is outside appended bridge vertex range');
   geo.setAttribute('position',new THREE.Float32BufferAttribute(
    [...position.array,...data.positions],3));
   geo.setAttribute('normal',new THREE.Float32BufferAttribute(
    [...normal.array,...data.normals],3));
   geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(
    [...skin.array,...data.joints],4));
   geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(
    [...weight.array,...data.weights],4));
   geo.setIndex(new THREE.Uint32BufferAttribute(
    [...index.array,...data.indices],1));
   geo.computeBoundingSphere();
  }
  // The bridge must be part of the SAME indexed SkinnedMesh as the Maya
  // rump. A separate donor mesh can match positions and weights yet still
  // shade as a floating flap because its boundary normals are never shared
  // with the retained host surface. Weld every host-side zipper sample to
  // the exact Maya split vertex, then recompute normals across the union.
  if(!bodyCut.seamBridgeData)
   throw Error('BTC seam bridge data missing before unified skin merge');
  {
   const hostGeo=anatomy.geometry,donorGeo=bodyCut.geometry,data=bodyCut.seamBridgeData;
   const hp=hostGeo.getAttribute('position'),dp=donorGeo.getAttribute('position');
   const hs=hostGeo.getAttribute('skinIndex'),hw=hostGeo.getAttribute('skinWeight');
   const ds=donorGeo.getAttribute('skinIndex'),dw=donorGeo.getAttribute('skinWeight');
   const hi=hostGeo.getIndex(),di=donorGeo.getIndex();
   if(!hp||!dp||!hs||!hw||!ds||!dw||!hi||!di)
    throw Error('BTC unified hind mesh requires indexed four-weight host and donor geometry');
   const hostCount=hp.count,donorCount=dp.count;
   const positionKey=(attr,id)=>[
    Math.round(attr.getX(id)*1e7),Math.round(attr.getY(id)*1e7),
    Math.round(attr.getZ(id)*1e7)
   ].join(':');
   const hostByPosition=new Map();
   for(let id=0;id<hostCount;id++){
    const key=positionKey(hp,id),list=hostByPosition.get(key)||[];
    list.push(id);hostByPosition.set(key,list);
   }
   const skinDistance=(hostId,donorId)=>{
    const a=new Map(),b=new Map();
    for(let k=0;k<4;k++){
     const ja=hs.getComponent(hostId,k),jb=ds.getComponent(donorId,k);
     const wa=hw.getComponent(hostId,k),wb=dw.getComponent(donorId,k);
     if(wa>1e-8)a.set(ja,(a.get(ja)||0)+wa);
     if(wb>1e-8)b.set(jb,(b.get(jb)||0)+wb);
    }
    const joints=new Set([...a.keys(),...b.keys()]);
    let score=0;for(const joint of joints)score+=Math.abs((a.get(joint)||0)-(b.get(joint)||0));
    return score;
   };
   const hostEndpointMap=new Map();
   const hostEndpointSources=new Map(data.hostEndpointSources||[]);
   let exactHostSourceMatches=0,fallbackHostSourceMatches=0,hostSourceMismatches=0;
   for(const local of data.hostEndpointVertices){
    const donorId=data.donorBase+local;
    if(donorId<data.donorBase||donorId>=donorCount)
     throw Error('BTC host seam endpoint index outside appended bridge vertices');
    const exactSource=hostEndpointSources.get(local);
    if(Number.isInteger(exactSource)&&exactSource>=0&&exactSource<hostCount&&
       positionKey(hp,exactSource)===positionKey(dp,donorId)&&
       skinDistance(exactSource,donorId)<=1e-3){
     // This is the actual host rim vertex used to construct the boundary
     // path, not an arbitrary coincident vertex from a UV/material split.
     hostEndpointMap.set(donorId,exactSource);
     exactHostSourceMatches++;
     continue;
    }
    if(Number.isInteger(exactSource))hostSourceMismatches++;
    const candidates=hostByPosition.get(positionKey(dp,donorId))||[];
    if(!candidates.length)
     throw Error('BTC host zipper endpoint has no exact split Maya vertex at '+positionKey(dp,donorId));
    let best=candidates[0],bestScore=Infinity;
    for(const candidate of candidates){
     const score=skinDistance(candidate,donorId);
     if(score<bestScore){bestScore=score;best=candidate;}
    }
    if(bestScore>1e-3)
     throw Error('BTC host zipper endpoint skin weights do not match split Maya edge: '+bestScore.toFixed(6));
    hostEndpointMap.set(donorId,best);
    fallbackHostSourceMatches++;
   }
   if(hostEndpointMap.size!==data.hostEndpointVertices.length)
    throw Error('BTC unified hind mesh failed to weld every host zipper endpoint');
   // The donor GLB has UV/material-split copies at the same physical cut-rim
   // points. The zipper uses one representative, but leaving its coincident
   // twins as separate indices makes computeVertexNormals rebuild a hard
   // shading seam after the unified host/donor merge. Reuse one donor index
   // for every exactly coincident rim twin, and require identical skinning:
   // all such twins were already reweighted from the same Maya boundary map.
   if(!Array.isArray(data.donorEndpointVertices)||!data.donorEndpointVertices.length)
    throw Error('BTC unified hind mesh has no donor-side zipper endpoints');
   const donorByPosition=new Map();
   for(let id=0;id<data.donorBase;id++){
    const key=positionKey(dp,id),list=donorByPosition.get(key)||[];
    list.push(id);donorByPosition.set(key,list);
   }
   const donorSkinDistance=(a,b)=>{
    const left=new Map(),right=new Map();
    for(let k=0;k<4;k++){
     const ja=ds.getComponent(a,k),jb=ds.getComponent(b,k);
     const wa=dw.getComponent(a,k),wb=dw.getComponent(b,k);
     if(wa>1e-8)left.set(ja,(left.get(ja)||0)+wa);
     if(wb>1e-8)right.set(jb,(right.get(jb)||0)+wb);
    }
    let score=0;
    for(const joint of new Set([...left.keys(),...right.keys()]))
     score+=Math.abs((left.get(joint)||0)-(right.get(joint)||0));
    return score;
   };
   const donorTwinMap=new Map(),donorEndpointKeys=new Set();
   for(const endpoint of data.donorEndpointVertices){
    if(!Number.isInteger(endpoint)||endpoint<0||endpoint>=data.donorBase)
     throw Error('BTC donor zipper endpoint is outside original donor geometry');
    const key=positionKey(dp,endpoint);
    donorEndpointKeys.add(key);
    const twins=donorByPosition.get(key)||[endpoint];
    const canonical=Math.min(...twins);
    for(const twin of twins){
     const score=donorSkinDistance(canonical,twin);
     if(score>1e-3)
      throw Error('BTC coincident donor seam twins have divergent skin weights: '+score.toFixed(6));
     donorTwinMap.set(twin,canonical);
    }
   }
   const combined=new THREE.BufferGeometry();
   for(const name of ['position','normal','skinIndex','skinWeight']){
    const a=hostGeo.getAttribute(name),b=donorGeo.getAttribute(name);
    if(!a||!b||a.itemSize!==b.itemSize)
     throw Error('BTC unified hind mesh attribute mismatch: '+name);
    const ArrayType=a.array.constructor;
    const values=new ArrayType(a.array.length+b.array.length);
    values.set(a.array,0);values.set(b.array,a.array.length);
    combined.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));
   }
   const mergedIndex=new Uint32Array(hi.count+di.count);
   for(let i=0;i<hi.count;i++)mergedIndex[i]=hi.getX(i);
   for(let i=0;i<di.count;i++){
    const id=di.getX(i),hostId=hostEndpointMap.get(id);
    const donorId=donorTwinMap.get(id);
    mergedIndex[hi.count+i]=hostId===undefined?
     hostCount+(donorId===undefined?id:donorId):hostId;
   }
   combined.setIndex(new THREE.BufferAttribute(mergedIndex,1));
   const donorSurfaceIndexCount=di.count-data.indices.length;
   const bridgeIndexStart=hi.count+donorSurfaceIndexCount;
   const bridgeIndexEnd=hi.count+di.count;
   if(donorSurfaceIndexCount<0||data.indices.length%3!==0||
      bridgeIndexStart%3!==0||bridgeIndexEnd%3!==0)
    throw Error('BTC unified seam bridge index ranges are not triangle-aligned');
   const groups=hostGeo.groups.length?hostGeo.groups:
    [{start:0,count:hi.count,materialIndex:0}];
   for(const group of groups)
    combined.addGroup(group.start,group.count,group.materialIndex||0);
   combined.addGroup(hi.count,donorSurfaceIndexCount,2);
   combined.addGroup(bridgeIndexStart,data.indices.length,2);
   // Solve bridge winding against BOTH real source surfaces after welding.
   // Orienting the zipper internally is insufficient: its outer edges must
   // run opposite to the adjacent Maya and donor faces, or WebGL back-face
   // culling leaves dark wedges despite coincident positions.
   const bridgeFaceStart=bridgeIndexStart/3;
   const bridgeFaceCount=data.indices.length/3;
   const bridgeEdges=new Map();
   for(let offset=0;offset<mergedIndex.length;offset+=3){
    const face=offset/3;
    const isBridge=offset>=bridgeIndexStart&&offset<bridgeIndexEnd;
    const isHost=offset<hi.count;
    const ids=[mergedIndex[offset],mergedIndex[offset+1],mergedIndex[offset+2]];
    for(const [from,to] of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){
     const key=from<to?from+':'+to:to+':'+from;
     const list=bridgeEdges.get(key)||[];
     list.push({face,from,to,isBridge,isHost});
     bridgeEdges.set(key,list);
    }
   }
   const bridgeLinks=Array.from({length:bridgeFaceCount},()=>[]);
   const bridgeBoundaryConstraints=[],bridgeBoundaryUnmatchedDetails=[];
   const mergedPosition=combined.getAttribute('position');
   const describeMergedVertex=id=>{
    const kind=id<hostCount?'host':id<hostCount+data.donorBase?'donor':'bridge';
    const sourceIndex=kind==='host'?id:kind==='donor'?id-hostCount:id-hostCount-data.donorBase;
    return {id,kind,sourceIndex,position:[0,1,2].map(k=>mergedPosition.getComponent(id,k))};
   };
   let bridgeBoundaryUnmatchedEdges=0,bridgeBoundaryNonManifoldEdges=0;
   for(const list of bridgeEdges.values()){
    const bridgeUses=list.filter(use=>use.isBridge);
    if(!bridgeUses.length)continue;
    if(list.length>2){bridgeBoundaryNonManifoldEdges++;continue;}
    if(bridgeUses.length===2){
     const [a,b]=bridgeUses;
     const same=a.from===b.from&&a.to===b.to;
     const toggle=same?1:0;
     const ai=a.face-bridgeFaceStart,bi=b.face-bridgeFaceStart;
     bridgeLinks[ai].push({face:bi,toggle});
     bridgeLinks[bi].push({face:ai,toggle});
    }else if(bridgeUses.length===1){
     const bridgeUse=bridgeUses[0],external=list.find(use=>!use.isBridge);
     if(!external){
      bridgeBoundaryUnmatchedEdges++;
      const offset=bridgeUse.face*3;
      const triangle=[mergedIndex[offset],mergedIndex[offset+1],mergedIndex[offset+2]];
      bridgeBoundaryUnmatchedDetails.push({
       face:bridgeUse.face,
       edge:[describeMergedVertex(bridgeUse.from),describeMergedVertex(bridgeUse.to)],
       triangle:triangle.map(describeMergedVertex),incidentFaces:list.length
      });
      continue;
     }
     const same=bridgeUse.from===external.from&&bridgeUse.to===external.to;
     bridgeBoundaryConstraints.push({
      face:bridgeUse.face-bridgeFaceStart,
      requiredFlip:same?1:0,
      surface:external.isHost?'host':'donor'
     });
    }else{
     bridgeBoundaryNonManifoldEdges++;
    }
   }
   const bridgeState=new Int8Array(bridgeFaceCount);bridgeState.fill(-1);
   const bridgeComponents=[],bridgeComponentOf=new Int32Array(bridgeFaceCount);
   bridgeComponentOf.fill(-1);
   let bridgeInternalWindingConflicts=0;
   for(let start=0;start<bridgeFaceCount;start++){
    if(bridgeState[start]!==-1)continue;
    const component=[],stack=[start],componentId=bridgeComponents.length;
    bridgeState[start]=0;
    while(stack.length){
     const face=stack.pop();component.push(face);
     bridgeComponentOf[face]=componentId;
     for(const link of bridgeLinks[face]){
      const expected=bridgeState[face]^link.toggle;
      if(bridgeState[link.face]===-1){
       bridgeState[link.face]=expected;stack.push(link.face);
      }else if(bridgeState[link.face]!==expected){
       bridgeInternalWindingConflicts++;
      }
     }
    }
    bridgeComponents.push(component);
   }
   const bridgeVotes=bridgeComponents.map(()=>({keep:0,flip:0,hostKeep:0,hostFlip:0}));
   for(const constraint of bridgeBoundaryConstraints){
    const component=bridgeComponentOf[constraint.face];
    const globalFlip=bridgeState[constraint.face]^constraint.requiredFlip;
    const vote=bridgeVotes[component];
    if(globalFlip){vote.flip++;if(constraint.surface==='host')vote.hostFlip++;}
    else{vote.keep++;if(constraint.surface==='host')vote.hostKeep++;}
   }
   let bridgeBoundaryFlippedComponents=0;
   const bridgeComponentFlip=bridgeVotes.map(vote=>{
    // Host-side boundary orientation is the tie-break because it is the
    // authored retained torso; donor winding must agree with that surface.
    const flip=vote.flip>vote.keep||
     (vote.flip===vote.keep&&vote.hostFlip>vote.hostKeep);
    if(flip)bridgeBoundaryFlippedComponents++;
    return flip?1:0;
   });
   for(let local=0;local<bridgeFaceCount;local++){
    if(!(bridgeState[local]^bridgeComponentFlip[bridgeComponentOf[local]]))continue;
    const offset=(bridgeFaceStart+local)*3;
    [mergedIndex[offset+1],mergedIndex[offset+2]]=
     [mergedIndex[offset+2],mergedIndex[offset+1]];
   }
   let bridgeBoundaryOrientationMismatches=0,bridgeBoundaryHostEdges=0,
    bridgeBoundaryDonorEdges=0;
   for(const constraint of bridgeBoundaryConstraints){
    if(constraint.surface==='host')bridgeBoundaryHostEdges++;
    else bridgeBoundaryDonorEdges++;
    const actual=bridgeState[constraint.face]^
     bridgeComponentFlip[bridgeComponentOf[constraint.face]];
    if(actual!==constraint.requiredFlip)bridgeBoundaryOrientationMismatches++;
   }
   bodyCut.seamBridgeExactHostSourceMatches=exactHostSourceMatches;
   bodyCut.seamBridgeFallbackHostSourceMatches=fallbackHostSourceMatches;
   bodyCut.seamBridgeHostSourceMismatches=hostSourceMismatches;
   bodyCut.seamBridgeBoundaryComponents=bridgeComponents.length;
   bodyCut.seamBridgeBoundaryEdges=bridgeBoundaryConstraints.length;
   bodyCut.seamBridgeBoundaryHostEdges=bridgeBoundaryHostEdges;
   bodyCut.seamBridgeBoundaryDonorEdges=bridgeBoundaryDonorEdges;
   bodyCut.seamBridgeBoundaryUnmatchedEdges=bridgeBoundaryUnmatchedEdges;
   bodyCut.seamBridgeBoundaryUnmatchedDetails=bridgeBoundaryUnmatchedDetails;
   bodyCut.seamBridgeBoundaryNonManifoldEdges=bridgeBoundaryNonManifoldEdges;
   bodyCut.seamBridgeBoundaryOrientationMismatches=bridgeBoundaryOrientationMismatches;
   bodyCut.seamBridgeBoundaryInternalWindingConflicts=bridgeInternalWindingConflicts;
   bodyCut.seamBridgeBoundaryFlippedComponents=bridgeBoundaryFlippedComponents;
   // Recompute normals only after host and donor seam indices are welded.
   // This averages the transition over actual adjacent faces, not a detached
   // strip's guessed normal field.
   combined.computeVertexNormals();
   combined.computeBoundingSphere();
   combined.name='BTC Maya rump + welded native hind limbs + skinned seam';
   combinedGeometry=combined;
   donorMaterial=anatomy.materials[0].clone();
   donorMaterial.name='BTC unified native hind-limb coat';
   // One-off real-WebGL diagnostic: color and double-side only the added
   // donor+seam material to distinguish a backface hole from a missing/
   // misplaced bridge. The flag is never enabled in the public build.
   if(typeof location!=='undefined'&&
      new URLSearchParams(location.search).get('btcSeamDebugQA')==='1'){
    donorMaterial.side=THREE.DoubleSide;
    donorMaterial.color?.setHex?.(0x36ff72);
    donorMaterial.emissive?.setHex?.(0x002b10);
    if('emissiveIntensity' in donorMaterial)donorMaterial.emissiveIntensity=.85;
    donorMaterial.needsUpdate=true;
   }
   anatomy.mesh.geometry=combinedGeometry;
   anatomy.geometry=combinedGeometry;
   anatomy.mesh.material=[...anatomy.materials,donorMaterial];
   bodyCut.seamBridgeWeldedHostVertices=hostEndpointMap.size;
   bodyCut.seamBridgeHostEndpointCount=data.hostEndpointVertices.length;
   bodyCut.seamBridgeWeldedDonorVertices=donorTwinMap.size;
   bodyCut.seamBridgeDonorEndpointGroups=donorEndpointKeys.size;
   bodyCut.seamBridgeWeldedDonorTwins=donorTwinMap.size-donorEndpointKeys.size;
   bodyCut.seamBridgeDonorEndpointCount=data.donorEndpointVertices.length;
   bodyCut.triangles+=data.indices.length/3;
   bodyCut.seamBridgeData=null;
  }
  donorHooves=attachNativeDonor(original,hoovesCut.geometry,anatomy.materials[1],
   'BTC V20 original Gallop posterior hoof keratin');
  // Opt-in screenshot isolation: hide only the added hind-limb material group.
  // The retained Maya rump remains visible in this diagnostic browser URL.
  if(typeof location!=='undefined'&&
     new URLSearchParams(location.search).get('btcHideDonorQA')==='1'){
   donorMaterial.visible=false;donorHooves.visible=false;
  }
 }catch(e){
  donorHooves?.removeFromParent();
  if(combinedGeometry){
   anatomy.mesh.geometry=originalHostGeometry;
   anatomy.geometry=originalHostGeometry;
   anatomy.mesh.material=originalMeshMaterial;
   combinedGeometry.dispose();combinedGeometry=null;
  }
  donorMaterial?.dispose();donorMaterial=null;
  bodyCut?.geometry.dispose();hoovesCut?.geometry.dispose();
  crop.restore();throw e;
 }
 let disposed=false;
 return {
  snapshot:{
   build:'btc-v22-continuous-hind-seam-20261107',seamCutZ:BTC_SEAM_CUT_Z,
   originalNativeSkeleton:true,originalGallopPreserved:true,
   donorHindTriangles:bodyCut.triangles,
   donorHoofTriangles:hoovesCut.triangles,
   removedMayaTriangles:crop.removedMayaTriangles,
   isolatedMayaPosteriorIslandsRemoved:crop.isolatedMayaPosteriorIslandsRemoved,
   isolatedMayaPosteriorTrianglesRemoved:crop.isolatedMayaPosteriorTrianglesRemoved,
   isolatedMayaPosteriorComponentAudit:crop.isolatedMayaPosteriorComponentAudit,
   isolatedMayaPosteriorResidualComponentsRemoved:crop.isolatedMayaPosteriorComponentAudit.length,
   isolatedMayaPosteriorResidualTrianglesRemoved:crop.isolatedMayaPosteriorComponentAudit.reduce((sum,c)=>sum+c.triangles,0),
   isolatedMayaPosteriorSourceFaceKeys:crop.isolatedMayaPosteriorSourceFaceKeys,
   cutTriangles:crop.cutTriangles,addedCutVertices:crop.addedCutVertices,
   seamMethod:crop.seamMethod,donorUpperInsetVertices:bodyCut.insetVertices,
   sewnRimVertices:bodyCut.sewnRimVertices||0,hostRimEdges:bodyCut.hostRimEdges||0,donorRimVertices:bodyCut.donorRimVertices||0,
   seamHostBoundarySplitPoints:bodyCut.seamHostBoundarySplitPoints||0,
   seamHostBoundarySplitEdges:bodyCut.seamHostBoundarySplitEdges||0,
   seamHostBoundarySplitMissing:bodyCut.seamHostBoundarySplitMissing||0,
   hostRimEdgesByPlane:bodyCut.hostRimEdgesByPlane||{},donorRimEdgesByPlane:bodyCut.donorRimEdgesByPlane||{},
   seamBridgeMethod:bodyCut.seamBridgeMethod||'none',seamBridgeLoopPairs:bodyCut.seamBridgeLoopPairs||0,
   seamBridgeOpenPaths:bodyCut.seamBridgeOpenPaths||0,
   seamBridgeClosedLoops:bodyCut.seamBridgeClosedLoops||0,
   seamBridgeVirtualClosures:bodyCut.seamBridgeVirtualClosures||0,
   seamBridgeVirtualClosureMaxGap:bodyCut.seamBridgeVirtualClosureMaxGap||0,
    seamBridgeVirtualClosureDiagnostics:bodyCut.seamBridgeVirtualClosureDiagnostics||[],
   seamBridgeSurfaceTangentFallbacks:bodyCut.seamBridgeSurfaceTangentFallbacks||0,
   seamBridgeTangentDirectionFlips:bodyCut.seamBridgeTangentDirectionFlips||0,
   seamBridgeMeanTangentReach:bodyCut.seamBridgeMeanTangentReach||0,
   seamBridgePostRelaxReprojectedVertices:bodyCut.seamBridgePostRelaxReprojectedVertices||0,
   seamBridgePostRelaxMaxShift:bodyCut.seamBridgePostRelaxMaxShift||0,
   seamWarpFactor:bodyCut.seamWarpFactor||0,seamWarpTargetFraction:bodyCut.seamWarpTargetFraction||0,
   seamWarpMaxMove:bodyCut.seamWarpMaxMove||0,
   seamWarpMeanMove:bodyCut.seamWarpMeanMove||0,seamWarpMaxResidualGap:bodyCut.seamWarpMaxResidualGap||0,
   seamWarpAcceptedGroups:bodyCut.seamWarpAcceptedGroups||0,
   seamWarpRejectedGroups:bodyCut.seamWarpRejectedGroups||0,
   seamBridgeZipperMovesDonor:bodyCut.seamBridgeZipperMovesDonor||0,seamBridgeZipperMovesHost:bodyCut.seamBridgeZipperMovesHost||0,
   seamBridgeZipperResampledLoops:bodyCut.seamBridgeZipperResampledLoops||0,
   seamBridgeZipperAdaptiveLoops:bodyCut.seamBridgeZipperAdaptiveLoops||0,
   seamBridgeZipperAdaptiveTriangles:bodyCut.seamBridgeZipperAdaptiveTriangles||0,
   seamBridgeZipperAdaptiveSourceTriangles:bodyCut.seamBridgeZipperAdaptiveSourceTriangles||0,
   seamBridgeZipperAdaptiveRejects:bodyCut.seamBridgeZipperAdaptiveRejects||0,
   seamBridgeZipperAdaptiveRejectReasons:bodyCut.seamBridgeZipperAdaptiveRejectReasons||[],
   seamBridgeZipperAdaptiveCenterFanCells:bodyCut.seamBridgeZipperAdaptiveCenterFanCells||0,
   seamBridgeZipperAdaptiveCapFanTriangles:bodyCut.seamBridgeZipperAdaptiveCapFanTriangles||0,
   seamBridgeZipperMaxAdaptiveTriangles:bodyCut.seamBridgeZipperMaxAdaptiveTriangles||0,
   seamBridgeLayerCount:bodyCut.seamBridgeLayerCount||0,
   seamBridgeZipperFallbackLoops:bodyCut.seamBridgeZipperFallbackLoops||0,
   seamBridgeZipperMeanQuality:bodyCut.seamBridgeZipperMeanQuality||0,seamBridgeZipperMinQuality:bodyCut.seamBridgeZipperMinQuality||0,
   seamBridgeOrientationFlips:bodyCut.seamBridgeOrientationFlips||0,
   seamBridgeOrientationComponents:bodyCut.seamBridgeOrientationComponents||0,
   seamBridgeTriangles:bodyCut.seamBridgeTriangles||0,seamBridgeUnmatchedEdges:bodyCut.seamBridgeUnmatchedEdges||0,
   seamBridgeSingleTriangleEdges:bodyCut.seamBridgeSingleTriangleEdges||0,
   seamBridgeTrianglesByPlane:bodyCut.seamBridgeTrianglesByPlane||{},
   seamBridgeEdgesByPlane:bodyCut.seamBridgeEdgesByPlane||{},
   seamBridgeUnmatchedByPlane:bodyCut.seamBridgeUnmatchedByPlane||{},seamBridgeMaxGap:bodyCut.seamBridgeMaxGap||0,
   seamBridgeMeanGap:bodyCut.seamBridgeMeanGap||0,seamBridgeEdges:bodyCut.seamBridgeEdges||0,
   seamBridgeVertices:bodyCut.seamBridgeVertices||0,seamBridgeUnmatchedVertices:bodyCut.seamBridgeUnmatchedVertices||0,
   seamBridgeMaxHostStep:bodyCut.seamBridgeMaxHostStep||0,
   collarRejectedMoves:bodyCut.collarRejectedMoves,collarBacktrackedMoves:bodyCut.collarBacktrackedMoves,
   donorReweightedVertices:bodyCut.reattachedWeights,donorSurfacePoints:bodyCut.uniqueSurfacePoints,
   donorSubdivisionPasses:bodyCut.subdivisionPasses,
   originalDonorTriangles:bodyCut.sourceTriangles,refinedDonorVertices:bodyCut.refinedVertices,
   originalHoofTriangles:hoovesCut.sourceTriangles,
   seamBridgeWeldedHostVertices:bodyCut.seamBridgeWeldedHostVertices||0,
   seamBridgeHostEndpointCount:bodyCut.seamBridgeHostEndpointCount||0,
   seamBridgeExactHostSourceMatches:bodyCut.seamBridgeExactHostSourceMatches||0,
   seamBridgeFallbackHostSourceMatches:bodyCut.seamBridgeFallbackHostSourceMatches||0,
   seamBridgeHostSourceMismatches:bodyCut.seamBridgeHostSourceMismatches||0,
   seamBridgeBoundaryComponents:bodyCut.seamBridgeBoundaryComponents||0,
   seamBridgeBoundaryEdges:bodyCut.seamBridgeBoundaryEdges||0,
   seamBridgeBoundaryHostEdges:bodyCut.seamBridgeBoundaryHostEdges||0,
   seamBridgeBoundaryDonorEdges:bodyCut.seamBridgeBoundaryDonorEdges||0,
   seamBridgeBoundaryUnmatchedEdges:bodyCut.seamBridgeBoundaryUnmatchedEdges||0,
    seamBridgeBoundaryUnmatchedDetails:bodyCut.seamBridgeBoundaryUnmatchedDetails||[],
   seamBridgeBoundaryNonManifoldEdges:bodyCut.seamBridgeBoundaryNonManifoldEdges||0,
   seamBridgeBoundaryOrientationMismatches:bodyCut.seamBridgeBoundaryOrientationMismatches||0,
   seamBridgeBoundaryInternalWindingConflicts:bodyCut.seamBridgeBoundaryInternalWindingConflicts||0,
   seamBridgeBoundaryFlippedComponents:bodyCut.seamBridgeBoundaryFlippedComponents||0,
   seamBridgeWeldedDonorVertices:bodyCut.seamBridgeWeldedDonorVertices||0,
   seamBridgeDonorEndpointGroups:bodyCut.seamBridgeDonorEndpointGroups||0,
   seamBridgeWeldedDonorTwins:bodyCut.seamBridgeWeldedDonorTwins||0,
   seamBridgeDonorEndpointCount:bodyCut.seamBridgeDonorEndpointCount||0,
   sameOriginalSkeleton:anatomy.mesh.skeleton===original.skeleton&&donorHooves.skeleton===original.skeleton
  },
  dispose(){
   if(disposed)return;disposed=true;
   donorHooves.removeFromParent();
   anatomy.mesh.geometry=originalHostGeometry;
   anatomy.geometry=originalHostGeometry;
   anatomy.mesh.material=originalMeshMaterial;
   combinedGeometry?.dispose();combinedGeometry=null;
   donorMaterial?.dispose();donorMaterial=null;
   bodyCut.geometry.dispose();hoovesCut.geometry.dispose();
   crop.restore();
  }
 };
}
