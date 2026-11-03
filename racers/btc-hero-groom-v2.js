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
 // The imported Hair primitive has 126 neck vertices and 384 tail vertices.
 // Positions are model rest-space: positive Y points towards the rump,
 // and positive Z is upward. Each lock keeps the bone weights of its root.
 const pos=source.geometry.attributes.position;
 const bones=source.geometry.attributes.skinIndex;
 const weights=source.geometry.attributes.skinWeight;
 if(!bones||!weights)throw Error('Original Hair skin weights missing');
 const src=[];
 for(let i=0;i<pos.count;i++)src.push([pos.getX(i),pos.getY(i),pos.getZ(i)]);
 const verts=[],idx=[],skIndices=[],skWeights=[],colors=[],tips=[],lockIds=[],regions=[];
 const STEPS=18,SIDES=8;
 const pick=(mane,y,x,z)=>{
  let nearest=0,best=1e7;
  for(let i=0;i<src.length;i++){
   const p=src[i];if(mane?p[1]>-.0105:p[1]<.014)continue;
   const score=(p[0]-x)**2*1.25+(p[1]-y)**2*2.5+(p[2]-z)**2;
   if(score<best){best=score;nearest=i;}
  }
  return nearest;
 };
 const add=(mane,j,n,fine=false,core=false)=>{
  // Layered base/root layout, avoiding the solid row of identical tubes.
  const layers=mane?4:5;
  const slot=Math.floor(j/layers),layer=j%layers;
  const slotCount=Math.ceil(n/layers);
  const along=slot/(slotCount-1);
  const phase=RNG(j*19.13+(mane?23:41)+(fine?517:0));
  const secondary=RNG(j*7.31+233+(fine?19:0));
  const lateral=(layer-(layers-1)*.5)*(mane?.00085:.00061)+
    (phase-.5)*.00020;
  const yRoot=mane?(-.0287+.0164*along+(.5-phase)*.00045):
    (.0181+.0014*(secondary-.5));
  const zRoot=mane?(.0437-.007*along):(.0321+.0008*(secondary-.5));
  const anchor=pick(mane,yRoot,lateral,zRoot);
  const p=src[anchor];
  // The width grows from a thin root to a sculpted belly then pinches
  // to a fine, curved tip. The cross section is an elliptical lens.
  const length=(mane?.0083+.0067*phase:.0125+.0065*phase)*
     (mane?settings.maneSize:settings.tailSize)*(0.88+layer*.056)*(fine?(.83+.45*secondary):core?.80:1);
  const width=(mane?.00098:.00115)*(.81+.27*secondary)*(fine?.26:core?1.70:1);
  const root=verts.length/3;
  const rootTilt=(phase-.5)*.00055+(fine?(secondary-.5)*.00070:0);
  const bend=(mane?.0021:.0028)*(.7+phase*.6);
  for(let k=0;k<=STEPS;k++){
   const u=k/STEPS;
   const swell=Math.sin(Math.PI*u);
   const envelope=Math.max(.01,Math.sin(Math.PI*Math.pow(u,.62)))*(.85+.18*Math.sin(Math.PI*u));
   const w=width*(.22+.93*Math.min(1,u*9))*envelope;
   const x=p[0]+rootTilt*u+(mane?0:(layer-2)*.00105*u)+
     .00018*Math.sin(u*Math.PI*1.5+phase*8)*u;
   const y=p[1]+length*(u+.045*Math.sin(Math.PI*u))+
      .00014*Math.sin(Math.PI*u*1.6+phase*4);
   const z=p[2]+(mane?bend*swell+(layer-1.5)*.00048:(.0014+.001*phase)*swell)+
     (mane?(-.00105*u*u):(.00030*u-.00075*u*u))+
     .00028*Math.sin(u*TAU+secondary*6)*u;
   for(let side=0;side<SIDES;side++){
    const a=side/SIDES*TAU;
    verts.push(x+Math.cos(a)*w*.65,y+Math.sin(a)*w*.15,
      z+Math.sin(a)*w*1.18);
    for(let c=0;c<4;c++){
     // Tail uses stable rump binding: the original Tail1..7 gallop action
     // otherwise rotates the entire new groom upward like a rigid fan.
     skIndices.push(mane?bones.getComponent(anchor,c):(c===0?1:0));
     skWeights.push(mane?weights.getComponent(anchor,c):(c===0?1:0));
    }
    const ridge=(side===1||side===2)?.21:(side===5||side===6?-.08:.04);
    const tint=.76+.12*phase+.05*Math.sin(j*1.7)+
      ridge+.075*swell+(fine?.18:core?-.10:0);
    colors.push(tint*1.08,tint*.96,tint*.89);
    tips.push(u);lockIds.push(j+(mane?0:100)+(fine?300:core?600:0));regions.push(mane?0:1);
   }
  }
  for(let k=0;k<STEPS;k++)for(let a=0;a<SIDES;a++){
   const v0=root+k*SIDES+a,v1=root+k*SIDES+(a+1)%SIDES;
   const v2=root+(k+1)*SIDES+a,v3=root+(k+1)*SIDES+(a+1)%SIDES;
   idx.push(v0,v2,v1,v1,v2,v3);
  }
 };
 for(let j=0;j<settings.maneLocks;j++)add(true,j,settings.maneLocks);
 for(let j=0;j<settings.tailLocks;j++)add(false,j,settings.tailLocks);
 // Fine tapered filaments stay in the SAME skinned mesh and draw call.
 const fineMane=24,fineTail=18;
 for(let j=0;j<fineMane;j++)add(true,j,fineMane,true);
 for(let j=0;j<fineTail;j++)add(false,j,fineTail,true);
 // Swept volumetric core reduces the comb-like appearance from rear.
 const coreMane=6,coreTail=10;
 for(let j=0;j<coreMane;j++)add(true,j,coreMane,false,true);
 for(let j=0;j<coreTail;j++)add(false,j,coreTail,false,true);
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(idx);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skIndices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skWeights,4));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setAttribute('groomTip',new THREE.Float32BufferAttribute(tips,1));
 geometry.setAttribute('groomLock',new THREE.Float32BufferAttribute(lockIds,1));
 geometry.setAttribute('groomTail',new THREE.Float32BufferAttribute(regions,1));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
