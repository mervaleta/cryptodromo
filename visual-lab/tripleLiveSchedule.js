/**
 * Three independent 180 s channels offset by one minute, anchored at :30.
 * Each has 480 broadcasts/day, 1440 total, replaying a seven-day synthetic
 * fixture. This clock ONLY selects reproducible data; it does not affect results.
 */
export const CRYPTO_ZONE='America/Argentina/Buenos_Aires';
export const TRACK_DEFS=Object.freeze([
  Object.freeze({id:'muybridge',name:'Eadweard Muybridge',minuteOffset:0,layout:'oval'}),
  Object.freeze({id:'genesis',name:'Genesis',minuteOffset:1,layout:'straight'}),
  Object.freeze({id:'vint-cerf',name:'Vint Cerf',minuteOffset:2,layout:'s-bend'})
]);
export const TRACK_RACES_PER_DAY=480;
export const VENUE_RACES_PER_DAY=1440;
export const BROADCAST_SECONDS=180;
export const START_SECOND=30;
export const FIXTURE_DAYS=7;
const format=new Intl.DateTimeFormat('en-CA',{timeZone:CRYPTO_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const mod=(a,b)=>((a%b)+b)%b;
export function getTrack(id){
 return TRACK_DEFS.find(t=>t.id===id)||null;
}
function pieces(date){
 const v=Object.fromEntries(format.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 return {dateKey:`${v.year}-${String(v.month).padStart(2,'0')}-${String(v.day).padStart(2,'0')}`,
    dayOrdinal:Math.floor(Date.UTC(v.year,v.month-1,v.day)/86400000),
    localSecond:v.hour*3600+v.minute*60+v.second};
}
export function tripleLiveSlot(date=new Date(),trackId='muybridge'){
 const track=getTrack(trackId);
 if(!track)throw new RangeError('Unknown stadium track');
 const part=pieces(date);
 const offset=track.minuteOffset*60+START_SECOND;
 const adjusted=part.localSecond-offset;
 const dayDelta=adjusted<0?-1:0;
 const secondOfDay=mod(adjusted,86400);
 const slot=Math.floor(secondOfDay/BROADCAST_SECONDS);
 const slotSeconds=secondOfDay%BROADCAST_SECONDS;
 const dayOrdinal=part.dayOrdinal+dayDelta;
 const anchor=Math.floor(Date.UTC(2026,10,2)/86400000);
 const dayIndex=mod(dayOrdinal-anchor,FIXTURE_DAYS);
 const base=(dayIndex*VENUE_RACES_PER_DAY);
 const timeFor=(s)=>{
   const minute=s*3+track.minuteOffset;
   return `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}:30`;
 };
 const entry=(s,dayShift=0)=>{
   const targetDay=mod(dayOrdinal+dayShift-anchor,FIXTURE_DAYS);
   const minute=s*3+track.minuteOffset;
   return {slot:s,dayIndex:targetDay,index:targetDay*VENUE_RACES_PER_DAY+minute,
     minuteOfDay:minute,label:timeFor(s),trackId:track.id,trackName:track.name};
 };
 const current=entry(slot);
 const previous=slot===0?entry(TRACK_RACES_PER_DAY-1,-1):entry(slot-1);
 const next=slot===TRACK_RACES_PER_DAY-1?entry(0,1):entry(slot+1);
 return {...current,previous,next,slotSeconds,slotSecondsToNext:BROADCAST_SECONDS-slotSeconds,
  secondsToNext:BROADCAST_SECONDS-slotSeconds,racing:slotSeconds<60,
  timezone:CRYPTO_ZONE,dateLabel:part.dateKey,track};
}
export function allLiveTracks(date=new Date()){
 return TRACK_DEFS.map(t=>tripleLiveSlot(date,t.id));
}
export function raceIdFor(trackId,dayIndex,slot){
 const track=getTrack(trackId);
 if(!track||!Number.isInteger(dayIndex)||dayIndex<0||dayIndex>=7||
   !Number.isInteger(slot)||slot<0||slot>=480)throw new RangeError('Invalid race reference');
 return dayIndex*1440+slot*3+track.minuteOffset;
}
