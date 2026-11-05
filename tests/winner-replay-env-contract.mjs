import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWinnerSlowMotion,WINNER_REPLAY_DURATION,WINNER_REPLAY_SOURCE_SPAN} from '../visual-lab/winnerSlowMotion.js';
import {createFinishOrchestrator} from '../alpha15/finishOrchestrator.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('winner slow-mo is 0.5x, exactly 7.2s, samples real race positions without new scoring',()=>{
 const replay=createWinnerSlowMotion();
 assert.equal(replay.state.phase,'idle');
 assert.equal(replay.begin(0,'BTC'),true);
 assert.equal(replay.begin(2,'ETH'),false,'Replay cannot start twice');
 assert.equal(replay.state.sampleTime,60-WINNER_REPLAY_SOURCE_SPAN);
 assert.equal(replay.state.speed,.5);
 assert.equal(replay.state.winnerSymbol,'BTC');
 replay.advance(WINNER_REPLAY_DURATION/2);
 assert.ok(Math.abs(replay.state.sampleTime-(60-WINNER_REPLAY_SOURCE_SPAN/2))<1e-9);
 assert.equal(replay.state.progress,.5);
 replay.advance(WINNER_REPLAY_DURATION/2);
 assert.equal(replay.state.phase,'holding');
 assert.equal(replay.state.complete,false);
 replay.advance(2.2);
 assert.equal(replay.state.complete,true);
 assert.equal(replay.state.sampleTime,60);
 assert.equal(replay.begin(1,'ETH'),false);
 replay.reset();
 assert.equal(replay.state.phase,'idle');
 assert.equal(replay.begin(1,'ETH'),true);
 assert.throws(()=>createWinnerSlowMotion({duration:0}),RangeError);
 assert.throws(()=>createWinnerSlowMotion({sourceEnd:2,sourceSpan:4}),RangeError);
});
test('replay can only begin after the 12th horse has crossed the official line',()=>{
 const gate=createFinishOrchestrator({runners:12,holdAfterLast:2.4,maxVisualSeconds:19});
 const replay=createWinnerSlowMotion();
 const part=gate.update({elapsed:69,distances:[120,...Array(11).fill(94)],finishDistance:100});
 assert.equal(part.allCrossed,false);
 if(gate.state.crossedCount===12)replay.begin(0,'BTC');
 assert.equal(replay.state.phase,'idle');
 const full=gate.update({elapsed:71,distances:Array(12).fill(120),finishDistance:100});
 assert.equal(full.crossedCount,12);
 if(gate.state.crossedCount===12)replay.begin(0,'BTC');
 assert.equal(replay.state.active,true);
 gate.update({elapsed:75,distances:Array(12).fill(120),finishDistance:100});
 assert.equal(gate.state.revealed,true,'official gate may authorize while replay remains visible');
 assert.equal(replay.state.active,true,'TV does not immediately expose official scoreboard');
 replay.advance(WINNER_REPLAY_DURATION);
 assert.equal(replay.state.phase,'holding');
 replay.advance(2.2);
 assert.equal(replay.state.complete,true);
});
test('both official scene pages mount slow-motion overlay, source and result ordering',()=>{
 const scene=read('visual-lab/scene.js');
 for(const html of ['visual-lab/index.html','stadiums/crypto/broadcast/index.html']){
  const doc=read(html);
  for(const id of ['winner-replay','winner-replay-name','winner-replay-progress','result-overlay','raceCanvas'])
   assert.ok(doc.includes('id="'+id+'"'),html+' missing '+id);
  assert.match(doc,/scene\.js\?v=muybridge-clearance-20261104-v1/);
 }
 assert.match(scene,/winnerReplay\.begin\(index,first\.entry\.symbol\)/);
 assert.match(scene,/lastCrossedAt=gate\.lastCrossAt;\s*startWinnerReplay\(\)/);
 assert.match(scene,/winnerReplay\.advance\(realSeconds\)/);
 assert.match(scene,/renderWinnerReplay\(\)/);
 assert.match(scene,/if\(finishShown\|\|winnerReplay\.state\.active\)return;/);
 assert.match(scene,/if\(gate\.showOfficialResult&&!winnerReplay\.state\.active\)showOfficialResult\(\)/);
 assert.match(scene,/officialRanking\(profiles\)/);
 assert.doesNotMatch(read('visual-lab/winnerSlowMotion.js'),/fetch\(|createOfficialRace|PRICE_FIXTURE/);
});
test('TV has real environment actions wired to existing stadium lighting inputs',()=>{
 const live=read('stadiums/crypto/live/index.html');
 const engine=read('stadiums/crypto/broadcast/index.html');
 const remote=read('assets/crypto-venue.js');
 const deck=read('assets/satoshi-tv-environment.js');
 assert.equal((live.match(/<iframe\b/g)||[]).length,1,'Never duplicate WebGL players');
 for(const group of ['stage','weather','light','hour','cloud','fog'])
  assert.match(live,new RegExp('data-tv-'+group+'='));
 for(const id of ['weather','light-power','light-dimmer','light-pattern','light-perimeter',
  'light-color','daytime','daytime-auto','cloud-cover','fog-intensity'])
  assert.ok(engine.includes('id="'+id+'"'),id);
 for(const id of ['muybridge','genesis','vint-cerf'])assert.ok(live.includes('data-tv-switch="'+id+'"'));
 assert.match(remote,/createTvEnvironmentDeck/);
 assert.match(remote,/environmentDeck\.apply\(\)/);
 assert.match(deck,/input\.dispatchEvent\(new EventClass\('input'/);
 assert.match(deck,/change\(doc,'daytime-auto'/);
 assert.match(deck,/change\(doc,'weather'/);
 assert.match(live,/tv-director-params-20261104-v2/);
 assert.doesNotMatch(deck,/createOfficialRace\(|setRace\(|raceIndex\b|officialRanking\(/);
});
