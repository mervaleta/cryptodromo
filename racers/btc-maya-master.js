/**
 * BTC anatomy master, from the user's actual Horse_VR_2017.ma polygon sculpt.
 *
 * The current race model (Quaternius) is kept for its ORIGINAL authored Gallop,
 * bones, and complete rollback. Only BTC's visible anatomical surface changes.
 * No video, screenshots, static planes, sprite swaps, or new race mechanics.
 */
import * as THREE from 'three';
import {BTC_EQUINE_MESH} from './btc-maya-body-data.js';
import {createMayaGroom} from './btc-maya-groom.js?v=btc-master-sculpted-locks-20261104-v10';
import {createBTCMayaFaceDetails} from './btc-maya-face-details.js?v=btc-master-sculpted-locks-20261104-v10';
import {createBTCHarmonyEars} from './btc-maya-ears.js?v=btc-master-sculpted-locks-20261104-v10';
export const BTC_MAYA_MASTER='btc-maya-2017-sculpt-gallop-20261104';
export const BTC_MAYA_RENDER_BUILD='btc-master-sculpted-locks-20261104-v10';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const gauss=(x,c,r)=>Math.exp(-Math.pow((x-c)/r,2));
const TAU=Math.PI*2;
const shade=new THREE.Color('#463126');
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
 let {positions,indices:originalIndices}=unbox();
 // Actual sculpt contains its OWN old ear tips and a thin skin-colored tail.
 // Both were still visible beneath the new pinnae and groom, generating
 // the reported four-horn and double-tail silhouettes.
 const removed={nativeEarFaces:0,extraTailFaces:0};
 const visibleTriangles=[];
 const retiredTailEdges=new Set();
 const retiredEarEdges=new Set();
 const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;
 const earVertex=id=>{
  const i=id*3,x=positions[i],y=positions[i+1],z=positions[i+2];
  return Math.abs(x)>.00113&&y>-.0302&&y<-.0230&&z>.04485;
 };
 const tailVertex=id=>{
  const i=id*3,x=positions[i],y=positions[i+1],z=positions[i+2];
  // The dock joins the rump here. Removing the root tears an open hole.
  // Only retire the old free end; preserve the skinned croup envelope.
  return y>.0155&&Math.abs(x)<.00155&&z>.016&&z<.0355;
 };
 for(let t=0;t<originalIndices.length;t+=3){
  const tri=[originalIndices[t],originalIndices[t+1],originalIndices[t+2]];
  if(tri.filter(earVertex).length>=2){
   removed.nativeEarFaces++;
   for(let k=0;k<3;k++)retiredEarEdges.add(edgeKey(tri[k],tri[(k+1)%3]));
   continue;
  }
  if(tri.filter(tailVertex).length>=2){
   removed.extraTailFaces++;
   for(let k=0;k<3;k++)retiredTailEdges.add(edgeKey(tri[k],tri[(k+1)%3]));
   continue;
  }
  visibleTriangles.push(...tri);
 }
 // The old free tail leaves a polygonal opening at its skinned dock.
 // Close the actual body manifold rather than adding another tail-shaped
 // capsule. Each retained boundary edge gets a triangle to a single
 // depressed interior center. Reverse the inherited edge orientation so
 // the cap meets the source's normal winding.
 const keptEdges=new Map();
 for(let t=0;t<visibleTriangles.length;t+=3){
  for(let k=0;k<3;k++){
   const a=visibleTriangles[t+k],b=visibleTriangles[t+(k+1)%3];
   const key=edgeKey(a,b);
   const entry=keptEdges.get(key)||{a,b,count:0};
   entry.count++;
   keptEdges.set(key,entry);
  }
 }
 const border=[...keptEdges].filter(([key,e])=>
  e.count===1&&retiredTailEdges.has(key)).map(([,e])=>e);
 if(border.length<20||border.length>100)
  throw Error('BTC tail root border unexpectedly changed');
 const borderVertices=new Set(border.flatMap(e=>[e.a,e.b]));
 const center=[0,0,0];
 for(const id of borderVertices)for(let k=0;k<3;k++)center[k]+=positions[id*3+k];
 for(let k=0;k<3;k++)center[k]/=borderVertices.size;
 // Sink the cap fractionally into the rump, never let it form a stump.
 center[1]-=.00048;
 const capCenter=positions.length/3;
 positions=Float32Array.from([...positions,...center]);
 for(const {a,b} of border)visibleTriangles.push(b,a,capCenter);
 removed.tailDockBorderEdges=border.length;
 removed.integratedDockCapTriangles=border.length;
 // The removed native ear tips also cut HOLES through the original poll.
 // Reconnect each ear-root opening to its OWN existing boundary vertices.
 // No floating cover or separate prop: the caps belong to the skinned body.
 const earEdges=[...keptEdges].filter(([key,e])=>
  e.count===1&&retiredEarEdges.has(key)).map(([,e])=>e);
 if(earEdges.length<40||earEdges.length>80)
  throw Error('BTC ear cut boundaries unexpectedly changed');
 const graph=new Map();
 for(const {a,b} of earEdges)for(const [u,v] of [[a,b],[b,a]]){
  if(!graph.has(u))graph.set(u,new Set());
  graph.get(u).add(v);
 }
 const visited=new Set(),earComponents=[];
 for(const vertex of graph.keys()){
  if(visited.has(vertex))continue;
  const stack=[vertex],component=new Set();
  visited.add(vertex);
  while(stack.length){
   const at=stack.pop();component.add(at);
   for(const next of graph.get(at)||[])if(!visited.has(next)){
    visited.add(next);stack.push(next);
   }
  }
  earComponents.push(component);
 }
 if(earComponents.length!==2||earComponents.some(c=>c.size<15))
  throw Error('BTC ear roots must have two original connected boundaries');
 const newEarCenters=[];
 for(const component of earComponents){
  const centerId=positions.length/3+newEarCenters.length/3;
  const cap=[0,0,0];
  for(const id of component)for(let k=0;k<3;k++)cap[k]+=positions[id*3+k];
  for(let k=0;k<3;k++)cap[k]/=component.size;
  cap[2]-=.00016; // inside the actual poll, never hovering over the skin
  newEarCenters.push(...cap);
  for(const {a,b} of earEdges)if(component.has(a)&&component.has(b))
   visibleTriangles.push(b,a,centerId);
 }
 positions=Float32Array.from([...positions,...newEarCenters]);
 removed.earCutBorderEdges=earEdges.length;
 removed.integratedEarRootCapTriangles=earEdges.length;
 removed.earRootCapCenters=earComponents.length;
 const indices=new Uint16Array(visibleTriangles);
 if(removed.nativeEarFaces<150||removed.extraTailFaces<150)
  throw Error('BTC original ear/tail geometry not located; refusing cosmetic patch');
 // Weight transfer remains anchored to the ORIGINAL rest surface while
 // sculpting; moving geometry must never reassign its joints by proximity.
 const skinRest=Float32Array.from(positions);
 // Model real hoof flare, quarters and the toe/heel transition directly on
 // the Maya sculpt vertices. The four measured coronet centers are defined
 // in original .ma rest space, not guessed in normalized scene coordinates.
 const hoofCentersY=[-.01625,.01045];
 let beveledHoofVertices=0;
 for(let i=0;i<positions.length;i+=3){
  const x=positions[i],y=positions[i+1],z=positions[i+2];
  const hind=y>.005,fore=y<-.009;
  if(!(fore||hind)||z>=.0034||Math.abs(x)<.0011)continue;
  const centerY=hind?hoofCentersY[1]:hoofCentersY[0];
  if(Math.abs(y-centerY)>.0036)continue;
  const centerX=Math.sign(x)*(hind?.00278:.00265);
  const fall=smooth((.00335-z)/.0027);
  // Equestrian hoof walls widen toward the ground and project their toe.
  positions[i]=centerX+(x-centerX)*(1+.18*fall);
  positions[i+1]=centerY+(y-centerY)*(1+.14*fall)
    +(fore?-.000085:.00006)*fall;
  // Preserve ground contact and imported gait, including all four fetlocks.
  beveledHoofVertices++;
 }
 // Retire the huge side-splayed native ear tips in favor of two small
 // hand-sculpted pinnae. Collapse ONLY their distal tips toward the poll
 // without removing facial triangles or changing original Head weights.
 let elevatedEarVertices=0;
 for(let i=0;i<positions.length;i+=3){
  const x=positions[i],y=positions[i+1],z=positions[i+2];
  const mask=smooth((z-.0443)/.0023)*
   smooth((Math.abs(x)-.00124)/.00138)*
   gauss(y,-.0266,.0020);
  if(mask<.012)continue;
  const strength=.94*mask;
  positions[i]+=(Math.sign(x)*.00145-x)*strength;
  positions[i+1]+=(-.02610-y)*strength;
  positions[i+2]+=(.04525-z)*strength;
  elevatedEarVertices++;
 }
 // Gentle anatomical correction in the actual supplied mesh, not added
 // cylinders or billboards. The eye socket remains in place for skinned eyes.
 for(let i=0;i<positions.length;i+=3){
  const x=positions[i],y=positions[i+1],z=positions[i+2];
  const cheek=gauss(y,-.0268,.0037)*gauss(z,.0385,.0044);
  const masseter=gauss(y,-.0232,.0034)*gauss(z,.0363,.0043);
  const muzzle=gauss(y,-.0334,.0020)*gauss(z,.0362,.0036);
  const brow=gauss(y,-.0280,.0027)*gauss(z,.0433,.0021);
  const eyeSocket=gauss(y,-.02815,.00085)*gauss(z,.0425,.00074);
  const withers=gauss(y,-.014,.006)*gauss(z,.034,.005);
  // Refined thoroughbred silhouette: a light throat, defined cheek plane,
  // refined muzzle and a gentle S-curve rising from withers to poll.
  const refinedMuzzle=gauss(y,-.0331,.00265)*gauss(z,.0360,.0040);
  const poll=gauss(y,-.0264,.0036)*gauss(z,.0442,.00265);
  const neck=gauss(y,-.016,.0077)*smooth((z-.028)/.009);
  const throat=gauss(y,-.0245,.0048)*gauss(z,.032,.004);
  const flank=gauss(y,.0053,.009)*gauss(z,.022,.009);
  const belly=gauss(y,.001,.010)*gauss(z,.018,.006);
  const volume=1+.075*cheek+.056*masseter-.033*refinedMuzzle+
    .025*brow-.025*eyeSocket-.083*neck+.022*flank-.025*belly;
  positions[i]=x*volume;
  positions[i+1]=y+.00077*refinedMuzzle-.00006*masseter;
  positions[i+2]=z+.00030*brow+.00050*withers+
    .00052*poll+.00050*neck+.00026*belly-.00024*throat;
 }
 // Strengthen the hindquarter silhouette: the supplied Maya body was
 // transfer-skinned correctly but its thighs and gaskins read skeletal
 // during the stretched phase of Gallop. Shape the *same* skinned surface,
 // not attached tubes or independent muscle ornaments.
 let poweredHindVertices=0;
 for(let i=0;i<positions.length;i+=3){
  const x=positions[i],y=positions[i+1],z=positions[i+2];
  const lateral=smooth((Math.abs(x)-.0012)/.0021);
  const croup=gauss(y,.0093,.0068)*gauss(z,.028,.0078);
  const thigh=gauss(y,.0108,.0058)*gauss(z,.0180,.0081);
  const gaskin=gauss(y,.0114,.0044)*gauss(z,.0107,.0061);
  const hock=gauss(y,.0115,.0040)*gauss(z,.0072,.0049)*smooth((z-.0032)/.0028);
  const muscle=lateral*(.15*croup+.31*thigh+.20*gaskin+.09*hock);
  if(muscle<.006)continue;
  // Radial expansion widens the top of both hind legs and rounds their
  // front/back contour without thickening the cannon bone or hoof.
  positions[i]=x*(1+muscle);
  positions[i+1]=y+(y-.0104)*(.25*thigh+.21*gaskin+.13*hock)
    +.00050*croup*lateral;
  positions[i+2]=z+.00023*croup*lateral+.00009*thigh*lateral;
  poweredHindVertices++;
 }
 const bone=new Uint16Array(positions.length/3*4);
 const weights=new Float32Array(positions.length/3*4);
 for(let i=0;i<positions.length;i+=3){
  const skin=skinAt(skinRest[i],skinRest[i+1],skinRest[i+2]);
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
 const coat=new THREE.MeshPhysicalMaterial();
 // Copy shared PBR maps/colors without assuming the GLB source is already a
 // MeshPhysicalMaterial (which would make .copy() access missing sheenColor).
 THREE.MeshStandardMaterial.prototype.copy.call(coat,source.material);
 coat.name='BTC Maya natural sculpted coat';
 coat.metalness=0;coat.roughness=.54;
 coat.defines={STANDARD:'',PHYSICAL:''};
 coat.clearcoat=.115;coat.clearcoatRoughness=.55;
 coat.sheen=.28;coat.sheenColor.set('#ac805b');coat.sheenRoughness=.78;
 // The horse is an animal, not a neon advertising statue. BTC branding is
 // carried by the identity card; the animal gets a natural chestnut coat.
 // A published editor profile with brand_colored intentionally overrides it.
 const natural=new THREE.Color(/^#[0-9a-f]{6}$/i.test(coatColor||'')?coatColor:'#a46239');
 const accent=new THREE.Color(/^#[0-9a-f]{6}$/i.test(brandAccent||'')?brandAccent:'#f7931a');
 coat.color.copy(natural.lerp(accent,brandMode==='brand_colored'?.46:.055));
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
   '#include <color_fragment>\nfloat crpMuzzle=1.0-smoothstep(-.035,-.028,vBTCMayaRest.y);\ncrpMuzzle*=smoothstep(.031,.035,vBTCMayaRest.z)*(1.0-smoothstep(.039,.043,vBTCMayaRest.z));\nfloat coatDirection=sin(vBTCMayaRest.y*13700.+vBTCMayaRest.z*1850.)*sin(vBTCMayaRest.x*7600.-vBTCMayaRest.y*920.);\nfloat coatSalt=fract(sin(dot(floor(vBTCMayaRest*4700.),vec3(17.43,37.2,91.1)))*43758.5453);\nfloat dorsalLight=smoothstep(.027,.041,vBTCMayaRest.z)*.04;\nfloat amberBreak=sin(vBTCMayaRest.y*470.+vBTCMayaRest.z*890.)*sin(vBTCMayaRest.x*340.);\nfloat coatGrain=.99+.020*coatDirection+.025*(coatSalt-.5)+.032*amberBreak+dorsalLight;\ndiffuseColor.rgb*=clamp(coatGrain,.85,1.09);\ndiffuseColor.rgb*=mix(vec3(1.),vec3(.69,.59,.52),crpMuzzle*.55);\nfloat lipCrease=exp(-pow((vBTCMayaRest.y+.0337)/.0012,2.)-pow((vBTCMayaRest.z-.0341)/.00048,2.));\nfloat nostril=exp(-pow((vBTCMayaRest.y+.0335)/.00043,2.)-pow((vBTCMayaRest.z-.0359)/.00040,2.))*smoothstep(.0007,.0021,abs(vBTCMayaRest.x));\nfloat lowLeg=(1.0-smoothstep(.008,.018,vBTCMayaRest.z))*smoothstep(.006,.014,abs(vBTCMayaRest.y));\ndiffuseColor.rgb*=1.0-.10*lipCrease-.44*nostril;\ndiffuseColor.rgb*=mix(vec3(1.),vec3(.54,.44,.35),lowLeg*.28);\nfloat foreheadStar=exp(-pow(vBTCMayaRest.x/.00047,2.))*exp(-pow((vBTCMayaRest.y+.0295)/.00165,2.))*smoothstep(.040,.043,vBTCMayaRest.z);\nfloat earVelvet=exp(-pow((abs(vBTCMayaRest.x)-.0013)/.0007,2.))*exp(-pow((vBTCMayaRest.y+.0258)/.0015,2.))*smoothstep(.044,.047,vBTCMayaRest.z);\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.69,.53,.39),foreheadStar*.24);\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.58,.31,.27),earVelvet*.20);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
   '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+.020*coatDirection+.030*amberBreak,.50,.82);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
   '#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(coatDirection*.002,amberBreak*.0017,coatDirection*.0015));');
 };
 coat.customProgramCacheKey=()=>String(cacheKey?.()||'')+'|btc-harmony-sculpt-face-v1';
 const hoof=new THREE.MeshStandardMaterial({
  name:'BTC original Maya four integrated hoof walls',
  color:/^#[0-9a-f]{6}$/i.test(hoofColor||'')?hoofColor:'#694937',
  roughness:.80,metalness:0,side:THREE.FrontSide
 });
 // The original Maya hoof and pastern are one continuous skinned surface.
 // Do not cover it with independent cylinders: that read as four loose boots.
 hoof.visible=true;
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
 return {mesh,geometry:geo,materials:[coat,hoof],vertices:positions.length/3,triangles:indices.length/3,positions,beveledHoofVertices,elevatedEarVertices,poweredHindVertices,...removed};
}

