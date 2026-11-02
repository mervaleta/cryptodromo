import test from 'node:test';
import assert from 'node:assert/strict';
import {selectBroadcastShot,createBroadcastDirector} from '../alpha15/director.js';
import {recommendQuality,rendererSettings,createQualityGovernor} from '../alpha15/quality.js';
import {syntheticRaceRecord,syntheticAudit,assertSyntheticRaceRecord,raceIdentity} from '../alpha15/raceRecords.js';
import {buildSyntheticChronicle,asTextBrief} from '../alpha15/chronicle.js';
import {createFinishOrchestrator} from '../alpha15/finishOrchestrator.js';
import {buildSyntheticCareers} from '../alpha15/careers.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {buildBroadcastProfiles,broadcastSpeed} from '../visual-lab/raceChoreography.js';
import {broadcastRunoutDistance} from '../visual-lab/raceBroadcast.js';

test('camera choices respond to race and remain presentation-only',()=>{
 assert.equal(selectBroadcastShot({elapsed:1,previousShot:'pack'}).shot,'rail');
 assert.equal(selectBroadcastShot({elapsed:32,layout:'oval'}).shot,'drone');
 assert.equal(selectBroadcastShot({elapsed:58,previousShot:'rail'}).shot,'finish');
 assert.equal(selectBroadcastShot({elapsed:115,phase:'results'}).shot,'finish');
 assert.equal(selectBroadcastShot({elapsed:150,phase:'presentation'}).shot,'grandstand');
 assert.equal(selectBroadcastShot({elapsed:25,previousShot:'rail',lastChangeAt:23,minDwell:6}).shot,'rail');
 assert.equal(selectBroadcastShot({elapsed:25,previousShot:'rail',lastChangeAt:23,
   leadMarginMeters:2,overtakes:2,previousOvertakes:1}).shot,'leader');
 const director=createBroadcastDirector({minDwell:5});
 assert.equal(director.frame({elapsed:1}).shot,'rail');
 assert.equal(director.frame({elapsed:2}).shot,'rail');
 assert.equal(director.frame({elapsed:12}).changed,true);
 director.reset();
 assert.equal(director.state.shot,'pack');
});
test('quality governor has stable budgets and hysteresis, no effect on race time',()=>{
 assert.equal(recommendQuality({softwareGPU:true}),'eco');
 assert.equal(recommendQuality({mobile:true}),'balanced');
 assert.equal(recommendQuality({deviceMemory:16,hardwareConcurrency:12}),'cinematic');
 assert.equal(rendererSettings('eco',{devicePixelRatio:3}).pixelRatio,.85);
 assert.equal(rendererSettings('cinematic',{devicePixelRatio:1.2}).pixelRatio,1.2);
 const governor=createQualityGovernor({window:12,minSamples:6,cooldownMs:100});
 for(let i=0;i<6;i++)governor.sample(60,i*60);
 assert.equal(governor.level,'eco');
 for(let i=0;i<6;i++)governor.sample(8,1000+i*8);
 assert.equal(governor.level,'balanced');
});
test('records are reproducible, labelled synthetic and audited without visual state',()=>{
 const a=syntheticRaceRecord(0,0),b=syntheticRaceRecord(0,0);
 assert.deepEqual(a,b);
 assert.ok(assertSyntheticRaceRecord(a));
 assert.equal(a.provenance.liveMarket,false);
 assert.equal(a.provenance.transmissionObserved,false);
 assert.equal(a.scoring.freezeAtSeconds,60);
 assert.equal(a.finish.length,12);
 assert.equal(new Set(a.finish.map(x=>x.symbol)).size,12);
 assert.equal(a.id,raceIdentity(0,0));
 assert.equal(syntheticAudit(0,0).horses[0].symbol,a.summary.winner);
 assert.throws(()=>syntheticRaceRecord(7,0),RangeError);
 assert.throws(()=>syntheticRaceRecord(0,480),RangeError);
});
test('chronicle uses past-only synthetic records, no fabricated real-world observations',()=>{
 const early=buildSyntheticChronicle({dayIndex:0,throughSlot:0,limit:9});
 assert.equal(early.racesExamined,1);
 assert.equal(early.provenance.synthetic,true);
 assert.equal(early.provenance.publicationStatus,'draft');
 assert.ok(early.highlights.length>=1);
 assert.ok(early.highlights.every(s=>s.day===1&&s.slot<=0&&s.provenance.synthetic));
 assert.match(asTextBrief(early.highlights[0]),/simulación/i);
 const later=buildSyntheticChronicle({dayIndex:0,throughSlot:15,limit:12});
 assert.equal(later.racesExamined,16);
 assert.ok(later.highlights.every(s=>s.slot<=15));
 assert.deepEqual(later,buildSyntheticChronicle({dayIndex:0,throughSlot:15,limit:12}));
 const secondDay=buildSyntheticChronicle({dayIndex:1,throughSlot:2,limit:8});
 assert.equal(secondDay.racesExamined,483);
 assert.ok(secondDay.highlights.every(s=>s.day===2&&s.slot<=2));
 assert.throws(()=>buildSyntheticChronicle({dayIndex:8}),RangeError);
});
test('finish reveals only after all 12 cross and celebration hold expires',()=>{
 const fx=createOfficialRace(getRaceFixture(10,2).entries),rank=officialRanking(fx);
 const finish=rank[0].distanceAt60,profiles=buildBroadcastProfiles(fx);
 const orchestrator=createFinishOrchestrator({holdAfterLast:2.4});
 const at60=profiles.map(p=>p.distanceAt60);
 let state=orchestrator.update({elapsed:60,distances:at60,finishDistance:finish});
 assert.equal(state.showOfficialResult,false);
 assert.equal(state.allCrossed,false);
 const at73=profiles.map(p=>broadcastRunoutDistance({
  ...p,exitVelocity:broadcastSpeed(p,59.99)},finish,13));
 state=orchestrator.update({elapsed:73,distances:at73,finishDistance:finish});
 assert.equal(state.allCrossed,true);
 assert.equal(state.showOfficialResult,false);
 state=orchestrator.update({elapsed:76,distances:at73,finishDistance:finish});
 assert.equal(state.showOfficialResult,true);
 assert.equal(state.celebration,false);
 assert.throws(()=>orchestrator.update({elapsed:61,distances:at60,finishDistance:finish}),/reset/);
 orchestrator.reset();assert.equal(orchestrator.state.crossedCount,0);
});
test('all 3360 synthetic fixture results and staged finish outcomes match engine',()=>{
 let winners=0;
 for(let d=0;d<7;d++)for(let r=0;r<480;r++){
  const record=syntheticRaceRecord(d,r);
  assert.ok(assertSyntheticRaceRecord(record));
  const fixture=getRaceFixture(r,d),official=officialRanking(createOfficialRace(fixture.entries));
  assert.equal(record.summary.winner,official[0].entry.symbol);
  assert.equal(record.summary.runnerUp,official[1].entry.symbol);
  assert.ok(record.summary.firstSecondMarginMeters>=0);
  winners++;
 }
 assert.equal(winners,3360);
});

