import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listGrandPrix,prepareGrandPrixReplay,replayFrame,grandPrixResult} from '../sports/grandPrix.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';

const html=readFileSync(new URL('../grandes-premios/replay-3d/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../grandes-premios/replay-3d/replay3d.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../grandes-premios/grandPrixPage.js',import.meta.url),'utf8');

test('3D GP renderer reuses original venue, horses, animation and motor positions',()=>{
 assert.match(js,/createStadiumVenue/);
 assert.match(js,/createHorse/);
 assert.match(js,/prepareGrandPrixReplay/);
 assert.match(js,/replayFrame/);
 assert.match(js,/getLanePosition/);
 assert.match(js,/horse\.update/);
 assert.match(js,/horse\.dispose/);
 assert.match(js,/venue\?\.dispose/);
 assert.doesNotMatch(js,/createOfficialRace/);
 assert.doesNotMatch(js,/officialRanking/);
 assert.doesNotMatch(js,/Math\.random/);
 assert.doesNotMatch(js,/\bfetch\s*\(/);
});
test('3D is an isolated opt-in URL with explicit synthetic archive gating',()=>{
 assert.match(html,/replay3d\.js/);
 assert.match(html,/type="importmap"/);
 assert.match(html,/SIMULACIÓN|SINTÉTICA|DEMO SINTÉTICA/);
 assert.match(html,/gp-podium/);
 for(const id of ['gp-seek','gp-play','gp-camera','gp-speed','gp-restart'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/params\.get\('archive'\)==='1'/);
 assert.match(js,/event\.absoluteIndex<=cutoff/);
 assert.match(page,/replay-3d\/\?day=/);
 assert.match(page,/sourceMode\(\)==='archive'/);
});
test('3D frames are exactly the same results at 0, 5, 30, 45, and 60 seconds',()=>{
 for(const event of [listGrandPrix()[0],listGrandPrix()[11],listGrandPrix().at(-1)]){
  const replay=prepareGrandPrixReplay(event);
  const official=officialRanking(createOfficialRace(getRaceFixture(event.slotIndex,event.dayIndex).entries));
  assert.deepEqual(replay.record.finish.map(x=>x.symbol),official.map(x=>x.entry.symbol));
  for(const second of [0,5,30,45,60]){
   const frame=replayFrame(replay,second);
   assert.equal(frame.length,12);
   assert.equal(new Set(frame.map(x=>x.symbol)).size,12);
   assert.ok(frame.every(x=>Number.isFinite(x.fraction)&&x.fraction>=0&&x.fraction<=1));
  }
  assert.equal(grandPrixResult(event).winner,replay.record.finish[0].symbol);
 }
});
