import assert from 'node:assert/strict';
import test from 'node:test';
import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,positionAt,FIRST_COEFFICIENTS,SECOND_COEFFICIENTS} from '../race-lab/source/src/data/officialRace.js';
test('all 12 runners use both exact and independent CRP decks',()=>{
 const fields=getRaceFixture(0,0).entries;
 assert.equal(fields.length,12);
 for(const e of fields){
  assert.deepEqual([...e.coefficients1].sort((a,b)=>a-b),[...FIRST_COEFFICIENTS].sort((a,b)=>a-b));
  assert.deepEqual([...e.coefficients2].sort((a,b)=>a-b),[...SECOND_COEFFICIENTS].sort((a,b)=>a-b));
  assert.equal(e.input1,100*(e.priceAtMid/e.priceAtStart-1));
  assert.equal(e.input2,100*(e.priceAtFinish/e.priceAtMid-1));
 }
});
test('dose ordering changes on-screen pacing but cannot change results',()=>{
 const entries=getRaceFixture(117,3).entries;
 const first=createOfficialRace(entries);
 const reordered=createOfficialRace(entries.map(e=>({...e,coefficients1:[...e.coefficients1].reverse(),coefficients2:[...e.coefficients2].reverse()})));
 assert.deepEqual(officialRanking(first).map(p=>p.entry.symbol),officialRanking(reordered).map(p=>p.entry.symbol));
 for(let i=0;i<first.length;i++){
  assert.equal(first[i].distanceAt60,reordered[i].distanceAt60);
  assert.equal(first[i].finishTime,reordered[i].finishTime);
  assert.equal(positionAt(first[i],0),0);
  assert.equal(positionAt(first[i],60),first[i].distanceAt60);
 }
});
test('late 1-minute variation changes official result',()=>{
 const entries=getRaceFixture(3,2).entries;
 const first=createOfficialRace(entries);
 const modified=createOfficialRace(entries.map((e,i)=>i===0?{...e,input2:e.input2+0.75}:e));
 assert.notEqual(first[0].distanceAt60,modified[0].distanceAt60);
 for(let i=1;i<12;i++)assert.equal(first[i].distanceAt60,modified[i].distanceAt60);
});
test('all 3,360 synthetic races are deterministic, finite and have twelve runners',()=>{
 let count=0;
 for(let day=0;day<FIXTURE_DAYS;day++)for(let n=0;n<RACES_PER_DAY;n++){
  const first=createOfficialRace(getRaceFixture(n,day).entries);
  assert.equal(first.length,12);
  assert.equal(officialRanking(first).length,12);
  for(const p of first){assert.ok(Number.isFinite(p.finishTime)&&p.finishTime>0);assert.ok(p.distanceAt60>0);}
  count++;
 }
 assert.equal(count,3360);
});
