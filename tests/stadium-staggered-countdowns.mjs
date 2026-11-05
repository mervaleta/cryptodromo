import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allLiveTracks,TRACK_DEFS} from '../visual-lab/tripleLiveSchedule.js';
import {projectChannelCountdown} from '../assets/crypto-channel-countdown.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const nextView=date=>allLiveTracks(new Date(date)).map(projectChannelCountdown);

test('three channels have staggered next starts, not identical 60-second phase timers',()=>{
 // 14:42:14 in Buenos Aires: presentation, results and race all have 00:16
 // left in their PHASE, but their NEXT RACE starts are exactly 60s apart.
 const views=nextView('2026-11-04T17:42:14Z');
 assert.deepEqual(views.map(v=>v.phase),['presentation','results','race']);
 assert.deepEqual(views.map(v=>v.secondsToNext),[16,76,136]);
 assert.deepEqual(views.map(v=>v.nextStart),['14:42:30','14:43:30','14:44:30']);
 assert.deepEqual(views.map(v=>v.nextRaceNumber),[295,295,295]);
 assert.ok(views.every(v=>v.label.startsWith('Próxima carrera 295 / 480 · largada ')));
});
test('next-start countdowns remain separated by a minute on all time boundaries',()=>{
 const instants=[
  '2026-11-04T17:42:14Z',
  '2026-11-04T17:42:29Z',
  '2026-11-04T17:42:30Z',
  '2026-11-04T17:43:30Z',
  '2026-11-04T17:44:30Z',
  '2026-11-05T02:59:29Z', // 23:59:29 BA
  '2026-11-05T03:00:30Z',
  '2026-11-05T03:01:30Z'
 ];
 for(const date of instants){
  const values=nextView(date).map(v=>v.secondsToNext).sort((a,b)=>a-b);
  assert.deepEqual(values,[values[0],values[0]+60,values[0]+120],date);
  assert.ok(values[0]>0 && values[2]<=180,date);
 }
});
test('card phase and labels derive from the same independent channel snapshot',()=>{
 assert.deepEqual(TRACK_DEFS.map(t=>t.id),['muybridge','genesis','vint-cerf']);
 const views=nextView('2026-11-04T17:42:14Z');
 assert.equal(new Set(views.map(x=>x.nextStart)).size,3);
 assert.equal(new Set(views.map(x=>x.phase)).size,3);
 const live=read('assets/crypto-venue.js');
 const page=read('stadiums/crypto/live/index.html');
 assert.match(live,/clock\(data\.secondsToNext\)/);
 assert.match(live,/data\.next\.label/);
 assert.match(live,/data-race-label/);
 assert.doesNotMatch(live,/60-data\.slotSeconds:phase==='results'/);
 assert.match(page,/crypto-venue-aaa-20261105-r1\.js/);
 assert.throws(()=>projectChannelCountdown(null),TypeError);
});
