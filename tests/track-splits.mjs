import assert from 'node:assert/strict';
import test from 'node:test';
import {FINISH_POINTS,SPLIT_PRESETS,timeAtMark,buildTrackSplits,splitSnapshot,aggregateSplitChampionship} from '../race-lab/source/src/data/trackSplits.js';

// Self-contained smoke fixtures. The official race engine supplies the same profile fields.
const profiles=()=>Array.from({length:12},(_,i)=>({
  entry:{symbol:'T'+i,name:'Token '+i,color:'#abcdef'},index:i,
  cumulative:Array.from({length:13},(_,step)=>step*(1040-i*5)/12),
  distanceAt60:1040-i*5,finishTime:60*1000/(1040-i*5),
}));

test('restores historic 25-18-15...-0 finish points and four +1 records',()=>{
 const result=buildTrackSplits(profiles());
 assert.equal(result.mode,'legacy');
 assert.deepEqual(result.splits.map(x=>x.meters),[200,400,600,800]);
 assert.deepEqual(result.results.map(x=>x.finishPoints),FINISH_POINTS);
 assert.equal(result.splits.every(x=>x.record==='T0'),true);
 assert.equal(result.results[0].totalPoints,29);
 assert.equal(result.results[0].bonusPoints,4);
 assert.equal(result.results[1].totalPoints,18);
 assert.equal(result.results.reduce((sum,x)=>sum+x.bonusPoints,0),4);
});

test('quarters expose 250/500/750/1000 without double-bonusing the finish',()=>{
 const data=buildTrackSplits(profiles(),{mode:'quarters'});
 assert.deepEqual(data.splits.map(x=>x.meters),SPLIT_PRESETS.quarters.meters);
 assert.deepEqual(data.splits.map(x=>x.bonus),[1,1,1,0]);
 assert.equal(data.results[0].totalPoints,28);
 assert.equal(data.splits[3].record,data.finishWinner);
});

test('crossing timestamps are interpolated, the 1000m finish is official',()=>{
 const p=profiles()[0];
 assert.ok(Math.abs(timeAtMark(p,250)-(60*250/1040))<1e-10);
 assert.equal(timeAtMark(p,1000),p.finishTime);
 assert.equal(timeAtMark(p,800)>timeAtMark(p,200),true);
});

test('broadcast discloses only elapsed splits; finish gated by track confirmation',()=>{
 const score=buildTrackSplits(profiles(),{mode:'quarters'});
 const early=splitSnapshot(score,0);
 assert.equal(early.checkpoints.every(x=>!x.visible),true);
 assert.equal(early.standings.every(x=>x.finishPoints===null),true);
 const mid=splitSnapshot(score,31);
 assert.equal(mid.checkpoints.filter(x=>x.visible).length,2);
 assert.equal(mid.finishVisible,false);
 const withheld=splitSnapshot(score,60);
 assert.equal(withheld.checkpoints[3].record,null);
 assert.equal(withheld.winner,null);
 const final=splitSnapshot(score,65,{finishAuthorized:true});
 assert.equal(final.checkpoints[3].record,'T0');
 assert.equal(final.checkpoints[3].ranking.length,12);
 const earlyAuthorization=splitSnapshot(score,20,{finishAuthorized:true});
 assert.equal(earlyAuthorization.finishVisible,false);
 assert.equal(final.standings[0].totalPoints,28);
 assert.equal(final.winner,'T0');
});

test('aggregated championship does not mutate race scoring',()=>{
 const a=buildTrackSplits(profiles()),before=structuredClone(a);
 const standings=aggregateSplitChampionship([a,a]);
 assert.equal(standings.length,12);
 assert.equal(standings[0].symbol,'T0');
 assert.equal(standings[0].totalPoints,58);
 assert.equal(standings[0].splitWins,8);
 assert.deepEqual(a,before);
});

test('rejects invalid mode, nonunique competitors and malformed trajectory',()=>{
 assert.throws(()=>buildTrackSplits(profiles(),{mode:'other'}));
 const dup=profiles();dup[11].entry.symbol='T0';assert.throws(()=>buildTrackSplits(dup));
 const bad=profiles();bad[0].cumulative[2]=-1;assert.throws(()=>buildTrackSplits(bad));
});

test('ties use the same official profile index as the race engine',()=>{
 const tied=profiles();
 tied[0].finishTime=tied[1].finishTime;
 tied.reverse();
 const score=buildTrackSplits(tied);
 assert.equal(score.results[0].symbol,'T0');
 assert.equal(score.results[1].symbol,'T1');
});

test('unreached checkpoints cannot earn an imaginary point',()=>{
 const slow=profiles();
 slow.forEach((p,i)=>{p.cumulative=p.cumulative.map(n=>n*.12);p.finishTime=100+i;});
 const score=buildTrackSplits(slow);
 assert.equal(score.splits[0].record,null);
 assert.equal(score.results.reduce((n,p)=>n+p.bonusPoints,0),0);
});
