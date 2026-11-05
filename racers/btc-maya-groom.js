/**
 * BTC Maya groom: rounded procedural strands + scalp bed on the original
 * 2017 Maya skinned horse. Shorter rooted crest removes loose neck filaments;
 * procedural cuticle grain restores detail without hundreds of dangling fibers.
 */
import * as THREE from 'three';
const PI=Math.PI,TAU=2*PI;
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const noise=n=>{const x=Math.sin(n*73.2271+14.91)*34987.2;return x-Math.floor(x);};
// Calibrated against actual upper vertices of BTC_EQUINE_MESH, with
// the small positive offset introduced by Maya's sculpted neck/poll skin.
// The previous hand-drawn curve both buried and floated scalp roots.
const TOPLINE=[
 [-.0290,.04572],[-.026,.04605],[-.024,.04535],
 [-.021,.04317],[-.018,.04159],[-.015,.03912],
 [-.012,.03743],[-.009,.03609],[-.006,.03489],[-.003,.03406]
];
function fallbackCrest(y) {
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

/** V18: anchor the groom to the POST-SCULPTED Maya scalp, not a hand
 * drawn centerline from an earlier version. The original curve remains
 * as a clamped fallback when no upper-surface vertices are found. */
function measureSculptedCrest(geometry){
 const position=geometry?.getAttribute('position');
 if(!position)return fallbackCrest;
 const count=26,start=-.0290,end=-.0030,offset=[];
 for(let step=0;step<=count;step++){
  const y=start+(end-start)*step/count,baseline=fallbackCrest(y);
  const values=[];
  for(let i=0;i<position.count;i++){
   const x=position.getX(i),py=position.getY(i),z=position.getZ(i);
   if(Math.abs(x)>.00102||Math.abs(py-y)>.0013||z<baseline-.0026||z>baseline+.0019)continue;
   values.push(z);
  }
  values.sort((a,b)=>b-a);
  if(values.length<3){offset.push(0);continue;}
  const best=values.slice(0,Math.min(8,values.length));
  const avg=best.reduce((a,b)=>a+b,0)/best.length;
  offset.push(clamp(avg-baseline,-.00025,.00075));
 }
 const filtered=offset.map((v,i)=>(offset[Math.max(0,i-1)]+v*2+
  offset[Math.min(count,i+1)])/4);
 return y=>{
  const v=clamp((y-start)/(end-start),0,1)*count;
  const a=Math.min(count-1,Math.floor(v)),t=smooth(v-a);
  return fallbackCrest(y)+filtered[a]*(1-t)+filtered[a+1]*t;
 };
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
 tail,majorCount,fineCount,size,color,motion,scalpColor,scalpGeometry
}){
 const crest=measureSculptedCrest(scalpGeometry);
 const positions=[],colors=[],tip=[],ids=[],region=[],zones=[],bones=[],weights=[],indices=[];
 // More independent roots, fewer segments/card: better silhouette and lower GPU cost.
 const ROWS=20,SIDES=6; // 16.7% fewer rings: preserve rounded 6-sided silhouette
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
  const follow=.12+.31*smooth(u);
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
    [side*(.00010+.00025*seed),-.02765+.00070*f,
     crest(-.02765+.00070*f)+.00022]:
   crown?
    [side*(.00010+.00034*crossSeed),-.02755+.00310*f,
     crest(-.02755+.00310*f)+.00022]:
   hero?
    [side*.00013,-.02635+.01510*f,crest(-.02635+.01510*f)+.00016]:
    [side*.00011,-.02625+.02185*f,crest(-.02625+.02185*f)+.00012];
  // The crown shares Head weights with the forelock: no visible separation when nodding.
  const baseSkin=skinAt(...root);
  // Forelock stays with Head; the crown gradually shares the EXACT skin
  // joints of the neck/root area. Full Head-weight for the entire crown
  // caused the back half to dive into the nape during head nods.
  let sk=baseSkin;
  if(forelock){
   sk={joints:[headJoint,0,0,0],weights:[1,0,0,0]};
  }else if(crown){
   const headShare=.90*smooth((-.0225-root[1])/.0047);
   const contributions=new Map([[headJoint,headShare]]);
   for(let k=0;k<4;k++){
    const index=baseSkin.joints[k],w=(1-headShare)*baseSkin.weights[k];
    if(w>1e-7)contributions.set(index,(contributions.get(index)||0)+w);
   }
   const ranked=[...contributions].sort((a,b)=>b[1]-a[1]).slice(0,4);
   const sum=ranked.reduce((acc,p)=>acc+p[1],0)||1;
   sk={joints:Array.from({length:4},(_,i)=>ranked[i]?.[0]||0),
    weights:Array.from({length:4},(_,i)=>(ranked[i]?.[1]||0)/sum)};
  }
  const id=++strandCount;
  // Physically plausible hair: shorter layered crest, tapered fine fibers and
  // a weighted tail fan. Previous groom was an oversized solid brown curtain.
  const length=(forelock
   ?(major?.00255+.00070*seed:.00190+.00065*seed)
   :crown
    ?(major?.00255+.00125*seed:.00210+.00105*seed)
   :hero
    ?(.0071+.0029*seed)
   :tail
    ?(major?.029+.0100*seed:.026+.0115*seed)
    :(major?.00820+.00210*seed:.00350+.00155*seed))*
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
    z=crest(cy)+.00022+.00036*Math.sin(PI*t)*(.64+.36*seed)-.00020*t2;
    if(ribbon===0)z+=cross*breadth*.59*w;
    else x+=side*cross*breadth*.32*w;
   }else if(hero){
    // Three-dimensional sculpted locks fly behind the poll above the coat.
    // Every guide has a different arch and a naturally tapering lifted tip.
    const flow=t*.72+.28*t2;
    const cy=Math.min(-.00455,root[1]+length*flow);
    const arch=(.00072+.00080*seed)*Math.pow(Math.sin(PI*t),1.3);
    const tipRise=.00016*t2*t2*(.35+.65*seed);
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
    y=root[1]-(.00110+.00045*seed)*(t*.55+.45*t2);
    z=root[2]-length*(.72*t+.28*t2);
    if(ribbon===0)x+=cross*breadth*.55*w;
    else y+=cross*breadth*.35*w;
   }else if(tail){
    // A live galloping horse streams its tail back from the dock, rather
    // than suspending a vertical curtain behind the hind legs. Target is
    // the supplied 212734.mp4 silhouette, never a still frame substitute.
    const flow=t*.68+.32*t2;
    // Three-dimensional tapered fan: a compact tail dock opens into a
    // soft plumelike cascade, with deliberate staggered free ends.
    const fan=(seed-.5)*(.0022*Math.sin(PI*t)+.0020*t2);
    x=root[0]+fan+(.00037+.00041*seed)*Math.sin(t*TAU*2.1+seed*4)*t2;
    y=root[1]+length*(.62*t+.32*t2)+.00095*Math.sin(PI*t)+.0010*Math.sin(t*PI*3.2+seed*TAU)*t2;
    // Raised tail with an elegant backward sweep rather than limp free ends.
    z=root[2]-(.0038+.33*length+.0009*crossSeed)*flow
      +.0037*Math.sin(PI*t)*(.5+.5*seed)
      +(seed-.5)*(.0019*Math.sin(PI*t)+.0016*t2)
      +.00086*Math.sin(PI*3.0*t+seed*6.3)*t2;
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
    const lift=(.00070+.00055*seed)*Math.sin(PI*t);
    const drape=(.00009+.00012*seed)*t2;
    // Locks sit on the crest; the previous wide sweep detached at the shoulder.
    const outward=(.00013+.00013*seed)*(.26*rearward+.74*t2);
    x=root[0]+side*(outward+.00009*Math.sin(PI*t));
    y=Math.min(-.00455,cy+.00013*Math.sin(PI*t*1.2+seed*2.8)*t2);
    z=neckZ+.00018+lift-drape+
       .00009*Math.sin(PI*t*1.7+seed*3)*t2;
    if(ribbon===0)z+=cross*breadth*w;
    else x+=side*cross*breadth*.50*w;
    // Physically trim low fibers: no alpha masking or recoloring.
    z=Math.max(z,crest(y)+.000035);
   }
   return [x,y,z];
  }
  // Smooth solid locks, generated by code as skinned ring lofts. The former
  // crossed flat cards were responsible for wire wisps and sharp ribbons.
  const radiusBase=tail?(major?.000081+.000043*seed:.000018):
   hero?(.000058+.000040*seed):
   crown?(major?.000086:.000027):
   forelock?(major?.000064:.000021):
   (major?.000098+.000050*seed:.000017);
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
   const radius=radiusBase*Math.pow(1-u,.86)+.000002;
   for(let col=0;col<SIDES;col++){
    const angle=TAU*col/SIDES,cs=Math.cos(angle),sn=Math.sin(angle);
    const v=[c[0]+radius*(ax*cs+bx*sn),
     c[1]+radius*(ay*cs+by*sn),
     c[2]+radius*(az*cs+bz*sn)];
    if(!tail&&!forelock&&(v[1]>-.00379||v[2]<crest(v[1])-.00235))neckOutliers++;
    positions.push(...v);
    const tint=(.79+.22*seed+.027*(1-u));
    colors.push(tint*1.04,tint*.99,tint*.95);
    tip.push(u);ids.push(id*1.71);region.push(tail?1:0);zones.push(tail?3:forelock?2:crown?1:0);
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
 // Native Maya body is now manifold: tail dock, both ears and BOTH eyes
 // are sealed in the anatomical SkinnedMesh. A detached hair-colored scalp
 // bed only produced a flat ridge/sunken strip during head flexion.
 const rootBedVertices=0;
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indices);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.setAttribute('mayaHairTip',new THREE.Float32BufferAttribute(tip,1));
 geo.setAttribute('mayaHairId',new THREE.Float32BufferAttribute(ids,1));
 geo.setAttribute('mayaHairTail',new THREE.Float32BufferAttribute(region,1));
 geo.setAttribute('mayaHairZone',new THREE.Float32BufferAttribute(zones,1));
 geo.computeVertexNormals();geo.computeBoundingSphere();
 const mat=new THREE.MeshPhysicalMaterial({
  name:tail?'BTC tail - tapered layered hair':'BTC neck mane - feathered layers',
  color,vertexColors:true,metalness:0,roughness:tail?.87:.88,
  sheen:.11,sheenColor:new THREE.Color('#766a65'),
  sheenRoughness:.92,clearcoat:0,side:THREE.DoubleSide
 });
 mat.onBeforeCompile=shader=>{
  shader.uniforms.mayaTime=motion.time;
  shader.uniforms.mayaWind=motion.wind;
  shader.uniforms.mayaGait=motion.gait;
  shader.uniforms.mayaTailInertia=motion.tailInertia;
  shader.uniforms.mayaManeInertia=motion.maneInertia;
  shader.uniforms.mayaForelockInertia=motion.forelockInertia;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute float mayaHairTip;\nattribute float mayaHairId;\nattribute float mayaHairTail;\nattribute float mayaHairZone;\nvarying vec2 vMayaHair;\nvarying vec3 vMayaHairRest;\nuniform float mayaTime;\nuniform float mayaWind;\nuniform float mayaGait;\nuniform float mayaTailInertia;\nuniform float mayaManeInertia;\nuniform float mayaForelockInertia;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvMayaHairRest=position;\nvMayaHair=vec2(mayaHairTip,mayaHairId);\nfloat hairElastic=pow(smoothstep(.075,.96,mayaHairTip),1.85);\nfloat maneRegion=1.-mayaHairTail;\nfloat forelock=step(1.5,mayaHairZone);\nfloat crown=step(.5,mayaHairZone)*(1.-forelock);\nfloat group=fract(mayaHairId*.147)*2.-1.;\nfloat flutter=sin(mayaTime*5.2-mayaHairTip*3.1+mayaHairId*.18);\nfloat air=mayaWind*(.5+.5*flutter);\nfloat maneLag=mayaManeInertia;\nfloat foreLag=mayaForelockInertia;\nfloat crownScale=mix(1.,.55,crown);\nfloat maneDrift=hairElastic*maneRegion*(1.-forelock)*(.00014*mayaWind+.00030*maneLag*crownScale+.00005*air*group);\nfloat foreDrift=hairElastic*forelock*(.00009*mayaWind+.00018*foreLag+.000025*air);\nfloat tailDrift=hairElastic*mayaHairTail*(.00032*mayaWind+.00084*mayaTailInertia+.00009*flutter);\ntransformed.y+=maneDrift+foreDrift+tailDrift;\ntransformed.z+=hairElastic*(maneRegion*(1.-forelock)*(.00012*maneLag*crownScale+.000035*flutter)+forelock*(.000065*foreLag)+mayaHairTail*(.0004*mayaTailInertia+.00012*flutter));\ntransformed.x+=hairElastic*(maneRegion*(.000035*group*flutter)+mayaHairTail*(.00012*group*flutter));');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec2 vMayaHair;\nvarying vec3 vMayaHairRest;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat hairRootShade=mix(.93,1.03,smoothstep(.04,.64,vMayaHair.x));\nfloat hairCuticle=sin(vMayaHair.y*22.3+vMayaHair.x*89.)*.022;\nfloat btcCuticle=sin(vMayaHairRest.y*15500. + vMayaHairRest.z*3700. + sin(vMayaHairRest.x*7200.)*.65);\nfloat btcFineCoat=sin(vMayaHairRest.y*5100.-vMayaHairRest.x*2800.);\nfloat hairBand=sin(vMayaHairRest.y*9300.+vMayaHairRest.z*11200.+vMayaHair.y*4.3);\ndiffuseColor.rgb*=clamp(hairRootShade+hairCuticle+.055*btcCuticle+.027*btcFineCoat+.036*hairBand,.82,1.16);');
 };
 mat.customProgramCacheKey=()=>tail?'btc-tail-mp4-inertia-v18':'btc-mane-forelock-poll-skin-v18';
 const scalpMat=null;
 const mesh=attach(source,geo,mat,
  tail?'BTC Maya rooted long tail':'BTC Maya natural rooted flowing mane');
 return {mesh,geo,mat,scalpMat,locks:strandCount,vertices:positions.length/3,neckOutliers,bridgeLocks:tail?0:112,heroLocks:tail?0:56,rootBedVertices,solidRingSides:SIDES,looseNeckFibers:tail?0:neckOutliers,proceduralHairTexture:!tail};
}

