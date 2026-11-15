/**
 * True 3D neck-collar bridge from authored Maya and GLB boundary polygons.
 * Two skinned source meshes, one intact original 50-bone native Gallop.
 * Candidate only: human review of WebGL still mandatory.
 */
import * as THREE from 'three';
const TAU=Math.PI*2,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function contour(mesh,cut,maxOffset=.004){
 const geo=mesh.geometry,idx=geo.getIndex(),p=geo.getAttribute('position'),
  bone=geo.getAttribute('skinIndex'),weight=geo.getAttribute('skinWeight');
 if(!idx||!p||!bone||!weight)throw Error('BTC collar needs both original skinned meshes');
 const edges=new Map();
 const add=(a,b)=>{
  const key=a<b?a+':'+b:b+':'+a;
  const existing=edges.get(key)||{a,b,count:0};
  existing.count++;edges.set(key,existing);
 };
 for(let i=0;i<idx.count;i+=3){
  const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);
  add(a,b);add(b,c);add(c,a);
 }
 const ids=new Set();
 for(const e of edges.values()){
  if(e.count!==1)continue;
  const y=(p.getY(e.a)+p.getY(e.b))/2;
  if(Math.abs(y-cut)>maxOffset)continue;
  ids.add(e.a);ids.add(e.b);
 }
 if(ids.size<18||ids.size>1000)throw Error('BTC collar boundary unsuitable: '+ids.size);
 const samples=[];
 for(const id of ids){
  const point=[p.getX(id),p.getY(id),p.getZ(id)];
  const weights=[];
  for(let i=0;i<4;i++){
   const w=weight.getComponent(id,i);
   if(w>1e-6)weights.push([bone.getComponent(id,i),w]);
  }
  samples.push({point,weights});
 }
 const centerZ=samples.reduce((s,e)=>s+e.point[2],0)/samples.length;
 const sorted=samples.map(e=>{
  const angle=(Math.atan2(e.point[0],e.point[2]-centerZ)+TAU)%TAU;
  return {...e,angle};
 }).sort((a,b)=>a.angle-b.angle);
 return {points:sorted,centerZ};
}
function sampleRing(ring,angle){
 const arr=ring.points,n=arr.length;
 let right=arr.findIndex(p=>p.angle>=angle);
 if(right<0)right=0;
 const left=(right+n-1)%n;
 const a=arr[left],b=arr[right];
 const aa=a.angle,bb=b.angle+(right<=left?TAU:0);
 const th=angle+(angle<aa?TAU:0);
 const t=bb-aa>1e-8?Math.max(0,Math.min(1,(th-aa)/(bb-aa))):0;
 const point=a.point.map((v,i)=>v*(1-t)+b.point[i]*t);
 const weights=new Map();
 for(const [bone,w] of a.weights)weights.set(bone,(weights.get(bone)||0)+w*(1-t));
 for(const [bone,w] of b.weights)weights.set(bone,(weights.get(bone)||0)+w*t);
 return {point,weights:[...weights]};
}
function skinMix(a,b,t){
 const m=new Map();
 for(const [bone,w] of a.weights)m.set(bone,(m.get(bone)||0)+(1-t)*w);
 for(const [bone,w] of b.weights)m.set(bone,(m.get(bone)||0)+t*w);
 const top=[...m].sort((x,y)=>y[1]-x[1]).slice(0,4);
 const sum=top.reduce((s,w)=>s+w[1],0)||1;
 return {joint:Array.from({length:4},(_,i)=>top[i]?.[0]||0),
  weight:Array.from({length:4},(_,i)=>(top[i]?.[1]||0)/sum)};
}
export function createBTCNeckCollarStitch(main,head,{
 nativeCut=-.02055,mayaCut=-.02065
}={}){
 if(main.skeleton!==head.skeleton)throw Error('BTC collar must share native Gallop skeleton');
 const native=contour(main,nativeCut),maya=contour(head,mayaCut);
 const columns=64,rows=6,position=[],indices=[],joint=[],weight=[];
 for(let row=0;row<=rows;row++){
  const t=smooth(row/rows);
  for(let c=0;c<columns;c++){
   const angle=TAU*c/columns,a=sampleRing(native,angle),
    b=sampleRing(maya,angle);
   const p=a.point.map((v,i)=>v*(1-t)+b.point[i]*t);
   position.push(...p);
   const w=skinMix(a,b,t);
   joint.push(...w.joint);weight.push(...w.weight);
  }
 }
 for(let row=0;row<rows;row++)for(let c=0;c<columns;c++){
  const nc=(c+1)%columns,a=row*columns+c,b=row*columns+nc,
   d=(row+1)*columns+c,e=(row+1)*columns+nc;
  indices.push(a,b,d,b,e,d);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joint,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const mat=[main.material].flat()[0].clone();
 mat.name='BTC Maya-to-native anatomical collar, original PBR';
 mat.side=THREE.DoubleSide;
 const mesh=new THREE.SkinnedMesh(geo,mat);
 mesh.name='BTC genuine skinned neck collar stitch';
 mesh.position.copy(main.position);mesh.quaternion.copy(main.quaternion);
 mesh.scale.copy(main.scale);mesh.bindMode=main.bindMode;
 main.parent.add(mesh);
 mesh.bind(main.skeleton,main.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(main.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 let disposed=false;
 return {
  snapshot:{nativeBorderVertices:native.points.length,mayaBorderVertices:maya.points.length,
   collarTriangles:indices.length/3,skinSource:'original 50-bone Gallop',realPolygonBridge:true},
  dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geo.dispose();mat.dispose();}
 };
}
