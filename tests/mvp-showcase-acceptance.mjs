import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS,PRICE_FIXTURE} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {gatePositions,validateGateEntries} from '../visual-lab/broadcastGates.js';

const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
const signs=readFileSync(new URL('../visual-lab/broadcastGateNumbers.js',import.meta.url),'utf8');

test('showcase fixture is explicitly synthetic and offline',()=>{
 assert.equal(PRICE_FIXTURE.generated,true);
 assert.equal(PRICE_FIXTURE.liveConnection,false);
 assert.match(PRICE_FIXTURE.version,/synthetic/i);
});
test('sampled first/middle/last races have 12 distinct, consistently ranked runners',()=>{
 const samples=[[0,0],[1,0],[RACES_PER_DAY-1,0],[0,FIXTURE_DAYS-1],[Math.floor(RACES_PER_DAY/2),Math.floor(FIXTURE_DAYS/2)]];
 for(const [race,day] of samples){
  const entries=getRaceFixture(race,day).entries;
  assert.equal(entries.length,12);
  assert.equal(validateGateEntries(entries),true);
  assert.equal(gatePositions(-390).length,entries.length);
  const a=officialRanking(createOfficialRace(entries));
  const b=officialRanking(createOfficialRace(getRaceFixture(race,day).entries));
  assert.deepEqual(a.map(x=>x.entry.symbol),b.map(x=>x.entry.symbol));
  assert.equal(new Set(a.map(x=>x.entry.symbol)).size,12);
  assert.ok(a.every(x=>Number.isFinite(x.finishTime)&&x.finishTime>0));
 }
});
test('LIVE rebinds signs and gates together on fixture change',()=>{
 assert.match(scene,/gateKit\.setEntries\(race\.entries\);gateLabels\.setEntries\(race\.entries\)/);
 assert.match(scene,/createBroadcastGates\(/);
 assert.match(scene,/attachGateNumbers\(/);
});
test('signage stays visual-only and does not change official scoring',()=>{
 assert.doesNotMatch(signs,/createOfficialRace|officialRanking|priceAtStart|priceAtFinish/);
 assert.match(scene,/officialRanking/);
});
test('result display is guarded by a dedicated finish controller',()=>{
 assert.match(scene,/finishController/);
 assert.match(scene,/finishController\.reset|finishController\.update|finishController\.resolve/);
});
