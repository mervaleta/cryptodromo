import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSportsWeek,asCsv} from '../scripts/audit-sports-week.mjs';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {syntheticRaceRecord,assertSyntheticRaceRecord} from '../alpha15/raceRecords.js';
import {buildTrackSplits} from '../race-lab/source/src/data/trackSplits.js';
import {listGrandPrix,grandPrixResult,prepareGrandPrixReplay,replayFrame} from '../sports/grandPrix.js';

test('weekly baseline: invariant sizes, structural integrity and source provenance',()=>{
 const r=auditSportsWeek();
 assert.equal(r.provenance.synthetic,true);
 assert.equal(r.provenance.live,false);
 assert.equal(r.counts.days,7);
 assert.equal(r.counts.races,3360);
 assert.equal(r.counts.starts,40320);
 assert.equal(r.counts.uniqueRunners,100);
 assert.deepEqual(r.issues,[]);
 assert.equal(r.runners.reduce((s,x)=>s+x.starts,0),40320);
 assert.equal(r.runners.reduce((s,x)=>s+x.wins,0),3360);
 assert.equal(r.runners.reduce((s,x)=>s+x.podiums,0),10080);
 assert.equal(r.counts.exactFinishTies,0);
 for(const group of Object.values(r.byTier))assert.equal(group.starts,13440);
 assert.equal(r.winners.first,'ETH');
 assert.equal(r.winners.last,'SOL');
});
test('baseline fingerprint: category win counts and marquee starts are stable',()=>{
 const r=auditSportsWeek();
 // These are regression fingerprints, not desired fairness thresholds.
 assert.deepEqual(r.winners.byTier,{star:434,core:1010,challenger:1916});
 const bySymbol=new Map(r.runners.map(x=>[x.symbol,x]));
 assert.equal(bySymbol.get('BTC').starts,2348);
 assert.equal(bySymbol.get('ETH').starts,2217);
 assert.equal(bySymbol.get('SOL').starts,2085);
 assert.equal(bySymbol.get('BTC').wins,69);
 assert.equal(bySymbol.get('ETH').wins,60);
 assert.equal(bySymbol.get('SOL').wins,69);
 assert.equal(r.daily.reduce((n,d)=>n+d.races,0),3360);
 assert.equal(asCsv(r).trim().split('\n').length,101);
});
test('all 28 Grand Prix share the immutable official winner and replay end',()=>{
 const events=listGrandPrix();
 assert.equal(events.length,28);
 for(const event of events){
  const fixture=getRaceFixture(event.slotIndex,event.dayIndex);
  const expected=officialRanking(createOfficialRace(fixture.entries)).map(p=>p.entry.symbol);
  const result=grandPrixResult(event);
  assert.equal(result.winner,expected[0]);
  assert.deepEqual(result.finish.map(x=>x.symbol),expected);
  assert.equal(result.provenance.observedTransmission,false);
  const replay=prepareGrandPrixReplay(event);
  const finish=replayFrame(replay,60);
  assert.deepEqual([...finish].sort((a,b)=>a.finalPlace-b.finalPlace).map(x=>x.symbol),expected);
 }
});
test('official results, synthetic race record and split scoring agree across representative slots',()=>{
 const cases=[[0,0],[0,119],[1,359],[3,117],[6,479]];
 for(const [day,slot] of cases){
  const fixture=getRaceFixture(slot,day);
  const official=officialRanking(createOfficialRace(fixture.entries)).map(p=>p.entry.symbol);
  const record=syntheticRaceRecord(day,slot);
  assertSyntheticRaceRecord(record);
  assert.equal(record.provenance.transmissionObserved,false);
  assert.deepEqual(record.finish.map(p=>p.symbol),official);
  for(const mode of ['legacy','quarters']){
   const splits=buildTrackSplits(createOfficialRace(fixture.entries),{mode});
   assert.equal(splits.finishWinner,official[0]);
   assert.deepEqual(splits.results.map(p=>p.symbol),official);
   assert.equal(splits.splits.length,4);
  }
 }
});