function makeAnatomicalEyes(source,skinAt,{eyeColor='#271910'}={}){
 // Actual Three.js spheres, embedded in the existing sculpted eye sockets.
 // A single skinned mesh renders both eyes; no flat iris disk or billboard.
 const headJoint=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(headJoint<0)throw Error('BTC eye globes require native Head joint');
 // Smaller globes sit INSIDE the two actual sockets; previous spheres floated ahead of the eyelid.
 const radius=.000385,template=new THREE.SphereGeometry(radius,36,24);
 const xyz=[],normals=[],local=[],sides=[],bones=[],weights=[],indices=[];
 const point=template.getAttribute('position'),normal=template.getAttribute('normal');
 const tris=template.getIndex();
 for(const side of [-1,1]){
  const base=xyz.length/3;
  for(let i=0;i<point.count;i++){
   const x=point.getX(i),y=point.getY(i),z=point.getZ(i);
   xyz.push(side*.002075+x,-.02814+y,.04257+z);
   normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));
   local.push(x/radius,y/radius,z/radius);
   sides.push(side);
   bones.push(headJoint,0,0,0);
   weights.push(1,0,0,0);
  }
  for(let i=0;i<tris.count;i++)indices.push(base+tris.getX(i));
 }
 template.dispose();
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(indices);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.setAttribute('eyeRest',new THREE.Float32BufferAttribute(local,3));
 geometry.setAttribute('eyeSide',new THREE.Float32BufferAttribute(sides,1));
 geometry.computeBoundingSphere();
 const chosen=/^#[0-9a-f]{6}$/i.test(eyeColor)?eyeColor:'#422517';
 const irisColor=new THREE.Color(chosen);
 const material=new THREE.MeshPhysicalMaterial({
  name:'BTC inset natural eye globes with independently colored irises',
  color:'#33211a',metalness:0,roughness:.27,
  clearcoat:.62,clearcoatRoughness:.19,side:THREE.FrontSide
 });
 material.onBeforeCompile=shader=>{
  shader.uniforms.btcIrisColor={value:irisColor};
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute vec3 eyeRest;\nattribute float eyeSide;\nvarying vec3 vBTCEyeRest;\nvarying float vBTCEyeSide;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvBTCEyeRest=eyeRest;\nvBTCEyeSide=eyeSide;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vBTCEyeRest;\nvarying float vBTCEyeSide;\nuniform vec3 btcIrisColor;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nfloat btcEyeFront=vBTCEyeRest.x*vBTCEyeSide;\nfloat btcEyeIrisRadius=length(vec2(vBTCEyeRest.y/.68,vBTCEyeRest.z/.53));\nfloat btcEyePupilRadius=length(vec2(vBTCEyeRest.y/.45,vBTCEyeRest.z/.29));\nfloat btcEyeFacing=smoothstep(.60,.72,btcEyeFront);\nfloat btcEyeIrisMask=(1.-smoothstep(.94,1.04,btcEyeIrisRadius))*btcEyeFacing;\nfloat btcEyePupilMask=(1.-smoothstep(.91,1.03,btcEyePupilRadius))*btcEyeFacing;\nvec3 btcEyeIrisShading=btcIrisColor*mix(.72,1.12,smoothstep(.22,1.,btcEyeIrisRadius));\ndiffuseColor.rgb=mix(diffuseColor.rgb,btcEyeIrisShading,btcEyeIrisMask);\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.003,.002,.002),btcEyePupilMask);');
 };
 material.customProgramCacheKey=()=> 'btc-three-inset-equine-eyes-20261104-v2';
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC bilateral embedded spherical eyes on native Head joint';
 applySkin(mesh,source);
 return {mesh,geometry,material,globes:2,eyeRadius:radius,irisEditable:true,blackEquinePupils:true};
}

