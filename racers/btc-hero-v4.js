/**
 * BTC horse hero v4: real, animated WebGL geometry, not generated artwork.
 * A BTC-only anatomical sculpt, dense flowing groom and directional coat.
 * Keeps the imported skeleton, authored Gallop and all other tokens intact.
 */
import * as THREE from 'three';
export const BTC_HERO_V4='btc-real-hero-v4-20261103';
const PI=Math.PI,TAU=2*PI;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
const wave=(v)=>Math.sin(v), smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const gauss=(x,c,r)=>Math.exp(-Math.pow((x-c)/r,2));
const fract=(n)=>n-Math.floor(n);
const rand=(n)=>fract(Math.sin(n*125.67+19.43)*43578.33);

function locate(root) {
 let hair=null;
 const coats=[];
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  const mats=[m.material].flat();
  if(!hair&&m.geometry?.attributes?.position?.count>=300&&mats.some(t=>t?.name==='Hair'))hair=m;
  if(mats.some(t=>t?.name==='Main'||t?.name==='Main_Light'))coats.push(m);
 });
 if(!hair?.geometry?.attributes?.skinIndex||!hair.geometry.attributes.skinWeight)
  throw new Error('BTC V4: animated original Hair primitive not found');
 return {hair,coats};
}

function makeCoat(root,coats) {
 const originals=[],materials=new Set(),quality=[];
 for(const mesh of coats){
  const original=mesh.geometry;
  const copy=original.clone();
  const pos=copy.attributes.position;
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
   // Athletic shoulder and gluteal silhouettes. The source rig is preserved.
   const shoulder=gauss(y,-.014,.007)*gauss(z,.028,.016);
   const rump=gauss(y,.012,.008)*gauss(z,.024,.018);
   const back=gauss(y,.000,.013)*gauss(z,.038,.008);
   const throat=gauss(y,-.024,.006)*gauss(z,.035,.008);
   const breadth=1+.11*shoulder+.16*rump+.05*back;
   let xx=x*breadth;
   let yy=y,zz=z+.00036*back+.00025*rump+.00025*throat;
   // The muzzle reads less square from profile; do not deform eyes or ears.
   const nose=gauss(y,-.0335,.0031)*gauss(z,.036,.0045);
   yy-=.00050*nose;
   pos.setXYZ(i,xx,yy,zz);
  }
  // Preserve the GLB's angle-weighted smoothed normals; recalculating after
  // separating skin triangles makes the entire horse look faceted.
  pos.needsUpdate=true;copy.computeBoundingSphere();
  mesh.geometry=copy;originals.push({mesh,original,copy});
  for(const m of [mesh.material].flat()){
   if(!m||materials.has(m))continue;
   materials.add(m);
   quality.push({material:m,roughness:m.roughness,metalness:m.metalness,
     onBeforeCompile:m.onBeforeCompile,customProgramCacheKey:m.customProgramCacheKey});
   m.metalness=0;m.roughness=m.name==='Main'?.60:.68;
   const previous=m.onBeforeCompile;
   const oldKey=m.customProgramCacheKey?.bind(m);
   m.onBeforeCompile=function(shader,renderer){
    previous?.call(this,shader,renderer);
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vBTCHeroObject;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvBTCHeroObject=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vBTCHeroObject;');
    const grain=[
      'float crpFiber=sin(vBTCHeroObject.y*11700.0+vBTCHeroObject.z*2250.0)*sin(vBTCHeroObject.x*9100.0-vBTCHeroObject.y*1970.0);',
      'float crpColorBreak=sin(vBTCHeroObject.y*830.0+sin(vBTCHeroObject.z*390.0))*sin(vBTCHeroObject.x*650.0+vBTCHeroObject.z*380.0);',
      'float crpDust=fract(sin(dot(floor(vBTCHeroObject*2100.0),vec3(17.1,79.7,31.3)))*45758.5);',
      'diffuseColor.rgb*=clamp(.98+.022*crpFiber+.037*crpColorBreak+.023*(crpDust-.5),.90,1.08);'
    ].join('\n');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n'+grain);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+.036*crpColorBreak+.022*crpFiber,.44,.89);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
      '#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(crpFiber*.007,crpColorBreak*.005,crpFiber*.005));');
   };
   m.customProgramCacheKey=()=>String(oldKey?.()||'')+'|'+BTC_HERO_V4;
   m.needsUpdate=true;
  }
 }
 return {
  count:originals.length,
  dispose(){for(const {mesh,original,copy} of originals){mesh.geometry=original;copy.dispose();}
   for(const old of quality){const m=old.material;m.roughness=old.roughness;m.metalness=old.metalness;m.onBeforeCompile=old.onBeforeCompile;m.customProgramCacheKey=old.customProgramCacheKey;m.needsUpdate=true;}}
 };
}

