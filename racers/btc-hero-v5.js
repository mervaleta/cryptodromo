/**
 * BTC V5 motion and silhouette passes.
 * Built on the real skinned original GLB and the proven V4 geometric groom.
 * No baked frames, images, video textures or external model replacement.
 * Each pass is cumulative, view with ?btcPass=1..10#BTC on this branch.
 */
import * as THREE from 'three';
import {createBTCHeroV4} from './btc-hero-v4.js?v=btc-real-hero-v4-20261103';
import {createBTCSilkShell} from './btc-silk-shell-v5.js?v=btc-silk-shell-v5-20261103';
export const BTC_HERO_V5='btc-v5-motion-study-20261103';
const PI=Math.PI,TAU=PI*2;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
const smooth=v=>{const x=clamp(v,0,1);return x*x*(3-2*x);};
const gauss=(v,c,r)=>Math.exp(-Math.pow((v-c)/r,2));

export function createBTCHeroV5(root,options={}){
 const pass=Math.floor(clamp(options.pass??10,1,10));
 const base=createBTCHeroV4(root,options);
 let groom=null;
 const coats=[];
 root.traverse(n=>{
  if(n.isSkinnedMesh&&n.name==='BTC real hero V4 silky mane and tail')groom=n;
  if(n.isSkinnedMesh&&[n.material].flat().some(m=>m?.name==='Main'||m?.name==='Main_Light'))coats.push(n);
 });
 if(!groom){base.dispose();throw new Error('BTC V5: V4 groom unavailable');}
 const geometry=groom.geometry;
 const position=geometry.getAttribute('position');
 const uAttr=geometry.getAttribute('hairTip');
 const idAttr=geometry.getAttribute('hairStrand');
 const region=geometry.getAttribute('hairTail');
 if(!position||!uAttr||!idAttr||!region){
  base.dispose();throw new Error('BTC V5: missing groom vertex metadata');
 }
 const passes=['01 GLB original, Gallop y V4 protegidos'];
 const originalMaterials=new Map();
 const restoreMats=()=>{
  for(const [m,s] of originalMaterials){
   m.roughness=s.roughness;m.sheen=s.sheen;
   m.transparent=s.transparent;m.opacity=s.opacity;m.depthWrite=s.depthWrite;
   m.sheenColor.copy(s.sheenColor);m.sheenRoughness=s.sheenRoughness;
   m.onBeforeCompile=s.onBeforeCompile;m.customProgramCacheKey=s.cacheKey;
   m.needsUpdate=true;
  }
 };
 function saveMat(m){
  if(!originalMaterials.has(m))originalMaterials.set(m,{
   roughness:m.roughness,sheen:m.sheen,sheenColor:m.sheenColor.clone(),
   transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,
   sheenRoughness:m.sheenRoughness,
   onBeforeCompile:m.onBeforeCompile,cacheKey:m.customProgramCacheKey
  });
 }

 // Each group of 6 vertices is a cross-section of an actual skinned hair lock.
 // Sculpt the centerline while keeping the root position and all skin weights.
 for(let i=0;i<position.count;i+=6){
  const u=uAttr.getX(i),tail=region.getX(i)>.5;
  const strand=idAttr.getX(i),t=smooth(u);
  const p=Math.sin(strand*3.27),q=Math.cos(strand*2.41);
  let dx=0,dy=0,dz=0,width=1;
  if(!tail){
   if(pass>=2){
    // Broad wave: continuous from crown, individual wisps catch the flow.
    dy+=t*(.00130+.00065*p);
    dz+=Math.sin(PI*u)*(.00035+.00044*q)+t*(.00063+.00045*p);
    width*=1.15-.17*t;
   }
   if(pass>=4){
    // Main crest flows in a coherent wave rather than uniform hedgehog spikes.
    dy+=.0009*t;
    dz+=.00085*Math.sin(PI*u*.85+strand*.16)*t;
   }
   if(pass>=10){
    // Feathered ends at differing lengths without changing the root binding.
    dy+=t*(.00042*p);
    dz+=t*(.00024*q);
    width*=1-.14*t;
   }
  }else{
   if(pass>=3){
    // Tail bends into an S and transitions from thick root to silky wisps.
    dy+=t*(-.0065+.0010*p);
    dz+=Math.sin(PI*u)*(.0011+.0005*p)+t*(.0072+.0007*q);
    dx+=t*(.0010*p);
    width*=1.30-.35*t;
   }
   if(pass>=4){
    dy+=.0006*t;
    dz+=.0008*Math.sin(PI*u*1.7+strand*.12)*t;
   }
   if(pass>=10){
    dy+=.0004*t*q;dz+=.0004*t*p;
    width*=1-.19*t;
   }
  }
  // Radial scaling about the ring centroid, preserving rounded fiber shading.
  let cx=0,cz=0;
  for(let j=0;j<6;j++){cx+=position.getX(i+j);cz+=position.getZ(i+j);}
  cx/=6;cz/=6;
  for(let j=0;j<6;j++){
   const k=i+j,x=position.getX(k),y=position.getY(k),z=position.getZ(k);
   position.setXYZ(k,cx+(x-cx)*width+dx,y+dy,cz+(z-cz)*width+dz);
  }
 }
 if(pass>=2)passes.push('02 Crin con ondas anchas y puntas escalonadas');
 if(pass>=3)passes.push('03 Cola más larga, taper y barrido curvo');
 if(pass>=4)passes.push('04 Línea de crin y cola más orgánica');
 if(pass>=2){
  position.needsUpdate=true;
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
 }

 // Preserve imported vertex normals to avoid the faceting regression in V4.
 const backups=[];
 if(pass>=5){
  for(const coat of coats){
   const p=coat.geometry.getAttribute('position');
   if(!p)continue;
   const coords=p.array.slice();
   backups.push({p,coords,geometry:coat.geometry});
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const flank=gauss(y,.010,.011)*gauss(z,.021,.012);
    const shoulder=gauss(y,-.017,.009)*gauss(z,.028,.012);
    const crest=gauss(y,-.020,.012)*gauss(z,.037,.009);
    const muscle=.055*flank+.07*shoulder;
    p.setXYZ(i,x*(1+muscle),y,z+.00018*crest+.00015*flank);
   }
   p.needsUpdate=true;coat.geometry.computeBoundingSphere();
  }
  passes.push('05 Volumen corporal: hombros, cuello y grupa sin caras planas');
 }

 const hairMat=groom.material;
 const previousFiberShadow=groom.castShadow;
 saveMat(hairMat);
 // Keep the V4 procedural fibers as a translucent detail layer, not a wall
 // of spiky wires. The new silk shells carry the dominant hair silhouette.
 if(pass>=4){hairMat.transparent=true;hairMat.opacity=.28;
  hairMat.depthWrite=false;hairMat.needsUpdate=true;groom.castShadow=false;}

 if(pass>=6){
  hairMat.roughness=.56;hairMat.sheen=.95;
  hairMat.sheenColor.set('#b18462');hairMat.sheenRoughness=.45;
  hairMat.needsUpdate=true;
  passes.push('06 Seda con brillo anisotrópico aproximado, sombras en raíces');
 }

 // Physically inspired delayed response of a damped hair mass to the Gallop.
 // Uniform displacement operates before skeletal skinning and vanishes at roots.
 const m={mane:0,tail:0,vm:0,vt:0,time:0,energy:0,gait:0,wind:.95,step:0};
 const uni={mane:{value:0},tail:{value:0},clock:{value:0},wind:{value:1}};
 const silk=pass>=2?createBTCSilkShell(groom,{pass,maneSize:options.maneSize??1.22,tailSize:options.tailSize??1.16,color:options.color||'#392722'},uni):null;
 const previous=hairMat.onBeforeCompile;
 const prevKey=hairMat.customProgramCacheKey?.bind(hairMat);
 saveMat(hairMat);
 hairMat.onBeforeCompile=function(shader,renderer){
  previous?.call(this,shader,renderer);
  shader.uniforms.btcVMane=uni.mane;
  shader.uniforms.btcVTail=uni.tail;
  shader.uniforms.btcVClock=uni.clock;
  shader.uniforms.btcVWind=uni.wind;
  const anchor='attribute float hairTip;';
  const declarations=[
   'uniform float btcVMane;',
   'uniform float btcVTail;',
   'uniform float btcVClock;',
   'uniform float btcVWind;'
  ].join('\n');
  if(!shader.vertexShader.includes(anchor))throw new Error('BTC V5 shader missing hairTip');
  shader.vertexShader=shader.vertexShader.replace(anchor,declarations+'\n'+anchor);
  const oldLine='transformed.y+=lag*mix(flutter*.00017,drift*.00026,hairTail);';
  const code=[
   'float elastic=smoothstep(0.025,0.95,hairTip);',
   'elastic=elastic*elastic;',
   'float phaseShift=btcVClock*3.4-hairTip*5.5+hairStrand*.43;',
   'float secondary=sin(phaseShift)*cos(btcVClock*1.7-hairStrand*.39);',
   'float follow=mix(btcVMane,btcVTail,hairTail);',
   'float sideMotion=follow*elastic;',
   'transformed.z+=sideMotion*(1.0-.10*hairTail);',
   'transformed.x+=sideMotion*.47*cos(hairStrand*.17);',
   'transformed.y+=elastic*follow*mix(.45,.76,hairTail);',
   'transformed.z+=elastic*secondary*btcVWind*mix(.00009,.00022,hairTail);'
  ].join('\n');
  if(!shader.vertexShader.includes(oldLine))throw new Error('BTC V5 shader missing V4 displacement');
  shader.vertexShader=shader.vertexShader.replace(oldLine,oldLine+'\n'+code);
  if(pass>=4){
   // The old tubular tail is what created the wire curtain in rear views.
   // The skinned silk shell now owns the tail silhouette and casts its shadow.
   shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',
    '#include <alphatest_fragment>\nif(vHair.z > .5) discard;');
  }
  if(pass>=9){
   shader.fragmentShader=shader.fragmentShader.replace(
    'diffuseColor.rgb*=rootShade*(.955+.066*fine);',
    'diffuseColor.rgb*=rootShade*(.96+.055*fine);'
   );
  }
 };
 hairMat.customProgramCacheKey=()=>String(prevKey?.()||'')+'|btc-v5-p'+pass;
 hairMat.needsUpdate=true;
 if(pass>=7)passes.push('07 Simulación resorte amortiguado con retraso de la crin');
 if(pass>=8)passes.push('08 Cola con inercia distinta y oscilación progresiva');
 if(pass>=9)passes.push('09 Fibras con iluminación coherente sin exceso de ruido');
 if(pass>=10)passes.push('10 Puntas variadas, color y animación final');

 function integrate(dt,phase,wind,speed,running){
  const step=clamp(dt,0,.05);
  m.time+=step;
  m.gait=phase;
  m.wind=clamp(wind,0,2);
  const omega=TAU*phase;
  const drive=running?1:.24;
  const targetM=drive*(Math.sin(omega-.9)*.0010+
     .00032*Math.sin(m.time*3.3));
  const targetT=drive*(Math.sin(omega-2.15)*.0017+
     .00048*Math.sin(m.time*2.1));
  // Spring-damper integrated with small timesteps for fps independence.
  const n=Math.max(1,Math.ceil(step/.012));
  const h=step/n;
  for(let i=0;i<n;i++){
   m.vm+=(45*(targetM-m.mane)-13*m.vm)*h;
   m.vt+=(25*(targetT-m.tail)-9*m.vt)*h;
   m.mane+=m.vm*h;m.tail+=m.vt*h;
  }
  m.energy=.91*m.energy+.09*(Math.abs(m.mane)+Math.abs(m.tail));
  uni.mane.value=pass>=7?m.mane:0;
  uni.tail.value=pass>=8?m.tail:0;
  uni.clock.value=m.time;
  uni.wind.value=(pass>=8?1:.3)*(running?(.8+m.wind*.4):.18)*clamp(speed,.3,2);
 }
 let disposed=false;
 return {
  get snapshot(){return {...base.snapshot,version:BTC_HERO_V5,pass,passes,
   hairMotion:{mane:m.mane,tail:m.tail,energy:m.energy,time:m.time,gait:m.gait},
   motionType:'damped-gallop-coupled-spring',silkShellVertices:silk?.vertexCount||0,silkLocks:silk?.lockCount||0,source:'original-skinned-glb',
   noTextures:true,vertexCount:position.count};},
  update(dt,{wind=1,speed=1,running=true,phase=0}={}){
   if(disposed)return;
   base.update(dt,{wind:Math.min(wind,.85),speed,running});
   integrate(dt,phase,wind,speed,running);
  },
  setColor(color){base.setColor(color);},
  dispose(){
   if(disposed)return;disposed=true;
   silk?.dispose();groom.castShadow=previousFiberShadow;restoreMats();
   for(const o of backups){o.p.array.set(o.coords);o.p.needsUpdate=true;o.geometry.computeBoundingSphere();}
   base.dispose();
  }
 };
}
