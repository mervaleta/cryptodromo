/**
 * Doses control continuous forward movement at a shared nominal cruise.
 * No horse can run backwards, stop, or be position-clamped at the finish.
 * Each five-second segment draws one runner-specific CRP dose.
 * The normalization reconciles the on-screen trajectory to the immutable
 * financial result after 60 seconds without changing its ranking.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const STEP_SECONDS=5;
export const SEGMENTS=12;
export const FIRST_DOSES=9;
export const CRUISE_METERS_PER_SECOND=1000/60;
export const MIN_CRUISE_RATIO=.42;
export function buildBroadcastProfiles(profiles,{strength=.55}={}){
 if(!Array.isArray(profiles)||profiles.length!==12)throw Error('Exactly 12 official runners required');
 return profiles.map(p=>{
  const weights=[];
  for(let k=0;k<SEGMENTS;k++){
   const first=k<FIRST_DOSES,input=first?p.input1:p.input2;
   const coefficient=p.coefficients[k],minimum=first?-10:20,span=40;
   const doseInfluence=.38+.62*clamp((coefficient-minimum)/span,0,1);
   const marketForce=clamp(Math.abs(input)/.10,0,1.6);
   // Positive price variation increases raw speed; negative decreases it.
   // Coefficients vary the strength, not the sign, of a price variation.
   const multiplier=1+Math.sign(input)*strength*marketForce*doseInfluence;
   weights.push(clamp(multiplier,MIN_CRUISE_RATIO,1.85));
  }
  const total=weights.reduce((a,b)=>a+b,0);
  const cumulative=[0];
  let cumulativeDistance=0;
  for(let k=0;k<SEGMENTS;k++){
   cumulativeDistance+=(weights[k]/total)*p.distanceAt60;
   cumulative.push(k===SEGMENTS-1?p.distanceAt60:cumulativeDistance);
  }
  return {...p,broadcastDistance:cumulative,broadcastWeights:weights,
    minimumSpeed:Math.min(...weights)*p.distanceAt60*SEGMENTS/total/STEP_SECONDS};
 });
}
export function broadcastPosition(profile,time){
 const t=clamp(time,0,SEGMENTS*STEP_SECONDS);
 if(t===60)return profile.distanceAt60;
 const i=Math.min(SEGMENTS-1,Math.floor(t/STEP_SECONDS));
 const fraction=(t-i*STEP_SECONDS)/STEP_SECONDS;
 // Linear travel inside each dose: there is no easing-to-zero at endpoints.
 return profile.broadcastDistance[i]+(profile.broadcastDistance[i+1]-profile.broadcastDistance[i])*fraction;
}
export function broadcastSpeed(profile,time){
 const t=clamp(time,0,59.999999),i=Math.min(SEGMENTS-1,Math.floor(t/STEP_SECONDS));
 return (profile.broadcastDistance[i+1]-profile.broadcastDistance[i])/STEP_SECONDS;
}
export function overtakeEvents(profiles,{seconds=60,step=.5}={}){
 let changes=0,previous=null;
 for(let t=0;t<=seconds;t+=step){
  const order=profiles.map((p,i)=>({i,d:broadcastPosition(p,t)})).sort((a,b)=>b.d-a.d||a.i-b.i).map(x=>x.i);
  if(previous)for(let i=0;i<order.length;i++)if(order[i]!==previous[i])changes++;
  previous=order;
 }
 return changes;
}
