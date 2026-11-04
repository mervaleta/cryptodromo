import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { STADIUMS, STADIUM_SLUGS, range, getRoster, makeDay } from '../assets/stadium-network-engine.mjs';
assert.equal(STADIUMS.length,8);
assert.equal(new Set(STADIUMS.map(s=>s.slug)).size,8);
assert.equal(STADIUMS.reduce((n,s)=>n+s.tracks.length,0),24);
assert(STADIUMS.every(s=>s.tracks.length>=3),'Cada sede requiere al menos tres pistas');
assert.equal(STADIUM_SLUGS.length,7);
assert.equal(STADIUM_SLUGS.reduce((n,s)=>n+getRoster(s).length,0),184);
assert.equal(makeDay('crypto','2026-11-04').status,'EXTERNAL');
assert.equal(makeDay('crypto','2026-11-04').races.length,0);
assert.equal(makeDay('merval','2026-11-23').races.length,0);
assert.equal(makeDay('wall-street','2026-11-26').status,'CLOSED');
assert.equal(makeDay('wall-street','2026-11-27').races.at(-1).localStart,'12:59');
assert.equal(makeDay('wall-street','2026-11-27').races.length,210);
assert.equal(makeDay('wall-street','2026-11-04').races.length,390);
assert.equal(makeDay('merval','2026-11-04').races.length,450);
assert.equal(makeDay('tokyo','2026-11-04').races.length,330);
assert.equal(makeDay('tokyo','2026-11-04').races[149].localStart,'11:29');
assert.equal(makeDay('tokyo','2026-11-04').races[150].localStart,'12:30');
assert.equal(makeDay('london','2026-11-04').races.length,510);
assert.equal(makeDay('commodities','2026-11-04').races.length,150);
assert.equal(makeDay('forex','2026-11-04').races.at(-1).localStart,'23:59');
assert.equal(makeDay('merval','2026-11-09').status,'REVIEW_REQUIRED');
assert.equal(makeDay('tokyo','2026-11-23').status,'CLOSED');
assert.equal(makeDay('commodities','2026-11-27').status,'REVIEW_REQUIRED');
assert.equal(makeDay('forex','2026-11-07').races.length,0);
assert.equal(makeDay('champions','2026-11-08').races.length,25);
assert.equal(makeDay('wall-street','2026-11-04').races[0].startsAt,'2026-11-04T14:30:00.000Z');
assert.equal(makeDay('wall-street','2026-11-04').races.at(-1).localStart,'15:59');
assert.equal(makeDay('wall-street','2026-11-04').races.at(-1).sessionLastMinute,true);
assert.equal(makeDay('wall-street','2026-11-04').races.at(-1).settlementPolicy,'LAST_VALID_SESSION_CANDLE_OR_OFFICIAL_CLOSE');
assert.equal(makeDay('london','2026-11-04').races.at(-1).localStart,'16:29');
assert.equal(makeDay('tokyo','2026-11-04').races.at(-1).localStart,'15:29');
assert.equal(makeDay('wall-street','2026-11-04').races[0].settlementStatus,'NOT_CONNECTED');
assert.equal(makeDay('wall-street','2026-11-02').status,'REVIEW_REQUIRED');
assert.equal(makeDay('wall-street','2026-11-04').races[0].cycleSeconds,180);
assert.equal(makeDay('wall-street','2026-11-04').races[0].durationSeconds,180);
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
   assert(race.startsAt.endsWith('Z'));
   assert.equal(race.cycleSeconds,180);
   assert.equal(race.durationSeconds,180);
   assert.equal(race.cycleStartAt,race.startsAt);
   assert.equal(race.settlementStatus,'NOT_CONNECTED');
   assert.equal(race.trackSlug,STADIUMS.find(s=>s.slug===slug).tracks[race.laneIndex].id);
   assert.equal(race.laneIndex%3,race.laneIndex);
   count++;
  }
 }
 byStadium[slug]=count;total+=count;
}
assert(total>30000,'Una largada por minuto debe aumentar el fixture mundial');
assert.equal(Object.keys(byStadium).length,7);
for(const slug of STADIUM_SLUGS){
 const day=makeDay(slug,slug==='champions'?'2026-11-08':'2026-11-04');
 if(day.races.length<4)continue;
 for(let i=1;i<day.races.length;i++){
  const prev=day.races[i-1],next=day.races[i];
  const delta=(Date.parse(next.startsAt)-Date.parse(prev.startsAt))/60000;
  assert(delta>=1,'Largadas monotónicas, no se solapan minutos');
  if(delta===1)assert.notEqual(prev.trackSlug,next.trackSlug,'Deben alternar pistas');
  if(i>=3&&delta===1&&Date.parse(prev.startsAt)-Date.parse(day.races[i-3].startsAt)===120000){
    assert.equal(next.trackSlug,day.races[i-2].trackSlug,'Reutilizar pista luego de tres minutos');
  }
 }
}

for(const s of STADIUMS)assert(existsSync('stadiums/'+s.slug+'/index.html'),'Falta '+s.slug);
assert(existsSync('stadiums/fixture/index.html'));
const nav=readFileSync('assets/crp-global-nav.js','utf8');
assert(nav.includes("'/stadiums/'")&&nav.includes("'/stadiums/fixture/'"));
console.log('OK: 8 sedes, 24 pistas proyectadas, 184 plazas nuevas y '+total.toLocaleString('es-AR')+' turnos DEMO de 180 segundos sin resultados ficticios.');
