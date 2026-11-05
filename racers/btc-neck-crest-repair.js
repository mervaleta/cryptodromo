/**
 * Stitch the actual open dorsal neck border of the source Quaternius GLB.
 * Native Main vertices, bones, Gallop, mouth, eyes and legs stay untouched.
 * Coordinates below were measured from the original source boundary. The
 * added triangles become part of the SAME skinned coat, not a floating prop.
 */
import * as THREE from 'three';
export const BTC_CREST_REPAIR_BUILD='btc-crest-closure-20261105-v1';
const section=[
 [-.02656543,.00078444,.04473275],
 [-.02606626,.00119316,.04467723],
 [-.02483443,.00099535,.04471820],
 [-.02424467,.00174035,.04448752],
 [-.02212494,.00183677,.04269411],
 [-.01863979,.00191262,.03992616],
 [-.01585875,.00204130,.03820063],
 [-.01307800,.00216997,.03647471]
];
const tip=[0,-.01178345,.0366338];
function find(p,x,y,z){
 let n=-1,d=Infinity;
 for(let i=0;i<p.count;i++){
  const q=(p.getX(i)-x)**2+(p.getY(i)-y)**2+(p.getZ(i)-z)**2;
  if(q<d){d=q;n=i;}
 }
 if(d>.0011**2)throw Error('BTC crest seam changed: refusing ungrounded repair');
 return n;
}
function skinFor(a,b,joints,weights){
 const m=new Map();
 for(const id of [a,b])for(let k=0;k<4;k++){
  const j=joints.getComponent(id,k),w=weights.getComponent(id,k)*.5;
  if(w>.000001)m.set(j,(m.get(j)||0)+w);
 }
 const top=[...m].sort((x,y)=>y[1]-x[1]).slice(0,4);
 const total=top.reduce((s,x)=>s+x[1],0)||1;
 return {bones:Array.from({length:4},(_,i)=>top[i]?.[0]||0),
  weights:Array.from({length:4},(_,i)=>(top[i]?.[1]||0)/total)};
}
export function closeBTCNeckCrest(mesh){
 if(!mesh?.isSkinnedMesh)throw Error('BTC native crest requires SkinnedMesh');
 const old=mesh.geometry,p=old.getAttribute('position'),n=old.getAttribute('normal'),
  joints=old.getAttribute('skinIndex'),weights=old.getAttribute('skinWeight'),idx=old.getIndex();
 if(!p||!n||!joints||!weights||!idx||p.count<2500)
  throw Error('BTC crest requires original skinned Main geometry');
 if(Object.values(old.attributes).some(a=>a.isInterleavedBufferAttribute))
  throw Error('BTC crest refuses interleaved attributes');
 const bounds=section.map(([y,x,z])=>[
  find(p,-x,y,z),find(p,x,y,z)
 ]);
 const finish=find(p,...tip);
 if(p.count+section.length>=65535)throw Error('BTC crest index overflow');
 const geo=new THREE.BufferGeometry(),attributes={};
 for(const [name,a] of Object.entries(old.attributes)){
  const data=new a.array.constructor((p.count+section.length)*a.itemSize);
  data.set(a.array);attributes[name]={a,data};
 }
 const push=(name,values,i)=>attributes[name].data.set(values,i*attributes[name].a.itemSize);
 for(let i=0;i<section.length;i++){
  const [l,r]=bounds[i],id=p.count+i;
  push('position',[(p.getX(l)+p.getX(r))*.5,
   (p.getY(l)+p.getY(r))*.5,(p.getZ(l)+p.getZ(r))*.5+.00034],id);
  const nx=n.getX(l)+n.getX(r),ny=n.getY(l)+n.getY(r),
   nz=Math.max(.15,n.getZ(l)+n.getZ(r)),length=Math.hypot(nx,ny,nz)||1;
  push('normal',[nx/length,ny/length,nz/length],id);
  const skin=skinFor(l,r,joints,weights);
  push('skinIndex',skin.bones,id);push('skinWeight',skin.weights,id);
  for(const [name,{a,data}] of Object.entries(attributes)){
   if(['position','normal','skinIndex','skinWeight'].includes(name))continue;
   for(let k=0;k<a.itemSize;k++)
    data[id*a.itemSize+k]=.5*(a.getComponent(l,k)+a.getComponent(r,k));
  }
 }
 for(const [name,{a,data}] of Object.entries(attributes))
  geo.setAttribute(name,new THREE.BufferAttribute(data,a.itemSize,a.normalized));
 const indices=Array.from(idx.array),start=idx.count;
 for(let i=0;i<bounds.length-1;i++){
  const [l,r]=bounds[i],[ln,rn]=bounds[i+1],c=p.count+i,cn=c+1;
  indices.push(l,c,ln,c,cn,ln,c,r,cn,r,rn,cn);
 }
 const [l,r]=bounds[bounds.length-1],c=p.count+bounds.length-1;
 indices.push(l,c,finish,c,r,finish);
 geo.setIndex(new THREE.Uint16BufferAttribute(indices,1));
 for(const group of old.groups)geo.addGroup(group.start,group.count,group.materialIndex);
 if(old.groups.length)geo.addGroup(start,indices.length-start,0);
 geo.computeBoundingSphere();
 mesh.geometry=geo;
 return {
  build:BTC_CREST_REPAIR_BUILD,
  triangles:(indices.length-start)/3,
  originalGeometryPreserved:true,
  nativeSkeletonPreserved:true,
  dispose(){if(mesh.geometry===geo)mesh.geometry=old;geo.dispose();}
 };
}
