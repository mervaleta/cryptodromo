import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {TRACK_DEFS,raceIdFor,tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const scene=read('visual-lab/scene.js');
const broadcast=read('stadiums/crypto/broadcast/index.html');
const lab=read('visual-lab/index.html');
const preview=read('visual-lab/presentationHorse.js');
const ids=html=>[...html.matchAll(/\bid=["']([A-Za-z][\w-]*)["']/g)].map(match=>match[1]);
const usedIds=[...new Set([
 ...[...scene.matchAll(/\bgetElementById\(\s*['"]([A-Za-z][\w-]*)['"]/g)].map(m=>m[1]),
 ...[...scene.matchAll(/\bquerySelector\(\s*['"]#([A-Za-z][\w-]*)['"]/g)].map(m=>m[1])
])];

test('all directly referenced race DOM elements exist in BOTH broadcast and laboratory',()=>{
 assert.ok(usedIds.length>=75,'selector coverage unexpectedly dropped');
 for(const [name,html] of [['broadcast',broadcast],['laboratory',lab]]){
  const present=new Set(ids(html));
  const missing=usedIds.filter(id=>!present.has(id));
  assert.deepEqual(missing,[],name+' is missing DOM dependencies');
  assert.equal(ids(html).length,present.size,name+' has duplicate DOM ids');
  assert.match(html,/<div id="present-horse-3d"/);
 }
});

test('all channel pages use the continuous synthetic fixture and local 1..480 race labels',()=>{
 assert.match(scene,/tripleMode\?race\.trackRaceNumber:race\.number/);
 assert.match(scene,/TRACK_RACES_PER_DAY/);
 assert.match(scene,/tripleRaceFixture\.js\?v=alpha19-week-v2/);
 const archive=read('assets/crypto-archive.js');
 assert.match(archive,/tripleRaceFixture\.js\?v=alpha19-week-v2/);
 assert.match(read('stadiums/crypto/archive/index.html'),/crypto-archive\.js\?v=satoshi-tv-single-20261104/);
 assert.match(read('visual-lab/index.html'),/scene\.js\?v=alpha19-tv-single-20261104/);
});
test('optional WebGL presentation failure cannot stop the official race',()=>{
 assert.match(preview,/if\(!container\)/);
 assert.match(preview,/return \{show:noop,dispose:noop\}/);
 assert.match(preview,/catch\(error\)/);
 assert.match(scene,/mountPresentationHorse\(document\.querySelector\('#present-horse-3d'\)\)/);
 assert.match(broadcast,/alpha19-tv-single-20261104/,'broadcast must bust old scene cache');
 assert.match(scene,/satoshi-tv-safe-20261104/,'scene must bust old preview cache');
});

test('archive replay references are stable over all seven synthetic days and three tracks',()=>{
 for(let day=0;day<7;day++)for(const track of TRACK_DEFS)for(const slot of [0,1,239,479]){
  const minute=slot*3+track.minuteOffset;
  const id=raceIdFor(track.id,day,slot);
  assert.equal(id,day*1440+minute);
  const race=getTripleRaceFixture(minute,day);
  assert.equal(race.trackId,track.id);
  assert.equal(race.entries.length,12);
  const podium=officialRanking(createOfficialRace(race.entries)).slice(0,3).map(r=>r.entry.symbol);
  assert.deepEqual(podium,officialRanking(createOfficialRace(getTripleRaceFixture(minute,day).entries)).slice(0,3).map(r=>r.entry.symbol));
 }
});

test('three LIVE clocks advance independently across local midnight',()=>{
 for(const date of ['2026-11-04T02:59:59Z','2026-11-04T03:00:30Z','2026-11-05T02:59:59Z','2026-11-05T03:00:30Z']){
  const slots=TRACK_DEFS.map(t=>tripleLiveSlot(new Date(date),t.id));
  assert.equal(slots.length,3);
  assert.equal(new Set(slots.map(s=>s.trackId)).size,3);
  for(const slot of slots){
   assert.ok(slot.index>=0 && slot.index<10080);
   assert.ok(slot.slotSeconds>=0 && slot.slotSeconds<180);
   assert.ok(slot.next.index>=0 && slot.next.index<10080);
   assert.ok(slot.previous.index>=0 && slot.previous.index<10080);
   assert.equal(getTripleRaceFixture(slot.minuteOfDay,slot.dayIndex).trackId,slot.trackId);
  }
 }
});
