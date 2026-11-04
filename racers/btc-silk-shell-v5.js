/**
 * Continuous silky main masses for BTC, skinned to the ORIGINAL horse skeleton.
 * Replaces the visual impression of wire-like strands with rounded tapering
 * ribbons. Fine existing V4 filaments remain underneath to show hair texture.
 * Geometry and deformation are fully procedural WebGL, never image/video cards.
 */
import * as THREE from 'three';
const PI=Math.PI,TAU=PI*2;
const smooth=v=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
const noise=n=>{const x=Math.sin(n*128.23+44.77)*43232.439;return x-Math.floor(x);};

export function createBTCSilkShell(source,{pass=10,maneSize=1.22,tailSize=1.16,color='#392722'}={},motion){
 const positions=[],indices=[],skins=[],weights=[],colors=[],tips=[],regions=[],ids=[];
 const SIDES=10,STEPS=32;
 function bindMane(s){
  const a=smooth((s-.06)/.53),b=smooth((s-.4)/.57);
  const j5=.48*b,j8=.18*(1-smooth(s/.27)),j7=.60*(1-a);
  const j6=Math.max(.02,1-j5-j7-j8),sum=j5+j6+j7+j8;
  return {bones:[5,6,7,8],weights:[j5/sum,j6/sum,j7/sum,j8/sum]};
 }
 function addLock(mane,index,count,tier,flank=1){
  const seed=noise(index*14.1+tier*115+(mane?16:234));
  const secondary=noise(index*71.7+tier*37.7+(mane?12:57));
  const f=(index+.33+.22*seed)/count;
  const tail=!mane;
  const isMain=tier===0;
  const rootY=mane?(-.0291+.0172*f):(.0188+.0009*(seed-.5));
  const rootZ=mane?(.0411-.0053*f):(.0320+.0005*(secondary-.5));
  const sk=mane?bindMane(f):{bones:[1,0,0,0],weights:[1,0,0,0]};
  const length=(mane?
    (.0116+.0038*Math.sin(PI*f))*(.92+.22*seed)*maneSize:
    (.018+.0030*seed)*tailSize)*(isMain?1:.87);
  const vWidth=(mane?.00120:.00134)*(isMain?1:.54)*(.78+.28*seed);
  const dWidth=vWidth*(mane?.63:.58);
  const start=positions.length/3;
  const id=index*1.91+tier*74.0+(mane?0:200);
  for(let n=0;n<=STEPS;n++){
   const u=n/STEPS,t=smooth(u);
   const belly=Math.pow(Math.max(0,Math.sin(PI*u)),.72);
   // Shared flowing S silhouette: a full, rounded root and feathered tips.
   const lift=mane?
    (.0023+.00065*seed)*Math.sin(PI*u)+(.00075+.0006*secondary)*t:
    (.0028+.0011*seed)*Math.sin(PI*u)+(.0057+.0007*secondary)*t;
   const curl=(mane?.00055:.0010)*t*Math.sin(u*TAU*1.05+seed*PI);
   const cy=rootY+length*(u+.055*Math.sin(PI*u))+
    .0002*t*Math.sin(id*.73);
   const cz=rootZ+lift+curl;
   const cx=mane?
    flank*(.00016+.00047*belly+.00055*t)*(tier===0?1:.75):
    (secondary-.5)*(.0014+.0028*belly)+
    .00045*t*Math.sin(index*.7+u*PI);
   const falloff=Math.pow(1-u,.41);
   const thick=(.035+.965*belly)*falloff;
   for(let side=0;side<SIDES;side++){
    const theta=TAU*side/SIDES;
    const striation=1+.024*Math.sin(side*4.17+id);
    const x=cx+dWidth*thick*Math.cos(theta)*striation;
    const z=cz+vWidth*thick*Math.sin(theta);
    positions.push(x,cy,z);
    for(let b=0;b<4;b++){skins.push(sk.bones[b]||0);weights.push(sk.weights[b]||0);}
    const ridge=Math.max(0,Math.sin(theta));
    const tint=.67+.13*seed+.11*ridge+.09*t+.035*Math.sin(index*.31+tier*3);
    colors.push(tint*1.06,tint*.98,tint*.90);
    tips.push(u);regions.push(tail?1:0);ids.push(id);
   }
  }
  for(let n=0;n<STEPS;n++)for(let side=0;side<SIDES;side++){
   const a=start+n*SIDES+side,b=start+n*SIDES+(side+1)%SIDES;
   const c=start+(n+1)*SIDES+side,d=start+(n+1)*SIDES+(side+1)%SIDES;
   indices.push(a,c,b,b,c,d);
  }
 }
 // Overlapping, staggered major locks. Never a single fan/comb.
 for(let i=0;i<17;i++){
  addLock(true,i,17,0,-1);
  addLock(true,i,17,0,1);
 }
 if(pass>=4)for(let i=0;i<22;i++)addLock(true,i,22,1,i%2?1:-1);
 if(pass>=3){
  for(let i=0;i<13;i++)addLock(false,i,13,0);
  if(pass>=4)for(let i=0;i<21;i++)addLock(false,i,21,1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(indices);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skins,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setAttribute('silkTip',new THREE.Float32BufferAttribute(tips,1));
 geometry.setAttribute('silkTail',new THREE.Float32BufferAttribute(regions,1));
 geometry.setAttribute('silkStrand',new THREE.Float32BufferAttribute(ids,1));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new THREE.MeshPhysicalMaterial({
  color,vertexColors:true,roughness:pass>=6?.52:.66,
  sheen:pass>=6?.95:.78,metalness:0,
  sheenColor:new THREE.Color('#ac7960'),sheenRoughness:.45,
  clearcoat:.025,clearcoatRoughness:.80,
  side:THREE.DoubleSide,shadowSide:THREE.DoubleSide
 });
 material.onBeforeCompile=shader=>{
  shader.uniforms.btcVMane=motion.mane;
  shader.uniforms.btcVTail=motion.tail;
  shader.uniforms.btcVClock=motion.clock;
  shader.uniforms.btcVWind=motion.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute float silkTip;\nattribute float silkTail;\nattribute float silkStrand;\nvarying vec3 vBTCSilk;\nuniform float btcVMane;\nuniform float btcVTail;\nuniform float btcVClock;\nuniform float btcVWind;');
  const deform=[
   'vBTCSilk=vec3(silkTip,silkStrand,silkTail);',
   'float tailLag=pow(smoothstep(.02,.96,silkTip),2.0);',
   'float follow=mix(btcVMane,btcVTail,silkTail);',
   'transformed.z+=follow*tailLag;',
   'transformed.y+=follow*tailLag*mix(.4,.68,silkTail);',
   'transformed.x+=follow*tailLag*.24*sin(silkStrand*.31);',
   'transformed.z+=tailLag*.000085*btcVWind*sin(btcVClock*3.1-silkTip*6.4+silkStrand*.31);'
  ].join('\n');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\n'+deform);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCSilk;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat striae=sin(vBTCSilk.y*23.7+vBTCSilk.x*91.0)*sin(vBTCSilk.y*8.2+vBTCSilk.x*37.0);\ndiffuseColor.rgb*=mix(.75,1.02,smoothstep(.0,.42,vBTCSilk.x))*(.975+.045*striae);');
 };
 material.customProgramCacheKey=()=>String(pass)+'|btc-silk-shell-v5';
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC V5 continuous silky lock masses';
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 let disposed=false;
 return {
  vertexCount:positions.length/3,lockCount:pass>=4?90:pass>=3?47:34,
  dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geometry.dispose();material.dispose();}
 };
}
