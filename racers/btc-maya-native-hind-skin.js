/**
 * BTC V18 anatomical leg-skin projection.
 *
 * The Maya 2017 vertex surface is NOT the original Quaternius topology.
 * Gaussian nearest-vertex transfer followed by unconditional neighborhood
 * averaging can mix several different hinges, especially the hind hock.
 *
 * Recover the original skinned Gallop surface's bone field by projecting each
 * posterior limb vertex to the closest SAME-SIDE original hind-leg triangle.
 * Use barycentric interpolation on the exact native source weights. Smooth
 * falloff into the rump means we do not create a hard attachment boundary.
 * No bone or animation keyframe is changed.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const voxel=(x,y,z,c)=>[
 Math.floor(x/c),Math.floor(y/c),Math.floor(z/c)
].join(':');
const vec=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)];
const distance2=(a,b)=> (a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;

/** Closest point on triangle and its exact barycentric interpolation weights.
 * Adapted from the geometric-region method (Ericson), without allocations
 * proportional to the number of source triangles.
 */
export function closestTriangleWeights(p,a,b,c) {
 const sub=(v,w)=>[v[0]-w[0],v[1]-w[1],v[2]-w[2]];
 const dot=(v,w)=>v[0]*w[0]+v[1]*w[1]+v[2]*w[2];
 const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a);
 const d1=dot(ab,ap),d2=dot(ac,ap);
 if(d1<=0&&d2<=0)return [1,0,0];
 const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);
 if(d3>=0&&d4<=d3)return [0,1,0];
 const vc=d1*d4-d3*d2;
 if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);return [1-v,v,0];}
 const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);
 if(d6>=0&&d5<=d6)return [0,0,1];
 const vb=d5*d2-d1*d6;
 if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return [1-w,0,w];}
 const va=d3*d6-d5*d4;
 if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){
  const w=(d4-d3)/((d4-d3)+(d5-d6));return [0,1-w,w];
 }
 const den=va+vb+vc;
 if(Math.abs(den)<1e-20)return [1,0,0];
 const v=vb/den,w=vc/den;return [1-v-w,v,w];
}

function nativeCandidates(source) {
 const geo=source.geometry,position=geo.getAttribute('position');
 const joint=geo.getAttribute('skinIndex'),weight=geo.getAttribute('skinWeight');
 const ids=geo.getIndex(),joints=source.skeleton.bones.map(b=>b.name);
 if(!position||!joint||!weight||!ids)throw Error('BTC V18 native leg projection requires indexed original skinned Gallop mesh');
 const triangles=[[],[]],grid=[new Map(),new Map()],cell=.0026;
 for(let t=0;t<ids.count;t+=3){
  const vi=[ids.getX(t),ids.getX(t+1),ids.getX(t+2)];
  const xyz=vi.map(i=>vec(position,i));
  const avg=xyz.reduce((s,p)=>[s[0]+p[0]/3,s[1]+p[1]/3,s[2]+p[2]/3],[0,0,0]);
  if(avg[1]<.002||avg[2]>.034||avg[2]<-.001)continue;
  const sign=avg[0]>0?1:-1,side=sign>0?1:0;
  if(Math.abs(avg[0])<.001)continue;
  let hindInfluence=0;
  for(const id of vi)for(let k=0;k<4;k++){
   const name=joints[joint.getComponent(id,k)]||'';
   if((name.startsWith('Back')||name.startsWith('IKBackLeg')||name.startsWith('FFB'))&&
    name.endsWith(sign>0?'.L':'.R'))hindInfluence+=weight.getComponent(id,k)/3;
  }
  if(hindInfluence<.30)continue;
  const record={vi,xyz,avg,side},index=triangles[side].push(record)-1;
  const key=voxel(...avg,cell);
  if(!grid[side].has(key))grid[side].set(key,[]);
  grid[side].get(key).push(index);
 }
 return {triangles,grid,cell,joint,weight};
}

