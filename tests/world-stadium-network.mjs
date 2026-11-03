import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { STADIUMS, STADIUM_SLUGS, range, getRoster, makeDay } from '../assets/stadium-network-engine.mjs';
assert.equal(STADIUMS.length,8);
assert.equal(new Set(STADIUMS.map(s=>s.slug)).size,8);
assert.equal(STADIUMS.reduce((n,s)=>n+s.tracks.length,0),13);
assert.equal(STADIUM_SLUGS.length,7);
assert.equal(STADIUM_SLUGS.reduce((n,s)=>n+getRoster(s).length,0),184);
assert.equal(makeDay('crypto','2026-11-04').status,'EXTERNAL');
assert.equal(makeDay('crypto','2026-11-04').races.length,0);
assert.equal(makeDay('merval','2026-11-23').races.length,0);
assert.equal(makeDay('wall-street','2026-11-26').status,'CLOSED');
assert.equal(makeDay('wall-street','2026-11-27').races.at(-1).localStart,'12:54');
assert.equal(makeDay('merval','2026-11-09').status,'REVIEW_REQUIRED');
assert.equal(makeDay('tokyo','2026-11-23').status,'CLOSED');
assert.equal(makeDay('commodities','2026-11-27').status,'REVIEW_REQUIRED');
assert.equal(makeDay('forex','2026-11-07').races.length,0);
assert.equal(makeDay('champions','2026-11-08').races.length,3);
assert.equal(makeDay('wall-street','2026-11-04').races[0].startsAt,'2026-11-04T14:33:00.000Z');
const byStadium={},ids=new Set();let total=0;
for(const slug of STADIUM_SLUGS){
 let count=0;
 for(let d=new Date(range.from+'T12:00:00Z');d.toISOString().slice(0,10)<=range.to;d.setUTCDate(d.getUTCDate()+1)){
  const date=d.toISOString().slice(0,10),first=makeDay(slug,date),second=makeDay(slug,date);
  assert.deepEqual(first,second,'La programación debe ser determinista');
  for(const race of first.races){
   assert(!ids.has(race.id),'ID duplicado '+race.id);ids.add(race.id);
   assert.equal(race.feedMode,'NOT_CONNECTED');
   assert.equal(race.marketDate,date);
   assert.equal(race.entrySymbols.length,slug==='champions'?8:12);
   assert.equal(new Set(race.entrySymbols).size,race.entrySymbols.length);
   assert(!('winner' in race)&&!('result' in race));
   assert(race.startsAt.endsWith('Z'));count++;
  }
 }
 byStadium[slug]=count;total+=count;
}
assert.deepEqual(byStadium,{'merval':2516,'wall-street':2372,'tokyo':2014,'london':3360,'commodities':432,'forex':5660,'champions':12});
assert.equal(total,16366);
for(const s of STADIUMS)assert(existsSync('stadiums/'+s.slug+'/index.html'),'Falta '+s.slug);
assert(existsSync('stadiums/fixture/index.html'));
const nav=readFileSync('assets/crp-global-nav.js','utf8');
assert(nav.includes("'/stadiums/'")&&nav.includes("'/stadiums/fixture/'"));
console.log('OK: 8 sedes, 13 pistas, 184 plazas nuevas y '+total.toLocaleString('es-AR')+' turnos sin resultados ficticios.');