function createGroomGeometry(maneSize,tailSize){
 const xyz=[],joint=[],weight=[],tint=[],along=[],strandId=[],area=[],tri=[];
 const SIDES=6,SEG=25;
 const neckSkin=(s)=>{
  const a=smooth((s-.06)/.53),b=smooth((s-.40)/.57);
  const j5=.48*b,j8=.18*(1-smooth(s/.27)),j7=.60*(1-a);
  const j6=Math.max(.02,1-j5-j8-j7),sum=j5+j6+j7+j8;
  return {bones:[5,6,7,8],weights:[j5/sum,j6/sum,j7/sum,j8/sum]};
 };
 function vertex(x,y,z,sk,u,id,tail,light){
  const n=xyz.length/3;xyz.push(x,y,z);
  for(let k=0;k<4;k++){joint.push(sk.bones[k]||0);weight.push(sk.weights[k]||0);}
  const high=clamp(light,.40,1.25);
  tint.push(high*1.04,high*.95,high*.85);
  along.push(u);strandId.push(id);area.push(tail?1:0);
  return n;
 }
 function lock(mane,index,count,layer,flank=1){
  const p=rand(index*3.19+layer*37+(mane?5:91));
  const q=rand(index*9.91+layer*18+(mane?13:82));
  const golden=fract(index*.6180339887+layer*.173);
  const s=(index+.35+.26*q)/count;
  const rootY=mane?(-.0292+.01765*s):(.0190+.00068*(q-.5));
  const rootZ=mane?(.0408-.0051*s+.00013*wave(PI*s)):(.0321+.00042*(p-.5));
  const sk=mane?neckSkin(s):{bones:[1,0,0,0],weights:[1,0,0,0]};
  const isHero=layer===0,isFine=layer===2;
  const vol=isHero?1.0:isFine?.15:.43;
  const length=mane?
    (.010+.0026*wave(PI*s))*(.77+.35*p)*maneSize*(isFine?.91:isHero?1.16:1):
    (.025+.0060*p)*tailSize*(isFine?.86:isHero?1.08:1);
  const radius=(mane?.00073:.00087)*vol*(.78+.3*q);
  const start=xyz.length/3;
  const side=flank;
  const id=(mane?0:280)+index*1.37+layer*81;
  const twist=TAU*(p-.5);
  for(let step=0;step<=SEG;step++){
   const u=step/SEG,belly=Math.pow(Math.max(0,wave(PI*u)),.75);
   const strandLift=wave(PI*u)*(.0017+.0008*q);
   const tailArc=wave(PI*u)*(.0026+.0014*q);
   let cx,cy,cz;
   if(mane){
    cy=rootY+length*(Math.pow(u,.94)+.05*wave(PI*u));
    cz=rootZ+strandLift-(.0010+.0009*q)*u*u+
      .00043*wave(u*PI*1.7+twist)*u*u;
    cx=side*(.00017+.00032*belly)+side*(.0007+.00055*p)*u*u;
   }else{
    cy=rootY+length*u+.0011*wave(u*PI*1.3+twist)*u*u;
    cz=rootZ+tailArc-.0041*u+
      .0010*wave(PI*2*u+twist)*u*u;
    cx=(golden-.5)*(.0019+.0062*belly)*tailSize+
      .0011*wave(u*PI*1.4+twist)*u*u;
   }
   const w=radius*(.07+.95*belly)*Math.pow(1-u,.30);
   const depth=radius*(.10+.73*belly)*Math.pow(1-u,.30);
   for(let sideId=0;sideId<SIDES;sideId++){
    const theta=TAU*sideId/SIDES;
    const detail=.88+.12*wave(theta*3+id);
    const x=cx+Math.cos(theta)*w*detail;
    const y=cy+.00007*wave(theta*2+id)*belly;
    const z=cz+Math.sin(theta)*depth*detail;
    const sheen=.72+.15*p+.11*Math.max(0,Math.sin(theta))+.08*(isFine?1:0)
      +.05*wave(index*3.16+layer);
    vertex(x,y,z,sk,u,id,mane?0:1,sheen);
   }
  }
  for(let k=0;k<SEG;k++)for(let j=0;j<SIDES;j++){
   const a=start+k*SIDES+j,b=start+k*SIDES+(j+1)%SIDES,
   c=start+(k+1)*SIDES+j,d=start+(k+1)*SIDES+(j+1)%SIDES;
   tri.push(a,c,b,b,c,d);
  }
 }
 // Large forms establish silhouette; lower layers create actual fine strands.
 for(let i=0;i<28;i++){lock(true,i,28,0,1);lock(true,i,28,0,-1);}
 for(let i=0;i<90;i++){lock(true,i,90,1,1);lock(true,i,90,1,-1);}
 for(let i=0;i<135;i++){lock(true,i,135,2,i%2?1:-1);}
 for(let i=0;i<24;i++)lock(false,i,24,0);
 for(let i=0;i<95;i++)lock(false,i,95,1);
 for(let i=0;i<130;i++)lock(false,i,130,2);
 const g=new THREE.BufferGeometry();
 g.setIndex(tri);
 g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joint,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
 g.setAttribute('color',new THREE.Float32BufferAttribute(tint,3));
 g.setAttribute('hairTip',new THREE.Float32BufferAttribute(along,1));
 g.setAttribute('hairStrand',new THREE.Float32BufferAttribute(strandId,1));
 g.setAttribute('hairTail',new THREE.Float32BufferAttribute(area,1));
 g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}

