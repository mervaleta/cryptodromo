/**
 * BTC groom v3, iteration 1: a continuous neck mane and a continuous tail.
 * One skinned draw call, no old tail showing, no cards or image textures.
 * The horse GLB, original bones and Gallop animation are not changed.
 */
import * as THREE from 'three';
export const GROOM_VERSION='btc-groom-v3-clumps-2';
const PI=Math.PI, TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function findHair(root){
 let found=null;
 root.traverse(mesh=>{
  if(!found&&mesh.isSkinnedMesh&&mesh.geometry?.attributes?.position?.count>=300&&
    [mesh.material].flat().some(m=>m?.name==='Hair'))found=mesh;
 });
 if(!found)throw Error('Original GLB skinned Hair primitive unavailable');
 if(!found.geometry.attributes.skinIndex||!found.geometry.attributes.skinWeight)
  throw Error('Original skin weights unavailable');
 return found;
}
function buildGeometry(source,options){
 const pos=source.geometry.attributes.position,jo=source.geometry.attributes.skinIndex,
   sw=source.geometry.attributes.skinWeight;
 const p=[],si=[],weights=[],colors=[],section=[],region=[],stripe=[],ix=[];
 function vertex(x,y,z,bones,ws,u,r,s,c){
  const n=p.length/3;
  p.push(x,y,z);
  for(let k=0;k<4;k++){si.push(bones[k]||0);weights.push(ws[k]||0);}
  section.push(u);region.push(r);stripe.push(s);
  colors.push(c,c*.967,c*.926);return n;
 }
 // The old Hair primitive mixes actual neck hair with Ear hair weights.
 // Reusing the nearest ear weights folds the whole shell into plastic spikes.
 // Instead smoothly blend only the EXISTING four neck/head joints.
 const smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 function nearest(y){
  const t=clamp((y+.0293)/.0179,0,1);
  const w5=.62*smooth((t-.50)/.50);
  const w8=.30*(1-smooth(t/.28));
  const w7=.62*(1-smooth((t-.12)/.63));
  const w6=Math.max(0,1-w5-w8-w7);
  const sum=w5+w6+w7+w8||1;
  return {bones:[5,6,7,8],ws:[w5/sum,w6/sum,w7/sum,w8/sum]};
 }
 // ONE double-surfaced hair shell follows the full neck crest.
 const N=44,M=29,sheets=[[],[]];
 for(let side=0;side<2;side++){
  for(let i=0;i<=N;i++){
   const s=i/N,rootY=-.0293+.0179*s;
   const rootZ=.0444-.0068*s+.0004*Math.sin(PI*s);
   const skin=nearest(rootY),row=[];
   for(let k=0;k<=M;k++){
    const u=k/M,bulge=Math.sin(PI*u),late=Math.pow(u,3);
    const edge=.46*Math.sin(s*PI*13)+.21*Math.sin(s*PI*21+.4);
    const length=(.0071+.0025*Math.sin(s*PI))*
      options.maneSize*(1+late*edge*.10);
    const y=rootY+length*(u+.04*bulge);
    const z=rootZ+.0031*bulge-.0009*u*u+
      .00030*late*Math.sin(s*PI*13);
    const halfW=(.00013+.00275*Math.pow(bulge,.72))*
      options.maneSize*(.90+.08*Math.cos(PI*6*s));
    const x=(side===0?1:-1)*halfW;
    row.push(vertex(x,y,z,skin.bones,skin.ws,u,0,s,
      (side===0?1.0:.82)*(.95-.1*u)+.03*Math.cos(s*PI*7)));
   }
   sheets[side].push(row);
  }
  for(let i=0;i<N;i++)for(let k=0;k<M;k++){
   const a=sheets[side][i][k],b=sheets[side][i+1][k],
     c=sheets[side][i][k+1],d=sheets[side][i+1][k+1];
   if(side===0)ix.push(a,b,c,c,b,d);else ix.push(a,c,b,c,d,b);
  }
 }
 // Close its edges for a genuine continuous volume.
 for(let i=0;i<N;i++)for(let edge of [0,M]){
  const a=sheets[0][i][edge],b=sheets[0][i+1][edge],
    c=sheets[1][i][edge],d=sheets[1][i+1][edge];
  ix.push(a,c,b,b,c,d);
 }
 for(let k=0;k<M;k++)for(let edge of [0,N]){
  const a=sheets[0][edge][k],b=sheets[0][edge][k+1],
    c=sheets[1][edge][k],d=sheets[1][edge][k+1];
  ix.push(a,b,c,b,d,c);
 }
 // ONE continuous tapered plume streaming behind the rump.
 // Skinning to the stable Back bone avoids the Tail1..7 double-animation bug.
 const R=44,S=18,rows=[],bones=[1,0,0,0],ws=[1,0,0,0];
 for(let i=0;i<=R;i++){
  const u=i/R,mid=Math.sin(PI*u);
  const cy=.0194+.0226*options.tailSize*u;
  const cz=.0319+.0029*Math.sin(PI*.93*u)-.0046*u;
  const taper=Math.max(.055,Math.pow(1-u,.36));
  const rx=(.0011+.0033*Math.pow(Math.max(0,mid),.72))*taper*options.tailSize;
  const rz=(.0013+.0024*Math.pow(Math.max(0,mid),.78))*taper*options.tailSize;
  const row=[];
  for(let j=0;j<S;j++){
   const a=TAU*j/S,scallop=1+.075*Math.sin(a*5+u*6)+.05*Math.sin(a*9-u*8);
   const x=rx*Math.cos(a)*scallop+.00017*Math.sin(u*TAU);
   const y=cy+.00030*Math.sin(a*3+u*6)*mid;
   const z=cz+rz*Math.sin(a)*scallop;
   row.push(vertex(x,y,z,bones,ws,u,1,j/S,.86+.15*Math.max(0,Math.sin(a))));
  }
  rows.push(row);
 }
 for(let i=0;i<R;i++)for(let j=0;j<S;j++){
  const a=rows[i][j],b=rows[i][(j+1)%S],
    c=rows[i+1][j],d=rows[i+1][(j+1)%S];
  ix.push(a,c,b,b,c,d);
 }
 for(let j=1;j<S-1;j++){
  ix.push(rows[0][0],rows[0][j+1],rows[0][j]);
  ix.push(rows[R][0],rows[R][j],rows[R][j+1]);
 }
 // ITERATION 2: a sparse set of curved highlight locks integrated into the
 // SAME BufferGeometry. The full, continuous shell remains dominant.
 // These are slim tapered strands, not dozens of rigid plastic wedges.
 function strand(mane,id,count,flank=1){
  const SEG=19,CIRCLE=7,begin=p.length/3,phase=id*2.399963;
  const s=(id+.38)/count;
  const rootY=-.0293+.0179*s;
  const rootZ=.0444-.0068*s+.0004*Math.sin(PI*s);
  const skin=mane?nearest(rootY):{bones:[1,0,0,0],ws:[1,0,0,0]};
  const angle=TAU*id/count;
  for(let k=0;k<=SEG;k++){
   const u=k/SEG,bulge=Math.sin(PI*u),tip=Math.pow(u,4);
   let cx,cy,cz,width,depth;
   if(mane){
    const len=(.0067+.0015*Math.sin(s*PI))*
      options.maneSize*(.83+.22*Math.sin(phase));
    cy=rootY+len*u;
    cz=rootZ+.0031*bulge-.0009*u*u+.00018*Math.sin(phase+u*5);
    cx=flank*(.0013+.0027*bulge)*options.maneSize;
    width=(.00011+.00054*Math.pow(bulge,.70))*Math.pow(1-u,.23);
    depth=(.00017+.00029*bulge)*Math.pow(1-u,.28);
   }else{
    cy=.0194+.0226*options.tailSize*u+tip*.0017*Math.sin(phase);
    const centerZ=.0319+.0029*Math.sin(PI*.93*u)-.0046*u;
    const rx=(.0011+.0033*Math.pow(bulge,.72))*Math.max(.055,Math.pow(1-u,.36))*options.tailSize;
    const rz=(.0013+.0024*Math.pow(bulge,.78))*Math.max(.055,Math.pow(1-u,.36))*options.tailSize;
    cx=Math.cos(angle)*(rx+.00022);
    cz=centerZ+Math.sin(angle)*(rz+.00019);
    width=(.00011+.00052*bulge)*Math.pow(1-u,.32);
    depth=(.00012+.00032*bulge)*Math.pow(1-u,.35);
   }
   const narrow=Math.max(.025,Math.pow(1-u,.60));
   for(let a=0;a<CIRCLE;a++){
    const theta=TAU*a/CIRCLE;
    const dx=Math.cos(theta)*width*narrow;
    const dz=Math.sin(theta)*depth*narrow;
    const light=(.91+.11*Math.max(0,Math.sin(theta))+
      .035*Math.sin(phase))*(mane?1:.97);
    vertex(cx+dx,cy,cz+dz,skin.bones,skin.ws,u,mane?0:1,
      mane?s+id*.031:id/count+id*.011,light);
   }
  }
  for(let k=0;k<SEG;k++)for(let a=0;a<CIRCLE;a++){
   const v0=begin+k*CIRCLE+a,v1=begin+k*CIRCLE+(a+1)%CIRCLE,
     v2=begin+(k+1)*CIRCLE+a,v3=begin+(k+1)*CIRCLE+(a+1)%CIRCLE;
   ix.push(v0,v2,v1,v1,v2,v3);
  }
 }
 const maneHighlights=12,tailHighlights=8;
 for(let i=0;i<maneHighlights;i++){
  strand(true,i,maneHighlights,1);
  strand(true,i,maneHighlights,-1);
 }
 for(let i=0;i<tailHighlights;i++)strand(false,i,tailHighlights);
 const g=new THREE.BufferGeometry();
 g.setIndex(ix);
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setAttribute('hairU',new THREE.Float32BufferAttribute(section,1));
 g.setAttribute('hairRegion',new THREE.Float32BufferAttribute(region,1));
 g.setAttribute('hairStripe',new THREE.Float32BufferAttribute(stripe,1));
 g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function createBTC3DHeroGroom(root,options={}){
 const source=findHair(root);
 const settings={maneSize:clamp(options.maneSize??1.2,.65,1.85),
   tailSize:clamp(options.tailSize??1.1,.65,1.85)};
 const geometry=buildGeometry(source,settings);
 const material=new THREE.MeshPhysicalMaterial({
  color:options.color||'#392824',vertexColors:true,roughness:.84,
  sheen:.40,sheenColor:new THREE.Color('#72584a'),sheenRoughness:.79,
  metalness:0,clearcoat:0,side:THREE.DoubleSide,shadowSide:THREE.DoubleSide
 });
 const anim={clock:{value:0},amount:{value:.62}};
 material.onBeforeCompile=shader=>{
  shader.uniforms.hairClock=anim.clock;shader.uniforms.hairAmount=anim.amount;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
    '#include <common>\nattribute float hairU;\nattribute float hairRegion;\nattribute float hairStripe;\nvarying vec3 hairData;\nuniform float hairClock;\nuniform float hairAmount;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nhairData=vec3(hairU,hairRegion,hairStripe);\nfloat w=hairU*hairU*(3.0-2.0*hairU)*hairAmount;\nfloat a=sin(hairClock*6.1-hairStripe*8.0-hairU*5.1);\nfloat b=sin(hairClock*3.8-hairU*7.3+hairStripe*5.4);\ntransformed.x+=w*mix(a*.00031,b*.00049,hairRegion);\ntransformed.z+=w*mix(a*.00030,b*.00037,hairRegion);\ntransformed.y+=w*mix(a*.00015,b*.00028,hairRegion);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
    '#include <common>\nvarying vec3 hairData;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
    '#include <color_fragment>\nfloat fibers=.5+.5*sin(hairData.z*165.0+hairData.x*33.0);\nfloat rootD=1.0-.22*(1.0-smoothstep(0.0,.25,hairData.x));\ndiffuseColor.rgb*=rootD*(.91+.08*fibers+.05*smoothstep(.7,1.0,hairData.x));');
 };
 material.customProgramCacheKey=()=>GROOM_VERSION;
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='BTC · continuous mane and tail volume';
 mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 const oldVisible=source.visible;
 source.visible=false;
 let disposed=false;
 return {
  get snapshot(){return {version:GROOM_VERSION,mode:'continuous-volume',
    maneBodies:1,tailBodies:1,maneHighlightStrands:24,tailHighlightStrands:8,oldHairHidden:!source.visible,
    vertices:geometry.attributes.position.count,modelPreserved:true,
    jockey:false,disposed};},
  update(dt,{wind=1,speed=1,running=true}={}){
   if(disposed)return;
   anim.clock.value+=clamp(dt,0,.05)*(.68+.3*clamp(speed,.3,2));
   anim.amount.value=(running?.46:.15)+.17*clamp(wind,0,2);
  },
  setColor(c){if(!disposed)material.color.set(c);},
  dispose(){
   if(disposed)return;disposed=true;
   source.visible=oldVisible;mesh.removeFromParent();
   geometry.dispose();material.dispose();
  }
 };
}
