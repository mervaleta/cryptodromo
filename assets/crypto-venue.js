import {allLiveTracks,getTrack,TRACK_DEFS} from '/visual-lab/tripleLiveSchedule.js?v=alpha19-live-1';

const cards=[...document.querySelectorAll('.hub-track[data-track]')];
const frame=document.getElementById('stadium-broadcast');
const activeLabel=document.getElementById('active-channel');
const query=new URLSearchParams(location.search);
let active=getTrack(query.get('track'))?.id||'muybridge';

const format=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
const clock=seconds=>format(seconds/60)+':'+format(seconds%60);
const stateText=phase=>phase==='race'?'● CARRERA EN CURSO · DEMO':
  phase==='results'?'LLEGADA Y RESULTADOS · DEMO':'PRESENTACIÓN DE CORREDORES · DEMO';
function activate(id,changeLocation=true){
 const track=getTrack(id);if(!track)return;
 active=id;
 cards.forEach(card=>{
   const on=card.dataset.track===active;
   card.style.boxShadow=on?'inset 0 0 0 1px #90edaf':'none';
   const anchor=card.querySelector('a[href*="/live/"]');
   if(anchor)anchor.setAttribute('aria-current',on?'page':'false');
 });
 if(frame){
   const destination='/stadiums/crypto/broadcast/?track='+encodeURIComponent(active);
   if(frame.getAttribute('src')!==destination)frame.setAttribute('src',destination);
 }
 if(activeLabel)activeLabel.textContent='Canal '+track.name+' · carreras sintéticas';
 if(changeLocation){
   const url=new URL(location.href);url.searchParams.set('track',active);
   history.replaceState(null,'',url.pathname+url.search);
 }
}
for(const card of cards){
 const btn=card.querySelector('a[href*="/live/"]');
 if(!btn||!frame)continue;
 btn.addEventListener('click',event=>{
  event.preventDefault();activate(card.dataset.track);frame.scrollIntoView({behavior:'smooth',block:'start'});
 });
}
function refresh(){
 const snapshots=allLiveTracks(new Date());
 for(const data of snapshots){
   const card=cards.find(x=>x.dataset.track===data.trackId);
   if(!card)continue;
   const phase=data.slotSeconds<60?'race':data.slotSeconds<120?'results':'presentation';
   card.dataset.phase=phase;
   card.querySelector('[data-phase-label]').textContent=stateText(phase);
   card.querySelector('[data-countdown]').textContent=clock(phase==='race'?60-data.slotSeconds:phase==='results'?120-data.slotSeconds:180-data.slotSeconds);
   card.querySelector('[data-race-label]').textContent='Carrera '+String(data.slot+1).padStart(3,'0')+
     ' / 480 · largada '+data.label+' UTC−3';
 }
}
activate(active,false);refresh();
const ticker=setInterval(refresh,1000);
window.addEventListener('pagehide',()=>clearInterval(ticker),{once:true});
