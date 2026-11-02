import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {buildBroadcastProfiles,broadcastPosition,broadcastSpeed,overtakeEvents,MIN_CRUISE_RATIO} from '../visual-lab/raceChoreography.js';

test('alpha07 extends visible straight by another 12% without changing the two-price financial engine',()=>{
 const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 assert.match(scene,/VISUAL_START_X=-390,VISUAL_FINISH_X=390/);
 assert.doesNotMatch(scene,/VISUAL_SPAN\*Math\.min\(1\.025/);
 assert.match(scene,/goal\.set\(0,layoutMode===/);
 assert.match(scene,/createNightLights/);
 assert.match(scene,/VISUAL_SPAN=VISUAL_FINISH_X-VISUAL_START_X/);
 assert.match(scene,/broadcastPosition\(p,elapsed\)/);
 assert.match(scene,/trackPoint\(layoutMode,pr,i\)/);
 assert.doesNotMatch(scene,/function jockey\s*\(/);
 assert.doesNotMatch(scene,/const rider=jockey/);
});
test('all 3360 races retain official prices, 60s finishing order and valid interpolation',()=>{
 let count=0,significant=0;
 for(let day=0;day<7;day++)for(let i=0;i<480;i++){
  const official=createOfficialRace(getRaceFixture(i,day).entries);
  const broadcast=buildBroadcastProfiles(official);
  const ranking=officialRanking(official).map(x=>x.entry.symbol);
  const atFinish=broadcast.map(p=>({symbol:p.entry.symbol,d:broadcastPosition(p,60)}))
     .sort((a,b)=>b.d-a.d).map(x=>x.symbol);
  assert.deepEqual(atFinish,ranking,'Different result at day '+day+' race '+i);
  for(const p of broadcast){
   assert.equal(broadcastPosition(p,0),0);
   assert.equal(broadcastPosition(p,60),p.distanceAt60);
   for(let t=0;t<60;t+=.5){
    assert.ok(broadcastPosition(p,t+.5)>broadcastPosition(p,t),'Stalled or reversed: day '+day+' race '+i);
    assert.ok(broadcastSpeed(p,t)>0,'Horse had zero cruise speed');
   }
   assert.ok(p.broadcastWeights.every(w=>w>=MIN_CRUISE_RATIO));
   assert.ok(p.minimumSpeed>0);

  }
  if(day===0&&i<100&&overtakeEvents(broadcast,{seconds:60,step:1})>=4)significant++;
  count++;
 }
 assert.equal(count,3360);
 assert.ok(significant>=30,'Expected visible overtakes across most first-day races, got '+significant);
});
test('dose shuffle changes midrace order but cannot change the winner',()=>{
 const entries=getRaceFixture(12,2).entries,base=createOfficialRace(entries);
 const rev=createOfficialRace(entries.map(e=>({...e,coefficients1:[...e.coefficients1].reverse(),
   coefficients2:[...e.coefficients2].reverse()})));
 const a=buildBroadcastProfiles(base),b=buildBroadcastProfiles(rev);
 assert.deepEqual(officialRanking(base).map(x=>x.entry.symbol),officialRanking(rev).map(x=>x.entry.symbol));
 assert.ok(a.some((p,i)=>Math.abs(broadcastPosition(p,23)-broadcastPosition(b[i],23))>0.01));
 assert.ok(a.every((p,i)=>broadcastPosition(p,60)===broadcastPosition(b[i],60)));
});
