import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('only BTC explicitly opts into the atelier',()=>{
 const racers=read('racers/racers.js'),html=read('racers/index.html');
 assert.match(racers,/get\('atelier'\)==='btc'/);
 assert.match(racers,/token\.symbol==='BTC'/);
 assert.match(racers,/previewModule=btcAtelier\?/);
 assert.match(racers,/horse-preview\.js\?v=alpha18-gaitmane-1/);
 assert.match(html,/id="btc-atelier-panel"[^>]*hidden/);
 assert.match(html,/href="\?atelier=btc#BTC"/);
});
test('pilot uses the established authored GLB Gallop, without jockeys',()=>{
 const pilot=read('racers/btc-atelier-preview.js');
 assert.match(pilot,/import \{createHorse\} from '\.\.\/race-lab\/source\/src\/horse\.js/);
 assert.match(pilot,/maneMotion:candidate/);
 assert.match(pilot,/mode:paused\?'Idle':'Gallop'/);
 assert.match(pilot,/setWind/);
 assert.match(pilot,/setVisualQuality/);
 assert.match(pilot,/setSpeed/);
 assert.doesNotMatch(pilot,/Alpha22|createAlpha22RaceHorse|horse-fidelity|jockey:true/);
});
test('neither LIVE race nor token identities are edited by atelier',()=>{
 const pilot=read('racers/btc-atelier-preview.js');
 assert.doesNotMatch(pilot,/createOfficialRace|raceFixture|trackPoint|setRace\(/);
 const legacy=read('visual-lab/horseRenderer.js');
 assert.match(legacy,/createLegacyHorse/);
 assert.doesNotMatch(legacy,/createAlpha22RaceHorse/);
});
