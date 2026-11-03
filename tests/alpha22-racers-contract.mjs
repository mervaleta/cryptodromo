import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const viewer=read('racers/horse-preview.js');
const listing=read('racers/racers.js');
const page=read('racers/index.html');

test('racers profile uses exactly the LIVE Alpha22 Fidelity horse, not a GLB',()=>{
 assert.match(viewer,/createAlpha22RaceHorse/);
 assert.match(viewer,/quality:'high'/);
 assert.match(viewer,/jockey:false/);
 assert.doesNotMatch(viewer,/\/src\/horse\.js|GLTFLoader|\.glb(?:\?|['"])/);
 assert.match(viewer,/next\.root/);
 assert.match(viewer,/horse\?\.update\(dt,1\)/);
});
test('roster identity and UI remain hooked to one selected Alpha22 horse',()=>{
 assert.match(viewer,/TOKEN_ROSTER\.findIndex/);
 assert.match(viewer,/coat:token\.coat,accent:token\.color,symbol:token\.symbol/);
 assert.match(listing,/horse-preview\.js\?v=alpha22-fidelity-racers-1/);
 assert.match(page,/racers\.js\?v=alpha22-fidelity-racers-1/);
 assert.match(viewer,/OrbitControls/);
 assert.match(viewer,/\bdispose\(\)/);
});
test('preview never reads prices or controls the official race',()=>{
 assert.doesNotMatch(viewer,/officialRace|raceFixture|createOfficialRace|localStorage|TextureLoader|CanvasTexture/);
 assert.match(viewer,/snapshot:/);
});
