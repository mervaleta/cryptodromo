import assert from 'node:assert/strict';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getRaceFixture,PRICE_FIXTURE,FIXTURE_DAYS,RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,officialAudit} from '../race-lab/source/src/data/officialRace.js';
assert.equal(TOKEN_ROSTER.length,100);
assert.equal(new Set(TOKEN_ROSTER.map(t=>t.symbol)).size,100);
assert.equal(FIXTURE_DAYS,7);
assert.equal(RACES_PER_DAY,480);
assert.equal(PRICE_FIXTURE.liveConnection,false);
let n=0;
for(let day=0;day<FIXTURE_DAYS;day++){
 for(let race=0;race<RACES_PER_DAY;race++){
  const fixture=getRaceFixture(race,day),entries=fixture.entries;
  assert.equal(entries.length,12);
  assert.equal(new Set(entries.map(e=>e.symbol)).size,12);
  for(const tier of ['star','core','challenger']) assert.equal(entries.filter(e=>e.tier===tier).length,4);
  const profiles=createOfficialRace(entries);
  const ranking=officialRanking(profiles);
  assert.equal(ranking.length,12);
  assert.ok(ranking.every(p=>Number.isFinite(p.finishTime)));
  const audit=officialAudit(profiles,day+1,race+1);
  assert.equal(audit.horses[0].symbol,ranking[0].entry.symbol);
  n++;
 }
}
console.log('OK: '+n+' carreras, 100 tokens, 4/4/4, resultados deterministas');