/**
 * Heal the circular rump opening left by the old polygon tail. Rather than
 * placing another tail-like tube on top, this is a low convex patch of the
 * actual COAT material, following the original Back bone in Gallop.
 * The new groom grows from immediately behind this seamless rump surface.
 */
function sculptRumpSurfacePatch(source,coat){
 const back=source.skeleton.bones.findIndex(b=>b.name==='Back');
 if(back<0)throw Error('BTC rump patch requires original Back bone');
 const SIDE=36,RINGS=6,xyz=[0,.01605,.03045],joints=[back,0,0,0],
   weights=[1,0,0,0],indices=[];
 for(let row=1;row<=RINGS;row++){
  const r=row/RINGS;
  for(let i=0;i<SIDE;i++){
   const theta=TAU*i/SIDE,cs=Math.cos(theta),sn=Math.sin(theta);
   const x=cs*.00235*r,z=.03045+sn*.00250*r;
   const y=.01422+.00183*(1-r*r);
   xyz.push(x,y,z);
   joints.push(back,0,0,0);weights.push(1,0,0,0);
  }
 }
 for(let j=0;j<SIDE;j++){
  const k=(j+1)%SIDE;
  indices.push(0,1+k,1+j);
 }
 for(let row=1;row<RINGS;row++){
  for(let j=0;j<SIDE;j++){
   const k=(j+1)%SIDE;
   const a=1+(row-1)*SIDE+j,b=1+(row-1)*SIDE+k,
      c=1+row*SIDE+j,d=1+row*SIDE+k;
   indices.push(a,b,c,b,d,c);
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indices);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geo.computeVertexNormals();
 const mesh=new THREE.SkinnedMesh(geo,coat);
 mesh.name='BTC integrated sculpted rump, single tail exit';
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);mesh.bindMode=source.bindMode;
 source.parent.add(mesh);mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 return {vertices:xyz.length/3,triangles:indices.length/3,
  dispose(){mesh.removeFromParent();geo.dispose();}};
}
export function createBTCHeroMaya(root,{maneSize=1.2,tailSize=1.1,color='#35251e',tailColor,eyeColor,coatColor,brandAccent,brandMode,hoofColor}={}){
 const {best,hidden}=sourceBody(root);
 const originalVisibility=hidden.map(x=>({...x}));
 const skinAt=makeSkinTransfer(best);
 const anatomy=makeAnatomy(best,skinAt,{coatColor,brandAccent,brandMode,hoofColor});
 const rumpPatch=sculptRumpSurfacePatch(best,anatomy.materials[0]);
 const groom=createMayaGroom(best,skinAt,{
  maneSize,tailSize,maneColor:color,tailColor:tailColor||color
 });
 const eyes=makeAnatomicalEyes(best,skinAt,{eyeColor});
 const face=createBTCMayaFaceDetails(best,skinAt,anatomy.positions);
 const ears=createBTCHarmonyEars(best,{coatColor});
 for(const h of hidden)h.obj.visible=false;
 // The original plastic eyes are hidden in favor of two inset glossy
 // equine eyes with the same skinned and animated head transform.
 let disposed=false,time=0,phase=0;
 return {
  get snapshot(){return {
   version:BTC_MAYA_MASTER,modelPreserved:true,gallopPreserved:true,
   originalRig:true,source:'supplied-Maya-2017-sculpt',
   sculptedBodyParts:1,vertices:anatomy.vertices,
   harmonyBuild:BTC_MAYA_RENDER_BUILD,
   nativeEarFacesRemoved:anatomy.nativeEarFaces,extraTailFacesRemoved:anatomy.extraTailFaces,
   earCutBorderEdges:anatomy.earCutBorderEdges,integratedEarRootCapTriangles:anatomy.integratedEarRootCapTriangles,earRootCapCenters:anatomy.earRootCapCenters,
   tailDockBorderEdges:anatomy.tailDockBorderEdges,integratedDockCapTriangles:anatomy.integratedDockCapTriangles,
   poweredHindVertices:anatomy.poweredHindVertices,
   triangles:anatomy.triangles,beveledHoofVertices:anatomy.beveledHoofVertices,elevatedEarVertices:anatomy.elevatedEarVertices,oldHairHidden:!best.visible,
   eyeGlobes:eyes.globes,eyeRadius:eyes.eyeRadius,irisEditable:eyes.irisEditable,blackEquinePupils:eyes.blackEquinePupils,
   animatedHair:true,maneVertices:groom.vertices,fineLocks:groom.locks,neckOutliers:groom.neckOutliers,crownBridgeLocks:groom.bridgeLocks,heroLocks:groom.heroLocks,rootBedVertices:groom.rootBedVertices,tailRootPatchTriangles:rumpPatch.triangles,sculptedEyes:2,facialSurfaces:face.surfaces,facialTriangles:face.triangles,heroHooves:4,hoofMeshVertices:anatomy.beveledHoofVertices,integratedMayaHooves:true,sculptedEars:ears.count,earTriangles:ears.triangles,
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
   groom.dispose();face.dispose();ears.dispose();rumpPatch.dispose();
   eyes.mesh.removeFromParent();eyes.geometry.dispose();eyes.material.dispose();
   anatomy.mesh.removeFromParent();anatomy.geometry.dispose();
   anatomy.materials.forEach(m=>m.dispose());
  }
 };
}
