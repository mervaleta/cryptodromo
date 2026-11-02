import assert from 'node:assert/strict';
import test from 'node:test';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {buildBroadcastProfiles} from '../visual-lab/raceChoreography.js';
import {buildTrackSplits,splitSnapshot,FINISH_POINTS} from '../race-lab/source/src/data/trackSplits.js';

test('Alpha 15 real fixture scores follow visual splits and preserve official results',()=>{
 for(const day of [0,1,3,6])for(const race of [0,89,246,479]){
  const fixture=getRaceFixture(race,day);
  const actual=createOfficialRace(fixture.entries);
  const official=officialRanking(actual).map(p=>p.entry.symbol);
  const broadcast=buildBroadcastProfiles(actual);
  for(const mode of ['legacy','quarters']){
   const scored=buildTrackSplits(broadcast,{mode});
   assert.deepEqual(scored.results.map(p=>p.symbol),official);
   assert.equal(scored.finishWinner,official[0]);
   assert.deepEqual(scored.results.map(p=>p.finishPoints),FINISH_POINTS);
   assert.equal(scored.results.reduce((acc,p)=>acc+p.bonusPoints,0),mode==='legacy'?4:3);
   const withheld=splitSnapshot(scored,59.9);
   assert.equal(withheld.finishVisible,false);
   assert.equal(withheld.winner,null);
   assert.equal(withheld.standings.every(row=>row.finishPoints===null),true);
   assert.equal(withheld.checkpoints.every(split=>split.meters!==1000||split.record===null),true);
   const published=splitSnapshot(scored,80,{finishAuthorized:true});
   assert.equal(published.winner,official[0]);
   assert.equal(published.standings.reduce((total,row)=>total+row.bonusPoints,0),mode==='legacy'?4:3);
  }
 }
});
