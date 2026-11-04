/**
 * BTC anatomy master, from the user's actual Horse_VR_2017.ma polygon sculpt.
 *
 * The current race model (Quaternius) is kept for its ORIGINAL authored Gallop,
 * bones, and complete rollback. Only BTC's visible anatomical surface changes.
 * No video, screenshots, static planes, sprite swaps, or new race mechanics.
 */
import * as THREE from 'three';
import {BTC_EQUINE_MESH} from './btc-maya-body-data.js';
import {createMayaGroom} from './btc-maya-groom.js';
import {createBTCMayaFaceDetails} from './btc-maya-face-details.js';
export const BTC_MAYA_MASTER='btc-maya-2017-sculpt-gallop-20261104';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const TAU=Math.PI*2;
const shade=new THREE.Color('#32231d');
function fromBase64(s){
 const binary=atob(s),out=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
 return new Uint16Array(out.buffer);
}
function unbox(){
 const asset=BTC_EQUINE_MESH,p=fromBase64(asset.position16),ii=fromBase64(asset.index16);
 if(p.length!==asset.count*3||ii.length!==asset.triangles*3)throw Error('Maya sculpt asset truncated');
 const positions=new Float32Array(p.length);
 for(let i=0;i<positions.length;i++){
  const axis=i%3;
  positions[i]=asset.min[axis]+p[i]/65535*(asset.max[axis]-asset.min[axis]);
 }
 return {positions,indices:ii};
}
function sourceBody(root){
 let best=null;const hidden=[];
 root.traverse(obj=>{
  if(!obj.isSkinnedMesh)return;
  const materials=[obj.material].flat(),name=materials[0]?.name;
  if(name==='Main'&&obj.geometry?.getAttribute('position')?.count>3000)best=obj;
  if(['Main','Main_Dark','Muzzle','Hooves','Main_Light','Hair','Eye_Black','Eye_White'].includes(name))
   hidden.push({obj,visible:obj.visible});
 });
 if(!best?.skeleton||!best.geometry.getAttribute('skinIndex')||!best.geometry.getAttribute('skinWeight'))
  throw Error('BTC master requires intact original Gallop skeleton and skin');
 return {best,hidden};
}
function makeSkinTransfer(source){
 const p=source.geometry.getAttribute('position');
 const joints=source.geometry.getAttribute('skinIndex');
 const weights=source.geometry.getAttribute('skinWeight');
 const cell=.0018;
 const key=(x,y,z)=>x+','+y+','+z;
 const coords=[],grid=new Map();
 for(let i=0;i<p.count;i++){
  const v=[p.getX(i),p.getY(i),p.getZ(i)];
  coords.push(v);
  const id=key(Math.floor(v[0]/cell),Math.floor(v[1]/cell),Math.floor(v[2]/cell));
  if(!grid.has(id))grid.set(id,[]);
  grid.get(id).push(i);
 }
 function skinAt(x,y,z){
  const c=[x,y,z].map(v=>Math.floor(v/cell)),nearest=[];
  // Original skinned body remains the single source of all joint indices.
  for(let ring=0;ring<=3;ring++){
   for(let a=-ring;a<=ring;a++)for(let b=-ring;b<=ring;b++)for(let d=-ring;d<=ring;d++){
    if(ring&&Math.max(Math.abs(a),Math.abs(b),Math.abs(d))!==ring)continue;
    const list=grid.get(key(c[0]+a,c[1]+b,c[2]+d));
    if(!list)continue;
    for(const i of list){
     const v=coords[i],dx=x-v[0],dy=y-v[1],dz=z-v[2];
     const dist=dx*dx+dy*dy+dz*dz;
     if(nearest.length<12||dist<nearest[nearest.length-1].dist){
      nearest.push({i,dist});nearest.sort((a,b)=>a.dist-b.dist);
      if(nearest.length>12)nearest.length=12;
     }
    }
   }
   if(nearest.length>=12&&ring>=1)break;
  }
  if(!nearest.length){
   for(let i=0;i<coords.length;i++){
    const v=coords[i],dx=x-v[0],dy=y-v[1],dz=z-v[2],dist=dx*dx+dy*dy+dz*dz;
    if(nearest.length<12||dist<nearest[nearest.length-1].dist){
     nearest.push({i,dist});nearest.sort((a,b)=>a.dist-b.dist);
     if(nearest.length>12)nearest.length=12;
    }
   }
  }
  const contributions=new Map();
  for(const {i,dist} of nearest){
   const proximity=Math.exp(-dist/(2*.0021*.0021));
   for(let j=0;j<4;j++){
    const weight=weights.getComponent(i,j);
    if(weight<.00001)continue;
    const bone=joints.getComponent(i,j);
    contributions.set(bone,(contributions.get(bone)||0)+weight*proximity);
   }
  }
  const top=[...contributions].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const total=top.reduce((sum,item)=>sum+item[1],0)||1;
  return {joints:Array.from({length:4},(_,i)=>top[i]?.[0]||0),
    weights:Array.from({length:4},(_,i)=>(top[i]?.[1]||0)/total)};
 }
 return skinAt;
}
function applySkin(mesh,source){
 mesh.bindMode=source.bindMode;
 mesh.position.copy(source.position);
 mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;
 mesh.castShadow=true;mesh.receiveShadow=true;
 source.parent.add(mesh);
 return mesh;
}
function makeAnatomy(source,skinAt,{coatColor,brandAccent,brandMode='natural_coat',hoofColor}={}){
 const {positions,indices}=unbox();
 const bone=new Uint16Array(positions.length/3*4);
 const weights=new Float32Array(positions.length/3*4);
 for(let i=0;i<positions.length;i+=3){
  const skin=skinAt(positions[i],positions[i+1],positions[i+2]);
  for(let k=0;k<4;k++){
   bone[(i/3)*4+k]=skin.joints[k];weights[(i/3)*4+k]=skin.weights[k];
  }
 }
 // Stabilize skin weights across neighboring vertices of the supplied Maya
 // anatomy; nearest-source weights alone tore the hocks during Gallop.
 const nVerts=positions.length/3;
 const adjacency=Array.from({length:nVerts},()=>new Set());
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  adjacency[a].add(b);adjacency[a].add(c);
  adjacency[b].add(a);adjacency[b].add(c);
  adjacency[c].add(a);adjacency[c].add(b);
 }
 for(let iteration=0;iteration<2;iteration++){
  const freshB=new Uint16Array(bone.length),freshW=new Float32Array(weights.length);
  for(let v=0;v<nVerts;v++){
   const sums=new Map();
   for(const neighbor of [v,...adjacency[v]]){
    const factor=neighbor===v?2:1;
    for(let k=0;k<4;k++){
     const w=weights[neighbor*4+k];
     if(w<.00001)continue;
     const joint=bone[neighbor*4+k];
     sums.set(joint,(sums.get(joint)||0)+w*factor);
    }
   }
   const top=[...sums].sort((a,b)=>b[1]-a[1]).slice(0,4);
   const total=top.reduce((v,p)=>v+p[1],0)||1;
   for(let k=0;k<4;k++){
    freshB[v*4+k]=top[k]?.[0]||0;
    freshW[v*4+k]=(top[k]?.[1]||0)/total;
   }
  }
  bone.set(freshB);weights.set(freshW);
 }
 const skinIndex=[],hoofIndex=[];
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  const z=(positions[a*3+2]+positions[b*3+2]+positions[c*3+2])/3;
  (z<.00265?hoofIndex:skinIndex).push(a,b,c);
 }
 const all=new Uint16Array(indices.length);all.set(skinIndex);
 all.set(hoofIndex,skinIndex.length);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bone,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setIndex(new THREE.BufferAttribute(all,1));
 geo.addGroup(0,skinIndex.length,0);
 geo.addGroup(skinIndex.length,hoofIndex.length,1);
 geo.computeVertexNormals();geo.computeBoundingSphere();
 // Important: unlike V5's procedural wax, the Maya sculpt's REAL modeled
 // cheeks, muzzle, shoulder landmarks, fetlocks and hoof forms carry light.
 const coat=source.material.clone();
 coat.name='BTC Maya natural sculpted coat';
 coat.metalness=0;coat.roughness=.77;
 // The horse is an animal, not a neon advertising statue. BTC branding is
 // carried by the identity card; the animal gets a natural chestnut coat.
 // A published editor profile with brand_colored intentionally overrides it.
 const natural=new THREE.Color(/^#[0-9a-f]{6}$/i.test(coatColor||'')?coatColor:'#936e50');
 const accent=new THREE.Color(/^#[0-9a-f]{6}$/i.test(brandAccent||'')?brandAccent:'#f7931a');
 coat.color.copy(natural.lerp(accent,brandMode==='brand_colored'?.46:.10));
 coat.flatShading=false;coat.side=THREE.FrontSide;
 const prior=coat.onBeforeCompile;
 const cacheKey=coat.customProgramCacheKey?.bind(coat);
 coat.onBeforeCompile=function(shader,renderer){
  prior?.call(this,shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCMayaRest;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvBTCMayaRest=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCMayaRest;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat crpMuzzle=1.0-smoothstep(-.035,-.028,vBTCMayaRest.y);\ncrpMuzzle*=smoothstep(.031,.035,vBTCMayaRest.z)*(1.0-smoothstep(.039,.043,vBTCMayaRest.z));\ndiffuseColor.rgb*=mix(vec3(1.0),vec3(.76,.73,.71),crpMuzzle*.78);');
 };
 coat.customProgramCacheKey=()=>String(cacheKey?.()||'')+'|btc-maya-muzzle-v2';
 const hoof=new THREE.MeshStandardMaterial({
  name:'BTC sculpted keratin with growth rings',color:/^#[0-9a-f]{6}$/i.test(hoofColor||'')?hoofColor:'#39302a',
  roughness:.84,metalness:0,side:THREE.FrontSide
 });
 // Keratin is layered, semi-matte horn. A subtle coronet/capsule transition,
 // vertical horn growth and low-angle bounce replaces the single dark blob.
 hoof.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCHoofRest;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvBTCHoofRest=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCHoofRest;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat coronet=exp(-pow((vBTCHoofRest.z-.0025)/.00035,2.));\nfloat hornStriae=sin(vBTCHoofRest.y*48000.+vBTCHoofRest.x*8000.)*sin(vBTCHoofRest.x*39000.);\nfloat toeTone=smoothstep(.0005,.0027,vBTCHoofRest.z);\ndiffuseColor.rgb*=mix(.66,1.13,toeTone)*(1.0+.050*hornStriae+.075*coronet);');
 };
 hoof.customProgramCacheKey=()=> 'btc-maya-hoof-growth-and-coronet-v3';
 const mesh=new THREE.SkinnedMesh(geo,[coat,hoof]);
 mesh.name='BTC 2017 sculpted anatomical replacement, original Gallop rig';
 applySkin(mesh,source);
 return {mesh,geometry:geo,materials:[coat,hoof],vertices:positions.length/3,triangles:indices.length/3,positions};
}

function makeAnatomicalEyes(source,skinAt){
 const vertices=[],bone=[],weights=[],faces=[];
 const sides=20,rings=7;
 // Eye position and dimensions measured against the user's Maya 2017 eye
 // surfaces, not estimated from a cartoon face.
 for(const side of [-1,1]){
  const center=[side*.00205,-.0282,.04260],sk=skinAt(...center);
  const start=vertices.length/3;
  for(let row=0;row<=rings;row++){
   const u=row/rings;
   for(let i=0;i<sides;i++){
    const theta=i*TAU/sides,radius=Math.sin(Math.PI*.5*u);
    vertices.push(
     side*(.00202+.00025*(1-u*u)),
     center[1]+.00047*radius*Math.cos(theta),
     center[2]+.00037*radius*Math.sin(theta)
    );
    for(let k=0;k<4;k++){bone.push(sk.joints[k]);weights.push(sk.weights[k]);}
   }
  }
  for(let row=0;row<rings;row++)for(let i=0;i<sides;i++){
   const a=start+row*sides+i,b=start+row*sides+(i+1)%sides;
   const c=a+sides,d=b+sides;
   faces.push(a,c,b,b,c,d);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(faces);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bone,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.computeVertexNormals();
 const material=new THREE.MeshPhysicalMaterial({
  name:'BTC dark glossy iris from Maya eye sockets',color:'#21120b',
  roughness:.19,metalness:0,clearcoat:.64,clearcoatRoughness:.12,
  side:THREE.DoubleSide
 });
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC inset sculpted bilateral equine eyes';
 applySkin(mesh,source);
 return {mesh,geometry,material};
}

export function createBTCHeroMaya(root,{maneSize=1.2,tailSize=1.1,color='#35251e',coatColor,brandAccent,brandMode,hoofColor}={}){
 const {best,hidden}=sourceBody(root);
 const originalVisibility=hidden.map(x=>({...x}));
 const skinAt=makeSkinTransfer(best);
 const anatomy=makeAnatomy(best,skinAt,{coatColor,brandAccent,brandMode,hoofColor});
 const groom=createMayaGroom(best,skinAt,{
  maneSize,tailSize,maneColor:color,tailColor:color
 });
 const eyes=makeAnatomicalEyes(best,skinAt);
 const face=createBTCMayaFaceDetails(best,skinAt,anatomy.positions);
 for(const h of hidden)h.obj.visible=false;
 // The original plastic eyes are hidden in favor of two inset glossy
 // equine eyes with the same skinned and animated head transform.
 let disposed=false,time=0,phase=0;
 return {
  get snapshot(){return {
   version:BTC_MAYA_MASTER,modelPreserved:true,gallopPreserved:true,
   originalRig:true,source:'supplied-Maya-2017-sculpt',
   sculptedBodyParts:1,vertices:anatomy.vertices,
   triangles:anatomy.triangles,oldHairHidden:!best.visible,
   animatedHair:true,maneVertices:groom.vertices,fineLocks:groom.locks,sculptedEyes:2,facialSurfaces:face.surfaces,facialTriangles:face.triangles,
   motionType:'original-gallop-bones-plus-spring-fine-ribbons',
   time,phase,disposed
  };},
  update(dt,{wind=1,speed=1,phase:gait=0,running=true}={}){
   if(disposed)return;
   time+=clamp(dt,0,.06)*clamp(speed,.2,2);
   phase=gait;
   groom.update(dt,{wind,speed,phase:gait,running});
  },
  setColor(next){
   if(typeof next==='string'&&/^#[0-9a-f]{6}$/i.test(next))
    groom.setColor(next);
  },
  dispose(){
   if(disposed)return;disposed=true;
   for(const h of originalVisibility)h.obj.visible=h.visible;
   groom.dispose();face.dispose();
   eyes.mesh.removeFromParent();eyes.geometry.dispose();eyes.material.dispose();
   anatomy.mesh.removeFromParent();anatomy.geometry.dispose();
   anatomy.materials.forEach(m=>m.dispose());
  }
 };
}
