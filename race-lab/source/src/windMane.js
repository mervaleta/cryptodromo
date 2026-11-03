/**
 * Lightweight, shader-only mane motion for the existing Cryptódromo horse GLB.
 *
 * The current GLB's "Hair" skinned primitive contains two disconnected parts:
 * the mane (rest-space Y -0.030..-0.011) and tail (Y +0.016..+0.022).
 * A small, tip-weighted displacement runs BEFORE skinning, so it follows
 * Neck1/Neck2/Neck3/Head during Gallop, Walk and Idle. No new draw calls,
 * planes, bones, textures or geometry clones are created.
 *
 * Geometry signature checks deliberately fail closed if the GLB changes.
 */
const VERSION='crp-mane-wind-v1';
const BEGIN='#include <begin_vertex>';
const COMMON='#include <common>';
const VERTEX_UNIFORMS=`
uniform float crpManeTime;
uniform float crpManeMotion;
`;
const VERTEX_DISPLACEMENT=`
  // Rest-space negative Y is the neck; positive Y is the TAIL (untouched).
  float crpManeLine=0.03615+clamp(-position.y-0.012,0.0,0.018)*0.45;
  float crpManeTip=(1.0-smoothstep(-0.011,-0.007,position.y))*
    smoothstep(0.0002,0.0018,position.z-crpManeLine);
  float crpManeWave=0.72*sin(crpManeTime*6.1+position.y*350.0+position.x*650.0)+
    0.28*sin(crpManeTime*3.7+position.y*210.0);
  // 12-18% longer near the tips, with a small backward/upward breeze.
  transformed.z+=crpManeTip*(0.00038+crpManeMotion*crpManeWave*0.00018);
  transformed.y+=crpManeTip*(0.00016+crpManeMotion*(0.00016+crpManeWave*0.00012));
  transformed.x+=crpManeTip*crpManeMotion*0.00012*
    sin(crpManeTime*4.7+position.y*310.0);
`;

const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):min));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

/** CPU mirror of the GLSL tip mask, for asset and regression verification. */
export function maneTipWeight(x,y,z){
 const line=0.03615+clamp(-y-0.012,0,0.018)*0.45;
 return (1-smooth(-0.011,-0.007,y))*smooth(0.0002,0.0018,z-line);
}

/** Guard against deforming a replacement horse, its tail, or another material. */
export function isSupportedManeGeometry(mesh){
 const geometry=mesh?.geometry,position=geometry?.attributes?.position;
 if(!mesh?.isSkinnedMesh||!position||position.count<100||position.count>3000)return false;
 if(!geometry.boundingBox)geometry.computeBoundingBox?.();
 const box=geometry.boundingBox;
 return !!box&&box.min.y<-.025&&box.max.y>.015&&
   box.min.z<.020&&box.max.z>.043&&box.min.x<-.001&&box.max.x>.001;
}

/**
 * The materials passed in must already be cloned PER HORSE by horse.js.
 * update() adjusts only uniform values; it never alters the animation mixer.
 */
export function createWindMane(bindings,{seed=0}={}){
 const channels=[];
 for(const {material,name,mesh} of bindings){
  if(name!=='Hair'||!material||!isSupportedManeGeometry(mesh))continue;
  const uniforms={
   time:{value:clamp(seed,0,100)*2.7},
   motion:{value:0}
  };
  const previousCompile=material.onBeforeCompile;
  const previousKey=material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile=function(shader,renderer){
   previousCompile?.call(this,shader,renderer);
   if(!shader.vertexShader?.includes(BEGIN)||!shader.vertexShader.includes(COMMON))return;
   shader.uniforms.crpManeTime=uniforms.time;
   shader.uniforms.crpManeMotion=uniforms.motion;
   shader.vertexShader=shader.vertexShader.replace(COMMON,COMMON+'\\n'+VERTEX_UNIFORMS);
   shader.vertexShader=shader.vertexShader.replace(BEGIN,BEGIN+'\\n'+VERTEX_DISPLACEMENT);
  };
  material.customProgramCacheKey=()=>VERSION+'|'+(previousKey?.()||'');
  material.needsUpdate=true;
  channels.push(uniforms);
 }
 let active=true;
 return {
  get enabled(){return active&&channels.length>0;},
  get channelCount(){return active?channels.length:0;},
  update(delta,{wind=.55,speed=1,reducedMotion=false}={}){
   if(!active)return;
   const dt=clamp(delta,0,.1),rate=clamp(speed,0,3.5);
   const motion=reducedMotion?0:clamp(.12+clamp(wind,0,2)*.43+rate*.13,0,1.4);
   for(const channel of channels){
    channel.time.value+=dt*(.85+rate*.23);
    channel.motion.value=motion;
   }
  },
  dispose(){active=false;channels.length=0;}
 };
}
