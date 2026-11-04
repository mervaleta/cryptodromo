/**
 * Cryptódromo hoof collision/event solver, visual-only and independent of scoring.
 * Four-beat transverse gallop: trailing hind, leading hind, trailing fore, leading fore.
 * Current GLB supplies hoofPhase. Future master may provide exact world-space sole
 * coordinates through model.getHoofContactPoints(), never through the race engine.
 */
export const HOOF_LAYOUT = Object.freeze([
  Object.freeze({id:'LH', x:-0.86, z:-0.33, beat:0}),
  Object.freeze({id:'RH', x:-0.86, z: 0.33, beat:0.115}),
  Object.freeze({id:'LF', x: 0.80, z:-0.35, beat:0.275}),
  Object.freeze({id:'RF', x: 0.80, z: 0.35, beat:0.405})
]);
export const SURFACES = Object.freeze({
  dirt: Object.freeze({name:'Tierra', dust:7, pigment:'#b29a76', imprint:'#442a1b', spread:1.00, rise:.85, markScale:1.0}),
  sand: Object.freeze({name:'Arena', dust:10, pigment:'#e8cf99', imprint:'#92724a', spread:1.40, rise:.57, markScale:1.25}),
  grass: Object.freeze({name:'Césped', dust:2, pigment:'#839b58', imprint:'#31512a', spread:.36, rise:.24, markScale:.82}),
  synthetic: Object.freeze({name:'Sintética', dust:1, pigment:'#939d91', imprint:'#45524d', spread:.31, rise:.20, markScale:.74})
});
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const wrap = n => ((n%1)+1)%1;
function crossing(previous,next,beat) {
  const delta = wrap(next-previous);
  if(delta<=1e-8 || delta>.55)return -1;
  const offset=wrap(beat-previous);
  return offset>1e-7 && offset<=delta+1e-7 ? offset/delta : -1;
}
function atFoot(x,z,heading,hoof) {
  const c=Math.cos(heading),s=Math.sin(heading);
  return {x:x+c*hoof.x+s*hoof.z, z:z-s*hoof.x+c*hoof.z};
}
export function createHoofContactSolver({lanes=12,soleThreshold=.13,releaseThreshold=.21}={}) {
  if(!Number.isInteger(lanes)||lanes<1||lanes>64)throw new RangeError('lanes must be 1..64');
  const states=Array.from({length:lanes},()=>({
    ready:false, phase:0, x:0,z:0,heading:0,
    poseReady:[false,false,false,false], planted:[false,false,false,false],
    priorY:[Infinity,Infinity,Infinity,Infinity], cooldown:[0,0,0,0],
    total:0
  }));
  function reset(lane=null) {
    const indices=lane===null?states.map((_,i)=>i):[lane];
    for(const i of indices){
      const s=states[i];if(!s)continue;
      s.ready=false;s.phase=0;s.x=0;s.z=0;s.heading=0;s.total=0;
      s.poseReady.fill(false);s.planted.fill(false);s.priorY.fill(Infinity);s.cooldown.fill(0);
    }
  }
  /**
   * sample({lane,x,z,heading,phase,dt,speed,enabled,soles,groundY})
   * If soles is a four-element array of {x,y,z} WORLD positions, use hysteresis
   * on the real sole-ground separation. Otherwise use phase-based proxy events.
   */
  function sample({lane=0,x=0,z=0,heading=0,phase=null,dt=0,speed=1,
                   enabled=true,soles=null,groundY=0}={}) {
    const s=states[lane];
    if(!s)return [];
    const step=clamp(dt,0,.1),rate=clamp(speed,.20,3.2);
    if(!enabled){s.ready=false;s.poseReady.fill(false);s.planted.fill(false);return [];}
    if(![x,z,heading].every(Number.isFinite))return [];
    const pressure=clamp(.60+.28*rate,.40,1.55);
    if(Array.isArray(soles)&&soles.length===4&&soles.every(v=>v&&[v.x,v.y,v.z].every(Number.isFinite))) {
      const result=[];
      for(let i=0;i<4;i++){
        const p=soles[i],h=p.y-groundY;
        s.cooldown[i]=Math.max(0,s.cooldown[i]-step);
        // Arming only when lifted prevents repeated dust bursts during a long stance.
        if(h>=releaseThreshold)s.planted[i]=false;
        const descending=s.poseReady[i]&&p.y<=s.priorY[i]+.025;
        if(!s.planted[i]&&h<=soleThreshold&&descending&&s.cooldown[i]<=0){
          s.planted[i]=true;s.cooldown[i]=.12;s.total++;
          result.push({lane,hoof:i,id:HOOF_LAYOUT[i].id,x:p.x,z:p.z,
            heading,pressure,mode:'soles',groundY});
        }
        s.poseReady[i]=true;s.priorY[i]=p.y;
      }
      s.ready=false;
      return result;
    }
    const actual=Number.isFinite(phase)?wrap(phase):wrap(s.phase+step*rate*1.715);
    if(!s.ready){
      s.ready=true;s.phase=actual;s.x=x;s.z=z;s.heading=heading;
      return [];
    }
    // A seek, lag spike or teleport MUST NOT spawn a backlog of phantom impacts.
    const jumped=Math.hypot(x-s.x,z-s.z)>14;
    const result=[];
    if(!jumped){
      for(let i=0;i<4;i++){
        const h=HOOF_LAYOUT[i],t=crossing(s.phase,actual,h.beat);
        if(t<0)continue;
        const travelHeading=s.heading+Math.atan2(Math.sin(heading-s.heading),Math.cos(heading-s.heading))*t;
        const p=atFoot(s.x+(x-s.x)*t,s.z+(z-s.z)*t,travelHeading,h);
        result.push({lane,hoof:i,id:h.id,x:p.x,z:p.z,heading:travelHeading,
          pressure,mode:'phase',groundY});s.total++;
      }
    }
    s.phase=actual;s.x=x;s.z=z;s.heading=heading;
    return result;
  }
  return {sample,reset,getTotals:()=>states.map(s=>s.total)};
}
export function normalizedSurface(surface){return Object.prototype.hasOwnProperty.call(SURFACES,surface)?surface:'dirt';}
export function hoofWorldPoint({x,z,heading,hoof}){return atFoot(x,z,heading,HOOF_LAYOUT[hoof]||HOOF_LAYOUT[0]);}
