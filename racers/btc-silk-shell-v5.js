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
 const SIDES=10,STEPS=38;
 const quality={majorMane:0,detailMane:0,majorTail:0,detailTail:0};
 // The GLB already carries a fully animated seven-bone tail rig. The old
 // procedural groom accidentally weighted EVERY tail strand to Back (joint 1).
 // Follow the actual authored Tail1..Tail7 chain instead: the imported
 // Gallop's tail swing now propagates gradually through the new hair masses.
 const tailBones=Array.from({length:7},(_,index)=>
  source.skeleton.bones.findIndex(b=>b.name==='Tail'+(index+1)));
 if(tailBones.some(index=>index<0))
  throw new Error('BTC V5 requires original GLB Tail1..Tail7 skin joints');
 function bindTail(u){
  // Blend two adjacent joints to prevent a hinge between each pair.
  // Smoothstep delays influence near the dock, keeping roots anchored.
  const a=smooth(u)*5.99999;
  const i=Math.min(5,Math.floor(a)),blend=a-i;
  // The GLB's authored Gallop already swishes the tail aggressively.
  // Transfer only part of that motion from the seven native joints;
  // the stable back anchor avoids the vertical tail-flip artifact.
  const rigInfluence=.13+.12*smooth(u);
  return {bones:[1,tailBones[i],tailBones[i+1],0],
   weights:[1-rigInfluence,rigInfluence*(1-blend),rigInfluence*blend,0]};
 }
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
  const rootY=mane?(-.0291+.0172*f):(.01640+.00036*(seed-.5));
  const rootZ=mane?(.0411-.0053*f):(.03060+.00030*(secondary-.5));
  const maneSkin=mane?bindMane(f):null;
  // A deliberate silhouette change: full athletic crest and a long weighted
  // tail, rather than the short V5 tubes. All lengths remain in GLB rest space.
  const length=(mane?
    (.0109+.0035*Math.sin(PI*f))*(.88+.26*seed)*maneSize:
    (.0230+.0053*seed)*tailSize)*(isMain?1:.80);
  const vWidth=(mane?.00061:.00086)*(isMain?1:.50)*(.79+.30*seed);
  const dWidth=vWidth*(mane?.54:.65);
  if(mane){if(isMain)quality.majorMane++;else quality.detailMane++;}
  else{if(isMain)quality.majorTail++;else quality.detailTail++;}
  const start=positions.length/3;
  const id=index*1.91+tier*74.0+(mane?0:200);
  for(let n=0;n<=STEPS;n++){
   const u=n/STEPS,t=smooth(u);
   const sk=mane?maneSkin:bindTail(u);
   const belly=Math.pow(Math.max(0,Math.sin(PI*u)),.72);
   // Shared flowing S silhouette: a full, rounded root and feathered tips.
   // Root anchoring is exact; successive sections gather into coherent locks.
   // Large low-frequency bends build shape; higher-frequency wisps are secondary.
   const lift=mane?
    (.0017+.0006*seed)*Math.sin(PI*u)+(.0010+.0006*secondary)*t:
    (.00165+.00075*seed)*Math.sin(PI*u)+(.0022+.00085*secondary)*t;
   const wave=.00070*Math.sin(u*TAU*.92+seed*PI*1.4)*t*t;
   const curl=(mane?.00062:.00125)*t*Math.sin(u*TAU*1.05+seed*PI);
   const cy=rootY+length*(u+.080*Math.sin(PI*u))+
    .00055*t*Math.sin(id*.73);
   // Rest-pose tail follows a descending arc, rather than flaring upward.
   // Match the original GLB tail's downward sweep while the native tail rig
   // provides secondary swish through limited, distributed skin weights.
   const cz=rootZ+lift+curl+wave-(mane?.00074*t*t:.0106*t);
   const cx=mane?
    flank*(.00018+.00047*belly+.00112*t*t)*(tier===0?1:.78):
    (secondary-.5)*(.0014+.0045*belly)+
    .00088*t*Math.sin(index*.7+u*PI);
   const falloff=Math.pow(1-u,.93);
   const thick=(.15+.85*Math.pow(belly,.73))*falloff;
   for(let side=0;side<SIDES;side++){
    const theta=TAU*side/SIDES;
    const striation=1+.024*Math.sin(side*4.17+id);
    const x=cx+dWidth*thick*Math.cos(theta)*striation;
    const z=cz+vWidth*thick*Math.sin(theta);
    positions.push(x,cy,z);
    for(let b=0;b<4;b++){skins.push(sk.bones[b]||0);weights.push(sk.weights[b]||0);}
    const ridge=Math.max(0,Math.sin(theta));
    const tint=.66+.16*seed+.12*ridge+.10*t+.045*Math.sin(index*.31+tier*3);
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
 for(let i=0;i<24;i++){
  addLock(true,i,24,0,-1);
  addLock(true,i,24,0,1);
 }
 // Feathered side layers blend into a solid neck silhouette, not a comb.
 if(pass>=4)for(let i=0;i<52;i++)addLock(true,i,52,1,i%2?1:-1);
 if(pass>=3){
  for(let i=0;i<22;i++)addLock(false,i,22,0);
  if(pass>=4)for(let i=0;i<36;i++)addLock(false,i,36,1);
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
  color,vertexColors:true,roughness:pass>=6?.70:.76,
  sheen:pass>=6?.50:.46,metalness:0,
  sheenColor:new THREE.Color('#a98168'),sheenRoughness:.57,
  clearcoat:.018,clearcoatRoughness:.82,
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
   'float bend=pow(smoothstep(.025,.96,silkTip),1.68);',
   'float follow=mix(btcVMane,btcVTail,silkTail);',
   'float travel=btcVClock*mix(4.9,3.25,silkTail)-silkTip*mix(5.8,8.8,silkTail);',
   'float waveA=sin(travel+silkStrand*.35);',
   'float waveB=sin(travel*1.7+silkStrand*.81);',
   'float strandVariation=.69+.31*sin(silkStrand*.23);',
   'transformed.z+=bend*(follow*mix(1.3,1.9,silkTail)+btcVWind*mix(.00035,.00067,silkTail)*waveA*strandVariation);',
   'transformed.y+=bend*(follow*mix(.35,.62,silkTail)+btcVWind*.00017*waveB);',
   'transformed.x+=bend*(follow*.38*sin(silkStrand*.31)+btcVWind*mix(.00018,.00043,silkTail)*waveB);'
  ].join('\n');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\n'+deform);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCSilk;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat striae=sin(vBTCSilk.y*23.7+vBTCSilk.x*91.0)*sin(vBTCSilk.y*8.2+vBTCSilk.x*37.0);\ndiffuseColor.rgb*=mix(.78,1.055,smoothstep(.0,.47,vBTCSilk.x))*(.970+.055*striae);');
 };
 material.customProgramCacheKey=()=>String(pass)+'|btc-silk-shell-v5-attached-v4';
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC V5 continuous silky lock masses';
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 let disposed=false;
 return {
  vertexCount:positions.length/3,lockCount:quality.majorMane+quality.detailMane+quality.majorTail+quality.detailTail,
  nativeTailBones:tailBones.length,
  quality,
  setColor(value){if(!disposed&&/^#[0-9a-f]{6}$/i.test(value))material.color.set(value);},
  dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geometry.dispose();material.dispose();}
 };
}
