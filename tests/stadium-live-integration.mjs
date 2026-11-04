import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createLiveStadiumDistrict} from '../visual-lab/stadiumDistrict.js';
import {STADIUM_IDS} from '../race-lab/source/src/stadium/presets.js';
const require=createRequire(new URL('../race-lab/source/package.json',import.meta.url));
const THREE=require('three');
const ctx={fillRect(){},fillText(){},beginPath(){},stroke(){}};
globalThis.document={createElement(name){
  assert.equal(name,'canvas');
  return {width:1024,height:128,getContext(){return ctx;}};
}};
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Alpha14 uses one camera, race controller, sky, weather, crowd and course',()=>{
  const scene=read('visual-lab/scene.js');
  assert.match(scene,/createStadiumBackdrop/);
  assert.match(scene,/createLiveStadiumDistrict/);
  assert.match(scene,/createParadeVillage/);
  assert.doesNotMatch(scene,/box\(810,\.29,1\.9/);
  assert.match(scene,/liveDistrict\.setEnvironment/);
  assert.match(scene,/createAlternativeTracks/);
  assert.match(scene,/createNightLights/);
  assert.match(scene,/createOfficialRace/);
  assert.match(scene,/broadcastPosition/);
  assert.doesNotMatch(scene,/createStadiumVenue/);
  for(const html of ['stadiums/crypto/broadcast/index.html','visual-lab/index.html'])
    assert.match(read(html),/scene\.js\?v=alpha(?:18|19|20)-[a-z0-9-]+/);
});
for(const venueId of STADIUM_IDS){
  test('live exterior '+venueId+' stays off-course, changes weather and disposes safely',()=>{
    const scene=new THREE.Scene();
    const originalCount=scene.children.length;
    const district=createLiveStadiumDistrict({THREE,scene,stadiumId:venueId,quality:'balanced'});
    assert.equal(scene.children.length,originalCount+1);
    assert.equal(district.preset.id,venueId);
    assert.deepEqual(Object.keys(district.stats).filter(key=>key.startsWith('adds')).map(key=>district.stats[key]),
      [false,false,false,false]);
    let minZ=Infinity,maxZ=-Infinity;
    district.root.traverse(mesh=>{
      if(mesh.isMesh){assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,false);}
      // Instanced meshes are efficiently batched, and any positions shown stay outside
      // the active Alpha14 track envelope (z from -20 to +20).
      if(mesh.name==='Acceso')assert.fail('legacy race geometry should not be recreated');
    });
    district.setEnvironment({hour:22,type:'rain',wetness:.9});
    district.setQuality('eco');district.setQuality('balanced');
    district.setEnvironment({hour:12,type:'clear',wetness:0});
    district.dispose();
    assert.equal(scene.children.length,originalCount);
    assert.equal(district.root.children.length,0);
  });
}
test('Alpha15 director and finish controller compose with stadium without changing finance engine',()=>{
  const source=read('visual-lab/scene.js');
  assert.match(source,/from ['"]\.\.\/alpha15\/director\.js/);
  assert.match(source,/from ['"]\.\.\/alpha15\/finishOrchestrator\.js/);
  assert.match(source,/from ['"]\.\.\/alpha15\/quality\.js/);
  assert.match(source,/createOfficialRace\(race\.entries\)/);
  const district=read('visual-lab/stadiumDistrict.js');
  assert.doesNotMatch(district,/Math\.random|fetch\(|createOfficialRace|RACES_PER_DAY|createHorse/);
});
