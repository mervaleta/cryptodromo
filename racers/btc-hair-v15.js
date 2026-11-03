/**
 * BTC Mane & Tail Atelier v1.5 (visual pilot only).
 * Procedural vertex deformation of the ORIGINAL skinned Hair primitive.
 * No new meshes, images or skeleton overrides. All offsets happen before skinning.
 * Neck mane: rest-space y < -0.011. Tail: y > 0.015. These coordinates are
 * verified against the existing Quaternius GLB; fail closed on replacement.
 */
export const BTC_HAIR_VERSION='btc-mane-tail-v15';
const BEGIN='#include <begin_vertex>';
const COMMON='#include <common>';
const COLOR='#include <color_fragment>';
const clamp=(x,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(x))?Number(x):min));
const TAU=Math.PI*2;
const uniformsDecl=`
uniform float crpHair15Time;
uniform float crpHair15ManeBend;
uniform float crpHair15TailBend;
uniform float crpHair15Air;
uniform float crpHair15Gallop;
varying vec3 crpHair15Rest;
`;
const vertexEffect=`
  crpHair15Rest=position;
  // The original single skinned "Hair" primitive has two disjoint parts.
  // Disjoint coordinate masks prevent either region changing the other.
  float crpHair15ManeRegion=1.0-smoothstep(-0.012,-0.008,position.y);
  float crpHair15TailRegion=smoothstep(0.012,0.016,position.y);
  float crpHair15NeckLine=0.03615+clamp(-position.y-0.012,0.0,0.018)*0.45;
  float crpHair15ManeTip=smoothstep(0.00025,0.0036,position.z-crpHair15NeckLine);
  float crpHair15TailTip=1.0-smoothstep(0.016,0.0325,position.z);
  float crpHair15ManeWeight=crpHair15ManeRegion*crpHair15ManeTip*crpHair15ManeTip;
  float crpHair15TailWeight=crpHair15TailRegion*crpHair15TailTip*crpHair15TailTip;
  // Three different traveling waves break the rigid "single flag" movement.
  float crpHair15Phase=position.y*540.0+position.x*710.0;
  float crpHair15Flow=
       0.54*sin(crpHair15Time*8.1-crpHair15Phase)
      +0.29*sin(crpHair15Time*12.6+position.y*860.0-position.x*340.0)
      +0.17*sin(crpHair15Time*17.4+position.z*1170.0+position.x*430.0);
  float crpHair15TailFlow=
       0.67*sin(crpHair15Time*5.4+position.z*360.0+position.x*440.0)
      +0.33*sin(crpHair15Time*9.8-position.z*660.0-position.x*620.0);
  float crpHair15GaitPulse=sin(crpHair15Time*10.7+position.y*120.0);
  float crpHair15ManeDrift=(crpHair15ManeBend*0.00145+
           crpHair15Flow*crpHair15Air*0.00043);
  transformed.z+=crpHair15ManeWeight*crpHair15ManeDrift;
  transformed.y+=crpHair15ManeWeight*(
      crpHair15ManeBend*0.00074+
      (crpHair15Flow*0.00023+crpHair15GaitPulse*0.00018*crpHair15Gallop)*crpHair15Air);
  transformed.x+=crpHair15ManeWeight*(
      0.00027*crpHair15Flow*crpHair15Air+
      0.00020*sin(crpHair15Time*4.0+position.y*780.0));
  // Tail follows a slower, heavier spring than the neck hair. Its root stays put.
  transformed.x+=crpHair15TailWeight*(
      crpHair15TailBend*0.00150+
      crpHair15TailFlow*crpHair15Air*0.00082);
  transformed.y+=crpHair15TailWeight*(
      crpHair15TailBend*0.00046+
      sin(crpHair15Time*6.4+position.z*310.0)*crpHair15Air*0.00038);
  transformed.z+=crpHair15TailWeight*(
      -0.00046*crpHair15Air+
      0.00022*crpHair15TailFlow*crpHair15Air);
`;
const fragmentCommon='varying vec3 crpHair15Rest;';
const fragmentSheen=`
  // Small analytic fiber breakup: no PNG, no CanvasTexture, no extra draw calls.
  float crpHair15Fiber=sin(crpHair15Rest.y*1180.0+crpHair15Rest.z*670.0);
  float crpHair15Fine=sin(crpHair15Rest.z*1910.0-crpHair15Rest.x*1540.0);
  diffuseColor.rgb*=0.974+0.018*crpHair15Fiber+0.012*crpHair15Fine;
`;

