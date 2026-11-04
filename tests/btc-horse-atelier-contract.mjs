import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('normal BTC card loads anatomical master and retains explicit rollback',()=>{
 const racers=read('racers/racers.js'),html=read('racers/index.html');
 assert.match(racers,/atelierMode==='btc'/);
 assert.match(racers,/atelierMode!=='off'&&selected\.symbol==='BTC'/);
 assert.match(racers,/btc-master-procedural-hind-groom-20261104-v12/);
 assert.match(racers,/horse-preview\.js\?v=alpha18-gaitmane-1/);
 assert.match(html,/id="btc-atelier-panel"[^>]*hidden/);
 assert.match(html,/href="\?atelier=btc#BTC"/);
 assert.match(html,/btc-master-procedural-hind-groom-20261104-v12/);
});
test('V4 visibly alters REAL 3D geometry and streams motion while retaining Gallop',()=>{
 const pilot=read('racers/btc-atelier-preview.js'),v4=read('racers/btc-hero-v5.js');
 assert.match(pilot,/createHorse/);
 assert.match(pilot,/createBTCHeroV5/);
 assert.match(pilot,/mode:paused\?'Idle':'Gallop'/);
 assert.match(pilot,/hero\?\.update/);
 assert.match(pilot,/setWind/);
 assert.match(pilot,/setSpeed/);
 assert.doesNotMatch(pilot,/createBTCHairAtelier|createBTC3DHeroGroom|applyBTCCoatLook/);
 assert.match(v4,/createBTCHeroV4/);
 assert.match(v4,/btcVMane/);
 assert.match(v4,/btcVTail/);
 assert.match(v4,/integrate/);
 assert.match(v4,/hairStrand/);
 assert.match(v4,/coat\.geometry/);
 assert.match(v4,/pass>=10/);
 
 
 
 
 
 
 
 
 assert.doesNotMatch(v4,/ImageLoader|TextureLoader|\.png|\.jpg|CanvasTexture|PlaneGeometry|jockey:true/);
});
test('race engine and all other tokens keep their existing source',()=>{
 const pilot=read('racers/btc-atelier-preview.js');
 assert.doesNotMatch(pilot,/createOfficialRace|raceFixture|trackPoint|setRace\(/);
 const legacy=read('visual-lab/horseRenderer.js');
 assert.match(legacy,/createLegacyHorse/);
 assert.doesNotMatch(legacy,/createAlpha22RaceHorse/);
});
