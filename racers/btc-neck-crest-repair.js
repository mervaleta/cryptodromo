/**
 * Repair the actual 74-edge opening running over BTC's skull, poll and crest.
 * Earlier V5's eight-station bridge left most of this border exposed.
 * Join the two original boundary chains in the SAME animated SkinnedMesh.
 * No extra bones, static covers, face replacements or edits to other racers.
 */
import * as THREE from 'three';
export const BTC_CREST_REPAIR_BUILD='btc-head-neck-border-closure-20261105-v2';
const WELD_SCALE=1e7;
const key3=(x,y,z)=>[x,y,z].map(v=>Math.round(v*WELD_SCALE)).join('/');
const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;

export function closeBTCNeckCrest(mesh){
 if(!mesh?.isSkinnedMesh)throw Error('BTC head and crest require a SkinnedMesh');
 const old=mesh.geometry,position=old?.getAttribute('position'),normal=old?.getAttribute('normal'),
  skinIndex=old?.getAttribute('skinIndex'),skinWeight=old?.getAttribute('skinWeight'),index=old?.getIndex();
 if(!position||!normal||!skinIndex||!skinWeight||!index||position.count<2500)
  throw Error('BTC head closure needs native indexed Main with its rig');
 if(Object.values(old.attributes).some(a=>a.isInterleavedBufferAttribute))
  throw Error('BTC head closure refuses interleaved geometry');

 // GLB UV/normal splits duplicate positions. Weld only for border discovery.
 // Faces still reference the existing source vertices with their original skin.
 const identities=new Map(),coords=[],representative=[],vertexId=new Int32Array(position.count);
 for(let v=0;v<position.count;v++){
  const x=position.getX(v),y=position.getY(v),z=position.getZ(v),key=key3(x,y,z);
  let id=identities.get(key);
  if(id===undefined){id=coords.length;identities.set(key,id);coords.push([x,y,z]);representative.push(v);}
  vertexId[v]=id;
 }
 const edges=new Map();
 for(let i=0;i<index.count;i+=3){
  const a=vertexId[index.getX(i)],b=vertexId[index.getX(i+1)],c=vertexId[index.getX(i+2)];
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   if(u===v)continue;
   const k=edgeKey(u,v),record=edges.get(k);
   if(record)record.count++;
   else edges.set(k,{a:u,b:v,count:1});
  }
 }
 const graph=new Map();
 for(const edge of edges.values())if(edge.count===1){
  for(const [a,b] of [[edge.a,edge.b],[edge.b,edge.a]]){
   if(!graph.has(a))graph.set(a,new Set());
   graph.get(a).add(b);
  }
 }
 const seen=new Set(),components=[];
 for(const start of graph.keys()){
  if(seen.has(start))continue;
  const todo=[start],component=[];seen.add(start);
  while(todo.length){
   const v=todo.pop();component.push(v);
   for(const next of graph.get(v)||[])if(!seen.has(next)){
    seen.add(next);todo.push(next);
   }
  }
  components.push(component);
 }
 // Hooves, eye sockets and tail have their own original borders: leave them.
 const outline=components.find(c=>c.length===74&&c.every(v=>(graph.get(v)?.size||0)===2)
   &&Math.min(...c.map(v=>coords[v][1]))<-.032
   &&Math.max(...c.map(v=>coords[v][1]))>-.014);
 if(!outline)throw Error('BTC 74-edge skull/neck opening changed: refusing an ungrounded patch');
 const front=outline.reduce((best,v)=>
  coords[v][2]<coords[best][2]-1e-8||
  (Math.abs(coords[v][2]-coords[best][2])<1e-8&&Math.abs(coords[v][0])<Math.abs(coords[best][0]))?v:best);
 const rear=outline.reduce((best,v)=>coords[v][1]>coords[best][1]?v:best);
 const order=[front];let previous=-1;
 while(order.length<outline.length){
  const here=order[order.length-1];
  const next=[...graph.get(here)].find(v=>v!==previous);
  if(next===undefined||next===front||order.includes(next))
   throw Error('BTC skull opening no longer forms one simple border');
  previous=here;order.push(next);
 }
 if(!graph.get(order[order.length-1]).has(front))
  throw Error('BTC skull opening border no longer closes');
 const rearAt=order.indexOf(rear);
 if(rearAt<10||rearAt>order.length-10)throw Error('BTC skull boundary sides invalid');
 const left=order.slice(0,rearAt+1),right=[front,...order.slice(rearAt+1).reverse(),rear];
 // Front-facing winding is evaluated in the active native Gallop pose.
 mesh.parent?.updateMatrixWorld(true);mesh.skeleton.update();
 const triangles=[];let l=0,r=0;
 const length=(a,b)=>Math.hypot(coords[a][0]-coords[b][0],coords[a][1]-coords[b][1],coords[a][2]-coords[b][2]);
 while(l<left.length-1||r<right.length-1){
  const a=left[l],b=right[r];
  let advanceLeft;
  if(l===left.length-1)advanceLeft=false;
  else if(r===right.length-1)advanceLeft=true;
  else{
   // Short cross sections preserve the horse's bent face and neck silhouette.
   const progressL=(l+1)/(left.length-1),progressR=(r+1)/(right.length-1);
   const costL=length(left[l+1],b)+Math.max(0,progressL-progressR-.05)*.005;
   const costR=length(a,right[r+1])+Math.max(0,progressR-progressL-.05)*.005;
   advanceLeft=costL<=costR;
  }
  const candidate=advanceLeft?[a,left[++l],b]:[a,b,right[++r]];
  if(new Set(candidate).size!==3)continue;
  const [v0,v1,v2]=candidate.map(id=>
   mesh.applyBoneTransform(representative[id],new THREE.Vector3().fromBufferAttribute(position,representative[id])));
  const ab=new THREE.Vector3().subVectors(v1,v0),ac=new THREE.Vector3().subVectors(v2,v0);
  const nz=ab.cross(ac).z;
  if(!Number.isFinite(nz)||Math.abs(nz)<1e-12)
   throw Error('BTC head closure found degenerate posed face');
  if(nz<0)[candidate[1],candidate[2]]=[candidate[2],candidate[1]];
  triangles.push(...candidate.map(id=>representative[id]));
 }
 if(triangles.length!==72*3)throw Error('BTC skull closure needs 72 stitched triangles');
 // Reject intersections with pre-existing faces / any remaining open seam.
 const counts=new Map(edges);
 for(let i=0;i<triangles.length;i+=3){
  const a=vertexId[triangles[i]],b=vertexId[triangles[i+1]],c=vertexId[triangles[i+2]];
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const key=edgeKey(u,v),oldRecord=counts.get(key);
   if(oldRecord)counts.set(key,{...oldRecord,count:oldRecord.count+1});
   else counts.set(key,{a:u,b:v,count:1});
  }
 }
 for(const v of outline)for(const neighbor of graph.get(v)){
  if(counts.get(edgeKey(v,neighbor)).count!==2)
   throw Error('BTC skull closure left an original border unsealed');
 }
 if([...counts.values()].some(e=>e.count>2))
  throw Error('BTC skull closure introduced non-manifold triangles');

 const geo=old.clone(),originalCount=index.count;
 const IndexArray=index.array.constructor,all=new IndexArray(originalCount+triangles.length);
 all.set(index.array);all.set(triangles,originalCount);
 geo.setIndex(new THREE.BufferAttribute(all,1));
 if(old.groups.length)geo.addGroup(originalCount,triangles.length,0);
 geo.computeBoundingBox();geo.computeBoundingSphere();
 mesh.geometry=geo;
 let active=true;
 return {
  build:BTC_CREST_REPAIR_BUILD,triangles:triangles.length/3,
  originalGeometryPreserved:true,nativeSkeletonPreserved:true,
  sealedOriginalBorderEdges:74,remainingSkullBorderEdges:0,
  dispose(){if(!active)return;active=false;if(mesh.geometry===geo)mesh.geometry=old;geo.dispose();}
 };
}
