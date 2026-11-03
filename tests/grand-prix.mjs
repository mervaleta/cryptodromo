import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GRAND_PRIX_COUNT,GRAND_PRIX_SLOTS,listGrandPrix,getGrandPrixAt,getGrandPrixById,grandPrixResult,grandPrixStandings,grandPrixRivalries,prepareGrandPrixReplay,replayFrame} from '../sports/grandPrix.js';
import {RACES_PER_DAY,FIXTURE_DAYS,getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {FINISH_POINTS} from '../race-lab/source/src/data/trackSplits.js';

test('Grand Prix contains precisely 28 unique events from original 480-slot schedule',()=>{
 const events=listGrandPrix();
 assert.equal(events.length,GRAND_PRIX_COUNT);
 assert.equal(GRAND_PRIX_COUNT,28);
 assert.deepEqual(GRAND_PRIX_SLOTS,[119,239,359,479]);
 assert.equal(new Set(events.map(x=>x.id)).size,28);
 for(const event of events){
  assert.equal(event.contract,'cryptodromo.grand-prix.v1');
  assert.equal(event.participants.length,12);
  assert.equal(new Set(event.participants).size,12);
  assert.deepEqual(event.participants,getRaceFixture(event.slotIndex,event.dayIndex).entries.map(x=>x.symbol));
  assert.strictEqual(getGrandPrixById(event.id)?.id,event.id);
  assert.equal(getGrandPrixAt(event.dayIndex,event.slotIndex)?.id,event.id);
  assert.equal(event.provenance.synthetic,true);
 }
 assert.equal(getGrandPrixAt(0,0),null);
});

test('Grand Prix winners and positions match immutable official engine',()=>{
 const events=listGrandPrix();
 for(const event of [events[0],events[8],events.at(-1)]){
  const official=officialRanking(createOfficialRace(getRaceFixture(event.slotIndex,event.dayIndex).entries));
  const result=grandPrixResult(event);
  assert.equal(result.winner,official[0].entry.symbol);
  assert.deepEqual(result.finish.map(x=>x.symbol),official.map(x=>x.entry.symbol));
  assert.deepEqual(result.finish.map(x=>x.championshipPoints),FINISH_POINTS);
  assert.equal(result.provenance.observedTransmission,false);
 }
});

test('cutoff excludes future results, totals remain pure and deterministic',()=>{
 const none=grandPrixStandings(-1);
 assert.equal(none.eventsCompleted,0);
 assert.equal(none.standings.reduce((s,x)=>s+x.points,0),0);
 const first=grandPrixStandings(119);
 assert.equal(first.eventsCompleted,1);
 assert.equal(first.standings.reduce((s,x)=>s+x.starts,0),12);
 assert.equal(first.standings.reduce((s,x)=>s+x.wins,0),1);
 assert.equal(first.standings.reduce((s,x)=>s+x.points,0),FINISH_POINTS.reduce((a,b)=>a+b,0));
 assert.equal(grandPrixStandings(118).eventsCompleted,0);
 const full=grandPrixStandings(FIXTURE_DAYS*RACES_PER_DAY-1);
 assert.equal(full.eventsCompleted,28);
 assert.equal(full.standings.reduce((s,x)=>s+x.starts,0),28*12);
 assert.equal(full.standings.reduce((s,x)=>s+x.wins,0),28);
 assert.equal(full.standings.reduce((s,x)=>s+x.trophies.length,0),28);
 assert.equal(full.standings.reduce((s,x)=>s+x.points,0),28*FINISH_POINTS.reduce((a,b)=>a+b,0));
 assert.deepEqual(full.standings,grandPrixStandings(FIXTURE_DAYS*RACES_PER_DAY-1).standings);
});

test('replay frames originate from official movement and finish ordering',()=>{
 const event=listGrandPrix()[0],replay=prepareGrandPrixReplay(event);
 const start=replayFrame(replay,0),middle=replayFrame(replay,30),finish=replayFrame(replay,60);
 assert.equal(start.length,12);
 assert.equal(finish.length,12);
 assert.ok(start.every(x=>x.meters===0));
 assert.ok(middle.every(x=>x.meters>0));
 const ranked=[...finish].sort((a,b)=>a.finalPlace-b.finalPlace).map(x=>x.symbol);
 assert.deepEqual(ranked,replay.record.finish.map(x=>x.symbol));
 assert.ok(finish.every(x=>Number.isFinite(x.meters)));
 assert.throws(()=>replayFrame(replay,61),RangeError);
 assert.throws(()=>grandPrixStandings(3360),RangeError);
});

test('head-to-head rivals come exclusively from completed Grand Prix',()=>{
 assert.equal(grandPrixRivalries(-1).length,0);
 const rivals=grandPrixRivalries(3359,12);
 assert.ok(rivals.length<=12);
 for(const r of rivals){
  assert.ok(r.meetings>=2);
  assert.equal(r.meetings,r.firstAhead+r.secondAhead);
 }
});

test('sports page is read-only and identifies synthetic source transparently',()=>{
 const html=readFileSync(new URL('../grandes-premios/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../grandes-premios/grandPrixPage.js',import.meta.url),'utf8');
 assert.match(html,/race-site-hub\.css/);
 assert.match(html,/SIMULACIÓN DEMOSTRATIVA/);
 assert.match(html,/no son cotizaciones reales/);
 assert.match(js,/sourceMode/);
 assert.match(js,/effectiveCutoff/);
 assert.match(js,/prepareGrandPrixReplay/);
 assert.doesNotMatch(js,/fetch\s*\(/);
});
