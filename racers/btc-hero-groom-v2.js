/**
 * BTC original 3D horse: skinned 3D clumps for mane and tail.
 * Keeps the original horse GLB, skeleton, Gallop, coat and identity unchanged.
 * Optional overlay used only in the BTC A/B experimental viewer.
 */
import * as THREE from 'three';
export const HERO_GROOM_VERSION='btc-3d-groom-v2';
const TAU=Math.PI*2;
const RNG=n=>{const x=Math.sin(n*127.1+43.23)*43758.545;return x-Math.floor(x)};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
function sourceHair(root){
 let result=null;
 root.traverse(mesh=>{
  if(!result&&mesh.isSkinnedMesh&&mesh.geometry?.attributes?.position?.count>=300&&
    [mesh.material].flat().some(m=>m?.name==='Hair'))result=mesh;
 });
 if(!result)throw Error('The original skinned Hair mesh was not found');
 return result;
}
function buildGroom(source,settings){
 const pos=source.geometry.attributes.position;
 const bones=source.geometry.attributes.skinIndex;
 const weights=source.geometry.attributes.skinWeight;
 if(!bones||!weights)throw Error('Original Hair skin weights missing');
 const src=[];
 for(let i=0;i<pos.count;i++)src.push([pos.getX(i),pos.getY(i),pos.getZ(i)]);
 const verts=[],idx=[],skIndices=[],skWeights=[],colors=[],tips=[],lockIds=[],regions=[];
 const steps=12,sides=6;
 const pick=(mane,y,x,z)=>{
  let nearest=0,best=1e8;
  for(let i=0;i<src.length;i++){
   let p=src[i];if(mane?p[1]>-.009:p[1]<.013)continue;
   let d=(p[0]-x)**2+(p[1]-y)**2+(p[2]-z)**2;
   if(d<best){best=d;nearest=i;}
  }
  return nearest;
 };
 const addLock=(mane,j,n)=>{
  let t=j/(n-1),r=RNG(j*17+(mane?7:173)),lane=(j%5-2)*.00048;
  const anchor=pick(mane,mane?(-.028+t*.015):(.0163+(j%7)*.00025),lane,mane?(.0423-t*.0043):.033);
  const p=src[anchor],size=mane?settings.maneSize:settings.tailSize;
  const length=(mane?.0066+.0059*r:.019+.011*r)*size;
  const w=(mane?.00057:.00075)*(.75+.45*RNG(j+123));
  const first=verts.length/3;
  for(let k=0;k<=steps;k++){
   const u=k/steps,peak=Math.sin(Math.PI*u);
   const radius=w*(.34+.86*Math.min(1,u*5))*Math.max(.045,(1-u)**.65);
   const x=p[0]+Math.sin(u*Math.PI*1.7+r*8)*.00042*u;
   const y=p[1]+(mane?length*u:(.005+.004*r)*u);
   const z=p[2]+(mane?peak*(.0025+.0015*r)-.0014*u:-length*u+.0019*peak);
   const joint=pick(mane,y,x,z);
   for(let side=0;side<sides;side++){
    let a=side/sides*TAU;
    verts.push(x+Math.cos(a)*radius,y+Math.sin(a)*radius*.17,z+Math.sin(a)*radius*.55);
    for(let c=0;c<4;c++){skIndices.push(bones.getComponent(joint,c));skWeights.push(weights.getComponent(joint,c));}
    const light=.72+.1*RNG(j*13+side)+((side===0||side===1)?.22:0);
    colors.push(light,light*.94,light*.88);
    tips.push(u);lockIds.push(j+(mane?0:100));regions.push(mane?0:1);
   }
  }
  for(let k=0;k<steps;k++)for(let side=0;side<sides;side++){
   let a=first+k*sides+side,b=first+k*sides+(side+1)%sides;
   let c=first+(k+1)*sides+side,d=first+(k+1)*sides+(side+1)%sides;
   idx.push(a,c,b,b,c,d);
  }
 };
 for(let i=0;i<settings.maneLocks;i++)addLock(true,i,settings.maneLocks);
 for(let i=0;i<settings.tailLocks;i++)addLock(false,i,settings.tailLocks);
 const g=new THREE.BufferGeometry();g.setIndex(idx);
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skIndices,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skWeights,4));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setAttribute('groomTip',new THREE.Float32BufferAttribute(tips,1));
 g.setAttribute('groomLock',new THREE.Float32BufferAttribute(lockIds,1));
 g.setAttribute('groomTail',new THREE.Float32BufferAttribute(regions,1));
 g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}
export function createBTC3DHeroGroom(root,options={}){
 const settings={maneLocks:38,tailLocks:27,maneSize:1.3,tailSize:1.25,color:'#39231d',...options};
 settings.maneLocks=Math.round(clamp(settings.maneLocks,16,80));
 settings.tailLocks=Math.round(clamp(settings.tailLocks,12,60));
 settings.maneSize=clamp(settings.maneSize,.7,1.9);
 settings.tailSize=clamp(settings.tailSize,.7,1.9);
 const original=sourceHair(root),geometry=buildGroom(original,settings);
 const material=new THREE.MeshStandardMaterial({color:settings.color,vertexColors:true,
   side:THREE.DoubleSide,roughness:.48,metalness:0});
 const uniforms={time:{value:0},intensity:{value:.8}};
 const declarations=[
  'attribute float groomTip;',
  'attribute float groomLock;',
  'attribute float groomTail;',
  'uniform float groomTime;',
  'uniform float groomIntensity;'
 ].join('\n');
 const displacement=[
  'float rootWeight=groomTip*groomTip*(3.0-2.0*groomTip);',
  'float phase=groomTime*7.4+groomLock*1.73;',
  'float maneWave=sin(phase+groomTip*2.5)*.66+sin(phase*.71-groomTip*3.4)*.34;',
  'float tailWave=sin(groomTime*4.7+groomLock*1.13+groomTip*3.3);',
  'float drag=rootWeight*groomIntensity;',
  'transformed.x+=drag*mix(maneWave*.00065,tailWave*.00096,groomTail);',
  'transformed.y+=drag*mix(-maneWave*.00043,tailWave*.00037,groomTail);',
  'transformed.z+=drag*mix(maneWave*.00035,tailWave*.00043,groomTail);'
 ].join('\n');
 material.onBeforeCompile=shader=>{
  shader.uniforms.groomTime=uniforms.time;
  shader.uniforms.groomIntensity=uniforms.intensity;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
    '#include <common>\n'+declarations);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n'+displacement);
 };
 material.customProgramCacheKey=()=>HERO_GROOM_VERSION;
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC · hero 3D mane and tail';mesh.frustumCulled=false;
 mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);
 mesh.scale.copy(original.scale);original.parent.add(mesh);
 mesh.bind(original.skeleton,original.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(original.bindMatrixInverse);
 let disposed=false;
 return {
  get snapshot(){return {version:HERO_GROOM_VERSION,locks:settings.maneLocks+settings.tailLocks,
    maneLocks:settings.maneLocks,tailLocks:settings.tailLocks,vertices:geometry.attributes.position.count,
    modelPreserved:true,jockey:false,disposed};},
  update(dt,{wind=1,speed=1,running=true}={}){
   if(disposed)return;
   uniforms.time.value+=clamp(dt,0,.05)*(.7+.3*clamp(speed,.3,2));
   uniforms.intensity.value=running?.48+clamp(wind,0,2)*.28:.18;
  },
  setColor(color){if(!disposed)material.color.set(color);},
  dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geometry.dispose();material.dispose();}
 };
}
