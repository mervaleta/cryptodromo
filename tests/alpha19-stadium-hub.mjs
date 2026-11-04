import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {tripleLiveSlot,allLiveTracks,raceIdFor,TRACK_DEFS} from '../visual-lab/tripleLiveSchedule.js';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {STADIUMS} from '../assets/stadium-network-engine.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exists=p=>existsSync(new URL('../'+p,import.meta.url));

test('1440 races per day, three staggered channels and 7-day archive',()=>{
 const total=Array(3).fill(0);
 for(let minute=0;minute<1440;minute++){
  const race=getTripleRaceFixture(minute,0);
  total[minute%3]++;
  assert.equal(race.number,minute+1);
  assert.equal(race.startSecond,minute*60+30);
  assert.equal(race.entries.length,12);
  assert.equal(new Set(race.entries.map(x=>x.symbol)).size,12);
  const official=officialRanking(createOfficialRace(race.entries));
  assert.equal(official.length,12);
  assert.ok(official.every(x=>Number.isFinite(x.finishTime)&&x.finishTime>0));
 }
 assert.deepEqual(total,[480,480,480]);
 assert.equal(7*total.reduce((s,x)=>s+x,0),10080);
});
test('each track gets its own 180-second channel, at :30 with one-minute offsets',()=>{
 const m0=new Date('2026-11-04T03:00:30Z');
 const g0=new Date('2026-11-04T03:01:30Z');
 const v0=new Date('2026-11-04T03:02:30Z');
 const m=tripleLiveSlot(m0,'muybridge');
 const g=tripleLiveSlot(g0,'genesis');
 const v=tripleLiveSlot(v0,'vint-cerf');
 assert.deepEqual([m.minuteOfDay,g.minuteOfDay,v.minuteOfDay],[0,1,2]);
 assert.deepEqual([m.slotSeconds,g.slotSeconds,v.slotSeconds],[0,0,0]);
 assert.deepEqual([m.index,g.index,v.index],[2*1440,2*1440+1,2*1440+2]);
 assert.equal(tripleLiveSlot(new Date('2026-11-04T03:03:30Z'),'muybridge').minuteOfDay,3);
 assert.equal(tripleLiveSlot(m0,'genesis').slot,479);
 assert.equal(tripleLiveSlot(m0,'genesis').dayIndex,1);
 assert.equal(tripleLiveSlot(m0,'genesis').slotSeconds,120);
 assert.equal(allLiveTracks(m0).length,3);
 assert.equal(raceIdFor('vint-cerf',2,479),2*1440+1439);
 assert.throws(()=>raceIdFor('vint-cerf',0,480),RangeError);
});
test('world catalog reflects agreed Muybridge Genesis Vint Cerf tracks',()=>{
 assert.equal(STADIUMS.length,8);
 assert.equal(STADIUMS.reduce((x,s)=>x+s.tracks.length,0),13);
 assert.deepEqual(STADIUMS.find(s=>s.slug==='crypto').tracks.map(t=>t.id),
  ['muybridge','genesis','vint-cerf']);
 assert.deepEqual(TRACK_DEFS.map(t=>t.id),['muybridge','genesis','vint-cerf']);
});
test('homepage and all stadium destinations exist; original 3D race moved to broadcast',()=>{
 const home=read('index.html');
 assert.match(home,/Elegí tu tribuna/);
 assert.doesNotMatch(home,/id="raceCanvas"/);
 for(const slug of STADIUMS.map(s=>s.slug)){
  assert.ok(exists('stadiums/'+slug+'/index.html'),slug+' missing');
  assert.ok(home.includes('href="/stadiums/'+slug+'/'),slug+' missing from homepage');
 }
 for(const sub of ['','live/','archive/','broadcast/'])
  assert.ok(exists('stadiums/crypto/'+sub+'index.html'),'Satoshi page missing: '+sub);
 assert.match(read('stadiums/crypto/broadcast/index.html'),/id="raceCanvas"/);
 assert.match(read('stadiums/crypto/live/index.html'),/stadium-broadcast/);
});
test('scene uses track-specific price fixture, replay selection and physical course modes',()=>{
 const scene=read('visual-lab/scene.js');
 for(const fragment of ['getTripleRaceFixture','tripleLiveSlot','hasReplay','raceFor(','selectedTrack?.layout','nextRaceIndex','createOfficialRace','officialRanking'])
  assert.ok(scene.includes(fragment),'Missing runtime integration '+fragment);
 const explorer=read('estadio/estadio.js');
 assert.match(explorer,/buildThreeCoursePreview/);
 assert.match(explorer,/next\.areas\.track\.visible=false/);
 const geometry=read('visual-lab/threeCoursePreview.js');
 for(const id of ['muybridge','genesis','vint-cerf'])assert.ok(geometry.includes(id));
});
test('archive replays official synthetic outcomes, never payment or forged results',()=>{
 const archive=read('assets/crypto-archive.js');
 assert.match(archive,/officialRanking\(createOfficialRace\(race\.entries\)\)/);
 assert.match(archive,/replayDay/);assert.match(archive,/replayMinute/);
 assert.doesNotMatch(archive,/checkout|payout|deposit|withdraw/i);
 const page=read('stadiums/crypto/archive/index.html');
 assert.match(page,/predeterminados por el fixture reproducible/);
});
