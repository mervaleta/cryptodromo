import test from 'node:test';
import assert from 'node:assert/strict';
import {getCarSession,positionsAt,resultsAtFinish,CAR_TRACKS} from '../autodromo/logic.js';
import {getTrafficPlan,trafficAt,trafficAudit,collisionClearance,
  LANE_CENTERS,MAX_LATERAL_RATE_METERS_PER_SECOND,
  SAFE_LATERAL_METERS,TRAFFIC_STEP_SECONDS} from '../autodromo/traffic.js';

const TIMES=[
  new Date('2026-11-04T15:31:55.000Z'),
  new Date('2026-11-05T08:47:55.000Z'),
  new Date('2026-11-06T22:17:55.000Z')
];
test('traffic director preserves the official positions, doses and winners',()=>{
 for(const time of TIMES)for(const track of CAR_TRACKS){
   const session=getCarSession(track.id,time);
   const winner=resultsAtFinish(session)[0].symbol;
   const plan=getTrafficPlan(session);
   assert.strictEqual(plan,getTrafficPlan(session),'cache per immutable fixture');
   assert.equal(plan.samples.length,301);
   for(const seconds of [0,.25,3,5,10,15,30,44.7,45,50,59.9,60]){
     const rows=trafficAt(session,seconds),official=positionsAt(session,seconds);
     assert.equal(rows.length,12);
     assert.deepEqual(rows.map(x=>x.symbol),official.map(x=>x.symbol),
       'overtaking must not change official race order');
     for(const row of rows){
       const original=official.find(o=>o.symbol===row.symbol);
       assert.equal(row.meters,original.meters,'no visual feedback into dose-based meters');
       assert.equal(row.trackMeters,original.trackMeters,'qualifying precedence unchanged');
       assert.ok(Number.isFinite(row.visualMeters)&&Number.isFinite(row.sideMeters));
       assert.ok(Math.abs(row.sideMeters)<=21,'car stays between both guard rails');
       assert.ok(Math.abs(row.steering)<=.260001,'no instant spin');
     }
   }
   assert.equal(trafficAt(session,60)[0].symbol,winner);
   assert.deepEqual(resultsAtFinish(session).map(x=>x.symbol),positionsAt(session,60).map(x=>x.symbol));
 }
});
test('twelve car bodies do not overlap while overtaking at 10Hz, including turns',()=>{
 let laneTransitions=0;
 for(const time of TIMES)for(const track of CAR_TRACKS){
   const session=getCarSession(track.id,time);
   const report=trafficAudit(session,.1);
   console.log('TRAFFIC_DIAGNOSTIC',JSON.stringify({
     session:session.key,unsafePairs:report.unsafePairs,
     minSpeed:Number(report.minimumVisualSpeed.toFixed(2)),
     maxSpeed:Number(report.maximumVisualSpeed.toFixed(2)),
     sideChanges:report.sideChanges,closest:Number(report.closestClearance.toFixed(2))
   }));
   assert.equal(report.unsafePairs,0,
     'UNSAFE visual body collision on '+session.key+': '+JSON.stringify(report));
   assert.ok(report.closestClearance>=-.01);
   laneTransitions+=report.sideChanges;
   for(const time of [0,10,20,40,59.9,60]){
     const positions=trafficAt(session,time);
     for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
       const a=positions[i],b=positions[j];
       assert.ok(collisionClearance(a.visualMeters-b.visualMeters,a.sideMeters-b.sideMeters)>-.02);
     }
   }
 }
 assert.ok(laneTransitions>0,'cars must actually change lanes rather than merely spread lengthwise');
});
test('traffic planner makes continuous steering, follows 2x6 pole grid and handles replay seeks',()=>{
 const session=getCarSession('muybridge',TIMES[0]);
 const start=trafficAt(session,0);
 const grid=new Map(session.grid.map(row=>[row.symbol,row]));
 for(const row of start){
   assert.equal(row.sideMeters,grid.get(row.symbol).sideMeters);
   assert.equal(row.meters,0);
 }
 for(let t=TRAFFIC_STEP_SECONDS;t<=60;t+=TRAFFIC_STEP_SECONDS){
   const prev=trafficAt(session,t-TRAFFIC_STEP_SECONDS);
   const next=trafficAt(session,Math.min(60,t));
   const bySymbol=new Map(prev.map(row=>[row.symbol,row]));
   for(const row of next){
     const before=bySymbol.get(row.symbol);
     assert.ok(Math.abs(row.sideMeters-before.sideMeters)
       <=MAX_LATERAL_RATE_METERS_PER_SECOND*TRAFFIC_STEP_SECONDS+.01,
       'lane change must be gradual for '+row.symbol);
     assert.ok(Math.abs(row.sideMeters)<=21&&Math.abs(row.sideMeters)>=0);
   }
 }
 const snap=trafficAt(session,31.4);
 trafficAt(session,59.7);trafficAt(session,2);
 assert.deepEqual(trafficAt(session,31.4),snap,'seeking must not change planned paths');
 assert.ok(LANE_CENTERS.every(x=>Math.abs(x)<=21));
 assert.ok(SAFE_LATERAL_METERS>6.5);
 assert.throws(()=>trafficAt(session,61),RangeError);
 assert.throws(()=>trafficAt(session,-.1),RangeError);
});
