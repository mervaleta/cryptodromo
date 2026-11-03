/**
 * Alpha21 broadcast locomotion director.
 * Controls only clip playback cadence and presentation cues; it NEVER changes
 * trackPoint, financial inputs, ranking, elapsed time or the official distance.
 * The existing GLB Gallop (.583 s), gaitRefiner and windMane remain authoritative
 * over bone poses. This removes the 3.15x high-speed "sewing machine" effect.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
export const GALLOP_CLIP_SECONDS=.583;
export const MOTION_LIMITS=Object.freeze({minRate:.86,maxRate:1.74,startRate:.90,maxDt:.10});
export function targetGallopRate(metersPerSecond,referenceSpeed=16.67){
 const ref=clamp(referenceSpeed,.1,1000);
 const ratio=clamp(metersPerSecond,0,1000)/ref;
 // At nominal race pace ~2.28 strides/s; the GLB clip is 1.715 cycles/s.
 // Faster horses lengthen stride as well as increase cadence.
 const rate=1.32+.29*Math.tanh((ratio-1)*1.1);
 return clamp(rate,MOTION_LIMITS.minRate,MOTION_LIMITS.maxRate);
}
export function motionCurve(seconds){
 const t=clamp(seconds,0,3);
 return t<.65?.90+.10*(t/.65):1;
}
export function createLocomotionDirector({count=12,referenceSpeed=16.67}={}){
 if(!Number.isInteger(count)||count<1||count>24)throw RangeError('Invalid runner count');
 const states=Array.from({length:count},()=>({rate:MOTION_LIMITS.startRate,velocity:0,accelerating:0}));
 let enabled=true;
 function reset(){for(const s of states){s.rate=MOTION_LIMITS.startRate;s.velocity=0;s.accelerating=0;}}
 function sample(index,{delta=0,metersPerSecond=0,reference=referenceSpeed,elapsed=0,phase='race'}={}){
  const s=states[index];
  if(!s)throw RangeError('Invalid runner');
  const dt=clamp(delta,0,MOTION_LIMITS.maxDt);
  const racing=phase==='race'||phase==='runout';
  if(!enabled||!racing)return {rate:1,impact:0,burst:0,stridesPerSecond:0,active:false};
  let target=targetGallopRate(metersPerSecond,reference)*motionCurve(elapsed);
  if(phase==='runout')target=clamp(target*.90,.86,1.74);
  // Two time constants make the horse accelerate with force and settle
  // more gently when losing speed. The driver follows, never predicts.
  const tau=target>s.rate?.23:.39;
  const alpha=1-Math.exp(-dt/tau);
  const previous=s.rate;
  s.rate=clamp(s.rate+(target-s.rate)*alpha,MOTION_LIMITS.minRate,MOTION_LIMITS.maxRate);
  s.accelerating=dt>0?(s.rate-previous)/dt:0;
  const speedRatio=clamp(metersPerSecond/Math.max(.1,reference),0,3.5);
  const burst=clamp((s.accelerating+.15)*.75,0,1);
  return {rate:s.rate,impact:clamp(.5+.35*speedRatio,0,1.4),
    burst,stridesPerSecond:s.rate/GALLOP_CLIP_SECONDS,active:true};
 }
 function setEnabled(value){enabled=!!value;if(!enabled)reset();}
 return {sample,reset,setEnabled,get enabled(){return enabled;},
  get count(){return states.length},get rates(){return states.map(s=>s.rate)}};
}
