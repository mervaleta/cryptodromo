/**
 * BTC anatomy master, from the user's actual Horse_VR_2017.ma polygon sculpt.
 *
 * The current race model (Quaternius) is kept for its ORIGINAL authored Gallop,
 * bones, and complete rollback. Only BTC's visible anatomical surface changes.
 * No video, screenshots, static planes, sprite swaps, or new race mechanics.
 */
import * as THREE from 'three';
import {BTC_EQUINE_MESH} from './btc-maya-body-data.js';
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
  if(['Main','Main_Dark','Muzzle','Hooves','Main_Light','Hair'].includes(name))
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
     if(nearest.length<4||dist<nearest[nearest.length-1].dist){
      nearest.push({i,dist});nearest.sort((a,b)=>a.dist-b.dist);
      if(nearest.length>4)nearest.length=4;
     }
    }
   }
   if(nearest.length>=4&&ring>=1)break;
  }
  if(!nearest.length){
   for(let i=0;i<coords.length;i++){
    const v=coords[i],dx=x-v[0],dy=y-v[1],dz=z-v[2],dist=dx*dx+dy*dy+dz*dz;
    if(nearest.length<4||dist<nearest[nearest.length-1].dist){
     nearest.push({i,dist});nearest.sort((a,b)=>a.dist-b.dist);
     if(nearest.length>4)nearest.length=4;
    }
   }
  }
  const contributions=new Map();
  for(const {i,dist} of nearest){
   const proximity=1/(dist+.00000006);
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
function makeAnatomy(source,skinAt){
 const {positions,indices}=unbox();
 const bone=new Uint16Array(positions.length/3*4);
 const weights=new Float32Array(positions.length/3*4);
 for(let i=0;i<positions.length;i+=3){
  const skin=skinAt(positions[i],positions[i+1],positions[i+2]);
  for(let k=0;k<4;k++){
   bone[(i/3)*4+k]=skin.joints[k];weights[(i/3)*4+k]=skin.weights[k];
  }
 }
 const skinIndex=[],hoofIndex=[],muIndex=[];
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  const z=(positions[a*3+2]+positions[b*3+2]+positions[c*3+2])/3;
  const y=(positions[a*3+1]+positions[b*3+1]+positions[c*3+1])/3;
  const target=z<.00335?hoofIndex:
   (y<-.0315&&z>.0320&&z<.040?muIndex:skinIndex);
  target.push(a,b,c);
 }
 const all=new Uint16Array(indices.length);all.set(skinIndex);
 all.set(muIndex,skinIndex.length);all.set(hoofIndex,skinIndex.length+muIndex.length);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bone,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setIndex(new THREE.BufferAttribute(all,1));
 geo.addGroup(0,skinIndex.length,0);
 geo.addGroup(skinIndex.length,muIndex.length,1);
 geo.addGroup(skinIndex.length+muIndex.length,hoofIndex.length,2);
 geo.computeVertexNormals();geo.computeBoundingSphere();
 // Important: unlike V5's procedural wax, the Maya sculpt's REAL modeled
 // cheeks, muzzle, shoulder landmarks, fetlocks and hoof forms carry light.
 const coat=source.material.clone();
 coat.name='BTC Maya natural sculpted coat';
 coat.metalness=0;coat.roughness=.83;
 coat.flatShading=false;coat.side=THREE.FrontSide;
 const muzzle=new THREE.MeshStandardMaterial({
  name:'BTC sculpted muzzle pigment',color:'#816452',roughness:.91,metalness:0
 });
 const hoof=new THREE.MeshStandardMaterial({
  name:'BTC sculpted keratin',color:'#342d29',roughness:.74,metalness:0
 });
 const mesh=new THREE.SkinnedMesh(geo,[coat,muzzle,hoof]);
 mesh.name='BTC 2017 sculpted anatomical replacement, original Gallop rig';
 applySkin(mesh,source);
 return {mesh,geometry:geo,materials:[coat,muzzle,hoof],vertices:positions.length/3,triangles:indices.length/3,positions};
}
// Silk RIBBONS, not the V4/V5 tubes or spiky cylinders. Roots are placed
// directly on the anatomically correct Maya topline and tail dock.
function makeGroom(source,skinAt,body,{maneSize=1,tailSize=1,color='#35251e'}={}){
 const positions=[],uv=[],bone=[],weight=[],indices=[],region=[],tip=[],strand=[];
 const TWIST=Math.PI*.6,SEG=15;
 let locks=0;
 const rand=x=>{const t=Math.sin(x*92.371+14.91)*52817.7;return t-Math.floor(t);};
 function crest(y){
  let result=-Infinity;
  const p=body.positions;
  for(let i=0;i<p.length;i+=3){
   if(Math.abs(p[i])<.00090&&Math.abs(p[i+1]-y)<.00090&&p[i+2]>.027)
    result=Math.max(result,p[i+2]);
  }
  return Number.isFinite(result)?result:.0402;
 }
 const add=(tail,n,count,side=1)=>{
  const a=rand(n*2.27+tail*133+side*17),b=rand(n*4.07+tail*5.11+side*29),f=(n+.28+.37*a)/count;
  const id=locks++;
  let root;
  if(!tail){
   const y=-.026+.020*f;
   root=[side*.00011,y,crest(y)-.00017];
  }else{
   root=[(a-.5)*.00035,.0149+.00065*b,.0318-.00065*a];
  }
  const sk=skinAt(...root);
  const length=(tail?(.014+.009*a)*tailSize:(.0036+.0046*b)*maneSize);
  const width=(tail?(.00011+.00011*b):(.00009+.00009*a));
  const start=positions.length/3;
  for(let i=0;i<=SEG;i++){
   const t=i/SEG,e=smooth(t),fall=Math.pow(1-t,.85),r=Math.sin(t*Math.PI);
   let center;
   if(tail){
    center=[
     root[0]+(a-.5)*(.0033*r+.0025*e),
     root[1]+.0011*r+.0035*e,
     root[2]-length*(t*.92+.08*Math.sin(t*Math.PI))];
   }else{
    center=[
     root[0]+side*(.0005*r+.0017*e)*(0.7+0.3*a),
     root[1]+(.0015+.0010*a)*e,
     root[2]-(length*(.52*t+.48*e))];
   }
   const strandWidth=width*fall*(.7+.3*r);
   const theta=TWIST*t+(a-.5)*.5;
   for(const sideId of [-1,1]){
    const q=sideId*strandWidth;
    positions.push(center[0]+q*Math.cos(theta),center[1]+q*.23*Math.sin(theta),center[2]+q*Math.sin(theta));
    uv.push(t,sideId===-1?0:1);region.push(tail);tip.push(t);strand.push(id);
    for(let j=0;j<4;j++){bone.push(sk.joints[j]);weight.push(sk.weights[j]);}
   }
  }
  for(let i=0;i<SEG;i++){
   const a=start+i*2,b=a+1,c=a+2,d=a+3;
   indices.push(a,c,b,b,c,d);
  }
 };
 // Multiple fine overlapping natural locks instead of massive plastic ropes.
 for(let i=0;i<142;i++){add(0,i,142,-1);add(0,i,142,1);}
 for(let i=0;i<290;i++)add(1,i,290);
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indices);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bone,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setAttribute('maneTip',new THREE.Float32BufferAttribute(tip,1));
 geo.setAttribute('maneTail',new THREE.Float32BufferAttribute(region,1));
 geo.setAttribute('maneId',new THREE.Float32BufferAttribute(strand,1));
 geo.computeVertexNormals();
 const material=new THREE.MeshPhysicalMaterial({
  name:'BTC Maya rooted fine-ribbon hair',
  color,metalness:0,roughness:.75,sheen:.47,
  sheenColor:new THREE.Color('#8b6550'),sheenRoughness:.78,
  side:THREE.DoubleSide,shadowSide:THREE.DoubleSide
 });
 const uniforms={clock:{value:0},wind:{value:.7},gait:{value:0}};
 material.onBeforeCompile=shader=>{
  shader.uniforms.crpMayaClock=uniforms.clock;
  shader.uniforms.crpMayaWind=uniforms.wind;
  shader.uniforms.crpMayaGait=uniforms.gait;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute float maneTip;\nattribute float maneTail;\nattribute float maneId;\nvarying vec2 vCRPMayaFiber;\nuniform float crpMayaClock;\nuniform float crpMayaWind;\nuniform float crpMayaGait;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvCRPMayaFiber=vec2(maneTip,maneId);\nfloat crpBend=pow(smoothstep(.015,.98,maneTip),1.7);\nfloat crpWave=sin(crpMayaClock*mix(5.3,2.8,maneTail)-maneTip*6.4+maneId*.43);\nfloat crpSecondary=sin(crpMayaGait*6.283185307+mix(.7,1.9,maneTail))*mix(.00020,.00070,maneTail);\ntransformed.x+=crpBend*crpWave*crpMayaWind*mix(.00014,.00034,maneTail);\ntransformed.y+=crpBend*(crpSecondary+.00012*crpWave*crpMayaWind);\ntransformed.z+=crpBend*crpSecondary*.32;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec2 vCRPMayaFiber;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat crpShade=.77+.21*smoothstep(.06,.62,vCRPMayaFiber.x);\nfloat crpStria=sin(vCRPMayaFiber.y*.51+vCRPMayaFiber.x*64.0)*.028;\ndiffuseColor.rgb*=crpShade+crpStria;');
 };
 material.customProgramCacheKey=()=>BTC_MAYA_MASTER+'-silk';
 const mesh=new THREE.SkinnedMesh(geo,material);
 mesh.name='BTC 2017 anatomically rooted ribbon mane and tail';
 applySkin(mesh,source);
 mesh.castShadow=true;mesh.receiveShadow=false;
 return {mesh,geo,material,uniforms,locks,vertices:positions.length/3};
}
export function createBTCHeroMaya(root,{maneSize=1.2,tailSize=1.1,color='#35251e'}={}){
 const {best,hidden}=sourceBody(root);
 const originalVisibility=hidden.map(x=>({...x}));
 const skinAt=makeSkinTransfer(best);
 const anatomy=makeAnatomy(best,skinAt);
 const groom=makeGroom(best,skinAt,anatomy,{maneSize,tailSize,color});
 for(const h of hidden)h.obj.visible=false;
 // EYE primitives stay available: eye sockets, pupils and head motion follow
 // the same original, animated head bone.
 let disposed=false,time=0,phase=0;
 return {
  get snapshot(){return {
   version:BTC_MAYA_MASTER,modelPreserved:true,gallopPreserved:true,
   originalRig:true,source:'supplied-Maya-2017-sculpt',
   sculptedBodyParts:1,vertices:anatomy.vertices,
   triangles:anatomy.triangles,oldHairHidden:!best.visible,
   animatedHair:true,maneVertices:groom.vertices,fineLocks:groom.locks,
   motionType:'original-gallop-bones-plus-spring-fine-ribbons',
   time,phase,disposed
  };},
  update(dt,{wind=1,speed=1,phase:gait=0,running=true}={}){
   if(disposed)return;
   time+=clamp(dt,0,.06)*clamp(speed,.2,2);
   phase=gait;
   groom.uniforms.clock.value=time;
   groom.uniforms.gait.value=gait;
   groom.uniforms.wind.value=running?clamp(wind,0,2):.14;
  },
  setColor(next){
   if(typeof next==='string'&&/^#[0-9a-f]{6}$/i.test(next))
    groom.material.color.set(next);
  },
  dispose(){
   if(disposed)return;disposed=true;
   for(const h of originalVisibility)h.obj.visible=h.visible;
   groom.mesh.removeFromParent();groom.geo.dispose();groom.material.dispose();
   anatomy.mesh.removeFromParent();anatomy.geometry.dispose();
   anatomy.materials.forEach(m=>m.dispose());
  }
 };
}
