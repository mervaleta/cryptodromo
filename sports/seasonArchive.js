/**
 * Synthetic weekly championship snapshot (read-only, not an observed broadcast).
 * History is retained by explicitly archiving completed calendar cycles.
 * All race winners are recomputed from the EXISTING official fixture; no RNG.
 */
import {listGrandPrix,grandPrixResult} from './grandPrix.js';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {PRICE_FIXTURE,RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js';
import {FINISH_POINTS} from '../race-lab/source/src/data/trackSplits.js';

export const SEASON_CONTRACT='cryptodromo.synthetic-season.v1';
export const SEASON_ANCHOR='2026-11-02';
export const SEASON_DAYS=7;
const DAY=86400000,MONDAY_EPOCH=Date.parse(SEASON_ANCHOR+'T03:00:00Z');
const fromDate=day=>new Date(day).toISOString().slice(0,10);
export function parseSeasonStart(date){
 if(typeof date!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(date))throw new RangeError('Use YYYY-MM-DD');
 const ms=Date.parse(date+'T03:00:00Z');
 if(!Number.isFinite(ms)||fromDate(ms-3*3600000)!==date)throw new RangeError('Invalid calendar date');
 if(ms<MONDAY_EPOCH||(ms-MONDAY_EPOCH)%(DAY*7)!==0)throw new RangeError('Season must start on an anchored Monday');
 return ms;
}
export function currentSeasonStart(date=new Date()){
 if(!(date instanceof Date)||!Number.isFinite(date.valueOf()))throw new TypeError('Valid date required');
 const week=Math.floor((date.valueOf()-MONDAY_EPOCH)/(7*DAY));
 return fromDate(MONDAY_EPOCH+Math.max(0,week)*7*DAY-3*3600000);
}
export function seasonEnd(start){
 const ms=parseSeasonStart(start);
 return fromDate(ms+7*DAY-3*3600000);
}
export function isSeasonClosed(start,now=new Date()){
 if(!(now instanceof Date)||!Number.isFinite(now.valueOf()))throw new TypeError('Valid date required');
 return now.valueOf()>=parseSeasonStart(start)+7*DAY;
}
export function createCompletedSeason(start,{now=new Date()}={}){
 if(!isSeasonClosed(start,now))throw new RangeError('Cannot archive a calendar cycle before it ends');
 const rows=new Map(TOKEN_ROSTER.map(t=>[t.symbol,{symbol:t.symbol,starts:0,wins:0,podiums:0,points:0,trophies:[]}]));
 const events=listGrandPrix().map(event=>{
  const result=grandPrixResult(event);
  for(const runner of result.finish){
   const row=rows.get(runner.symbol);
   row.starts++;row.points+=FINISH_POINTS[runner.place-1]||0;
   if(runner.place===1){row.wins++;row.trophies.push(event.id);}
   if(runner.place<=3)row.podiums++;
  }
  return Object.freeze({
   id:event.id,dayIndex:event.dayIndex,slotIndex:event.slotIndex,time:event.time,
   name:event.name,winner:result.winner,
   podium:result.finish.slice(0,3).map(r=>r.symbol),
   classification:result.finish.map(r=>r.symbol)
  });
 });
 const standings=[...rows.values()].map(row=>({...row,trophies:[...row.trophies]}))
  .sort((a,b)=>b.points-a.points||b.wins-a.wins||b.podiums-a.podiums||a.symbol.localeCompare(b.symbol));
 return {
  contract:SEASON_CONTRACT,id:'synthetic-v1-'+start,start,endExclusive:seasonEnd(start),
  fixtureVersion:PRICE_FIXTURE.version,method:'CRP-DOSE-FAIR-V1',
  scheduledRaces:FIXTURE_DAYS*RACES_PER_DAY,grandPrixCount:events.length,
  provenance:{synthetic:true,predetermined:true,liveMarket:false,transmissionObserved:false,
   statement:'Reproducción semanal idéntica del fixture synthetic-v1. No prueba carreras realmente transmitidas.'},
  events,standings
 };
}
export function assertSeasonSnapshot(snapshot){
 if(!snapshot||snapshot.contract!==SEASON_CONTRACT)throw new Error('Unknown season contract');
 parseSeasonStart(snapshot.start);
 if(snapshot.id!=='synthetic-v1-'+snapshot.start||snapshot.endExclusive!==seasonEnd(snapshot.start))
  throw new Error('Invalid season dates');
 if(snapshot.fixtureVersion!==PRICE_FIXTURE.version||snapshot.method!=='CRP-DOSE-FAIR-V1')
  throw new Error('Unsupported race engine/fixture');
 if(snapshot.provenance?.synthetic!==true||snapshot.provenance?.predetermined!==true||
  snapshot.provenance?.transmissionObserved!==false||snapshot.provenance?.liveMarket!==false)
  throw new Error('Missing synthetic provenance');
 if(!Array.isArray(snapshot.events)||snapshot.events.length!==28||
   !Array.isArray(snapshot.standings)||snapshot.standings.length!==100)
  throw new Error('Incomplete season');
 const expected=createCompletedSeason(snapshot.start,{now:new Date(parseSeasonStart(snapshot.start)+7*DAY)});
 if(JSON.stringify(snapshot)!==JSON.stringify(expected))throw new Error('Snapshot differs from deterministic official fixture');
 return true;
}
/** Operates on verified completed snapshots, never creates fake members. */
export function historicalPalmares(snapshots){
 const seen=new Set(),total=new Map(TOKEN_ROSTER.map(t=>[t.symbol,{symbol:t.symbol,seasons:0,points:0,wins:0,podiums:0,trophies:0}]));
 for(const snap of snapshots){
  assertSeasonSnapshot(snap);
  if(seen.has(snap.id))throw new Error('Duplicate season: '+snap.id);
  seen.add(snap.id);
  for(const row of snap.standings){
   const r=total.get(row.symbol);r.seasons++;r.points+=row.points;r.wins+=row.wins;r.podiums+=row.podiums;r.trophies+=row.trophies.length;
  }
 }
 return Object.freeze([...total.values()].sort((a,b)=>b.trophies-a.trophies||b.points-a.points||a.symbol.localeCompare(b.symbol)));
}
