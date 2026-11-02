/**
 * Alpha15 staged quality governor. Measures frame times without browser APIs
 * and returns recommendations only. It NEVER changes race time or physics.
 * Scene integration will decide how/when to apply renderer settings.
 */
export const QUALITY_LEVELS=Object.freeze({
 eco:Object.freeze({name:'eco',pixelRatioCap:.85,shadowResolution:512,
   crowdFactor:.27,sceneryFactor:.35,particleFactor:.33,postEffects:false}),
 balanced:Object.freeze({name:'balanced',pixelRatioCap:1.15,shadowResolution:768,
   crowdFactor:.64,sceneryFactor:.65,particleFactor:.66,postEffects:true}),
 cinematic:Object.freeze({name:'cinematic',pixelRatioCap:1.6,shadowResolution:1536,
   crowdFactor:1,sceneryFactor:1,particleFactor:1,postEffects:true})
});
const ORDER=['eco','balanced','cinematic'];
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
export function recommendQuality({softwareGPU=false,mobile=false,deviceMemory=4,
 hardwareConcurrency=4,saveData=false,reducedMotion=false}={}){
 if(softwareGPU||saveData||finite(deviceMemory,4)<=2||finite(hardwareConcurrency,4)<=2)return 'eco';
 if(mobile||reducedMotion||finite(deviceMemory,4)<6)return 'balanced';
 return 'cinematic';
}
export function rendererSettings(name,{devicePixelRatio=1}={}){
 if(!QUALITY_LEVELS[name])throw new RangeError('Unknown graphics preset: '+name);
 const p=QUALITY_LEVELS[name];
 return Object.freeze({...p,pixelRatio:Math.max(.5,Math.min(clamp(finite(devicePixelRatio,1),.5,4),p.pixelRatioCap))});
}
/**
 * A moving frame-window with dual thresholds and cooldown.
 * Records visual FPS only. No timers or globals.
 */
export function createQualityGovernor({initial='balanced',window=90,
 degradeBelow=33,upgradeAbove=54,minSamples=45,cooldownMs=20000}={}){
 if(!QUALITY_LEVELS[initial])throw new RangeError('Invalid initial quality');
 let level=initial,lastChanged=-Infinity;const frameTimes=[];
 return {
  sample(frameMs,nowMs){
   const frame=finite(frameMs,NaN),now=finite(nowMs,NaN);
   if(!Number.isFinite(frame)||!Number.isFinite(now)||frame<=0)return {level,changed:false,reason:'invalid-sample'};
   frameTimes.push(clamp(frame,1,200));
   if(frameTimes.length>Math.max(4,window))frameTimes.shift();
   const fps=1000/(frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length);
   if(frameTimes.length<minSamples)return {level,changed:false,fps,reason:'warmup'};
   if(now-lastChanged<cooldownMs)return {level,changed:false,fps,reason:'cooldown'};
   const idx=ORDER.indexOf(level);
   let next=level;
   if(fps<degradeBelow&&idx>0)next=ORDER[idx-1];
   if(fps>upgradeAbove&&idx<ORDER.length-1)next=ORDER[idx+1];
   if(next===level)return {level,changed:false,fps,reason:'stable'};
   level=next;lastChanged=now;frameTimes.length=0;
   return {level,changed:true,fps,reason:fps<degradeBelow?'low-fps':'surplus-fps'};
  },
  reset(next='balanced'){
   if(!QUALITY_LEVELS[next])throw new RangeError('Invalid quality');
   level=next;lastChanged=-Infinity;frameTimes.length=0;
  },
  get level(){return level;},
  get profile(){return QUALITY_LEVELS[level];}
 };
}
