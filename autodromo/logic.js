/**
 * Autódromo Crypto: adaptation layer only.
 * It reuses the exact 7-day / 100-token / 12-runner synthetic fixture and
 * CRP-DOSE-FAIR-V1, without inventing car-only outcomes or new financial inputs.
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {createOfficialRace,officialRanking,positionAt} from '../race-lab/source/src/data/officialRace.js';
import {tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';

export const CAR_TRACKS=Object.freeze([
  Object.freeze({id:'muybridge',name:'Circuito Vector',subtitle:'Gran Premio de velocidad',layout:'speed',accent:'#ffb547'}),
  Object.freeze({id:'genesis',name:'Circuito Delta',subtitle:'Gran Premio de curvas',layout:'technical',accent:'#26ddd0'}),
  Object.freeze({id:'vint-cerf',name:'Circuito Neón',subtitle:'Gran Premio nocturno',layout:'street',accent:'#ac88ff'})
]);
export const CAR_ROSTER=TOKEN_ROSTER.map((token,index)=>Object.freeze({
  symbol:token.symbol,name:token.name,color:token.color,tier:token.tier,
  number:index+1, liveryId:'CRP-'+String(index+1).padStart(3,'0')
}));
export const CAR_RACE_SECONDS=60;
export const CAR_SLOT_SECONDS=180;
export const CAR_WEEK_DAYS=7;
export const CAR_RACES_PER_DAY=1440;
export const CAR_RACES_PER_TRACK=480;
if(CAR_ROSTER.length!==100||new Set(CAR_ROSTER.map(c=>c.symbol)).size!==100)
  throw new Error('Autódromo requires 100 unique token liveries');

export function carTrack(id){
  return CAR_TRACKS.find(track=>track.id===id)||null;
}
export function getCarSession(trackId,date=new Date()){
  const track=carTrack(trackId);
  if(!track)throw new RangeError('Unknown car track: '+trackId);
  const clock=tripleLiveSlot(date,trackId);
  const fixture=getTripleRaceFixture(clock.minuteOfDay,clock.dayIndex);
  if(fixture.trackId!==trackId)throw new Error('Autódromo fixture/stadium mismatch');
  const profiles=createOfficialRace(fixture.entries);
  return {track,clock,fixture,profiles,
    official:officialRanking(profiles),
    key:clock.dayIndex+':'+clock.minuteOfDay+':'+trackId};
}
export function positionsAt(session,seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>60)
    throw new RangeError('Car replay must be 0..60 seconds');
  return session.profiles.map((profile,index)=>({
    symbol:profile.entry.symbol,name:profile.entry.name,color:profile.entry.color,
    meters:positionAt(profile,seconds),index,profile,
    time:profile.finishTime
  })).sort((a,b)=>b.meters-a.meters||a.index-b.index);
}
export function resultsAtFinish(session){
  return session.official.map((profile,index)=>({
    place:index+1,symbol:profile.entry.symbol,name:profile.entry.name,
    color:profile.entry.color,variation1Pct:profile.input1,
    variation2Pct:profile.input2,finishTime:profile.finishTime
  }));
}
