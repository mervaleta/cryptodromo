/**
 * Public LIVE schedule for synthetic replay, never real market quotes.
 * Exactly 480 slots/day at 3-minute intervals in Buenos Aires stadium time.
 * Seven-day deterministic program wraps across the calendar.
 */
export const LIVE_ZONE='America/Argentina/Buenos_Aires';
export const SLOT_SECONDS=180;
export const RACES_PER_DAY=480;
export const REPLAY_SECONDS=60;
const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:LIVE_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function liveSlot(date=new Date()){
 const vals=Object.fromEntries(dateParts.formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
 const {year,month,day,hour,minute,second}=vals;
 const seconds=hour*3600+minute*60+second;
 const slot=Math.floor(seconds/SLOT_SECONDS),sinceStart=seconds%SLOT_SECONDS;
 const dayOrdinal=Math.floor(Date.UTC(year,month-1,day)/86400000);
 const anchor=Math.floor(Date.UTC(2026,10,2)/86400000); // Monday day 0
 const dayIndex=((dayOrdinal-anchor)%7+7)%7;
 const display=offset=>{
   const idx=(slot+offset+RACES_PER_DAY)%RACES_PER_DAY;
   const minuteOfDay=idx*3;
   return {slot:idx,dayIndex:((dayIndex+Math.floor((slot+offset)/RACES_PER_DAY))%7+7)%7,
     index:dayIndex*RACES_PER_DAY+idx,label:String(Math.floor(minuteOfDay/60)).padStart(2,'0')+':'+String(minuteOfDay%60).padStart(2,'0')};
 };
 const current=display(0),previous=display(-1),next=display(1);
 // Correct wrap indices as well as day index at midnight.
 previous.index=previous.dayIndex*RACES_PER_DAY+previous.slot;
 next.index=next.dayIndex*RACES_PER_DAY+next.slot;
 return {...current,slotSeconds:sinceStart,secondsToNext:SLOT_SECONDS-sinceStart,
   racing:sinceStart<REPLAY_SECONDS,previous,next,timezone:LIVE_ZONE,
   dateLabel:year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0')};
}
export const formatCountdown=seconds=>String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')+':'+String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0');
