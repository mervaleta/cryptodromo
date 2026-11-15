/**
 * BTC · CC0 groom study, derived from the original Quaternius Horse Hair skinned mesh.
 * Original Horse from Quaternius Ultimate Animated Animal Pack, CC0 1.0.
 * Uses its native Hair primitive as the geometric scalp and the native skeleton
 * as a skinning source. All original gallop/other animations remain untouched.
 * No Amitesh Nandan (BY-ND) or WildMesh (BY-NC) asset used.
 */
import * as THREE from 'three';
export const CRP_CC0_GROOM_BUILD='btc-cc0-groom-20261115-a1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function skinAt(skinIndex,skinWeight,triangle,coeff){
 const contributions=new Map();
 for(let k=0;k<3;k++){
  const v=triangle[k];
  for(let j=0;j<4;j++){
   const idx=skinIndex.getComponent(v,j),w=skinWeight.getComponent(v,j)*coeff[k];
   if(w>.00001)contributions.set(idx,(contributions.get(idx)||0)+w);
  }
 }
 const list=[...contributions].sort((a,b)=>b[1]-a[1]).slice(0,4);
 const sum=list.reduce((a,b)=>a+b[1],0)||1;
 return {indices:[...Array(4)].map((_,j)=>list[j]?.[0]||0),weights:[...Array(4)].map((_,j)=>(list[j]?.[1]||0)/sum)};
}
function createStrandGeometry(source,kind,count,seed){
 const g=source.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
 const si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');
 if(!p||!si||!sw)throw Error('Expected native Quaternius hair skinning attributes');
 const ix=g.getIndex();
 const faceCount=ix?ix.count/3:p.count/3;
 const candidates=[];
 let total=0;
 const pa=new THREE.Vector3(),pb=new THREE.Vector3(),pc=new THREE.Vector3();
 for(let f=0;f<faceCount;f++){
  const a=ix?ix.getX(f*3):f*3,b=ix?ix.getX(f*3+1):f*3+1,c=ix?ix.getX(f*3+2):f*3+2;
  pa.fromBufferAttribute(p,a);pb.fromBufferAttribute(p,b);pc.fromBufferAttribute(p,c);
  const centerY=(pa.y+pb.y+pc.y)/3;
  if(kind==='mane'&&!(centerY<-.005))continue;
  if(kind==='tail'&&!(centerY>.005))continue;
  const area=pb.clone().sub(pa).cross(pc.clone().sub(pa)).length()*.5;
  if(area<1e-12)continue;
  total+=area;candidates.push({a,b,c,upto:total});
 }
 if(!candidates.length)throw Error('No CC0 '+kind+' faces found');
 const random=rng(seed);const positions=[],colors=[],weights=[],indices=[],prog=[],phases=[],skinIndices=[],uvs=[];
 const side=new THREE.Vector3(),base=new THREE.Vector3(),normal=new THREE.Vector3(),direction=new THREE.Vector3();
 const dark=new THREE.Color(kind==='mane'?'#251811':'#261910');
 const copper=new THREE.Color(kind==='mane'?'#68402a':'#61402b');
 for(let strand=0;strand<count;strand++){
  const target=random()*total;
  let lo=0,hi=candidates.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(candidates[mid].upto<target)lo=mid+1;else hi=mid;}
  const face=candidates[lo],triangle=[face.a,face.b,face.c];
  const v0=new THREE.Vector3().fromBufferAttribute(p,face.a),v1=new THREE.Vector3().fromBufferAttribute(p,face.b),v2=new THREE.Vector3().fromBufferAttribute(p,face.c);
  let u=random(),v=random();if(u+v>1){u=1-u;v=1-v;}const coeff=[1-u-v,u,v];
  base.copy(v0).multiplyScalar(coeff[0]).addScaledVector(v1,coeff[1]).addScaledVector(v2,coeff[2]);
  if(n){normal.fromBufferAttribute(n,face.a).multiplyScalar(coeff[0]).addScaledVector(new THREE.Vector3().fromBufferAttribute(n,face.b),coeff[1]).addScaledVector(new THREE.Vector3().fromBufferAttribute(n,face.c),coeff[2]).normalize();}
  else normal.set(1,0,0);
  // Native Quaternius Hair geometry: mane on negative-Y; tail on positive-Y.
  direction.set((random()-.5)*.33,kind==='mane'?.65:.50,kind==='mane'?-1.00:-1.25).normalize();
  direction.addScaledVector(normal,(random()-.5)*.20).normalize();
  side.crossVectors(direction,normal).normalize();if(side.lengthSq()<.1)side.set(1,0,0);
  const length=(kind==='mane'?.0015:.0042)+(random()*(kind==='mane'?.0037:.0065));
  const width=(kind==='mane'?.000064:.000073)+(random()*.00012);
  const phase=random()*Math.PI*2,brightness=.45+random()*.55;
  const color=dark.clone().lerp(copper,brightness),skin=skinAt(si,sw,triangle,coeff);
  const baseVertex=positions.length/3;
  for(let step=0;step<=3;step++){
   const t=step/3;
   const tip=base.clone().addScaledVector(direction,length*t).addScaledVector(normal,.00012*t*t);
   const w=width*Math.pow(1-t,1.25)+.000006;
   for(let s of [-1,1]){
    const at=tip.clone().addScaledVector(side,w*s);
    positions.push(at.x,at.y,at.z);
    colors.push(color.r*(1-t*.13),color.g*(1-t*.11),color.b*(1-t*.08));
    skinIndices.push(...skin.indices);weights.push(...skin.weights);
    prog.push(t);phases.push(phase);uvs.push(s===-1?0:1,t);
   }
   if(step<3){const i=baseVertex+step*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
  }
 }
 const out=new THREE.BufferGeometry();
 out.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 out.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 out.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));
 out.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 out.setAttribute('hairProgress',new THREE.Float32BufferAttribute(prog,1));
 out.setAttribute('hairSeed',new THREE.Float32BufferAttribute(phases,1));
 out.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 out.setIndex(indices);out.computeVertexNormals();
 return {geometry:out,strands:count,triangles:indices.length/3,faces:candidates.length};
}
function makeMaterial(){
 const m=new THREE.MeshStandardMaterial({color:'#faf1dc',vertexColors:true,side:THREE.DoubleSide,roughness:.88,metalness:0});
 const clock={value:0};
 m.onBeforeCompile=shader=>{
  shader.uniforms.uCRPHairTime=clock;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nattribute float hairProgress;\nattribute float hairSeed;\nuniform float uCRPHairTime;`);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nfloat crpSway=sin(uCRPHairTime*8.7+hairSeed*1.71)*.00013+sin(uCRPHairTime*5.2+hairSeed*.73)*.000075;\ntransformed.x+=crpSway*hairProgress*hairProgress;\ntransformed.y+=cos(uCRPHairTime*5.7+hairSeed)*.000052*hairProgress*hairProgress;`);
 };
 m.customProgramCacheKey=()=>CRP_CC0_GROOM_BUILD;
 return {material:m,clock};
}
export function createBTCCC0Groom(root,{maneStrands=1350,tailStrands=960}={}){
 const source=[];
 root.traverse(obj=>{
  if(!obj.isSkinnedMesh)return;
  const mats=Array.isArray(obj.material)?obj.material:[obj.material];
  if(mats.some(m=>m?.name==='Hair')&&obj.geometry.getAttribute('skinIndex')&&obj.skeleton)source.push(obj);
 });
 if(!source.length)throw Error('CC0 groom needs original Quaternius Hair skinned mesh');
 const hair=source.sort((a,b)=>b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0];
 const group=[],stats={build:CRP_CC0_GROOM_BUILD,source:'Quaternius Horse CC0 Hair',sourceCount:hair.geometry.getAttribute('position').count};
 for(const [kind,count,seed] of [['mane',maneStrands,0xb71c0],['tail',tailStrands,0x70a11]]){
  const strand=createStrandGeometry(hair,kind,count,seed);
  const {material,clock}=makeMaterial();
  const mesh=new THREE.SkinnedMesh(strand.geometry,material);
  mesh.name='BTC_CC0_'+kind.toUpperCase()+'_RIBBONS';
  mesh.position.copy(hair.position);mesh.quaternion.copy(hair.quaternion);mesh.scale.copy(hair.scale);
  mesh.bindMode=hair.bindMode;mesh.bind(hair.skeleton,hair.bindMatrix.clone());
  mesh.bindMatrixInverse.copy(hair.bindMatrixInverse);
  mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
  hair.parent.add(mesh);
  group.push({mesh,clock});stats[kind]={strands:count,triangles:strand.triangles,sourceTriangles:strand.faces};
 }
 let time=0;
 return {stats,update(dt,speed=1){time+=clamp(dt,0,.08)*clamp(speed,.2,2);group.forEach(o=>o.clock.value=time);},
  dispose(){for(const {mesh} of group){mesh.parent?.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}}};
}