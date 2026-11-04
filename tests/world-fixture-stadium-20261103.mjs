import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STADIUMS,range,makeDay} from '../assets/stadium-network-engine.js';
import {STADIUM_IDS,WORLD_STADIUM_IDS,getStadiumPreset} from '../race-lab/source/src/stadium/presets.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const routes=['stadiums/index.html','stadiums/fixture/index.html',
 ...STADIUMS.map(s=>'stadiums/'+s.slug+'/index.html')];

test('world pages use Hostinger-compatible .js modules, watchdog and valid HTML',()=>{
 assert.equal(routes.length,10);
 for(const path of routes){
  const html=read(path);
  if(path==='stadiums/crypto/index.html'){
   assert.match(html,/crypto-venue\.js\?v=hub-1/);
   assert.match(html,/\/stadiums\/crypto\/live\//);
   assert.match(html,/\/stadiums\/crypto\/archive\//);
   continue;
  }
  assert.match(html,/stadium-network-ui\.js\?v=world2/);
  assert.match(html,/stadium-network-watchdog\.js\?v=world2/);
  assert.doesNotMatch(html,/src="\/assets\/stadium-network-ui\.mjs/);
  assert.match(html,/id="world-app"/);
 }
 const engine=read('assets/stadium-network-engine.js');
 const ui=read('assets/stadium-network-ui.js');
 assert.match(engine,/export const STADIUMS/);
 assert.match(ui,/stadium-network-engine\.js\?v=world2/);
 assert.match(ui,/root\.dataset\.worldReady='1'/);
 assert.match(read('assets/stadium-network-watchdog.js'),/No se pudo cargar esta sección/);
});
test('all eight world venue cards connect to 3D, without replacing the editorial fixture',()=>{
 assert.equal(STADIUMS.length,8);
 assert.deepEqual(WORLD_STADIUM_IDS,STADIUMS.map(s=>s.slug));
 assert.deepEqual(STADIUM_IDS,['satoshi','exchange','horizon']);
 const ui=read('assets/stadium-network-ui.js');
 assert.match(ui,/\/estadio\/\?venue=\$\{encodeURIComponent\(s.slug\)\}/);
 for(const s of STADIUMS){
  const p=getStadiumPreset(s.slug);
  assert.equal(p.id,s.slug);
  assert.equal(p.name,s.name);
  assert.ok(p.seed>0);
  assert.ok(p.palette.roof>0);
  assert.ok(p.signs.gate);
 }
 assert.equal(makeDay('crypto','2026-11-04').races.length,0);
 assert.equal(makeDay('wall-street','2026-11-04').races.length>0,true);
 assert.equal(range.from,'2026-11-04');
});
test('original three stadiums and authoritative racing code remain independent',()=>{
 const script=read('estadio/estadio.js'),page=read('estadio/index.html');
 assert.match(page,/OCHO ESTADIOS/);
 assert.match(page,/value="satoshi"/);
 assert.match(page,/value="exchange"/);
 assert.match(page,/value="horizon"/);
 for(const id of WORLD_STADIUM_IDS)assert.match(page,new RegExp('value="'+id+'"'));
 assert.match(script,/WORLD_STADIUM_IDS/);
 assert.match(script,/stadium-qa/);
 assert.match(script,/scene\.fog\.near=type/);
 assert.match(script,/history\.replaceState/);
 assert.doesNotMatch(script,/createOfficialRace|broadcastSpeed|PRICE_FIXTURE|startBetting/);
 assert.doesNotMatch(read('race-lab/source/src/stadium/venue.js'),/createOfficialRace|broadcastPosition/);
});
