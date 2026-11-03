/**
 * Alpha19 triple fixture adapter. Reuses the existing 480-race/day sports fixture,
 * its horse identities and dose coefficients, and the SAME minute price history.
 * No modifications to the race engine, outcome calculations or source prices.
 */
import {getRaceFixture,getFixturePrice,FIXTURE_DAYS,RACES_PER_DAY as BASE_RACES} from './raceFixture.js';
export const TRACKS=Object.freeze([
 Object.freeze({id:'muybridge',name:'Eadweard Muybridge',offsetMinutes:0}),
 Object.freeze({id:'genesis',name:'Genesis',offsetMinutes:1}),
 Object.freeze({id:'vint-cerf',name:'Vint Cerf',offsetMinutes:2})
]);
export const TRIPLE_RACES_PER_DAY=1440;
export const TRACK_RACES_PER_DAY=480;
export const TRACK_SLOT_SECONDS=180;
export function getTripleRaceFixture(minuteOfDay,day=0){
 if(!Number.isInteger(minuteOfDay)||minuteOfDay<0||minuteOfDay>=1440)throw new RangeError('minuteOfDay must be 0..1439');
 const track=TRACKS[minuteOfDay%3],slot=Math.floor(minuteOfDay/3);
 const dayIndex=((day%FIXTURE_DAYS)+FIXTURE_DAYS)%FIXTURE_DAYS;
 // Shift the 480-race sports roster for the other two tracks, avoiding
 // identical fields in simultaneous broadcasts without inventing competitors.
 const sourceSlot=(slot+track.offsetMinutes*160)%BASE_RACES;
 const source=getRaceFixture(sourceSlot,dayIndex);
 const entries=source.entries.map(entry=>{
  const p0=getFixturePrice(entry.symbol,dayIndex,minuteOfDay);
  const p1=getFixturePrice(entry.symbol,dayIndex,minuteOfDay+1);
  const p2=getFixturePrice(entry.symbol,dayIndex,minuteOfDay+2);
  if(![p0,p1,p2].every(Number.isFinite))throw new Error('Missing synthetic candle for '+entry.symbol);
  return {...entry,priceAtStart:p0,priceAtMid:p1,priceAtFinish:p2,
    input1:100*(p1/p0-1),input2:100*(p2/p1-1)};
 });
 return {day:dayIndex+1,number:minuteOfDay+1,minute:minuteOfDay,
  time:String(Math.floor(minuteOfDay/60)).padStart(2,'0')+':'+String(minuteOfDay%60).padStart(2,'0'),
  trackId:track.id,trackName:track.name,trackSlot:slot,
  announcementSecond:minuteOfDay*60,startSecond:minuteOfDay*60+30,
  entries,sourceFixture:{day:dayIndex+1,slot:sourceSlot}};
}
export function getTripleTrackState(minuteOfDay,second=0,day=0){
 const now=minuteOfDay*60+second;
 return TRACKS.map((track,i)=>{
  const start=Math.floor((now-i*60)/TRACK_SLOT_SECONDS)*TRACK_SLOT_SECONDS+i*60;
  const absolute=Math.max(0,start/60);
  return {trackId:track.id,slotSeconds:((now-i*60)%180+180)%180,
   fixture:getTripleRaceFixture(Math.floor(absolute)%1440,day)};
 });
}