export function createBTCHeroV4(root,options={}){
 const {hair,coats}=locate(root);
 const maneSize=clamp(options.maneSize??1.22,.65,1.85);
 const tailSize=clamp(options.tailSize??1.16,.65,1.85);
 const geometry=createGroomGeometry(maneSize,tailSize);
 const coat=makeCoat(root,coats);
 const material=new THREE.MeshPhysicalMaterial({
  color:options.color||'#372522',vertexColors:true,roughness:.62,
  sheen:.76,sheenColor:new THREE.Color('#b58763'),sheenRoughness:.64,
  metalness:0,clearcoat:.025,clearcoatRoughness:.86,
  side:THREE.DoubleSide,shadowSide:THREE.DoubleSide
 });
 const motion={time:{value:0},wind:{value:.7}};
 material.onBeforeCompile=shader=>{
  shader.uniforms.heroTime=motion.time;shader.uniforms.heroWind=motion.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute float hairTip;\nattribute float hairStrand;\nattribute float hairTail;\nvarying vec3 vHair;\nuniform float heroTime;\nuniform float heroWind;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvHair=vec3(hairTip,hairStrand,hairTail);\nfloat lag=hairTip*hairTip*(3.0-2.0*hairTip)*heroWind;\nfloat flutter=sin(heroTime*6.2-hairTip*8.4-hairStrand*1.7);\nfloat drift=sin(heroTime*3.7-hairTip*4.9+hairStrand*.91);\ntransformed.x+=lag*mix(flutter*.00022,drift*.00067,hairTail);\ntransformed.z+=lag*mix(drift*.00031,flutter*.00047,hairTail);\ntransformed.y+=lag*mix(flutter*.00017,drift*.00026,hairTail);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vHair;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat fine=sin(vHair.y*17.9+vHair.x*63.0)*sin(vHair.y*9.7-vHair.x*109.0);\nfloat rootShade=mix(.67,1.03,smoothstep(.01,.42,vHair.x));\ndiffuseColor.rgb*=rootShade*(.955+.066*fine);');
 };
 material.customProgramCacheKey=()=>BTC_HERO_V4;
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC real hero V4 silky mane and tail';
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.position.copy(hair.position);mesh.quaternion.copy(hair.quaternion);mesh.scale.copy(hair.scale);
 hair.parent.add(mesh);
 mesh.bind(hair.skeleton,hair.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(hair.bindMatrixInverse);
 const previouslyVisible=hair.visible;hair.visible=false;
 let disposed=false;
 return {
  get snapshot(){return {version:BTC_HERO_V4,modelPreserved:true,
   gallopPreserved:true,oldHairHidden:!hair.visible,vertices:geometry.attributes.position.count,
   sculptedBodyParts:coat.count,animatedHair:true,drawCallsAdded:1,disposed};},
  update(dt,{wind=1,speed=1,running=true}={}){
   if(disposed)return;
   motion.time.value+=clamp(dt,0,.05)*(.7+.3*clamp(speed,.4,2));
   motion.wind.value=(running?.56:.12)+.3*clamp(wind,0,2);
  },
  setColor(value){if(!disposed)material.color.set(value);},
  dispose(){
   if(disposed)return;disposed=true;
   hair.visible=previouslyVisible;
   mesh.removeFromParent();geometry.dispose();material.dispose();coat.dispose();
  }
 };
}
