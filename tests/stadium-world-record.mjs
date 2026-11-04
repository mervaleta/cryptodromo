import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveWorldRace,WORLD_RACE_RECORD_SCHEMA} from '../race-lab/source/src/data/worldRaceRecord.js';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';

const tracks=[['muybridge',0],['genesis',1],['vint-cerf',2]];
test('Alpha18 historical identity is preserved and never rebranded as a three-track race',()=>{
 const record=resolveWorldRace({family:'alpha18',dayIndex:0,slot:12});
 assert.equal(record.schema,WORLD_RACE_RECORD_SCHEMA);
 assert.equal(record.trackId,null);
 assert.equal(record.family,'alpha18');
 assert.equal(record.replay,null);
 assert.match(record.key,/^CRP18-CRYPTO-LEGACY-/);
 assert.equal(record.localTime,'00:36');
 assert.deepEqual(record.participantSymbols,getRaceFixture(12,0).entries.map(e=>e.symbol));
 assert.throws(()=>resolveWorldRace({family:'alpha18',dayIndex:0,slot:1,trackId:'muybridge'}),RangeError);
});
test('Alpha19 world references match exact official fixture, podium and replay for seven days',()=>{
 const keys=new Set();
 for(let dayIndex=0;dayIndex<7;dayIndex++)for(const [trackId,offset] of tracks){
  for(const slot of [0,1,119,239,478,479]){
   const rec=resolveWorldRace({family:'alpha19',dayIndex,slot,trackId});
   const minute=slot*3+offset;
   const fixture=getTripleRaceFixture(minute,dayIndex);
   const official=officialRanking(createOfficialRace(fixture.entries));
   assert.equal(rec.sourceVersion,'synthetic-v1');
   assert.equal(rec.mode,'SYNTHETIC_REPRODUCIBLE');
   assert.equal(rec.connection,'NOT_LIVE');
   assert.equal(rec.minuteOfDay,minute);
   assert.equal(rec.raceNumber,minute+1);
   assert.equal(rec.trackId,trackId);
   assert.deepEqual(rec.participantSymbols,fixture.entries.map(e=>e.symbol));
   assert.deepEqual(rec.podium,official.slice(0,3).map(p=>p.entry.symbol));
   assert.equal(rec.winner,official[0].entry.symbol);
   assert.deepEqual(rec.ranking.map(r=>r.symbol),official.map(r=>r.entry.symbol));
   assert.equal(rec.localTime,fixture.time+':30');
   assert.equal(rec.participants.length,12);
   assert.equal(rec.replay.url,'/stadiums/crypto/broadcast/?track='+trackId+'&replayDay='+dayIndex+'&replayMinute='+minute);
   assert.ok(Object.isFrozen(rec)&&Object.isFrozen(rec.ranking)&&Object.isFrozen(rec.participants));
   assert.ok(!keys.has(rec.key),'duplicate race identity');
   keys.add(rec.key);
  }
 }
 assert.equal(keys.size,126);
});
test('both fixture families are explicitly disjoint and invalid references are rejected',()=>{
 const old=resolveWorldRace({family:'alpha18',dayIndex:6,slot:479});
 const current=resolveWorldRace({family:'alpha19',dayIndex:6,slot:479,trackId:'muybridge'});
 assert.notEqual(old.key,current.key);
 assert.throws(()=>resolveWorldRace({family:'alpha19',dayIndex:7,slot:1,trackId:'muybridge'}),RangeError);
 assert.throws(()=>resolveWorldRace({family:'alpha19',dayIndex:1,slot:480,trackId:'muybridge'}),RangeError);
 assert.throws(()=>resolveWorldRace({family:'alpha19',dayIndex:1,slot:1,trackId:'unlisted'}),RangeError);
 assert.throws(()=>resolveWorldRace({family:'alpha20',dayIndex:1,slot:1}),RangeError);
});
