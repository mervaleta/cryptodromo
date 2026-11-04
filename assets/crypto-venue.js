import {allLiveTracks,getTrack} from '/visual-lab/tripleLiveSchedule.js?v=alpha19-live-1';
import {buildTvPlayerUrl,findRacePlayerSource,readTvReplay,RACE_PLAYER_SOURCES} from './satoshi-tv-contract.js?v=tv-single-20261104';

/**
 * One active WebGL feed at a time. The parent is the station and the iframe
 * contains ONLY the race document, never /live/ or another station page.
 *
 * Keep the three clocks independent of the selected channel and in UTC-3.
 */
const $=id=>document.getElementById(id);
const frame=$('stadium-broadcast'),screen=$('tv-player'),loading=$('tv-loading');
const errorBox=$('tv-error'),errorDetail=$('tv-error-detail'),directError=$('tv-direct-error');
const modeBadge=$('tv-mode-badge'),activeLabel=$('active-channel');
const liveButton=$('tv-live-now'),directLink=$('tv-direct');
const cards=[...document.querySelectorAll('.hub-track[data-track]')];
const params=new URLSearchParams(location.search);
const selected=getTrack(params.get('track'))||getTrack('muybridge');
let active=selected.id;
let replay=readTvReplay(params,active);
let source=null,serial=0,loadTimer=null;
let sourcePromise=null;
const format=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
const clock=n=>format(n/60)+':'+format(n%60);
const phaseFor=seconds=>seconds<60?'race':seconds<120?'results':'presentation';
const phaseText=phase=>phase==='race'?'● CARRERA EN CURSO · DEMO':
 phase==='results'?'LLEGADA Y RESULTADOS · DEMO':'PRESENTACIÓN DE CORREDORES · DEMO';
