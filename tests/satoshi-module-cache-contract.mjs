import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const marker='satoshi-cachefix-20261104-v3';
test('triple fixture loads the new continuous source via versioned path',()=>{
 const fixture=read('race-lab/source/src/data/tripleRaceFixture.js');
 assert.ok(fixture.includes("./raceFixture.js?v="+marker));
 assert.ok(fixture.includes('getContinuousFixturePrice'));
 assert.ok(read('race-lab/source/src/data/raceFixture.js').includes('export function getContinuousFixturePrice'));
 for(const s of ['visual-lab/scene.js','assets/crypto-archive.js'])
  assert.ok(read(s).includes("tripleRaceFixture.js?v="+marker),s);
});
test('stadium preset, venue and three-course layout use versioned imports',()=>{
 const stadium=read('estadio/estadio.js'),venue=read('race-lab/source/src/stadium/venue.js');
 assert.ok(stadium.includes("presets.js?v="+marker));
 assert.ok(stadium.includes("venue.js?v="+marker));
 assert.ok(venue.includes("presets.js?v="+marker));
 assert.ok(stadium.includes("threeCoursePreview.js?v="+marker));
 assert.ok(read('visual-lab/threeCoursePreview.js').includes("threeCourseLayout.js?v="+marker));
 assert.ok(read('race-lab/source/src/stadium/presets.js').includes('WORLD_STADIUM_IDS'));
});
test('all entry HTML and TV source URLs bust old production caches',()=>{
 for(const path of ['stadiums/crypto/archive/index.html'])
  assert.ok(read(path).includes(marker),path+' missing cache marker');
 assert.match(read('stadiums/crypto/broadcast/index.html'),/scene\.js\?v=[a-z0-9][\w.-]+/);
 assert.match(read('visual-lab/index.html'),/scene\.js\?v=[a-z0-9][\w.-]+/);
  assert.ok(read('assets/satoshi-tv-contract.js').includes("build:'satoshi-tv-director-v1-20261104'"));
 assert.ok(read('estadio/index.html').includes('stadium-flight-v1-20261104'));
 assert.ok(read('stadiums/crypto/live/index.html').includes('satoshi-tv-director-v1-20261104'));
 
});
