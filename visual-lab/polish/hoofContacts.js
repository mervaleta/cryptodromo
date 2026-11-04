/**
 * Contact-event extraction from the ACTUAL corrected GLB gallop phase.
 * No faux footsteps fired from distance alone and no per-frame allocation
 * except the (normally zero-length) emitted event array.
 */
export const HOOF_CONTACTS=Object.freeze([
 Object.freeze({phase:.03,foot:'hind-trailing',side:-1,force:.80}),
 Object.freeze({phase:.14,foot:'hind-leading',side:1,force:.97}),
 Object.freeze({phase:.28,foot:'fore-trailing',side:-1,force:.91}),
 Object.freeze({phase:.43,foot:'fore-leading',side:1,force:1.12})
]);
const fract=x=>((x%1)+1)%1;
export function crossingContacts(previous,current){
 const events=[];
 if(!Number.isFinite(previous)||!Number.isFinite(current))return events;
 const prior=fract(previous),next=fract(current);
 let increment=next-prior;
 if(increment<0)increment+=1;
 // A discontinuity (replay seek, dropped frames, other gait) is NOT impact.
 if(increment<.00001||increment>.48)return events;
 for(const marker of HOOF_CONTACTS){
  const forward=(marker.phase-prior+1)%1;
  if(forward>.00001&&forward<=increment+.000001)events.push(marker);
 }
 return events.sort((a,b)=>((a.phase-prior+1)%1)-((b.phase-prior+1)%1));
}
export function createHoofContactTracker({count=12}={}){
 if(!Number.isInteger(count)||count<1||count>24)throw RangeError('Invalid runner count');
 const last=new Float64Array(count).fill(NaN);
 const lastEmit=new Float64Array(count).fill(-Infinity);
 function reset(){last.fill(NaN);lastEmit.fill(-Infinity);}
 function sample(index,{hoofPhase,elapsed=0,active=true}={}){
  if(!Number.isInteger(index)||index<0||index>=count)throw RangeError('Invalid runner');
  if(!active||!Number.isFinite(hoofPhase)){last[index]=NaN;return [];}
  const phase=fract(hoofPhase),before=last[index];
  last[index]=phase;
  if(!Number.isFinite(before))return [];
  const events=crossingContacts(before,phase);
  // Avoid bursts when a replay timer seeks or a browser skips a whole frame.
  if(Number.isFinite(elapsed)&&elapsed-lastEmit[index]<.016)return [];
  if(events.length)lastEmit[index]=elapsed;
  return events;
 }
 return {sample,reset,get count(){return count}};
}