const localTime=new Intl.DateTimeFormat('es-AR',{
 timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
});
const validFrameDoc=()=>{
 try{
  const doc=frame.contentDocument;
  return !!doc?.querySelector('#raceCanvas')&&!doc?.querySelector('#stadium-broadcast');
 }catch{return false;}
};
const setBusy=()=>{
 frame.hidden=false;frame.style.visibility='hidden';loading.hidden=false;errorBox.hidden=true;
};
const setError=detail=>{
 clearTimeout(loadTimer);
 frame.hidden=true;frame.style.visibility='hidden';loading.hidden=true;errorBox.hidden=false;
 errorDetail.textContent=detail;
 directError.href=buildTvPlayerUrl(RACE_PLAYER_SOURCES[1],active,replay);
};
const probe=()=>findRacePlayerSource(path=>fetch(path,{cache:'no-store',redirect:'follow'}));
function setUrl(){
 const url=new URL(location.href);
 url.searchParams.set('track',active);
 if(replay){
  url.searchParams.set('replayDay',String(replay.day));
  url.searchParams.set('replayMinute',String(replay.minute));
 }else{
  url.searchParams.delete('replayDay');
  url.searchParams.delete('replayMinute');
 }
 history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function syncPanel(){
 const track=getTrack(active);
 activeLabel.textContent='CANAL '+track.name.toUpperCase();
 modeBadge.textContent=replay?'REPLAY · ARCHIVO':'● EN VIVO · DEMO';
 document.querySelector('.tv-brand').classList.toggle('is-replay',!!replay);
 liveButton.disabled=!replay;
 liveButton.textContent=replay?'● VOLVER AL VIVO':'● ESTÁS EN VIVO';
 $('tv-replay-again').hidden=!replay;
 for(const card of cards){
  const on=card.dataset.track===active;
  card.dataset.selected=String(on);
  const button=card.querySelector('[data-tv-tune]');
  if(button)button.setAttribute('aria-pressed',String(on));
 }
}
function showProgramGuide(){
 const snapshots=allLiveTracks(new Date());
 for(const data of snapshots){
  const card=cards.find(el=>el.dataset.track===data.trackId);
  if(!card)continue;
  const phase=phaseFor(data.slotSeconds);
  card.dataset.phase=phase;
  card.querySelector('[data-phase-label]').textContent=phaseText(phase);
  const counter=card.querySelector('[data-countdown]');
  counter.textContent=clock(data.secondsToNext);
  counter.setAttribute('aria-label','Próxima largada de '+data.trackName+' en '+clock(data.secondsToNext));
  card.querySelector('[data-race-label]').textContent='Próxima carrera '+
   String(data.next.slot+1).padStart(3,'0')+' / 480 · '+data.next.label+' UTC−3';
 }
 const current=snapshots.find(x=>x.trackId===active);
 if(current){
  $('tv-current-race').textContent=replay?
   'DÍA '+(replay.day+1)+' · CARRERA '+String(Math.floor(replay.minute/3)+1).padStart(3,'0')+'/480':
   'CARRERA '+String(current.slot+1).padStart(3,'0')+'/480 · '+phaseText(phaseFor(current.slotSeconds)).replace(' · DEMO','');
 }
 $('tv-local-time').textContent=localTime.format(new Date())+' UTC−3';
}
function watchLoad(expectedSerial){
 clearTimeout(loadTimer);
 loadTimer=setTimeout(()=>{
  if(expectedSerial!==serial||loading.hidden)return;
  setError('La señal no terminó de cargar. Probá de nuevo o abrí la carrera directamente.');
 },45000);
}
async function tune(id,requestedReplay=null,changeUrl=true){
 const track=getTrack(id);if(!track)return;
 active=track.id;replay=requestedReplay;
 const current=++serial;
 clearTimeout(loadTimer);
 setBusy();syncPanel();showProgramGuide();
 if(changeUrl)setUrl();
 // Navigating away from the old page releases its WebGL context.
 frame.src='about:blank';
 sourcePromise??=probe();
 let path=await sourcePromise;
 if(current!==serial)return;
 if(!path){
  setError('El servidor no está entregando el documento 3D en ninguna de las rutas oficiales. No se abrirá otra página dentro del player.');
  return;
 }
 source=path;
 const destination=buildTvPlayerUrl(source,active,replay);
 directLink.href=destination;directError.href=destination;
 frame.title=(replay?'Repetición':'Transmisión en vivo')+' · '+track.name;
 frame.src=destination;
 watchLoad(current);
}
frame.addEventListener('load',async()=>{
 if(frame.getAttribute('src')==='about:blank'||!source)return;
 try{if(frame.contentWindow.location.href==='about:blank')return;}catch{}
 if(validFrameDoc()){
  clearTimeout(loadTimer);frame.hidden=false;frame.style.visibility='visible';loading.hidden=true;errorBox.hidden=true;
  try{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('resize'));}catch{}
  return;
 }
 // A hosting rewrite may serve /live/ with status 200 at /broadcast/.
 // Never display or recursively load that page inside the player.
 if(source===RACE_PLAYER_SOURCES[0]){
  const last=serial;
  sourcePromise=Promise.resolve(RACE_PLAYER_SOURCES[1]);
  source=RACE_PLAYER_SOURCES[1];
  const fallback=buildTvPlayerUrl(source,active,replay);
  const response=await fetch(source,{cache:'no-store'}).catch(()=>null);
  const usable=Boolean(response?.ok)&&/\bid=['"]raceCanvas['"]/.test(await response.text());
  if(last!==serial)return;
  if(usable){frame.src=fallback;directLink.href=fallback;watchLoad(last);return;}
 }
 frame.src='about:blank';
 setError('La dirección de carrera está devolviendo una página equivocada o un error. Se bloqueó el anidamiento.');
});
for(const card of cards){
 const button=card.querySelector('[data-tv-tune]');
 button?.addEventListener('click',()=>{tune(card.dataset.track,null);screen.scrollIntoView({behavior:'smooth',block:'center'});});
}
liveButton.addEventListener('click',()=>tune(active,null));
$('tv-replay-again').addEventListener('click',()=>{if(replay)tune(active,replay,false);});
$('tv-retry').addEventListener('click',()=>{sourcePromise=null;source=null;tune(active,replay,false);});
$('tv-fullscreen').addEventListener('click',()=>{
 if(document.fullscreenElement)document.exitFullscreen();
 else if(screen.requestFullscreen)screen.requestFullscreen();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)showProgramGuide();});
const ticker=setInterval(showProgramGuide,1000);
window.addEventListener('pagehide',()=>{clearInterval(ticker);clearTimeout(loadTimer);frame.src='about:blank';},{once:true});
showProgramGuide();
if(window.self===window.top){
 tune(active,replay,false);
}else{
 // Hostinger sometimes rewrites a missing /broadcast/ path to this same page.
 // A framed TV hub must NEVER create another frame (recursive embedding).
 document.documentElement.dataset.tvNestedHub='blocked';
 frame.src='about:blank';
 setError('Esta ruta sirvió la página de canales en lugar de la carrera 3D.');
}
