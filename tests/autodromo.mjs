import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAR_TRACKS,CAR_ROSTER,CAR_RACE_SECONDS,CAR_SLOT_SECONDS,
  CAR_RACES_PER_DAY,CAR_RACES_PER_TRACK,GRID_RELEASE_SECONDS,GRID_ROW_GAP_METERS,
  QUALIFYING_LOOKBACK_MINUTES,carTrack,getCarSession,positionsAt,resultsAtFinish} from '../autodromo/logic.js';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {createOfficialRace,officialRanking,positionAt} from '../race-lab/source/src/data/officialRace.js';
import {tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';
import {getContinuousFixturePrice,MINUTES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';

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
test('pole position is determined by past-only synthetic candles, not the future outcome',()=>{
 assert.equal(QUALIFYING_LOOKBACK_MINUTES,3);
 assert.equal(GRID_ROW_GAP_METERS,15);
 assert.equal(GRID_RELEASE_SECONDS,45);
 const date=new Date('2026-11-04T15:31:55.000Z');
 for(const track of CAR_TRACKS){
  const session=getCarSession(track.id,date);
  const {grid,gridBySymbol,fixture,clock}=session;
  assert.equal(grid.length,12);
  assert.equal(gridBySymbol.size,12);
  assert.deepEqual(grid.map(x=>x.position),Array.from({length:12},(_,i)=>i+1));
  assert.deepEqual(grid.map(x=>x.row),[1,1,2,2,3,3,4,4,5,5,6,6]);
  assert.deepEqual(grid.map(x=>x.column),[0,1,0,1,0,1,0,1,0,1,0,1]);
  assert.equal(grid[0].backMeters,5);
  assert.equal(grid[1].backMeters,10);
  for(const item of grid){
   assert.equal(item.qualifyingEndMinute,clock.dayIndex*MINUTES_PER_DAY+fixture.minute);
   assert.ok(item.qualifyingStartMinute<=item.qualifyingEndMinute);
   assert.ok(item.qualifyingEndMinute-item.qualifyingStartMinute<=3);
   assert.equal(item.preRacePrice,getContinuousFixturePrice(item.symbol,item.qualifyingStartMinute));
   assert.ok(item.backMeters>0);
  }
  assert.deepEqual(grid,getCarSession(track.id,date).grid);
  assert.equal(positionsAt(session,0)[0].symbol,grid[0].symbol);
  assert.deepEqual(positionsAt(session,0).map(x=>x.symbol),grid.map(x=>x.symbol));
 }
});
test('staggered 2-by-6 grid visibly starts behind the line and merges into dose-driven running',()=>{
 const session=getCarSession('muybridge',new Date('2026-11-04T15:31:55.000Z'));
 const start=positionsAt(session,0);
 assert.ok(start.every(x=>x.meters===0));
 assert.ok(start.every(x=>x.trackMeters<0));
 assert.ok(start.every(x=>x.trackMeters===x.visualMeters));
 assert.ok(start.every((x,i)=>i===0||x.trackMeters<start[i-1].trackMeters));
 for(const seconds of [1,5,15,25,35,44,45,50,55,60]){
  const frame=positionsAt(session,seconds);
  assert.equal(frame.length,12);
  assert.equal(new Set(frame.map(x=>x.symbol)).size,12);
  for(const x of frame){
   const official=session.profiles.find(p=>p.entry.symbol===x.symbol);
   assert.equal(x.meters,positionAt(official,seconds));
   assert.ok(Number.isFinite(x.visualMeters));
   if(seconds>=45)assert.equal(x.trackMeters,x.meters);
  }
  for(let i=1;i<frame.length;i++)
   assert.ok(frame[i-1].visualMeters>=frame[i].visualMeters-1e-9);
 }
 assert.deepEqual(positionsAt(session,60).map(x=>x.symbol),resultsAtFinish(session).map(x=>x.symbol));
 assert.notEqual(session.grid[0].symbol,undefined);
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
 assert.match(circuits,/GRID_ROW_GAP_METERS/);
 assert.match(html,/id="pole-label"/);
 assert.doesNotMatch(js,/localStorage|fetch\s*\(/);
});