export function createBTC3DHeroGroom(root,options={}){
 const settings={maneLocks:52,tailLocks:35,maneSize:1.22,tailSize:1.16,color:'#45312c',...options};
 settings.maneLocks=Math.round(clamp(settings.maneLocks,16,80));
 settings.tailLocks=Math.round(clamp(settings.tailLocks,12,60));
 settings.maneSize=clamp(settings.maneSize,.7,1.9);
 settings.tailSize=clamp(settings.tailSize,.7,1.9);
 const original=sourceHair(root),geometry=buildGroom(original,settings);
 const material=new THREE.MeshPhysicalMaterial({color:settings.color,vertexColors:true,
   side:THREE.DoubleSide,roughness:.57,metalness:0,
   sheen:.75,sheenRoughness:.56,sheenColor:new THREE.Color('#996c51'),
   clearcoat:.12,clearcoatRoughness:.34});
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
  'transformed.x+=drag*mix(maneWave*.00050,tailWave*.00057,groomTail);',
  'transformed.y+=drag*mix(-maneWave*.00029,tailWave*.00026,groomTail);',
  'transformed.z+=drag*mix(maneWave*.00028,tailWave*.00030,groomTail);'
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
  get snapshot(){return {version:HERO_GROOM_VERSION,locks:settings.maneLocks+settings.tailLocks+42+16,
    maneLocks:settings.maneLocks,tailLocks:settings.tailLocks,fineManeLocks:24,fineTailLocks:18,
    coreManeLocks:6,coreTailLocks:10,
    vertices:geometry.attributes.position.count,
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