test('100-horse form and rivalry dossiers use only races before their explicit cutoff',()=>{
 const first=buildSyntheticCareers({throughDay:0,throughSlot:0});
 assert.equal(first.racesAnalyzed,1);
 assert.equal(first.careers.size,100);
 assert.equal([...first.careers.values()].reduce((n,s)=>n+s.starts,0),12);
 const firstSymbols=getRaceFixture(0,0).entries.map(x=>x.symbol);
 for(const sym of firstSymbols)assert.equal(first.careers.get(sym).starts,1);
 const weekly=buildSyntheticCareers();
 assert.equal(weekly.racesAnalyzed,3360);
 assert.equal(weekly.careers.size,100);
 const entries=[...weekly.careers.values()];
 assert.equal(entries.reduce((sum,s)=>sum+s.starts,0),3360*12);
 assert.equal(entries.reduce((sum,s)=>sum+s.wins,0),3360);
 assert.equal(entries.reduce((sum,s)=>sum+s.podiums,0),3360*3);
 assert.ok(entries.every(s=>s.recentForm.length<=8&&s.provenance.transmissionObserved===false));
 assert.ok(entries.some(s=>s.rivals.length>0));
 const btc=weekly.careers.get('BTC');
 for(const opponent of btc.rivals){
  assert.ok(opponent.meetings>=opponent.placedAhead+opponent.placedBehind);
 }
});