/** Mirrors the two weighted tip masks, useful for testing geometry isolation. */
export function hairRegionWeights(x,y,z){
 const smooth=(a,b,n)=>{let t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t)};
 const neck=1-smooth(-.012,-.008,y),tail=smooth(.012,.016,y);
 const line=.03615+clamp(-y-.012,0,.018)*.45;
 const m=smooth(.00025,.0036,z-line),t=1-smooth(.016,.0325,z);
 return {mane:neck*m*m,tail:tail*t*t};
}
export function isCompatibleHair(mesh){
 if(!mesh?.isSkinnedMesh||!mesh.geometry?.attributes?.position)return false;
 const pos=mesh.geometry.attributes.position;
 if(pos.count<300||pos.count>900)return false;
 if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox?.();
 const b=mesh.geometry.boundingBox;
 return !!b&&Math.abs(b.min.y+.029727)<.006&&
   Math.abs(b.max.y-.022233)<.006&&Math.abs(b.min.z-.014485)<.006&&
   Math.abs(b.max.z-.045763)<.006;
}

function springStep(state,target,stiffness,friction,dt){
 const acceleration=(target-state.position)*stiffness-state.velocity*friction;
 state.velocity=clamp(state.velocity+acceleration*dt,-8,8);
 state.position=clamp(state.position+state.velocity*dt,-2.3,2.3);
}
export function createBTCHairAtelier(root){
 if(!root?.traverse)throw new TypeError('Horse Object3D required');
 const channels=[],seen=new Set();
 root.traverse(mesh=>{
  if(!isCompatibleHair(mesh))return;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const material of materials){
   if(material?.name!=='Hair'||seen.has(material))continue;
   seen.add(material);
   const u={
    time:{value:0},mane:{value:0},tail:{value:0},air:{value:0},gallop:{value:0}
   };
   const previousCompile=material.onBeforeCompile;
   const previousKey=material.customProgramCacheKey?.bind(material);
   material.onBeforeCompile=function(shader,renderer){
    previousCompile?.call(this,shader,renderer);
    if(!shader.vertexShader?.includes(BEGIN)||
       !shader.vertexShader.includes(COMMON)||
       !shader.fragmentShader?.includes(COLOR))return;
    Object.assign(shader.uniforms,{
     crpHair15Time:u.time,crpHair15ManeBend:u.mane,
     crpHair15TailBend:u.tail,crpHair15Air:u.air,
     crpHair15Gallop:u.gallop
    });
    shader.vertexShader=shader.vertexShader.replace(COMMON,COMMON+'\n'+uniformsDecl);
    shader.vertexShader=shader.vertexShader.replace(BEGIN,BEGIN+'\n'+vertexEffect);
    shader.fragmentShader=shader.fragmentShader.replace(COMMON,COMMON+'\n'+fragmentCommon);
    shader.fragmentShader=shader.fragmentShader.replace(COLOR,COLOR+'\n'+fragmentSheen);
   };
   material.customProgramCacheKey=()=>String(previousKey?.()||'')+'|'+BTC_HAIR_VERSION;
   material.roughness=.66;
   material.needsUpdate=true;
   channels.push({u,material,previousCompile,previousKey});
  }
 });
 const mane={position:0,velocity:0},tail={position:0,velocity:0};
 let time=0,lastSpeed=0,active=true;
 return {
  get channelCount(){return active?channels.length:0;},
  get snapshot(){return {version:BTC_HAIR_VERSION,mane:channels[0]?.u.mane.value||0,
    tail:channels[0]?.u.tail.value||0,air:channels[0]?.u.air.value||0,
    channels:active?channels.length:0};},
  update(delta,{wind=1,speed=1,phase=0,running=true}={}){
   if(!active)return;
   const dt=clamp(delta,0,.05);
   if(dt<=0)return;
   time+=dt;
   const rate=clamp(speed,0,2),w=clamp(wind,0,2);
   const gust=.07*Math.sin(time*.93)+.055*Math.sin(time*1.67+.7);
   const air=clamp(.11+w*.40+(running?rate*.53:0)+gust,0,2.15);
   const acceleration=clamp((rate-lastSpeed)/Math.max(dt,.01),-2.5,2.5);
   lastSpeed+=(rate-lastSpeed)*(1-Math.exp(-dt*5.5));
   const bounce=running?Math.sin(TAU*clamp(phase,0,1))*.19:0;
   springStep(mane,air*.68-acceleration*.13+bounce,29,9.6,dt);
   springStep(tail,air*.61+acceleration*.10-bounce*.55,14,6.8,dt);
   for(const {u} of channels){
    u.time.value=time;
    u.mane.value=mane.position;
    u.tail.value=tail.position;
    u.air.value=air;
    u.gallop.value=running?clamp(rate,0,1.6):0;
   }
  },
  dispose(){
   if(!active)return;
   active=false;
   for(const {material,previousCompile,previousKey} of channels){
    material.onBeforeCompile=previousCompile;
    if(previousKey)material.customProgramCacheKey=previousKey;
    material.needsUpdate=true;
   }
   channels.length=0;
  }
 };
}
