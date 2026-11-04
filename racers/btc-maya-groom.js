/**
 * BTC Maya groom: continuous root-to-tip curved ribbon locks on the user's
 * sculpted 2017 horse, skinned to the unchanged real Gallop skeleton.
 *
 * A crossover of directional ribbons gives a three-dimensional hair silhouette
 * at all camera angles, without tubular 'spaghetti' geometry. Major overlapping
 * locks form the primary shape; hairline-fine overlapping cards soften the edge.
 */
import * as THREE from 'three';
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
 const ROWS=16,WIDTH=2,RIBBONS=2;
 const total=majorCount+fineCount;
 let strandCount=0;
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
 function guide(n,major,side,forelock=false){
  const seed=noise(n*13.7+(tail?141:27)+(side+3)*53.5+(major?3:17));
  const crossSeed=noise(n*7.03+(tail?47:3)+(side+1)*33.4);
  const f=(n+.37+.24*seed)/(forelock?(major?25:50):(major?majorCount:fineCount));
  const root=tail?
   [(seed-.5)*.00056,.01472+.00084*crossSeed,.03195-.00047*seed]:
   forelock?
    [side*(.00018+.00034*seed),-.0272+.0008*f,.04708-.00030*seed]:
    [side*.00019,-.0271+.0226*f,crest(-.0271+.0226*f)-.00066];
  const sk=skinAt(...root);
  const id=++strandCount;
  // Physically plausible hair: shorter layered crest, tapered fine fibers and
  // a weighted tail fan. Previous groom was an oversized solid brown curtain.
  const length=(forelock
   ?(major?.0027+.0017*seed:.0024+.0021*seed)
   :tail
    ?(major?.021+.0060*seed:.018+.0075*seed)
    :(major?.0060+.0031*seed:.0049+.0030*seed))*size;
  const breadth=(tail
   ?(major?.00028+.00012*seed:.000055+.000070*seed)
   :(major?.00031+.00014*seed:.000037+.000045*seed));
  const base=positions.length/3;
  function point(t,cross,ribbon){
   const t2=smooth(t),w=Math.pow(1-t,.81)*(0.72+0.28*Math.sin(PI*t));
   let x,y,z;
   if(forelock){
    // True short forelock between the pinnae, rooted to the existing head
    // and tapered downward onto the forehead, not a mesh glued in screen space.
    x=root[0]+side*(.00037+.00023*seed)*t2;
    y=root[1]-(.00110+.00038*seed)*t;
    z=root[2]-length*(.65*t+.35*t2);
    if(ribbon===0)x+=cross*breadth*.55*w;
    else y+=cross*breadth*.35*w;
   }else if(tail){
    // A live galloping horse streams its tail back from the dock, rather
    // than suspending a vertical curtain behind the hind legs. Target is
    // the supplied 212734.mp4 silhouette, never a still frame substitute.
    const flow=t*.74+.26*t2;
    // Natural tail arcs rearward then descends, preserving the rump dock.
    // Distinct lock lengths end at different heights, never in a broom edge.
    const fan=(seed-.5)*(.0040*Math.sin(PI*t)+.0019*t2);
    x=root[0]+fan+.00040*Math.sin(t*TAU+seed*4)*t2;
    y=root[1]+length*(.58*t+.17*t2)+.00045*Math.sin(PI*t);
    z=root[2]-(.0135+.0055*crossSeed)*flow
      +.00075*Math.sin(PI*t)*(.5+.5*seed)
      +(seed-.5)*(.0020*Math.sin(PI*t)+.0024*t2);
    if(ribbon===0)x+=cross*breadth*w;
    else z+=cross*breadth*.42*w;
   }else{
    // A true swept crest: hairs grow backward along the mane, close to
    // the neck. They do not fall vertically over the cheek and shoulders.
    const rearward=t*.78+.22*t2;
    const cy=root[1]+length*rearward;
    const neckZ=crest(cy);
    const lift=.00080*Math.sin(PI*t)*(.65+.35*seed);
    const feather=(.00090+.00070*seed)*t2;
    const outward=(.00045+.00050*seed)*rearward;
    x=root[0]+side*(outward+.00018*Math.sin(PI*t));
    y=cy;
    z=neckZ-.00066+lift+feather-(.00014+.00019*crossSeed)*t2;
    if(ribbon===0)z+=cross*breadth*w;
    else x+=side*cross*breadth*.50*w;
   }
   return [x,y,z];
  }
  for(let i=0;i<=ROWS;i++){
   const u=i/ROWS;
   for(let ribbon=0;ribbon<RIBBONS;ribbon++){
    for(let w=0;w<=WIDTH;w++){
     const cross=(w/WIDTH)*2-1;
     const v=point(u,cross,ribbon);
     positions.push(...v);
     const across=Math.abs(cross);
     const tint=(.76+.18*seed+.10*u+.085*(1-across))*(major?1:.85);
     colors.push(tint*1.045,tint*.99,tint*.95);
     tip.push(u);ids.push(id*1.71);region.push(tail?1:0);
     const skin=skinFor(sk,u);
     for(let k=0;k<4;k++){
      bones.push(skin.joints[k]||0);weights.push(skin.weights[k]||0);
     }
    }
   }
  }
  const span=RIBBONS*(WIDTH+1);
  for(let row=0;row<ROWS;row++)for(let ribbon=0;ribbon<RIBBONS;ribbon++){
   const start=base+row*span+ribbon*(WIDTH+1);
   const next=start+span;
   for(let k=0;k<WIDTH;k++){
    const a=start+k,b=a+1,c=next+k,d=c+1;
    indices.push(a,c,b,b,c,d);
   }
  }
 }
 if(!tail){
  // Both sides of the crest have their own overlapping hair masses.
  for(const side of [-1,1]){
   for(let n=0;n<majorCount/2;n++)guide(n,true,side);
   for(let n=0;n<fineCount/2;n++)guide(n,false,side);
   for(let n=0;n<25;n++)guide(n,true,side,true);
   for(let n=0;n<50;n++)guide(n,false,side,true);
  }
 }else{
  for(let n=0;n<majorCount;n++)guide(n,true,1);
  for(let n=0;n<fineCount;n++)guide(n,false,1);
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
  color,vertexColors:true,metalness:0,roughness:tail?.72:.69,
  sheen:.68,sheenColor:new THREE.Color('#906e57'),
  sheenRoughness:.65,clearcoat:0,side:THREE.DoubleSide
 });
 mat.onBeforeCompile=shader=>{
  shader.uniforms.mayaTime=motion.time;
  shader.uniforms.mayaWind=motion.wind;
  shader.uniforms.mayaGait=motion.gait;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute float mayaHairTip;\nattribute float mayaHairId;\nattribute float mayaHairTail;\nvarying vec2 vMayaHair;\nuniform float mayaTime;\nuniform float mayaWind;\nuniform float mayaGait;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvMayaHair=vec2(mayaHairTip,mayaHairId);\nfloat hairElastic=pow(smoothstep(.03,.97,mayaHairTip),2.0);\nfloat hairWave=sin(mayaTime*mix(4.2,2.6,mayaHairTail)-mayaHairTip*6.8+mayaHairId*.24);\nfloat hairFollow=sin(mayaGait*6.283185307-mix(.6,1.55,mayaHairTail))*mix(.00023,.00057,mayaHairTail);\ntransformed.x+=hairElastic*mayaWind*hairWave*mix(.000095,.00032,mayaHairTail);\ntransformed.y+=hairElastic*(hairFollow+mayaWind*hairWave*.00011);\ntransformed.z+=hairElastic*hairFollow*.28;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec2 vMayaHair;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat hairRootShade=mix(.69,1.01,smoothstep(.04,.64,vMayaHair.x));\nfloat hairCuticle=sin(vMayaHair.y*22.3+vMayaHair.x*89.)*.022;\ndiffuseColor.rgb*=hairRootShade+hairCuticle;');
 };
 mat.customProgramCacheKey=()=>tail?'btc-maya-hair-tail-2':'btc-maya-hair-mane-2';
 const mesh=attach(source,geo,mat,tail?'BTC Maya rooted long tail':'BTC Maya sculpted crest and sweeping mane');
 return {mesh,geo,mat,locks:strandCount,vertices:positions.length/3};
}
export function createMayaGroom(source,skinAt,{
 maneSize=1,tailSize=1,maneColor='#36231e',tailColor='#30211e'
}={}){
 const motion={time:{value:0},wind:{value:1},gait:{value:0}};
 const mane=createHairMass(source,skinAt,{tail:false,majorCount:256,fineCount:480,
  size:clamp(maneSize,.6,1.9),color:maneColor,motion});
 const tail=createHairMass(source,skinAt,{tail:true,majorCount:144,fineCount:300,
  size:clamp(tailSize,.6,1.9),color:tailColor,motion});
 let disposed=false;
 return {
  locks:mane.locks+tail.locks,
  vertices:mane.vertices+tail.vertices,
  update(dt,{wind=1,speed=1,phase=0,running=true}={}){
   if(disposed)return;
   motion.time.value+=Math.min(.05,Math.max(0,dt))*clamp(speed,.3,2);
   motion.wind.value=running?clamp(wind,0,2):.13;
   motion.gait.value=phase;
  },
  setColor(color){
   if(/^#[0-9a-f]{6}$/i.test(color)){mane.mat.color.set(color);tail.mat.color.set(color);}
  },
  dispose(){
   if(disposed)return;disposed=true;
   for(const layer of [mane,tail]){
    layer.mesh.removeFromParent();layer.geo.dispose();layer.mat.dispose();
   }
  }
 };
}
