/**
 * Read-only shared identity contract for historical Alpha18 and three-track
 * Alpha19 synthetic events. This module does not rewrite existing consumers,
 * race physics, candles, rankings or historic URLs.
 */
import {getRaceFixture,PRICE_FIXTURE,FIXTURE_DAYS,RACES_PER_DAY} from './raceFixture.js';
import {getTripleRaceFixture,TRACKS,TRACK_RACES_PER_DAY} from './tripleRaceFixture.js';
import {createOfficialRace,officialRanking} from './officialRace.js';

export const WORLD_RACE_RECORD_SCHEMA='world-race-record-v1';
export const WORLD_RACE_TZ='America/Argentina/Buenos_Aires';
const pad=(value,width=2)=>String(value).padStart(width,'0');
const requireRange=(name,value,max)=>{
 if(!Number.isInteger(value)||value<0||value>=max)
  throw new RangeError(name+' must be between 0 and '+(max-1));
};
const snapshotPrice=entry=>Object.freeze({
 symbol:entry.symbol,name:entry.name,
 priceAtStart:entry.priceAtStart,priceAtMid:entry.priceAtMid,priceAtFinish:entry.priceAtFinish,
 input1:entry.input1,input2:entry.input2,
 coefficients1:Object.freeze([...entry.coefficients1]),
 coefficients2:Object.freeze([...entry.coefficients2])
});
/**
 * @param {{family:'alpha18'|'alpha19',dayIndex:number,slot:number,trackId?:string}} reference
 * @returns frozen immutable-by-convention record for UI, archive, stats and replay.
 *
 * Alpha18 has no distinct course identity. Never relabel those races as Muybridge.
 * Alpha19 uses a separate namespaced key, not the old fixture's numeric index.
 */
export function resolveWorldRace(reference){
 if(!reference||!['alpha18','alpha19'].includes(reference.family))
  throw new RangeError('Explicit historical fixture family required');
 const {family,dayIndex,slot}=reference;
 requireRange('dayIndex',dayIndex,FIXTURE_DAYS);
 const triple=family==='alpha19';
 requireRange('slot',slot,triple?TRACK_RACES_PER_DAY:RACES_PER_DAY);
 if(!triple&&reference.trackId!==undefined&&reference.trackId!==null)
  throw new RangeError('Alpha18 has no explicit track identity');
 const track=triple?TRACKS.find(t=>t.id===reference.trackId):null;
 if(triple&&!track)throw new RangeError('Unknown Alpha19 track');
 const minute=triple?slot*3+track.offsetMinutes:slot*3;
 const fixture=triple?getTripleRaceFixture(minute,dayIndex):getRaceFixture(slot,dayIndex);
 const profiles=officialRanking(createOfficialRace(fixture.entries));
 const rows=Object.freeze(profiles.map((p,index)=>Object.freeze({
  position:index+1,symbol:p.entry.symbol,finishTime:p.finishTime,distanceAt60:p.distanceAt60
 })));
 const entrants=Object.freeze(fixture.entries.map(snapshotPrice));
 const clock=fixture.time+(triple?':30':'');
 const eventKey=triple?
  'CRP19-CRYPTO-'+track.id.toUpperCase()+'-D'+pad(dayIndex+1)+'-S'+pad(slot+1,3):
  'CRP18-CRYPTO-LEGACY-D'+pad(dayIndex+1)+'-S'+pad(slot+1,3);
 const replay=triple?Object.freeze({
  mode:'MANUAL_SYNTHETIC',
  url:'/stadiums/crypto/broadcast/?track='+encodeURIComponent(track.id)+
    '&replayDay='+dayIndex+'&replayMinute='+minute
 }):null;
 return Object.freeze({
  schema:WORLD_RACE_RECORD_SCHEMA,
  key:eventKey,family,fixtureVersion:triple?fixture.fixtureVersion:'alpha18-legacy-v1',
  stadiumId:'crypto',trackId:track?.id??null,
  raceNumber:fixture.number,dayIndex,syntheticDay:dayIndex+1,slot,
  minuteOfDay:minute,localTime:clock,timezone:WORLD_RACE_TZ,
  mode:'SYNTHETIC_REPRODUCIBLE',connection:'NOT_LIVE',status:'OFFICIAL_COMPUTED',
  sourceVersion:PRICE_FIXTURE.version,sourceFixture:fixture.sourceFixture??null,
  participants:entrants,participantSymbols:Object.freeze(entrants.map(e=>e.symbol)),
  winner:rows[0].symbol,podium:Object.freeze(rows.slice(0,3).map(row=>row.symbol)),
  ranking:rows,replay
 });
}