export function createMayaGroom(source,skinAt,{
 maneSize=1,tailSize=1,maneColor='#36231e',tailColor='#30211e',scalpColor,scalpGeometry
}={}){
 const motion={time:{value:0},wind:{value:1},gait:{value:0},tailInertia:{value:0},
  maneInertia:{value:0},forelockInertia:{value:0}};
 let lastPhase=0,tailVelocity=0,maneVelocity=0,forelockVelocity=0;
 const mane=createHairMass(source,skinAt,{tail:false,majorCount:112,fineCount:480,
  size:clamp(maneSize,.6,1.9),color:maneColor,motion,scalpColor,scalpGeometry});
 const tail=createHairMass(source,skinAt,{tail:true,majorCount:144,fineCount:500,
  size:clamp(tailSize,.6,1.9),color:tailColor,motion,scalpGeometry});
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
  get tailInertia(){return motion.tailInertia.value;},
  update(dt,{wind=1,speed=1,phase=0,running=true}={}){
   if(disposed)return;
   const step=clamp(Number(dt)||0,0,.05);
   if(!step)return;
   motion.time.value+=step*clamp(speed,.3,2);
   motion.wind.value=clamp(wind,0,2)*(running?1:.22);
   motion.gait.value=phase;
   // 212734.mp4: rooted mane follows the nod, with delayed tips and
   // separately damped forelock; no matching-frequency sine per strand.
   // Two bounded substeps keep this stable during frame-rate changes.
   const targetMane=running?clamp(speed,.5,1.6)*(.62*Math.sin(phase*TAU-.65)+
    .12*Math.sin(phase*TAU*2-1.1)):0;
   const targetForelock=running?clamp(speed,.5,1.6)*(.66*Math.sin(phase*TAU-1.22)+
    .14*Math.sin(phase*TAU*2-1.35)):0;
   const h=step*.5,omegaM=10.5,omegaF=13.0;
   for(let sub=0;sub<2;sub++){
    maneVelocity+=(omegaM*omegaM*(targetMane-motion.maneInertia.value)-
     1.65*omegaM*maneVelocity)*h;
    motion.maneInertia.value+=maneVelocity*h;
    forelockVelocity+=(omegaF*omegaF*(targetForelock-motion.forelockInertia.value)-
     1.72*omegaF*forelockVelocity)*h;
    motion.forelockInertia.value+=forelockVelocity*h;
   }
   motion.maneInertia.value=clamp(motion.maneInertia.value,-1.2,1.2);
   motion.forelockInertia.value=clamp(motion.forelockInertia.value,-1.2,1.2);
   // Retain the independent native-tail lag, never edit Gallop bones.
   const delta=((phase-lastPhase+1.5)%1)-.5;
   lastPhase=phase;
   const desired=running?clamp(delta/step,-7,7)*.095+
    Math.sin(phase*TAU-1.1)*.62:0;
   tailVelocity+=(desired-motion.tailInertia.value)*step*17;
   tailVelocity*=Math.exp(-step*7.5);
   motion.tailInertia.value=clamp(motion.tailInertia.value+tailVelocity*step*9,-1.4,1.4);
  },
  setColor(color){
   if(/^#[0-9a-f]{6}$/i.test(color)){mane.mat.color.set(color);tail.mat.color.set(color);}
  },
  dispose(){
   if(disposed)return;disposed=true;
   for(const layer of [mane,tail]){
    layer.mesh.removeFromParent();layer.geo.dispose();layer.mat.dispose();layer.scalpMat?.dispose();
   }
  }
 };
}
