/**
 * Broadcast choreography for one predetermined CRP race.
 *
 * A runner's coefficients are used only in its own 5-second dose.
 * Minute 1 drives doses 0..8 (t=0..45); minute 2 drives doses 9..11.
 * Each shuffled deck has the same contents for everyone.
 * At second 60 each horse lands on its authoritative, price-derived
 * distanceAt60, so shuffling cannot change the official winner.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const STEP_SECONDS=5;
export const SEGMENTS=12;
export const FIRST_DOSES=9;
export function buildBroadcastProfiles(profiles,{strength=0.47}={}){
  if(!Array.isArray(profiles)||profiles.length!==12)throw Error('Requires 12 price-derived official profiles');
  return profiles.map(p=>{
    const w=[];
    for(let k=0;k<SEGMENTS;k++){
      const first=k<FIRST_DOSES;
      const coef=p.coefficients[k];
      const center=first?91/9:40;
      const spread=first?20:20;
      const input=first?p.input1:p.input2;
      const sign=Math.sign(input);
      const amplitude=clamp(Math.abs(input)/.07,.58,1.22);
      // No invented sign when the financial price variation is exactly zero.
      const modulation=sign*(coef-center)/spread*strength*amplitude;
      w.push(clamp(1+modulation,.24,1.84));
    }
    const total=w.reduce((a,b)=>a+b,0);
    const distance=[];
    distance.push(0);
    let cumulative=0;
    for(let k=0;k<SEGMENTS;k++){
      cumulative+=w[k]/total*p.distanceAt60;
      distance.push(k===SEGMENTS-1?p.distanceAt60:cumulative);
    }
    return {...p,broadcastDistance:distance,broadcastWeights:w};
  });
}
export function broadcastPosition(profile,time){
  const seconds=clamp(time,0,SEGMENTS*STEP_SECONDS);
  if(seconds===60)return profile.distanceAt60;
  const index=Math.min(SEGMENTS-1,Math.floor(seconds/STEP_SECONDS));
  const fraction=(seconds-index*STEP_SECONDS)/STEP_SECONDS;
  // Smooth motion without adding external, nondeterministic forces.
  const eased=fraction-.065*Math.sin(2*Math.PI*fraction);
  return profile.broadcastDistance[index]+(profile.broadcastDistance[index+1]-profile.broadcastDistance[index])*eased;
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
