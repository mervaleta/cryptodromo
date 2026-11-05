/**
 * SATOSHI NAKAMOTO / three independent stadium clocks.
 *
 * This is the venue landing's display controller, NOT the 3D TV player.
 * All three lanes share the same real instant, but their 180-second slots
 * start at local :00:30, :01:30 and :02:30 respectively (UTC-3).
 * A label for the end of the CURRENT phase is not the next race start.
 */
import {allLiveTracks,TRACK_DEFS} from '/visual-lab/tripleLiveSchedule.js?v=satoshi-venue-clocks-20261104-v1';
import {projectChannelCountdown} from './crypto-channel-countdown.js?v=satoshi-venue-clocks-20261104-v1';

const cards=new Map([...document.querySelectorAll('.hub-track[data-track]')]
 .map(card=>[card.dataset.track,card]));
const pad=n=>String(n).padStart(2,'0');
const asClock=seconds=>pad(Math.floor(seconds/60))+':'+pad(seconds%60);
let frozenDate=null;

function render(date){
 const data=allLiveTracks(date);
 for(const item of data){
  const card=cards.get(item.trackId);
  if(!card)continue;
  const show=projectChannelCountdown(item);
  const phase=card.querySelector('[data-phase-label]');
  const countdown=card.querySelector('[data-countdown]');
  const race=card.querySelector('[data-race-label]');
  if(!phase||!countdown||!race)continue;
  const text=show.phase==='race'?'● CARRERA EN CURSO':
   show.phase==='results'?'LLEGADA Y RESULTADOS':
   'PRESENTACIÓN DE CORREDORES';
  phase.textContent=text;
  countdown.textContent=asClock(show.secondsToNext);
  countdown.setAttribute('aria-label',
   'Próxima largada '+item.trackName+' en '+asClock(show.secondsToNext));
  race.textContent=show.label;
  card.dataset.phase=show.phase;
 }
}
function snapshot(){
 return TRACK_DEFS.map(track=>{
  const card=cards.get(track.id);
  return {
   track:track.id,
   countdown:card?.querySelector('[data-countdown]')?.textContent||'',
   raceLabel:card?.querySelector('[data-race-label]')?.textContent||'',
   phase:card?.dataset.phase||''
  };
 });
}
function update(){render(frozenDate||new Date());}
update();
const interval=setInterval(update,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
if(new URLSearchParams(location.search).get('clock-qa')==='1'){
 window.__crpStadiumClocksQA=Object.freeze({
  setTime(iso){
   const date=new Date(iso);
   if(!Number.isFinite(date.getTime()))throw new RangeError('Invalid QA date');
   frozenDate=date;update();return snapshot();
  },
  clearTime(){frozenDate=null;update();return snapshot();},
  snapshot
 });
}
