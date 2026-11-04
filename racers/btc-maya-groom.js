/**
 * BTC Maya groom: rounded procedural strands + scalp bed on the original
 * 2017 Maya skinned horse. Shorter rooted crest removes loose neck filaments;
 * procedural cuticle grain restores detail without hundreds of dangling fibers.
 */
import * as THREE from 'three';
import {createBTCTailSpring} from './btc-maya-tail-spring.js?v=btc-face-poll-tail-20261104-v15';
const PI=Math.PI,TAU=2*PI;
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const noise=n=>{const x=Math.sin(n*73.2271+14.91)*34987.2;return x-Math.floor(x);};
const TOPLINE=[
 [-.0290,.04555],[-.026,.04510],[-.023,.0445],
 [-.020,.04285],[-.017,.0409],[-.014,.0392],
 [-.011,.0374],[-.008,.0355],[-.005,.0340],[-.003,.0337]
];
function crest(y) {
 if(y<=TOPLINE[0][0])return TOPLINE[0][1];
 for(let i=1;i<TOPLINE.length;i++){
  const a=TOPLINE[i-1],b=TOPLINE[i];
  if(y<=b[0]){
   const t=smooth((y-a[0])/(b[0]-a[0]));
   return a[1]*(1-t)+b[1]*t;
  }
 }
 return TOPLINE.at(-1)[1];
}
function attach(source,geometry,material,name){
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name=name;
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);
 mesh.bindMode=source.bindMode;
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
 return mesh;
}
function createHairMass(source,skinAt,{
 tail,majorCount,fineCount,size,color,motion
}){
 const positions=[],colors=[],tip=[],ids=[],region=[],bones=[],weights=[],indices=[];
 // More independent roots, fewer segments/card: better silhouette and lower GPU cost.
 const ROWS=20,SIDES=6;
 const total=majorCount+fineCount;
 let strandCount=0,neckOutliers=0;
 const headJoint=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(!tail&&headJoint<0)throw Error('BTC Maya mane needs original Head joint');
 // Reuse the native animated Tail1..Tail7 skeleton: every hair root remains
 // attached to the croup, with an increasingly light secondary tail chain
 // influence toward the ends. Never overwrite Gallop bone rotations.
 const tailJoints=tail?Array.from({length:7},(_,i)=>
  source.skeleton.bones.findIndex(b=>b.name==='Tail'+(i+1))):[];
 if(tail&&tailJoints.some(i=>i<0))throw Error('BTC Maya tail requires native Tail1..Tail7');
 function skinFor(sk,u){
  if(!tail)return sk;
  const stretch=smooth(u)*5.99999,j=Math.min(5,Math.floor(stretch)),mix=stretch-j;
  const follow=.06+.16*smooth(u);
  const rootIndex=sk.joints[0],rootWeight=sk.weights[0];
  const followA=tailJoints[j],followB=tailJoints[j+1];
  // Keep headroom for blending with the existing croup influence.
  return {joints:[rootIndex,followA,followB,sk.joints[1]||0],
   weights:[(1-follow)*rootWeight,follow*(1-mix),follow*mix,
    (1-follow)*(1-rootWeight)]};
 }
 function guide(n,major,side,forelock=false,crown=false,hero=false){
  const seed=noise(n*13.7+(tail?141:27)+(side+3)*53.5+(major?3:17));
  const crossSeed=noise(n*7.03+(tail?47:3)+(side+1)*33.4);
  // A bilateral crest gets HALF the roots on each side. Using the full
  // count in this denominator cropped the mane to its FRONT HALF.
  const f=(n+.37+.24*seed)/(forelock?(major?6:14):crown?(major?14:42):hero?28:
   (tail?(major?majorCount:fineCount):(major?majorCount/2:fineCount/2)));
  const root=tail?
   [(seed-.5)*.00056,.01472+.00084*crossSeed,.03195-.00047*seed]:
   forelock?
    [side*(.00010+.00025*seed),-.02765+.00070*f,.04575-.00010*seed]:
   crown?
    [side*(.00010+.00034*crossSeed),-.02755+.00310*f,
     crest(-.02755+.00310*f)+.00022]:
   hero?
    [side*.00013,-.02635+.01510*f,crest(-.02635+.01510*f)+.00016]:
    [side*.00011,-.02625+.02185*f,crest(-.02625+.02185*f)+.00012];
  // The crown shares Head weights with the forelock: no visible separation when nodding.
  const sk=(forelock||crown)?
   {joints:[headJoint,0,0,0],weights:[1,0,0,0]}:
   skinAt(...root);
  const id=++strandCount;
  // Physically plausible hair: shorter layered crest, tapered fine fibers and
  // a weighted tail fan. Previous groom was an oversized solid brown curtain.
  const length=(forelock
   ?(major?.00155+.00052*seed:.00110+.00065*seed)
   :crown
    ?(major?.00255+.00125*seed:.00210+.00105*seed)
   :hero
    ?(.00435+.00165*seed)
   :tail
    ?(major?.021+.011*seed:.015+.013*seed)
    :(major?.0072+.0032*seed:.0040+.0025*seed))*
      size*(tail||forelock||crown||hero?1:(.70+.30*smooth(f/.29))*clamp((-.0038-root[1])/.008,.15,1));
  const breadth=(tail
   ?(major?.00070+.00032*seed:.000100+.000085*seed)
   :hero?(.00108+.00044*seed)
   :(major?.00092+.00035*seed:.000080+.000095*seed));
  const base=positions.length/3;
  function point(t,cross,ribbon){
   const t2=smooth(t),w=Math.pow(1-t,.81)*(0.72+0.28*Math.sin(PI*t));
   let x,y,z;
   if(crown){
    // Continuous raised scalp bridge between the ears, from forelock to mane.
    // Root vertices live near the crest and never become floating side wisps.
    const cy=Math.min(-.0236,root[1]+length*(.72*t+.28*t2));
    x=root[0]+side*(.00009*t+.00049*t2)+side*.00007*Math.sin(PI*t+seed);
    y=cy;
    z=crest(cy)+.00022+.00082*Math.sin(PI*t)*(.64+.36*seed)-.00020*t2;
    if(ribbon===0)z+=cross*breadth*.59*w;
    else x+=side*cross*breadth*.32*w;
   }else if(hero){
    // Three-dimensional sculpted locks fly behind the poll above the coat.
    // Every guide has a different arch and a naturally tapering lifted tip.
    const flow=t*.72+.28*t2;
    const cy=Math.min(-.00455,root[1]+length*flow);
    const arch=(.00130+.00048*seed)*Math.sin(PI*t);
    const tipRise=.00018*t2*t2*(.7+.3*seed);
    x=root[0]+side*(.00010+(.00046+.00018*seed)*t2);
    y=cy+.00015*Math.sin(PI*t)*(seed-.5);
    z=crest(cy)+.00016+arch+tipRise+
      .00023*Math.sin(PI*2.5*t+seed*5)*t2;
    if(ribbon===0)z+=cross*breadth*.42*w;
    else x+=side*cross*breadth*.52*w;
   }else if(forelock){
    // True short forelock between the pinnae, rooted to the existing head
    // and tapered downward onto the forehead, not a mesh glued in screen space.
    x=root[0]+side*(.00015+.00018*seed)*t2;
    y=root[1]-(.00060+.00020*seed)*t;
    z=root[2]-length*(.72*t+.28*t2);
    if(ribbon===0)x+=cross*breadth*.55*w;
    else y+=cross*breadth*.35*w;
   }else if(tail){
    // Root-to-tip ballistic shape: long independent wave paths, no rigid fan.
    const flow=t*.68+.32*t2;
    const stream=Math.pow(t,1.45);
    const twist=Math.sin(PI*(2.2*t+.25*seed)+seed*TAU)*stream;
    const flutter=Math.sin(TAU*(2.1*t+.17*seed))*stream;
    x=root[0]+(seed-.5)*(.0060*flow+.0075*stream)+
      (.0007+.0005*crossSeed)*twist;
    y=root[1]+length*(.70*t+.28*t2)+
      (.0008+.0005*seed)*Math.sin(PI*t)+.0010*flutter;
    z=root[2]-(.0029+.43*length)*flow+
      (.0018+.0020*seed)*Math.sin(PI*t)+
      (crossSeed-.5)*.008*stream+
      (.0008+.0012*seed)*flutter;
    if(ribbon===0)x+=cross*breadth*w;
    else z+=cross*breadth*.42*w;
   }else{
    // A true swept crest: hairs grow backward along the mane, close to
    // the neck. They do not fall vertically over the cheek and shoulders.
    const rearward=t*.70+.30*t2;
    // Keep the ribbons on the anatomical neck instead of trailing into the shoulder.
    const cy=root[1]+Math.min(length,Math.max(0,-.00455-root[1]))*rearward;
    const neckZ=crest(cy);
    // The large, smooth "calligraphic" mane is made of feathered layers:
    // it starts on the poll, flows down the full neck and finishes in
    // overlapping tapered curls. Stronger silhouette, fewer dark wires.
    const lift=(.00135+.00115*seed)*Math.sin(PI*t);
    const drape=(.00008+.00011*seed)*t2;
    const outward=(.00018+.00040*seed)*(.25*rearward+.75*t2);
    const curl=Math.sin(TAU*(1.25*t+.20*seed))*t2;
    x=root[0]+side*(outward+.00021*Math.sin(PI*t)+.00019*curl);
    y=Math.min(-.00455,cy+.00024*Math.sin(PI*t*1.2+seed*2.8)*t2);
    z=neckZ+.00022+lift-drape+
       (.00032+.00035*seed)*curl;
    if(ribbon===0)z+=cross*breadth*w;
    else x+=side*cross*breadth*.50*w;
    // Physically trim low fibers: no alpha masking or recoloring.
    z=Math.max(z,crest(y)+.000035);
   }
   return [x,y,z];
  }
  // Smooth solid locks, generated by code as skinned ring lofts. The former
  // crossed flat cards were responsible for wire wisps and sharp ribbons.
  const radiusBase=tail?(major?.000160+.000060*seed:.000030):
   hero?(.000099+.000045*seed):
   crown?(major?.000105:.000030):
   forelock?(major?.000085:.000028):
   (major?.000097+.000041*seed:.000027);
  for(let row=0;row<=ROWS;row++){
   const u=row/ROWS,c=point(u,0,0);
   const before=point(Math.max(0,u-.013),0,0);
   const after=point(Math.min(1,u+.013),0,0);
   let tx=after[0]-before[0],ty=after[1]-before[1],tz=after[2]-before[2];
   const tLength=Math.hypot(tx,ty,tz)||1;
   tx/=tLength;ty/=tLength;tz/=tLength;
   const rx=Math.abs(tz)>.93?1:0,ry=0,rz=Math.abs(tz)>.93?0:1;
   let ax=ty*rz-tz*ry,ay=tz*rx-tx*rz,az=tx*ry-ty*rx;
   const aLength=Math.hypot(ax,ay,az)||1;
   ax/=aLength;ay/=aLength;az/=aLength;
   const bx=ty*az-tz*ay,by=tz*ax-tx*az,bz=tx*ay-ty*ax;
   const radius=radiusBase*Math.pow(1-u,.77)+.000003;
   for(let col=0;col<SIDES;col++){
    const angle=TAU*col/SIDES,cs=Math.cos(angle),sn=Math.sin(angle);
    const v=[c[0]+radius*(ax*cs+bx*sn),
     c[1]+radius*(ay*cs+by*sn),
     c[2]+radius*(az*cs+bz*sn)];
    if(!tail&&!forelock&&(v[1]>-.00379||v[2]<crest(v[1])-.00235))neckOutliers++;
    positions.push(...v);
    // Subtle warm/chocolate strand-level variation, no toy-plastic uniform mass.
    const tint=(.88+.16*seed+.046*(1-u));
    const low=.95+.045*noise(id*2.49);
    colors.push(tint*1.10,tint*.99*low,tint*.91*low);
    tip.push(u);ids.push(id*1.71);region.push(tail?1:0);
    const skin=skinFor(sk,u);
    for(let k=0;k<4;k++){
     bones.push(skin.joints[k]||0);weights.push(skin.weights[k]||0);
    }
   }
  }
  for(let row=0;row<ROWS;row++)for(let col=0;col<SIDES;col++){
   const a=base+row*SIDES+col,b=base+row*SIDES+(col+1)%SIDES;
   const c=a+SIDES,d=b+SIDES;
   indices.push(a,c,b,b,c,d);
  }
 }
 if(!tail){
  // Both sides of the crest have their own overlapping hair masses.
  for(const side of [-1,1]){
   for(let n=0;n<majorCount/2;n++)guide(n,true,side);
   for(let n=0;n<fineCount/2;n++)guide(n,false,side);
   for(let n=0;n<14;n++)guide(n,true,side,false,true);
   for(let n=0;n<42;n++)guide(n,false,side,false,true);
   for(let n=0;n<28;n++)guide(n,true,side,false,false,true);
   for(let n=0;n<6;n++)guide(n,true,side,true);
   for(let n=0;n<14;n++)guide(n,false,side,true);
  }
 }else{
  for(let n=0;n<majorCount;n++)guide(n,true,1);
  for(let n=0;n<fineCount;n++)guide(n,false,1);
 }
 // A smooth, skinned root bed closes gaps between the forehead, ear roots
 // and mane. Sculpted cross-sections remain below the individual flowing
 // locks, not a floating billboard or a flat solid curtain.
 let rootBedVertices=0;
 if(!tail){
  const bedRows=44,bedWidth=10,bedBase=positions.length/3;
  for(let row=0;row<=bedRows;row++){
   const t=row/bedRows,y=-.02755+.0230*t;
   const fullness=.42+.58*Math.sin(PI*Math.pow(t,.75));
   const halfWidth=.00062+.00049*fullness;
   for(let col=0;col<=bedWidth;col++){
    const across=col/bedWidth*2-1;
    const sideRound=Math.sqrt(Math.max(0,1-across*across));
    const x=across*halfWidth;
    const pollBlend=1-smooth((y+.0250)/.0065);
    const z=crest(y)-.00036+
      (.00020+.00048*fullness)*sideRound*pollBlend+
      .00004*Math.sin(12*PI*t+across*2)*sideRound*pollBlend;
    positions.push(x,y,z);
    colors.push(.96+.06*sideRound,.92+.07*sideRound,.89+.07*sideRound);
    tip.push(0);ids.push(0);region.push(0);
    // Gently transfer the bed from the Head to the native neck skeleton.
    const blend=smooth((y+.0271)/.0049);
    const native=skinAt(x,y,z),sums=new Map([[headJoint,1-blend]]);
    for(let k=0;k<4;k++){
     const joint=native.joints[k]||0,weight=(native.weights[k]||0)*blend;
     sums.set(joint,(sums.get(joint)||0)+weight);
    }
    const top=[...sums].sort((a,b)=>b[1]-a[1]).slice(0,4);
    const sum=top.reduce((n,p)=>n+p[1],0)||1;
    for(let k=0;k<4;k++){
     bones.push(top[k]?.[0]||0);
     weights.push((top[k]?.[1]||0)/sum);
    }
    rootBedVertices++;
   }
  }
  for(let row=0;row<bedRows;row++)for(let col=0;col<bedWidth;col++){
   const a=bedBase+row*(bedWidth+1)+col,b=a+1,
     c=a+bedWidth+1,d=c+1;
   indices.push(a,c,b,b,c,d);
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indices);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setAttribute('mayaHairTip',new THREE.Float32BufferAttribute(tip,1));
 geo.setAttribute('mayaHairId',new THREE.Float32BufferAttribute(ids,1));
 geo.setAttribute('mayaHairTail',new THREE.Float32BufferAttribute(region,1));
 geo.computeVertexNormals();geo.computeBoundingSphere();
 const mat=new THREE.MeshPhysicalMaterial({
  name:tail?'BTC tail - tapered layered hair':'BTC neck mane - feathered layers',
  color,vertexColors:true,metalness:0,roughness:tail?.84:.86,
  sheen:.095,sheenColor:new THREE.Color('#4b3d37'),
  sheenRoughness:.92,clearcoat:0,side:THREE.DoubleSide
 });
 mat.onBeforeCompile=shader=>{
  shader.uniforms.mayaTime=motion.time;
  shader.uniforms.mayaWind=motion.wind;
  shader.uniforms.mayaGait=motion.gait;
  shader.uniforms.mayaTailSway=motion.tailSway;
  shader.uniforms.mayaTailLift=motion.tailLift;
  shader.uniforms.mayaTailFlutter=motion.tailFlutter;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   `#include <common>
attribute float mayaHairTip;
attribute float mayaHairId;
attribute float mayaHairTail;
varying vec2 vMayaHair;
varying vec3 vMayaHairRest;
uniform float mayaTime;
uniform float mayaWind;
uniform float mayaGait;
uniform float mayaTailSway;
uniform float mayaTailLift;
uniform float mayaTailFlutter;`);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   `#include <begin_vertex>
vMayaHairRest=position;
vMayaHair=vec2(mayaHairTip,mayaHairId);
float hairElastic=pow(smoothstep(.035,.96,mayaHairTip),2.);
float hairWave=sin(mayaTime*mix(4.5,3.3,mayaHairTail)-mayaHairTip*6.6+mayaHairId*.31);
float hairFollow=sin(mayaGait*6.283185307-mix(.55,1.42,mayaHairTail))*mix(.00020,.00031,mayaHairTail);
transformed.x+=hairElastic*mayaWind*hairWave*mix(.00010,.00024,mayaHairTail);
transformed.y+=hairElastic*(hairFollow+mayaWind*hairWave*.00013);
transformed.z+=hairElastic*hairFollow*.27;
float btcTailElastic=mayaHairTail*pow(smoothstep(.10,1.,mayaHairTip),1.7);
transformed.x+=btcTailElastic*(.00210*mayaTailSway+.00026*mayaTailFlutter*sin(mayaTime*5.3+mayaHairId*.26));
transformed.z+=btcTailElastic*(.00138*mayaTailLift+.00019*mayaTailFlutter*cos(mayaTime*6.1+mayaHairId*.17));
transformed.y+=btcTailElastic*.00027*mayaTailSway*sin(mayaTime*4.7+mayaHairId*.09);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec2 vMayaHair;\nvarying vec3 vMayaHairRest;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat hairRootShade=mix(.93,1.03,smoothstep(.04,.64,vMayaHair.x));\nfloat hairCuticle=sin(vMayaHair.y*22.3+vMayaHair.x*89.)*.010;\nfloat btcCuticle=sin(vMayaHairRest.y*15500. + vMayaHairRest.z*3700. + sin(vMayaHairRest.x*7200.)*.65);\nfloat btcFineCoat=sin(vMayaHairRest.y*5100.-vMayaHairRest.x*2800.);\nfloat btcFiber=sin(vMayaHairRest.z*23000.+vMayaHair.y*11.3);\ndiffuseColor.rgb*=clamp(hairRootShade+hairCuticle+.035*btcCuticle+.026*btcFineCoat+.013*btcFiber,.84,1.13);');
 };
 mat.customProgramCacheKey=()=>tail?'btc-damped-spring-tail-v14':'btc-silk-matte-mane-v14';
 const mesh=attach(source,geo,mat,tail?'BTC Maya rooted long tail':'BTC Maya sculpted crest and sweeping mane');
 return {mesh,geo,mat,locks:strandCount,vertices:positions.length/3,neckOutliers,bridgeLocks:tail?0:112,heroLocks:tail?0:56,rootBedVertices,solidRingSides:SIDES,looseNeckFibers:tail?0:neckOutliers,proceduralHairTexture:!tail};
}

export function createMayaGroom(source,skinAt,{
 maneSize=1,tailSize=1,maneColor='#36231e',tailColor='#30211e'
}={}){
 const motion={time:{value:0},wind:{value:1},gait:{value:0},
  tailSway:{value:0},tailLift:{value:0},tailFlutter:{value:0}};
 const spring=createBTCTailSpring();
 const mane=createHairMass(source,skinAt,{tail:false,majorCount:112,fineCount:320,
  size:clamp(maneSize,.6,1.9),color:maneColor,motion});
 const tail=createHairMass(source,skinAt,{tail:true,majorCount:144,fineCount:448,
  size:clamp(tailSize,.6,1.9),color:tailColor,motion});
 let disposed=false;
 return {
  locks:mane.locks+tail.locks,
  vertices:mane.vertices+tail.vertices,
  neckOutliers:mane.neckOutliers,
  bridgeLocks:mane.bridgeLocks,
  heroLocks:mane.heroLocks,
  solidRingSides:mane.solidRingSides,
  rootBedVertices:mane.rootBedVertices,
  looseNeckFibers:mane.looseNeckFibers,
  proceduralHairTexture:mane.proceduralHairTexture,
  get dynamics(){return spring.state;},
  get hairFinish(){return {
   maneRoughness:mane.mat.roughness,
   maneSheen:mane.mat.sheen,
   tailRoughness:tail.mat.roughness,
   tailSheen:tail.mat.sheen,
   maneStrands:mane.locks,
   tailStrands:tail.locks
  };},
  update(dt,{wind=1,speed=1,phase=0,running=true}={}){
   if(disposed)return;
   motion.time.value+=Math.min(.05,Math.max(0,dt))*clamp(speed,.3,2);
   motion.wind.value=running?clamp(wind,0,2):.13;
   motion.gait.value=phase;
   const dynamics=spring.update(dt,{phase,wind,speed,running});
   motion.tailSway.value=dynamics.sway;
   motion.tailLift.value=dynamics.lift;
   motion.tailFlutter.value=dynamics.flutter;
  },
  setColor(color){
   if(/^#[0-9a-f]{6}$/i.test(color)){mane.mat.color.set(color);tail.mat.color.set(color);}
  },
  dispose(){
   if(disposed)return;disposed=true;
   spring.reset();
   for(const layer of [mane,tail]){
    layer.mesh.removeFromParent();layer.geo.dispose();layer.mat.dispose();
   }
  }
 };
}
