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
 // Keep the native centerline and anterior skeleton. Subtract the TWO
 // disjoint, convex posterior crop lobes exactly. The former one-crossing
 // clipper bridged holes when an edge entered and exited a removed lobe.
 // This is actual geometry surgery: retained polygons are split, and every
 // new point receives interpolated skin influences.
 const planes=[
  {name:'rearZ',signed:v=>.0208-xyz[v*3+2]},
  {name:'lowY',signed:v=>xyz[v*3+1]-.0052},
  {name:'leftX',signed:v=>-.0015-xyz[v*3]},
  {name:'rightX',signed:v=>xyz[v*3]-.0015}
 ];
 const EPS=1e-12;
 function edgeIntersection(a,b,plane){
  const fa=plane.signed(a),fb=plane.signed(b);
  if(Math.abs(fa)<=EPS)return a;
  if(Math.abs(fb)<=EPS)return b;
  const key=plane.name+':'+Math.min(a,b)+':'+Math.max(a,b);
  if(edgeCache.has(key))return edgeCache.get(key);
  const t=fa/(fa-fb);
  if(!Number.isFinite(t)||t<0||t>1)
   throw Error('BTC V23 invalid planar cut intersection '+plane.name+': '+a+'/'+b);
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
  for(let k=0;k<4;k++){
   bones.push(top[k]?.[0]||0);
   weights.push((top[k]?.[1]||0)/sum);
  }
  edgeCache.set(key,id);
  return id;
 }
 function planeClip(poly,plane,positive){
  if(poly.length<3)return [];
  const inside=v=>positive?plane.signed(v)>=-EPS:plane.signed(v)<=EPS;
  const out=[];
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length];
   const ia=inside(a),ib=inside(b);
   if(ia)out.push(a);
   if(ia!==ib)out.push(edgeIntersection(a,b,plane));
  }
  const dedup=[];
  for(const v of out)if(dedup[dedup.length-1]!==v)dedup.push(v);
  if(dedup.length>1&&dedup[0]===dedup[dedup.length-1])dedup.pop();
  return dedup;
 }
 function polygonArea(poly){
  if(poly.length<3)return 0;
  const a=poly[0],ax=xyz[a*3],ay=xyz[a*3+1],az=xyz[a*3+2];
  let sum=0;
  for(let i=1;i<poly.length-1;i++){
   const b=poly[i],c=poly[i+1];
   const bx=xyz[b*3]-ax,by=xyz[b*3+1]-ay,bz=xyz[b*3+2]-az;
   const cx=xyz[c*3]-ax,cy=xyz[c*3+1]-ay,cz=xyz[c*3+2]-az;
   sum+=Math.hypot(by*cz-bz*cy,bz*cx-bx*cz,bx*cy-by*cx)*.5;
  }
  return sum;
 }
 function removeConvexLobe(poly,sidePlane){
  let active=poly;
  const retained=[];
  // A polygon minus the INTERSECTION of three half-spaces is the
  // union of non-overlapping outside slices, emitted in plane order.
  for(const plane of [planes[0],planes[1],sidePlane]){
   if(active.length<3)break;
   const values=active.map(plane.signed);
   if(Math.max(...values)<=EPS){
    retained.push(active);
    active=[];
    break;
   }
   if(Math.min(...values)>EPS)continue;
   const outside=planeClip(active,plane,false);
   if(outside.length>=3&&polygonArea(outside)>1e-19)
    retained.push(outside);
   active=planeClip(active,plane,true);
  }
  return retained;
 }
 for(const group of old.groups){
  const start=next.length;
  for(let i=group.start;i<group.start+group.count;i+=3){
   const tri=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
   const ps=tri.map(v=>[xyz[v*3],xyz[v*3+1],xyz[v*3+2]]);
   // Fast path: triangles provably disjoint from both rear crop lobes.
   if(ps.every(p=>p[2]>=.0208)||ps.every(p=>p[1]<=.0052)||
      ps.every(p=>Math.abs(p[0])<=.0015)){
    next.push(...tri);
    continue;
   }
   // Clip away the left and right lobes separately. An edge with two
   // crossings now yields multiple legitimate retained polygons instead
   // of a spurious bridge or an unconditional runtime rejection.
   let polys=removeConvexLobe(tri,planes[2]);
   polys=polys.flatMap(poly=>removeConvexLobe(poly,planes[3]));
   const area=polygonArea(tri);
   let keptArea=0;
   for(const poly of polys){
    const a=polygonArea(poly);
    if(a<=1e-19)continue;
    keptArea+=a;
    for(let j=1;j<poly.length-1;j++)
     next.push(poly[0],poly[j],poly[j+1]);
   }
   if(keptArea<=Math.max(1e-19,area*1e-9))fullyRemoved++;
   else if(keptArea<area*(1-1e-8))clipped++;
  }
  groups.push({start,count:next.length-start,materialIndex:group.materialIndex});
 }
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
 const edgeOwner=new Map();
 for(let i=0;i<next.length;i+=3){
  const tri=i/3,vs=[next[i],next[i+1],next[i+2]];
  for(let k=0;k<3;k++){
   const a=vs[k],b=vs[(k+1)%3];
   const key=a<b?a+':'+b:b+':'+a;
   if(edgeOwner.has(key))join(tri,edgeOwner.get(key));
   else edgeOwner.set(key,tri);
  }
 }
 const counts=new Map(),limits=new Map();
 for(let i=0;i<next.length;i+=3){
  const r=root(i/3);counts.set(r,(counts.get(r)||0)+1);
  const l=limits.get(r)||{y:0,z:0,n:0};
  for(let k=0;k<3;k++){
   const v=next[i+k];l.y+=xyz[v*3+1];l.z+=xyz[v*3+2];l.n++;
  }
  limits.set(r,l);
 }
 const islandRoots=new Set();
 for(const [r,count] of counts){
  const l=limits.get(r);
  if(count<=8&&l.y/l.n>.005&&l.z/l.n<.002)
   islandRoots.add(r);
 }
 const pruned=[],cleanGroups=[];
 let isolatedTrianglesRemoved=0;
 for(const group of groups){
  const start=pruned.length;
  for(let i=group.start;i<group.start+group.count;i+=3){
   if(islandRoots.has(root(i/3))){isolatedTrianglesRemoved++;continue;}
   pruned.push(next[i],next[i+1],next[i+2]);
  }
  cleanGroups.push({start,count:pruned.length-start,materialIndex:group.materialIndex});
 }
 if(isolatedTrianglesRemoved>20)
  throw Error('BTC posterior island cleanup exceeded 20 triangles: '+isolatedTrianglesRemoved);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setIndex(new THREE.Uint16BufferAttribute(pruned,1));
 geo.clearGroups();
 for(const g of cleanGroups)geo.addGroup(g.start,g.count,g.materialIndex);
 geo.deleteAttribute('normal');
 geo.computeVertexNormals();
 geo.computeBoundingSphere();
 return {removedMayaTriangles:fullyRemoved,cutTriangles:clipped,
  addedCutVertices:xyz.length/3-originalCount,keptMayaTriangles:pruned.length/3,
  isolatedMayaPosteriorIslandsRemoved:islandRoots.size,
  isolatedMayaPosteriorTrianglesRemoved:isolatedTrianglesRemoved,
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

/**
 * Subdivide the ACTUAL rigged GLB donor surface, not a fake cylinder drawn
 * over it. Quaternius splits 3D vertices at UV/hard-normal seams:
 * 3086 triangle-corner vertices represent only ~827 spatial locations.
 * Weld those coincident native points (the coat has no UV dependence here),
 * then apply two conservative Loop subdivision passes to round the limbs.
 * Preserve all native Gallop bone indices at old vertices; interpolate
 * influences at new edge vertices. No separately animated skeleton.
 */
function refineSkinnedDonor(source,passes=2){
 const pos=source.getAttribute('position'),joints=source.getAttribute('skinIndex'),
  weights=source.getAttribute('skinWeight'),index=source.getIndex();
 if(!index||!joints||!weights)throw Error('BTC V22 cannot refine a non-rigged donor');
 const unique=new Map(),vertices=[],faces=[];
 const getVertex=id=>{
  const point=[pos.getX(id),pos.getY(id),pos.getZ(id)];
  const key=point.map(x=>Math.round(x*1e7)).join(':');
  if(unique.has(key))return unique.get(key);
  const bones=new Map();
  for(let k=0;k<4;k++){
   const w=weights.getComponent(id,k);
   if(w>1e-8)bones.set(joints.getComponent(id,k),w);
  }
  const v=vertices.length;vertices.push({p:point,w:bones});unique.set(key,v);
  return v;
 };
 for(let i=0;i<index.count;i+=3){
  const tri=[getVertex(index.getX(i)),getVertex(index.getX(i+1)),getVertex(index.getX(i+2))];
  if(new Set(tri).size===3)faces.push(tri);
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
   if(near.length===2){
    next.push(combine([[vs[i],.75],[vs[near[0]],.125],[vs[near[1]],.125]]));
   }else if(valence>=3){
    const beta=valence===3?3/16:3/(8*valence);
    const terms=[[vs[i],1-valence*beta],...Array.from(adj[i],v=>[vs[v],beta])];
    next.push(combine(terms));
   }else next.push(vs[i]);
  }
  const mid=new Map();
  for(const [key,e] of edges){
   const [a,b]=[vs[e.a],vs[e.b]];
   const m=e.opp.length===2
    ?combine([[a,.375],[b,.375],[vs[e.opp[0]],.125],[vs[e.opp[1]],.125]])
    :combine([[a,.5],[b,.5]]);
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
 const crop=cropMayaHind(anatomy);
 let donor=null,donorHooves=null,bodyCut=null,hoovesCut=null;
 try{
  bodyCut=clipNativeTriangles(original,(p)=>{
   const x=p.reduce((n,v)=>n+v[0],0)/3,
     y=p.reduce((n,v)=>n+v[1],0)/3,z=p.reduce((n,v)=>n+v[2],0)/3;
   // Full original Gallop joint topology from gaskin through fetlock.
   // Upper end tucks into the still-continuous Maya rump.
   // Stop the Quaternius thigh collar below the original Maya croup.
   // The old z<.0268 allowed broad donor triangles to climb onto the
   // rump and appear as a jagged skirt in real rear WebGL images.
   return y>.00385&&z<.0246&&Math.abs(x)>.0010;
  });

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
  const attachment=[];
  for(const i of liveHostVertices){
   const x=hostPos.getX(i),y=hostPos.getY(i),z=hostPos.getZ(i);
   if(z>.0207&&z<.032&&y>.0042&&Math.abs(x)>.0012)
    attachment.push({id:i,x,y,z,side:Math.sign(x)});
  }
  if(attachment.length<100)throw Error('BTC V22 host rump attachment surface incomplete');
  let insetVertices=0,reattachedWeights=0;
  for(let i=0;i<donorPos.count;i++){
   const z=donorPos.getZ(i),y=donorPos.getY(i),x=donorPos.getX(i);
   if(z<=.0208||y<.0039||Math.abs(x)<.0010)continue;
   // Match the taper's endpoint to the new anatomical collar cutoff.
   const u=THREE.MathUtils.clamp((z-.0208)/(.0246-.0208),0,1);
   const t=u*u*(3-2*u);
   const side=Math.sign(x);
   // Project to a locally averaged SAME-FLANK Maya patch, not one
   // nearest vertex. Single-vertex snapping creates a stepped collar and
   // needle-like triangles when adjacent donor points choose different hosts.
   const nearby=[];
   for(const v of attachment){
    if(v.side!==side)continue;
    const dx=v.x-x,dy=v.y-y,dz=v.z-z;
    const dist=dx*dx+dy*dy+dz*dz*2.4;
    if(nearby.length<4||dist<nearby[nearby.length-1].dist){
     nearby.push({v,dist});
     nearby.sort((a,b)=>a.dist-b.dist);
     if(nearby.length>4)nearby.pop();
    }
   }
   if(!nearby.length||nearby[0].dist>.000075)continue;
   // Keep the closest original host for skin influence until the genuine
   // Maya rig is available; only smooth the surface attachment geometry.
   const near=nearby[0].v;
   let sum=0,px=0,py=0,pz=0;
   for(const {v,dist} of nearby){
    const w=1/(dist+1e-9);
    sum+=w;px+=v.x*w;py+=v.y*w;pz+=v.z*w;
   }
   px/=sum;py/=sum;pz/=sum;
   const blend=t*.98;
   donorPos.setXYZ(i,
    THREE.MathUtils.lerp(x,px-side*.00022,blend),
    THREE.MathUtils.lerp(y,py,blend),
    THREE.MathUtils.lerp(z,pz,blend*.18));
   // At the upper boundary the donor follows the SAME hind-thigh tissue
   // as Maya during Gallop. Distal native Gallop weights are untouched.
   const influences=new Map();
   for(const [id,mult,attr,weight] of [
    [i,1-.88*t,donorSkin,donorWeights],
    [near.id,.88*t,hostSkin,hostWeights]
   ])for(let k=0;k<4;k++){
    const w=mult*weight.getComponent(id,k);
    if(w>1e-8){
     const bone=attr.getComponent(id,k);
     influences.set(bone,(influences.get(bone)||0)+w);
    }
   }
   const top=[...influences].sort((p,q)=>q[1]-p[1]).slice(0,4);
   const total=top.reduce((s,p)=>s+p[1],0)||1;
   for(let k=0;k<4;k++){
    donorSkin.setComponent(i,k,top[k]?.[0]||0);
    donorWeights.setComponent(i,k,(top[k]?.[1]||0)/total);
   }
   insetVertices++;reattachedWeights++;
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
  bodyCut.insetVertices=insetVertices;
  bodyCut.reattachedWeights=reattachedWeights;
  bodyCut.uniqueSurfacePoints=uniqueSurfacePoints;
  hoovesCut=clipNativeTriangles(hoof,p=>{
   const cy=p.reduce((s,v)=>s+v[1],0)/3;
   return cy>.003;
  });
  if(bodyCut.triangles<280||hoovesCut.triangles<20)
   throw Error('BTC V20 native donor unexpectedly incomplete: '+bodyCut.triangles+'/'+hoovesCut.triangles);
  const smoothHooves=refineSkinnedDonor(hoovesCut.geometry,1);
  hoovesCut.geometry.dispose();hoovesCut.geometry=smoothHooves.geometry;
  hoovesCut.sourceTriangles=smoothHooves.sourceTriangles;
  hoovesCut.triangles=smoothHooves.triangles;
  donor=attachNativeDonor(original,bodyCut.geometry,anatomy.materials[0],
   'BTC V20 original Gallop hind limbs with original skin weights');
  donorHooves=attachNativeDonor(original,hoovesCut.geometry,anatomy.materials[1],
   'BTC V20 original Gallop posterior hoof keratin');
  // Opt-in screenshot isolation: hidden ONLY in this diagnostic browser URL.
  // No effect on the published BTC model, physics or default candidate.
  if(typeof location!=='undefined'&&
     new URLSearchParams(location.search).get('btcHideDonorQA')==='1'){
   donor.visible=false;donorHooves.visible=false;
  }
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
   isolatedMayaPosteriorIslandsRemoved:crop.isolatedMayaPosteriorIslandsRemoved,
   isolatedMayaPosteriorTrianglesRemoved:crop.isolatedMayaPosteriorTrianglesRemoved,
   cutTriangles:crop.cutTriangles,addedCutVertices:crop.addedCutVertices,
   seamMethod:crop.seamMethod,donorUpperInsetVertices:bodyCut.insetVertices,
   donorReweightedVertices:bodyCut.reattachedWeights,donorSurfacePoints:bodyCut.uniqueSurfacePoints,
   donorSubdivisionPasses:bodyCut.subdivisionPasses,
   originalDonorTriangles:bodyCut.sourceTriangles,refinedDonorVertices:bodyCut.refinedVertices,
   originalHoofTriangles:hoovesCut.sourceTriangles,
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
