/**
 * Synthetic fixture -> presentation-safe record.
 * A computed result is NOT proof that a live race was transmitted.
 * Never substitute this for a persisted, time-stamped transmission ledger.
 */
import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS,PRICE_FIXTURE} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,officialAudit} from '../race-lab/source/src/data/officialRace.js';

const integerIn=(n,max)=>Number.isInteger(n)&&n>=0&&n<max;
const round=(n,places)=>Number(n.toFixed(places));
export const SYNTHETIC_RECORD_CONTRACT='cryptodromo.synthetic-race.v1';
export function raceIdentity(dayIndex,slotIndex){
 if(!integerIn(dayIndex,FIXTURE_DAYS)||!integerIn(slotIndex,RACES_PER_DAY))throw new RangeError('Unknown fixture race');
 return PRICE_FIXTURE.version+':d'+String(dayIndex+1)+'-r'+String(slotIndex+1).padStart(3,'0');
}
export function syntheticRaceRecord(dayIndex,slotIndex){
 const id=raceIdentity(dayIndex,slotIndex);
 const fixture=getRaceFixture(slotIndex,dayIndex);
 const profiles=createOfficialRace(fixture.entries);
 const ranked=officialRanking(profiles);
 const finish=ranked.map((p,index)=>Object.freeze({
  place:index+1,symbol:p.entry.symbol,name:p.entry.name,tier:p.entry.tier,
  coat:p.entry.coat,color:p.entry.color,finishTimeSeconds:round(p.finishTime,6),
  distanceAt60Meters:round(p.distanceAt60,6),
  syntheticChangePct:round(p.input1+p.input2,7)
 }));
 const margin=ranked[0].distanceAt60-ranked[1].distanceAt60;
 return Object.freeze({
  contract:SYNTHETIC_RECORD_CONTRACT,id,
  provenance:Object.freeze({
   source:'deterministic-price-fixture',version:PRICE_FIXTURE.version,
   synthetic:true,liveMarket:false,transmissionObserved:false,
   caption:'Simulación / replay sintético. No es un resultado histórico observado.'
  }),
  race:Object.freeze({dayIndex,slotIndex,day:dayIndex+1,number:slotIndex+1,
    startTime:fixture.time,timezone:'America/Argentina/Buenos_Aires',runners:12}),
  scoring:Object.freeze({method:'CRP-DOSE-FAIR-V1',freezeAtSeconds:60,
    distanceMeters:1000,dependsOnVisuals:false}),
  summary:Object.freeze({winner:ranked[0].entry.symbol,runnerUp:ranked[1].entry.symbol,
    firstSecondMarginMeters:round(margin,6),
    lastPlace:ranked.at(-1).entry.symbol}),
  finish:Object.freeze(finish)
 });
}
/**
 * Optional full reproducibility proof. Not included in public cards because
 * it contains synthetic candle audit detail. Consumers must explicitly opt in.
 */
export function syntheticAudit(dayIndex,slotIndex){
 raceIdentity(dayIndex,slotIndex);
 const fixture=getRaceFixture(slotIndex,dayIndex);
 return officialAudit(createOfficialRace(fixture.entries),dayIndex+1,slotIndex+1);
}
export function assertSyntheticRaceRecord(record){
 if(record?.contract!==SYNTHETIC_RECORD_CONTRACT)throw Error('Unknown record contract');
 if(record.provenance?.synthetic!==true||record.provenance?.liveMarket!==false||
    record.provenance?.transmissionObserved!==false)throw Error('Invalid provenance');
 if(record.scoring?.freezeAtSeconds!==60||record.finish?.length!==12)throw Error('Invalid race');
 const symbols=new Set(record.finish.map(x=>x.symbol));
 if(symbols.size!==12||record.finish.some((x,i)=>x.place!==i+1||
    !Number.isFinite(x.finishTimeSeconds)))throw Error('Invalid classification');
 if(record.summary.winner!==record.finish[0].symbol)throw Error('Winner mismatch');
 return true;
}
