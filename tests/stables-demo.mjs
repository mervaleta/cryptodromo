import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace, officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';

const manifest=JSON.parse(readFileSync(new URL('../stables/official-week-v1.json',import.meta.url),'utf8'));
test('the synthetic week matches the actual official CRP race engine, race by race',()=>{
 assert.equal(manifest.version,'synthetic-v1');
 assert.equal(manifest.method,'CRP-DOSE-FAIR-V1');
 assert.equal(manifest.positions.length,3360);
 assert.deepEqual(new Set(manifest.symbols),new Set(TOKEN_ROSTER.map(t=>t.symbol)));
 for(let i=0;i<3360;i++){
  const day=Math.floor(i/480),number=i%480;
  const actual=officialRanking(createOfficialRace(getRaceFixture(number,day).entries))
    .map(p=>p.entry.symbol);
  const supplied=manifest.positions[i];
  assert.equal(supplied.length,12,'12 symbols at race '+i);
  assert.equal(new Set(supplied).size,12,'distinct runners at race '+i);
  assert.deepEqual(supplied,actual,'positions of day '+(day+1)+' race '+(number+1));
 }
});
test('a roster scores only officially entered horses and both rankings use the same XP table',()=>{
 const xp=[0,27,17,12,7,7,7,2,2,2,2,2,2];
 const race=manifest.positions[0];
 const horseA=race[0],horseB=race[11];
 const entries=race.filter(t=>t===horseA||t===horseB);
 const total=entries.reduce((sum,token)=>sum+xp[race.indexOf(token)+1],0);
 assert.equal(total,29);assert.equal(total/entries.length,14.5);
 assert.equal(entries.length,2);
});
