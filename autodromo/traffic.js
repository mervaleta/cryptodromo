/**
 * Cryptódromo Autódromo / Traffic Director v1.
 *
 * Only produces camera-facing Three.js positions. It NEVER writes into
 * createOfficialRace(), positionAt(), officialRanking() or the synthetic tape.
 *
 * Deterministic 0.2 s trajectories prevent the cars from "ghosting" through
 * one another at overtakes. Cars scan ahead, select an available lane and
 * move laterally at a limited rate. If every passing lane is occupied the
 * visual follower yields longitudinal space until it can safely overtake.
 *
 * IMPORTANT: visualMeters is NOT an official distance and is never used for
 * scoring, race results, betting, or the standings.
 */
import {positionsAt} from './logic.js?v=autodromo-pole-2';

export const TRAFFIC_STEP_SECONDS=0.2;
export const PASS_LOOKAHEAD_SECONDS=2.8;
export const LANE_CENTERS=Object.freeze([-20,-12,-4,4,12,20]);
export const MAX_LATERAL_RATE_METERS_PER_SECOND=8;
export const SAFE_LONGITUDINAL_METERS=14;
export const SAFE_LATERAL_METERS=8.1;
const SAMPLE_COUNT=Math.round(60/TRAFFIC_STEP_SECONDS);
const cache=new WeakMap();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const laneDistance=(a,b)=>Math.abs(a-b);

/**
 * Visual only collision envelope in local road coordinates. A longer car
 * needs greater longitudinal separation while two bodies share a lane.
 */
export function collisionClearance(longitudinal,lateral){
 const lateralRatio=Math.abs(lateral)/SAFE_LATERAL_METERS;
 if(lateralRatio>=1)return Infinity;
 const minimumLongitudinal=SAFE_LONGITUDINAL_METERS*Math.sqrt(1-lateralRatio*lateralRatio);
 return Math.abs(longitudinal)-minimumLongitudinal;
}
function chooseLane(vehicle,processed,current,predicted,states){
 const previous=states[vehicle.index];
 const currentRow=current.get(vehicle.index);
 const futureRow=predicted.get(vehicle.index);
 let best=previous.target,bestScore=Infinity;
 const options=[...LANE_CENTERS,previous.target,previous.side]
   .filter((lane,index,array)=>array.findIndex(v=>Math.abs(v-lane)<0.001)===index);
 for(const candidate of options){
   if(Math.abs(candidate)>21)continue; // keep the wings on the 54m tarmac
   // Hold the racing line when safe; an overtake changes it only when needed.
   let score=laneDistance(candidate,previous.side)*1.15+
     laneDistance(candidate,previous.target)*0.62+
     laneDistance(candidate,previous.base)*0.045+
     (Math.abs(candidate)>=19?0.45:0);
   for(const other of processed){
     const futureOther=predicted.get(other.index);
     const nowOther=current.get(other.index);
     const nextGap=Math.abs(futureRow.trackMeters-futureOther.trackMeters);
     const nowGap=Math.abs(currentRow.trackMeters-nowOther.trackMeters);
     const nearby=Math.min(nextGap,nowGap);
     const lateralToReserved=laneDistance(candidate,other.target);
     // Look ahead *before* the nose of the overtaker reaches the rear wing.
     if(nextGap<26 && lateralToReserved<9){
       score+=1500*(1-nextGap/26)*(1-lateralToReserved/10);
     }
     // Avoid changing across a currently occupied adjacent lane.
     const sweepMin=Math.min(candidate,previous.side)-5.5;
     const sweepMax=Math.max(candidate,previous.side)+5.5;
     if(nowGap<13 && other.side>sweepMin && other.side<sweepMax &&
       Math.abs(candidate-previous.side)>1.2)
       score+=220;
     if(nearby<12 && laneDistance(candidate,other.side)<7)
       score+=750*(1-nearby/12);
   }
   if(Math.abs(candidate-previous.target)<.01)score-=2;
   if(score<bestScore-1e-8){bestScore=score;best=candidate;}
 }
 return best;
}
function safeVisualPlacement(rows,states){
 const placed=[];
 const mapped=Array(rows.length);
 for(const row of rows){ // sorted by official progress, not by rendered positions
   const state=states[row.index];
   let visual=row.visualMeters;
   // Under heavy bunching we do not allow same-lane car models to overlap.
   // The follower waits behind the leader; the official order is untouched.
   for(const ahead of placed){
     const other=states[ahead.index];
     const lat=state.side-other.side;
     const latRatio=Math.abs(lat)/SAFE_LATERAL_METERS;
     if(latRatio>=1)continue;
     const required=SAFE_LONGITUDINAL_METERS*Math.sqrt(1-latRatio*latRatio);
     visual=Math.min(visual,ahead.visualMeters-required);
   }
   const result={index:row.index,symbol:row.symbol,
     meters:row.meters,trackMeters:row.trackMeters,
     visualMeters:visual,sideMeters:state.side,steering:0};
   placed.push(result);mapped[row.index]=result;
 }
 return mapped;
}
function buildPlan(session){
 const states=session.profiles.map(profile=>{
   const grid=session.gridBySymbol.get(profile.entry.symbol);
   if(!grid)throw new Error('Missing official qualifying row for traffic director');
   return {index:profile.index,base:grid.sideMeters,
     side:grid.sideMeters,target:grid.sideMeters};
 });
 const samples=[];
 let previous=null;
 for(let n=0;n<=SAMPLE_COUNT;n++){
   const seconds=n*TRAFFIC_STEP_SECONDS;
   const rows=positionsAt(session,seconds);
   const ahead=positionsAt(session,Math.min(60,seconds+PASS_LOOKAHEAD_SECONDS));
   const current=new Map(rows.map(row=>[row.index,row]));
   const projected=new Map(ahead.map(row=>[row.index,row]));
   // The prospective front runner receives the current trajectory first.
   const assigned=[];
   if(n>0){
     for(const row of ahead){
       const target=chooseLane(row,assigned,current,projected,states);
       assigned.push({index:row.index,target,side:states[row.index].side});
       states[row.index].target=target;
     }
     for(const state of states){
       const difference=state.target-state.side;
       const step=MAX_LATERAL_RATE_METERS_PER_SECOND*TRAFFIC_STEP_SECONDS;
       state.side+=clamp(difference,-step,step);
       state.side=clamp(state.side,-21,21);
     }
   }
   const placed=safeVisualPlacement(rows,states);
   if(previous){
     for(let i=0;i<placed.length;i++){
       const moved=placed[i],before=previous[i];
       const longitudinalSpeed=(moved.visualMeters-before.visualMeters)/TRAFFIC_STEP_SECONDS;
       const lateralSpeed=(moved.sideMeters-before.sideMeters)/TRAFFIC_STEP_SECONDS;
       // Heading correction tilts into the pass, without spinning the car.
       moved.steering=clamp(-Math.atan2(lateralSpeed,Math.max(8,longitudinalSpeed)),-.26,.26);
     }
   }
   samples.push(placed);
   previous=placed;
 }
 return {samples,sessionKey:session.key,step:TRAFFIC_STEP_SECONDS};
}
/** Precompute once per immutable scheduled event and reuse on every video frame. */
export function getTrafficPlan(session){
 if(!session||!session.gridBySymbol||!session.profiles)
   throw new TypeError('Expected an official autódromo race session');
 if(!cache.has(session))cache.set(session,buildPlan(session));
 return cache.get(session);
}
/**
 * Sample all twelve cars at any timestamp, including seeks and replays.
 * Time interpolation avoids twitching on 60fps displays.
 */
