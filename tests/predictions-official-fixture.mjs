import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveWorldRace } from '../race-lab/source/src/data/worldRaceRecord.js';
for(let day=0;day<7;day++){
 test('prediction manifest day '+(day+1)+' matches all 1440 authoritative races',()=>{
  const bundle=JSON.parse(readFileSync(new URL('../predictions/fixtures/day-'+(day+1)+'.json',import.meta.url)));
  assert.equal(bundle.schema,'crp19-predictions-fixture-v1');
  assert.equal(bundle.simulation,true);
  assert.equal(bundle.races.length,1440);
  const keys=new Set();
  for(let minute=0;minute<1440;minute++){
   const rec=bundle.races[minute], trackId=['muybridge','genesis','vint-cerf'][minute%3];
   const source=resolveWorldRace({family:'alpha19',dayIndex:day,slot:Math.floor(minute/3),trackId});
   assert.equal(rec.key,source.key);
   assert.equal(rec.trackId,trackId);
   assert.equal(rec.minute,minute);
   assert.deepEqual(rec.runners,source.participantSymbols);
   assert.deepEqual(rec.ranking,source.ranking.map(p=>p.symbol));
   assert.equal(new Set(rec.runners).size,12);
   assert.deepEqual([...rec.runners].sort(),[...rec.ranking].sort());
   assert.equal(keys.has(rec.key),false);
   keys.add(rec.key);
  }
 });
}
