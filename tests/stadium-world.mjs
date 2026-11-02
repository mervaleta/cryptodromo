import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {STADIUM_IDS,getStadiumPreset} from '../race-lab/source/src/stadium/presets.js';
import {createStadiumVenue} from '../race-lab/source/src/stadium/venue.js';

const require=createRequire(new URL('../race-lab/source/package.json',import.meta.url));
const THREE=require('three');
const ctx={fillRect(){},fillText(){},beginPath(){},stroke(){},moveTo(){},lineTo(){}};
globalThis.document={createElement(tag){
  assert.equal(tag,'canvas');
  return {width:1024,height:180,getContext(){return ctx;}};
}};
test('three standalone venues are distinct data presets',()=>{
  assert.deepEqual(STADIUM_IDS,['satoshi','exchange','horizon']);
  assert.equal(new Set(STADIUM_IDS.map(id=>getStadiumPreset(id).name)).size,3);
  assert.equal(STADIUM_IDS.filter(id=>getStadiumPreset(id).features.spires).length,1);
});
for(const id of STADIUM_IDS){
  for(const quality of ['low','medium','high']){
    test(id+' '+quality+' builds, handles weather, and disposes',()=>{
      const scene=new THREE.Scene(),before=scene.children.length;
      const venue=createStadiumVenue({THREE,scene,stadiumId:id,quality,weatherParticles:true});
      assert.equal(scene.children.length,before+1);
      assert.equal(venue.constants.axes,'X-forward Y-up Z-width');
      assert.equal(venue.constants.lanes,12);
      assert.ok(venue.getStats().crowdCount>100);
      assert.ok(venue.getStats().treeCount>40);
      assert.equal(venue.areas.architecture.parent,venue.root);
      const p=venue.getLanePosition(.13,3);
      assert.ok([p.x,p.y,p.z,p.heading].every(Number.isFinite));
      venue.setEnvironment({hour:22,type:'rain',wind:18});
      venue.update(.016);venue.setScoreboard({raceNumber:'005',leader:'ETH',time:'00:41'});
      venue.setEnvironment({hour:12,type:'clear'});venue.update(.016);
      venue.dispose();
      assert.equal(scene.children.length,before);
      assert.equal(venue.root.children.length,0);
    });
  }
}
test('race core and current cinematic broadcast remain isolated',()=>{
  const main=readFileSync('visual-lab/scene.js','utf8');
  const fixture=readFileSync('race-lab/source/src/data/raceFixture.js','utf8');
  assert.match(main,/createOfficialRace/);
  assert.match(main,/createStadiumBackdrop/);
  assert.match(fixture,/RACES_PER_DAY\s*=\s*480/);
  assert.match(fixture,/RUNNERS_PER_RACE\s*=\s*12/);
  const explorer=readFileSync('estadio/index.html','utf8');
  for(const id of ['venue-select','camera-select','lighting','climate','quality-select'])assert.ok(explorer.includes('id="'+id+'"'));
});