export function trafficAt(session,seconds){
 if(!Number.isFinite(seconds)||seconds<0||seconds>60)
   throw new RangeError('Traffic time must be 0..60 seconds');
 const plan=getTrafficPlan(session);
 const scaled=seconds/TRAFFIC_STEP_SECONDS;
 const left=clamp(Math.floor(scaled),0,SAMPLE_COUNT),right=Math.min(SAMPLE_COUNT,left+1);
 const fraction=clamp(scaled-left,0,1);
 const rows=positionsAt(session,seconds);
 return rows.map(row=>{
   const from=plan.samples[left][row.index];
   const to=plan.samples[right][row.index];
   return {...row,
     sideMeters:lerp(from.sideMeters,to.sideMeters,fraction),
     visualMeters:lerp(from.visualMeters,to.visualMeters,fraction),
     steering:lerp(from.steering,to.steering,fraction)
   };
 });
}
/** Rigorous, side-effect-free race inspection for automated regressions. */
export function trafficAudit(session,stepSeconds=0.2){
 if(!Number.isFinite(stepSeconds)||stepSeconds<=0||stepSeconds>10)
   throw new RangeError('Invalid traffic audit sample');
 let closest=Infinity,unsafePairs=0,changeCount=0,frames=0;
 const examples=[];
 const starting=trafficAt(session,0);
 const oldSides=new Map(starting.map(row=>[row.symbol,row.sideMeters]));
 for(let t=0;t<=60+1e-6;t+=stepSeconds){
   const rows=trafficAt(session,Math.min(60,t));frames++;
   for(const row of rows){
     if(Math.abs(row.sideMeters-oldSides.get(row.symbol))>5)changeCount++;
   }
   for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
     const a=rows[i],b=rows[j];
     const clearance=collisionClearance(a.visualMeters-b.visualMeters,a.sideMeters-b.sideMeters);
     if(Number.isFinite(clearance))closest=Math.min(closest,clearance);
     if(clearance<-.01){
       unsafePairs++;
       if(examples.length<8)examples.push({t:Number(t.toFixed(2)),a:a.symbol,b:b.symbol,
         long:Number((a.visualMeters-b.visualMeters).toFixed(3)),
         side:Number((a.sideMeters-b.sideMeters).toFixed(3)),
         clearance:Number(clearance.toFixed(3))});
     }
   }
 }
 return {frames,unsafePairs,closestClearance:closest,sideChanges:changeCount,
   winner:session.official[0].entry.symbol,sessionKey:session.key,examples};
}
