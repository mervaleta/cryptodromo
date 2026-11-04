import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('normal BTC card loads original Maya anatomical horse, with rollback',()=>{
 const racers=read('racers/racers.js'),html=read('racers/index.html');
 assert.match(racers,/atelierMode==='btc'/);
 assert.match(racers,/atelierMode!=='off'&&selected\.symbol==='BTC'/);
 assert.match(racers,/btc-maya-anatomy-20261104/);
 assert.match(racers,/horse-preview\.js\?v=alpha18-gaitmane-1/);
 assert.match(html,/id="btc-atelier-panel"[^>]*hidden/);
 assert.match(html,/href="\?atelier=btc#BTC"/);
 assert.match(html,/btc-maya-anatomy-20261104/);
});
test('Maya sculpt is skinned to the native Gallop and V4 is retained as comparison',()=>{
 const pilot=read('racers/btc-atelier-preview.js'),v4=read('racers/btc-hero-v4.js'),maya=read('racers/btc-maya-master.js'),groom=read('racers/btc-maya-groom.js');
 assert.match(pilot,/createHorse/);
 assert.match(pilot,/createBTCHeroV4/);
 assert.match(pilot,/createBTCHeroMaya/);
 assert.match(maya,/BTC_EQUINE_MESH/);
 assert.match(maya,/makeSkinTransfer/);
 assert.match(maya,/new THREE\.SkinnedMesh/);
 assert.match(groom,/createMayaGroom/);
 assert.match(pilot,/mode:paused\?'Idle':'Gallop'/);
 assert.match(pilot,/hero\?\.update/);
 assert.match(pilot,/setWind/);
 assert.match(pilot,/setSpeed/);
 assert.doesNotMatch(pilot,/createBTCHairAtelier|createBTC3DHeroGroom|applyBTCCoatLook/);
 assert.match(v4,/new THREE\.SkinnedMesh/);
 assert.match(v4,/skinIndex/);
 assert.match(v4,/skinWeight/);
 assert.match(v4,/mesh\.bind\(hair\.skeleton/);
 assert.doesNotMatch(v4,/copy\.computeVertexNormals/); // GLB normals remain smooth
 assert.match(v4,/sculptedBodyParts/);
 assert.match(v4,/oldHairHidden/);
 assert.match(v4,/hair\.visible=previouslyVisible/);
 assert.match(v4,/heroTime/);
 assert.doesNotMatch(v4,/ImageLoader|TextureLoader|\.png|\.jpg|CanvasTexture|PlaneGeometry|jockey:true/);
});
test('race engine and all other tokens keep their existing source',()=>{
 const pilot=read('racers/btc-atelier-preview.js');
 assert.doesNotMatch(pilot,/createOfficialRace|raceFixture|trackPoint|setRace\(/);
 const legacy=read('visual-lab/horseRenderer.js');
 assert.match(legacy,/createLegacyHorse/);
 assert.doesNotMatch(legacy,/createAlpha22RaceHorse/);
});
