import test from 'node:test';
import assert from 'node:assert/strict';
import {getTripleRaceFixture,TRACKS,TRIPLE_RACES_PER_DAY} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {getRaceFixture,getFixturePrice,getContinuousFixturePrice,PRICE_FIXTURE,MINUTES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {raceIdFor,TRACK_DEFS,tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';

const period=MINUTES_PER_DAY*FIXTURE_DAYS;
test('synthetic source preserves every original sampled price and continues its terminal close',()=>{
 for(const symbol of PRICE_FIXTURE.history.keys()){
  for(const index of [0,1,9,1438,1439,1440,2879,2880,period-3,period-2,period-1]){
   assert.equal(getContinuousFixturePrice(symbol,index),
    getFixturePrice(symbol,Math.floor(index/MINUTES_PER_DAY),index%MINUTES_PER_DAY),
    symbol+' changed historic price at '+index);
  }
  const data=PRICE_FIXTURE.history.get(symbol);
  const oldEnd=data.prices[period],newStart=getContinuousFixturePrice(symbol,period);
  assert.ok(Math.abs(oldEnd/newStart-1)<1e-6,symbol+' week-end discontinuity');
  const after=getContinuousFixturePrice(symbol,period+1),initialRate=data.prices[1]/data.prices[0];
  assert.ok(Math.abs(after/newStart-initialRate)<1e-6,symbol+' invalid first rollover return');
  assert.ok(Number.isFinite(after)&&after>0);
 }
 assert.throws(()=>getContinuousFixturePrice('BTC',-1),RangeError);
 assert.throws(()=>getContinuousFixturePrice('BTC',1.5),RangeError);
 assert.equal(getContinuousFixturePrice('UNKNOWN',0),null);
});
test('FULL synthetic week: 10,080 results, 120,960 entries, unique track fixtures and valid rankings',()=>{
 const totals=Object.fromEntries(TRACKS.map(t=>[t.id,0]));
 const keys=new Set(),lastTrackIds={};
 let entries=0,valid=0;
 for(let day=0;day<FIXTURE_DAYS;day++)for(let minute=0;minute<TRIPLE_RACES_PER_DAY;minute++){
  const race=getTripleRaceFixture(minute,day);
  const track=TRACKS[minute%3],slot=Math.floor(minute/3);
  const key=day+'|'+track.id+'|'+slot;
  assert.ok(!keys.has(key),'duplicate race key '+key);keys.add(key);
  assert.equal(race.trackId,track.id);
  assert.equal(race.trackSlot,slot);
  assert.equal(race.trackRaceNumber,slot+1);
  assert.equal(race.venueRaceNumber,minute+1);
  assert.equal(race.startSecond,minute*60+30);
  assert.equal(race.entries.length,12);
  assert.equal(new Set(race.entries.map(e=>e.symbol)).size,12);
  assert.equal(raceIdFor(track.id,day,slot),day*1440+minute);
  assert.equal(race.sourceFixture.slot,(slot+track.offsetMinutes*160)%480);
  const baseline=getRaceFixture(race.sourceFixture.slot,day);
  assert.deepEqual(race.entries.map(e=>e.symbol),baseline.entries.map(e=>e.symbol));
  const minStart=day*MINUTES_PER_DAY+minute;
  for(const entry of race.entries){
   entries++;
   const [p0,p1,p2]=[0,1,2].map(dt=>getContinuousFixturePrice(entry.symbol,minStart+dt));
   assert.equal(entry.priceAtStart,p0);assert.equal(entry.priceAtMid,p1);assert.equal(entry.priceAtFinish,p2);
   assert.ok([p0,p1,p2,entry.input1,entry.input2].every(Number.isFinite),'nonfinite price '+key);
   assert.ok(p0>0&&p1>0&&p2>0,key);
   // Each minute in the deterministic tape moves no more than about 0.72%.
   assert.ok(Math.abs(entry.input1)<1&&Math.abs(entry.input2)<1,
    'synthetic discontinuity '+key+' '+entry.symbol);
  }
  const ranks=officialRanking(createOfficialRace(race.entries));
  assert.equal(ranks.length,12);
  assert.equal(new Set(ranks.map(r=>r.entry.symbol)).size,12);
  assert.ok(ranks.every(r=>r.finishTime>0&&Number.isFinite(r.finishTime)),key);
  assert.ok(ranks.every((r,i)=>i===0||ranks[i-1].finishTime<=r.finishTime),key);
  totals[track.id]++;valid++;
  lastTrackIds[track.id]=key;
 }
 assert.equal(valid,10080);
 assert.equal(entries,120960);
 assert.equal(keys.size,10080);
 assert.deepEqual(Object.values(totals),[3360,3360,3360]);
 assert.deepEqual(lastTrackIds,{'muybridge':'6|muybridge|479','genesis':'6|genesis|479','vint-cerf':'6|vint-cerf|479'});
});
test('calendar: three individual 180s cycles, starts at seconds 30,90,150 of each 3-minute block',()=>{
 assert.deepEqual(TRACK_DEFS.map(t=>t.minuteOffset),[0,1,2]);
 for(const minute of [0,1,2,3,4,5,1437,1438,1439]){
  const tr=TRACKS[minute%3];
  const fixed=new Date(Date.UTC(2026,10,4,3,minute,30)); // First local day
  const snapshot=tripleLiveSlot(fixed,tr.id);
  assert.equal(snapshot.minuteOfDay,minute);
  assert.equal(snapshot.slotSeconds,0);
  assert.equal(snapshot.next.slot,(snapshot.slot+1)%480);
 }
});
