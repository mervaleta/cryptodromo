import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {FIXTURE_DAYS,RACES_PER_DAY,getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {syntheticRaceRecord,syntheticAudit,assertSyntheticRaceRecord} from '../alpha15/raceRecords.js';
import {buildSyntheticCareers} from '../alpha15/careers.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';

test('sports laboratory shares the exact 100-token roster and weekly fixture',()=>{
 assert.equal(TOKEN_ROSTER.length,100);
 assert.equal(new Set(TOKEN_ROSTER.map(x=>x.symbol)).size,100);
 assert.equal(FIXTURE_DAYS*RACES_PER_DAY,3360);
 for(const [day,slot] of [[0,0],[1,301],[6,479]]){
  const f=getRaceFixture(slot,day);
  assert.equal(f.entries.length,12);
  assert.equal(new Set(f.entries.map(x=>x.symbol)).size,12);
  const record=syntheticRaceRecord(day,slot);
  assertSyntheticRaceRecord(record);
  const official=officialRanking(createOfficialRace(f.entries));
  assert.deepEqual(record.finish.map(x=>x.symbol),official.map(x=>x.entry.symbol));
  assert.equal(record.provenance.synthetic,true);
  assert.equal(record.provenance.transmissionObserved,false);
  assert.equal(record.summary.winner,official[0].entry.symbol);
  assert.equal(syntheticAudit(day,slot).horses[0].symbol,record.summary.winner);
 }
});

test('historical cutoffs cannot include future results in horse biographies',()=>{
 const start=buildSyntheticCareers({throughDay:0,throughSlot:0});
 const after=buildSyntheticCareers({throughDay:0,throughSlot:1});
 assert.equal(start.racesAnalyzed,1);
 assert.equal(after.racesAnalyzed,2);
 assert.equal([...start.careers.values()].reduce((sum,x)=>sum+x.starts,0),12);
 assert.equal([...after.careers.values()].reduce((sum,x)=>sum+x.starts,0),24);
 assert.equal(start.careers.get('BTC').provenance.transmissionObserved,false);
});

test('audit and statistics are display-only, without modifying official prices or finish',()=>{
 const f=getRaceFixture(10,3);
 const before=f.entries.map(x=>[x.symbol,x.input1,x.input2,x.coefficients1.join(','),x.coefficients2.join(',')]);
 const one=syntheticRaceRecord(3,10);
 const two=syntheticRaceRecord(3,10);
 assert.deepEqual(one,two);
 assert.deepEqual(f.entries.map(x=>[x.symbol,x.input1,x.input2,x.coefficients1.join(','),x.coefficients2.join(',')]),before);
 assert.equal(one.scoring.dependsOnVisuals,false);
});

test('browser page references shared assets, guards synthetic provenance, no gambling actions',()=>{
 const html=readFileSync(new URL('../laboratorio/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../laboratorio/lab.js',import.meta.url),'utf8');
 assert.match(html,/race-site-hub\.css/);
 assert.match(html,/No se aceptan apuestas/);
 assert.match(html,/synthetic-v1/);
 assert.match(js,/syntheticRaceRecord/);
 assert.match(js,/assertSyntheticRaceRecord/);
 assert.match(js,/buildSyntheticCareers/);
 assert.match(js,/throughSlot/);
 assert.doesNotMatch(js,/fetch\s*\(/);
});