/** Mutates weights only in the posterior leg region; original Gallop retained. */
export function projectHindWeightsFromNative(source,targetRest,bones,weights){
 if(!(targetRest instanceof Float32Array)||!(bones instanceof Uint16Array)||
   !(weights instanceof Float32Array)||targetRest.length/3*4!==bones.length||
   bones.length!==weights.length)throw Error('BTC V18 posterior projection invalid target attributes');
 const {triangles,grid,cell,joint,weight}=nativeCandidates(source);
 let adjusted=0,skipped=0,totalError=0,maxError=0;
 for(let i=0;i<targetRest.length/3;i++){
  const p=[targetRest[i*3],targetRest[i*3+1],targetRest[i*3+2]];
  const side=p[0]>=0?1:0;
  const lateral=smooth((Math.abs(p[0])-.00105)/.00125);
  const rear=smooth((p[1]-.0036)/.0042);
  const upper=1-smooth((p[2]-.025)/.007);
  const mask=lateral*rear*upper;
  if(mask<.025)continue;
  const group=triangles[side],bins=grid[side],origin=p.map(v=>Math.floor(v/cell));
  let nearest=null,minDist=Infinity;
  const seen=new Set();
  const evaluate=id=>{
   if(seen.has(id))return;seen.add(id);
   const tri=group[id];const abc=closestTriangleWeights(p,...tri.xyz);
   const closest=[0,0,0];
   for(let k=0;k<3;k++)for(let d=0;d<3;d++)closest[d]+=abc[k]*tri.xyz[k][d];
   const d2=distance2(p,closest);
   if(d2<minDist){minDist=d2;nearest={tri,abc};}
  };
  for(let ring=0;ring<=3;ring++){
   for(let dx=-ring;dx<=ring;dx++)for(let dy=-ring;dy<=ring;dy++)for(let dz=-ring;dz<=ring;dz++){
    if(ring&&Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))!==ring)continue;
    const items=bins.get([origin[0]+dx,origin[1]+dy,origin[2]+dz].join(':'));
    if(items)for(const id of items)evaluate(id);
   }
   if(nearest&&minDist<(.0013+ring*.0012)**2&&seen.size>=6)break;
  }
  if(!nearest){ // coarse shape offsets: distant Maya surface / GLB source
   for(let id=0;id<group.length;id++)evaluate(id);
  }
  if(!nearest||minDist>.0055**2){skipped++;continue;}
  // A gradual transition from native high-fidelity limb weighting to Maya
  // rump binding avoids abrupt segment/mesh seams at the stifle.
  const blend=.96*mask;
  // Blend original region boundaries against interpolated native weights.
  const mixed=new Map();
  for(let k=0;k<3;k++){
   const id=nearest.tri.vi[k],bary=nearest.abc[k];
   for(let n=0;n<4;n++){
    const j=joint.getComponent(id,n),w=blend*bary*weight.getComponent(id,n);
    if(w>1e-8)mixed.set(j,(mixed.get(j)||0)+w);
   }
  }
  for(let k=0;k<4;k++){
   const j=bones[i*4+k],w=(1-blend)*weights[i*4+k];
   if(w>1e-8)mixed.set(j,(mixed.get(j)||0)+w);
  }
  const top=[...mixed].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const sum=top.reduce((a,b)=>a+b[1],0)||1;
  for(let k=0;k<4;k++){
   bones[i*4+k]=top[k]?.[0]||0;
   weights[i*4+k]=(top[k]?.[1]||0)/sum;
  }
  adjusted++;const d=Math.sqrt(minDist);totalError+=d;maxError=Math.max(maxError,d);
 }
 return {adjusted,skipped,meanProjectionError:adjusted?totalError/adjusted:0,
  maxProjectionError:maxError,nativeHindTriangles:triangles[0].length+triangles[1].length,
  originalGallop:true,topologyUntouched:true};
}
