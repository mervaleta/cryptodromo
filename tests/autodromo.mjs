import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAR_TRACKS,CAR_ROSTER,CAR_RACE_SECONDS,CAR_SLOT_SECONDS,
  CAR_RACES_PER_DAY,CAR_RACES_PER_TRACK,carTrack,getCarSession,positionsAt,resultsAtFinish} from '../autodromo/logic.js';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {createOfficialRace,officialRanking,positionAt} from '../race-lab/source/src/data/officialRace.js';
import {tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';

test('second venue exposes three unique circuits and 100 individually identified cars',()=>{
 assert.equal(CAR_TRACKS.length,3);
 assert.equal(new Set(CAR_TRACKS.map(t=>t.id)).size,3);
 assert.equal(new Set(CAR_TRACKS.map(t=>t.layout)).size,3);
 assert.equal(CAR_ROSTER.length,100);
 assert.equal(new Set(CAR_ROSTER.map(x=>x.symbol)).size,100);
 assert.equal(new Set(CAR_ROSTER.map(x=>x.number)).size,100);
 assert.equal(CAR_RACES_PER_DAY,1440);
 assert.equal(CAR_RACES_PER_TRACK,480);
 assert.equal(CAR_RACE_SECONDS,60);
 assert.equal(CAR_SLOT_SECONDS,180);
 assert.equal(carTrack('bad'),null);
 assert.throws(()=>getCarSession('bad'),RangeError);
});
test('autodromo reads same three-channel 180s fixture and immutable financial inputs',()=>{
 const date=new Date('2026-11-04T15:31:55.000Z');
 for(const track of CAR_TRACKS){
  const session=getCarSession(track.id,date);
  const expectedClock=tripleLiveSlot(date,track.id);
  const fixture=getTripleRaceFixture(expectedClock.minuteOfDay,expectedClock.dayIndex);
  assert.equal(session.key,expectedClock.dayIndex+':'+expectedClock.minuteOfDay+':'+track.id);
  assert.equal(session.fixture.trackId,track.id);
  assert.equal(session.clock.slotSeconds,expectedClock.slotSeconds);
  assert.equal(session.fixture.entries.length,12);
  assert.deepEqual(session.fixture.entries,fixture.entries);
  assert.equal(new Set(session.fixture.entries.map(x=>x.symbol)).size,12);
  assert.equal(session.official.length,12);
  assert.equal(session.fixture.fixtureVersion,'alpha19-triple-v2-continuous-week');
  assert.equal(session.fixture.startSecond,expectedClock.minuteOfDay*60+30);
 }
});
test('finish is exactly the official CRP-DOSE-FAIR-V1 ranking for every car circuit',()=>{
 const date=new Date('2026-11-04T21:20:20.000Z');
 for(const track of CAR_TRACKS){
  const session=getCarSession(track.id,date);
  const expected=officialRanking(createOfficialRace(session.fixture.entries));
  assert.deepEqual(resultsAtFinish(session).map(x=>x.symbol),expected.map(p=>p.entry.symbol));
  assert.deepEqual(positionsAt(session,60).map(x=>x.symbol),expected.map(p=>p.entry.symbol));
  assert.ok(positionsAt(session,0).every(x=>x.meters===0));
  assert.ok(positionsAt(session,30).every(x=>x.meters>0));
  for(const profile of session.profiles){
   const result=positionsAt(session,60).find(x=>x.symbol===profile.entry.symbol);
   assert.equal(result.meters,positionAt(profile,60));
  }
  assert.throws(()=>positionsAt(session,-.01),RangeError);
  assert.throws(()=>positionsAt(session,61),RangeError);
 }
});
test('autodromo is isolated, explicitly synthetic and offers real HTML links',()=>{
 const html=readFileSync(new URL('../autodromo/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../autodromo/app.js',import.meta.url),'utf8');
 const circuits=readFileSync(new URL('../autodromo/circuit.js',import.meta.url),'utf8');
 assert.match(html,/SIMULACIÓN SINTÉTICA/);
 assert.match(html,/sin precios reales|No hay apuestas/);
 assert.match(html,/data-track="muybridge"/);
 assert.match(html,/data-track="genesis"/);
 assert.match(html,/data-track="vint-cerf"/);
 assert.match(js,/getCarSession/);
 assert.match(js,/positionsAt/);
 assert.match(circuits,/CatmullRomCurve3/);
 assert.doesNotMatch(js,/localStorage|fetch\s*\(/);
});
