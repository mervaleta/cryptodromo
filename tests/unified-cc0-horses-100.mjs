import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {allTokenIdentities,tokenIdentity,CRP_UNIFIED_HORSE_BUILD,CRP_HORSE_TOKEN_COUNT}
 from '../race-lab/source/src/tokenHorseFactory.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';

const sourceSnapshot=JSON.stringify(TOKEN_ROSTER);
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('100 actual unique cryptographic token horse identities, backed by one CC0 source',()=>{
 assert.equal(CRP_HORSE_TOKEN_COUNT,100);
 assert.equal(TOKEN_ROSTER.length,100);
 const identities=allTokenIdentities();
 assert.equal(identities.length,100);
 assert.equal(new Set(identities.map(i=>i.symbol)).size,100);
 for(const [n,id] of identities.entries()){
  const token=TOKEN_ROSTER[n];
  assert.equal(id.symbol,token.symbol);
  assert.equal(id.accent.toLowerCase(),token.color.toLowerCase());
  assert.equal(id.coat.toLowerCase(),token.coat.toLowerCase(),'unedited tokens keep organic base coat');
  assert.equal(id.materials.coat,token.coat);
  assert.ok(id.groom.maneScale>0);
  assert.ok(id.groom.tailScale>0);
 }
 assert.deepEqual(TOKEN_ROSTER.map(t=>t.symbol),identities.map(i=>i.symbol));
 assert.equal(JSON.stringify(TOKEN_ROSTER),sourceSnapshot,'factory cannot alter authoritative market roster');
 assert.match(CRP_UNIFIED_HORSE_BUILD,/crp-100-cc0-groom/);
});

test('actual Horse Atelier published palette changes only its individual token profile',()=>{
 const saved={ETH:{name:'Ether Stallion',appearance:{
  appearanceMode:'natural_coat',raceColor:'#11aaee',coatColor:'#654321',
  muzzleColor:'#554433',hoofColor:'#333222',maneColor:'#aa9988',
  tailColor:'#bb7755',eyeColor:'#121212',bridleColor:'#998877',
  maneScale:1.25,tailScale:.82,maneStyle:'long',tailStyle:'short'
 }}};
 const ids=allTokenIdentities(saved);
 const eth=ids.find(v=>v.symbol==='ETH'),btc=ids.find(v=>v.symbol==='BTC');
 assert.equal(eth.accent,'#11aaee');
 assert.equal(eth.coat,'#654321');
 assert.equal(eth.materials.mane,'#aa9988');
 assert.equal(eth.materials.tail,'#bb7755');
 assert.equal(eth.materials.eye,'#121212');
 assert.equal(eth.materials.hoof,'#333222');
 assert.equal(eth.groom.maneScale,1.25);
 assert.equal(eth.groom.tailScale,.82);
 assert.equal(eth.groom.maneStyle,'long');
 assert.equal(eth.groom.tailStyle,'short');
 assert.equal(btc.accent,TOKEN_ROSTER[0].color);
 assert.equal(btc.coat,TOKEN_ROSTER[0].coat);
 assert.equal(tokenIdentity(TOKEN_ROSTER[0],saved).symbol,'BTC');
 assert.throws(()=>tokenIdentity({symbol:'BAD_TOKEN'}),/desconocido/);
 assert.equal(JSON.stringify(TOKEN_ROSTER),sourceSnapshot);
});

test('visual mapping never changes fixtures, official price inputs or ranking',()=>{
 const samples=[[0,0],[17,1],[212,4],[479,6]];
 const before=samples.map(([race,day])=>{
  const entries=getRaceFixture(race,day).entries;
  return {entries:JSON.stringify(entries),
   results:officialRanking(createOfficialRace(entries)).map(v=>v.entry.symbol)};
 });
 const saved={BTC:{appearance:{appearanceMode:'brand_colored',raceColor:'#dddddd',maneColor:'#cc5511',tailColor:'#1100aa'}}};
 allTokenIdentities(saved);
 const after=samples.map(([race,day])=>{
  const entries=getRaceFixture(race,day).entries;
  return {entries:JSON.stringify(entries),
   results:officialRanking(createOfficialRace(entries)).map(v=>v.entry.symbol)};
 });
 assert.deepEqual(after,before);
});

test('the two public race renderers, BTC fiche and programmatic groom use shared master',()=>{
 const horse=get('race-lab/source/src/horse.js');
 const groom=get('race-lab/source/src/horseGroomCC0.js');
 const factory=get('race-lab/source/src/tokenHorseFactory.js');
 const broadcast=get('visual-lab/scene.js');
 const lab=get('race-lab/source/src/main.js');
 const btc=get('racers/btc-atelier-preview.js');
 const page=get('racers/index.html');
 assert.match(horse,/createRaceCC0Groom/);
 assert.match(horse,/sharedGroom\?\.update/);
 assert.match(groom,/hairAnchor/);
 assert.match(groom,/hair\.skeleton/);
 assert.match(groom,/sharedGeometry/);
 assert.match(groom,/setGroom/);
 assert.match(factory,/createTokenHorse/);
 assert.match(broadcast,/horse-qa/);
 assert.match(lab,/__crpUnifiedHorsesQA/);
 assert.match(btc,/createTokenHorse/);
 assert.match(page,/data-btc-variant="cc0groom" aria-pressed="true"/);
 assert.doesNotMatch(groom,/WildMesh.*\.glb/);
 assert.doesNotMatch(groom,/horse_run_cycle_on_place\.glb/);
});
