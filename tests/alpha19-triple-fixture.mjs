import test from 'node:test';import assert from 'node:assert/strict';
import {getTripleRaceFixture,TRACKS,TRIPLE_RACES_PER_DAY} from '../race-lab/source/src/data/tripleRaceFixture.js';
test('1440 races per day, 480 per track, twelve distinct horses',()=>{
 const counts=Object.fromEntries(TRACKS.map(t=>[t.id,0]));
 for(let minute=0;minute<TRIPLE_RACES_PER_DAY;minute++){
  const r=getTripleRaceFixture(minute);
  counts[r.trackId]++;
  assert.equal(r.number,minute+1);
  assert.equal(r.startSecond,minute*60+30);
  assert.equal(r.entries.length,12);
  assert.equal(new Set(r.entries.map(e=>e.symbol)).size,12);
  for(const e of r.entries)assert.ok([e.input1,e.input2,e.priceAtStart,e.priceAtMid,e.priceAtFinish].every(Number.isFinite));
 }
 assert.deepEqual(Object.values(counts),[480,480,480]);
});
test('same fixture and shared price source across calls',()=>{
 const a=getTripleRaceFixture(1439,6),b=getTripleRaceFixture(1439,6);
 assert.deepEqual(a,b);
 assert.equal(a.trackId,'vint-cerf');
});
