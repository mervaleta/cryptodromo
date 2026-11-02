import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {createOfficialRace} from '../race-lab/source/src/data/officialRace.js';
import {broadcastSpeed} from '../visual-lab/raceChoreography.js';
import {coastDistance,coastSpeed,raceStatistics,narrateEvent,RUNOUT_SECONDS} from '../visual-lab/raceBroadcast.js';
import {buildRosterStats,horseBiography} from '../visual-lab/rosterStats.js';

test('runout continues past official 60s position while monotonically decelerating',()=>{
 for(let day=0;day<7;day++)for(let n=0;n<480;n+=21){
  const official=createOfficialRace(getRaceFixture(n,day).entries);
  const stats=raceStatistics(official);
  assert.equal(stats.entries.length,12);
  for(const p of official){
   const initial=16.66;
   let prev=p.distanceAt60;
   let lastV=initial;
   for(let t=.2;t<=RUNOUT_SECONDS;t+=.2){
    const d=coastDistance(p.distanceAt60,initial,t),v=coastSpeed(initial,t);
    assert.ok(d>prev,'Runout horse is stationary or backing up at '+day+'/'+n+'/'+p.entry.symbol+'/'+t);
    assert.ok(v>0&&v<lastV,'Runout speed not positive and decelerating');
    prev=d;lastV=v;
   }
  }
 }
});
test('all 100 token identities have deterministic career statistics over all 3360 synthetic races',()=>{
 const records=buildRosterStats();
 assert.equal(records.size,100);
 const values=[...records.values()];
 assert.equal(values.reduce((sum,r)=>sum+r.starts,0),3360*12);
 assert.equal(values.reduce((sum,r)=>sum+r.wins,0),3360);
 assert.equal(values.reduce((sum,r)=>sum+r.podiums,0),3360*3);
 assert.equal(values.filter(r=>r.starts>0).length,100);
 for(const token of TOKEN_ROSTER){
  const record=records.get(token.symbol);
  assert.ok(record.starts>0);
  assert.ok(record.wins<=record.podiums);
  assert.match(horseBiography(token,record),/identidad ficticia/i);
 }
});
test('keyframe table matches actual joint names and runout never pauses the model at 60s',()=>{
 const horse=readFileSync(new URL('../race-lab/source/src/gaitRefiner.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 assert.match(horse,/GAIT_POSE_COUNT=8/);
 for(const joint of ['FrontUpperLeg.L','FrontLowerLeg.R','BackLowerLeg.L','BackUpperLeg.R','Neck1','Head','Tail2']){
  assert.ok(horse.includes(joint),'Missing horse rig bone '+joint);
 }
 assert.ok(scene.includes('coastDistance(p.distanceAt60,exitVelocity,elapsed-60)'));
 assert.ok(scene.includes('showOfficialResult()'));
 assert.ok(scene.includes('resultsOverlay.hidden=false'));
 assert.ok(!scene.includes("elapsed=Math.min(60,elapsed+realSeconds)"));
 assert.ok(scene.includes('h.model.root.visible=false'));
 assert.ok(scene.includes("narrateEvent({type:'finish'"));
});
test('scripted narrator has deterministic start, dose and official finish clips',()=>{
 assert.match(narrateEvent({type:'start'}),/Largaron/);
 assert.match(narrateEvent({type:'dose',elapsed:45}),/últimas tres dosis/);
 assert.match(narrateEvent({type:'finish',leader:'BTC'}),/BTC/);
});
