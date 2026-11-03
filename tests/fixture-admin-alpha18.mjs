import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getRaceFixture,PRICE_FIXTURE,FIXTURE_DAYS,RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,officialAudit} from '../race-lab/source/src/data/officialRace.js';
const html=readFileSync(new URL('../admin/fixture/index.html',import.meta.url),'utf8');
assert.match(html,/\.\/fixture/); // keep this panel isolated from original pages
assert.match(html,/4 estrellas, 4 principales y 4 desafíos/);
assert.match(html,/if\(original\)return original/);
assert.match(html,/import \{TOKEN_ROSTER\} from '\/race-lab\/source\/src\/data\/tokenRoster\.js'/);
assert.equal(TOKEN_ROSTER.length,100);
assert.equal(FIXTURE_DAYS,7);
assert.equal(RACES_PER_DAY,480);
assert.equal(PRICE_FIXTURE.liveConnection,false);
for(let day=0;day<FIXTURE_DAYS;day++)for(let n=0;n<RACES_PER_DAY;n++){
 const fixture=getRaceFixture(n,day);
 assert.equal(fixture.entries.length,12);
 assert.equal(new Set(fixture.entries.map(e=>e.symbol)).size,12);
 for(const tier of ['star','core','challenger']) assert.equal(fixture.entries.filter(e=>e.tier===tier).length,4);
 const profiles=createOfficialRace(fixture.entries),rank=officialRanking(profiles),audit=officialAudit(profiles,day+1,n+1);
 assert.equal(rank[0].entry.symbol,audit.horses[0].symbol);
 assert.ok(rank.every(row=>Number.isFinite(row.finishTime)));
}
console.log('PASS: Alpha18 fixture/admin contract, 3360 synthetic races, independent official results');
