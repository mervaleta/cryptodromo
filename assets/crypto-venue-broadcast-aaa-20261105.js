// Hostinger immutable television controller build. Source: assets/crypto-venue.js
import {allLiveTracks,getTrack} from '/visual-lab/tripleLiveSchedule.js?v=alpha19-live-1';
import {buildTvPlayerUrl,findRacePlayerSource,readTvReplay,RACE_PLAYER_SOURCES} from './satoshi-tv-contract.js?v=photo-finish-tv-params-20261104-v1';
import {createTvEnvironmentDeck} from './satoshi-tv-environment.js?v=winner-slowmo-env-20261104-v1';
import {createTvParameterMenus} from './satoshi-tv-submenus.js?v=tv-director-params-20261104-v2';

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
const liveButton=$('tv-live-now'),directLink=$('tv-direct'),audioButton=$('tv-audio');
const transition=$('tv-transition'),transitionLabel=$('tv-transition-label');
const quickChannels=[...document.querySelectorAll('[data-tv-switch]')];
const shotButtons=[...document.querySelectorAll('[data-tv-shot]')];
let activeShot='broadcast';
const smoothSwitch=!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const cover=()=>{screen.classList.add('is-switching');transition?.setAttribute('aria-hidden','true');};
const uncover=()=>{screen.classList.remove('is-switching');};
function setShot(mode){
 if(!shotButtons.some(button=>button.dataset.tvShot===mode))return;
 activeShot=mode;
 for(const button of shotButtons)button.setAttribute('aria-pressed',String(button.dataset.tvShot===activeShot));
 const doc=(()=>{try{return frame.contentDocument}catch{return null}})();
 const select=doc?.querySelector('#camera');
 if(select&&[...select.options].some(o=>o.value===mode)){
  select.value=mode;select.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 }
}
const environmentDeck=createTvEnvironmentDeck({frame,root:$('tv-env-deck'),onShot:setShot});
const parameterDeck=createTvParameterMenus({frame,root:$('tv-control-detail')});
let soundEnabled=false;
const cards=[...document.querySelectorAll('.hub-track[data-track]')];
const params=new URLSearchParams(location.search);
const selected=getTrack(params.get('track'))||getTrack('muybridge');
let active=selected.id;
let replay=readTvReplay(params,active);
let source=null,serial=0,loadTimer=null,framePoller=null,frameReadySerial=-1;
let sourcePromise=null;
let readyObserver=null;
// Read-only tuning telemetry, exposed only in ?tv-qa=1; no sporting state.
let tuneStartedAt=0,lastTuneLatencyMs=null,successfulTuneCount=0,failedTuneCount=0,lastTuneError='';
const format=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
const clock=n=>format(n/60)+':'+format(n%60);
const phaseFor=seconds=>seconds<60?'race':seconds<120?'results':'presentation';
const phaseText=phase=>phase==='race'?'● CARRERA EN CURSO':
 phase==='results'?'LLEGADA Y RESULTADOS':'PRESENTACIÓN DE CORREDORES';
const localTime=new Intl.DateTimeFormat('es-AR',{
 timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
});
const hasRaceDocument=()=>{
 try{
  const doc=frame.contentDocument;
  return !!doc?.querySelector('#raceCanvas')&&!doc?.querySelector('#stadium-broadcast');
 }catch{return false;}
};
const validFrameDoc=()=>{
 if(!hasRaceDocument())return false;
 try{
  // A canvas element exists before the async 12-horse scene is ready.
  // Never uncover a still-loading/failed 3D feed as if it were on air.
  const doc=frame.contentDocument;
  const start=doc?.getElementById('start');
  return start?.disabled===false;
 }catch{return false;}
};
const setBusy=()=>{
 frame.hidden=false;frame.style.visibility='hidden';loading.hidden=false;errorBox.hidden=true;
 soundEnabled=false;audioButton.disabled=true;audioButton.setAttribute('aria-pressed','false');audioButton.textContent='🔊 Activar sonido';
};
const setError=detail=>{
 disconnectReadyObserver();
 failedTuneCount++;lastTuneError=String(detail);lastTuneLatencyMs=null;
 clearTimeout(loadTimer);clearInterval(framePoller);uncover();
 frame.hidden=true;frame.style.visibility='hidden';loading.hidden=true;errorBox.hidden=false;
 audioButton.disabled=true;
 errorDetail.textContent=detail;
 directError.href=buildTvPlayerUrl(RACE_PLAYER_SOURCES[1],active,replay);
 // A failed but hidden iframe can still consume a WebGL context and RAF time.
 // Preserve the recovery URL, then release the failed scene before retry.
 if(frame.getAttribute('src')!=='about:blank')frame.src='about:blank';
};
// Bound each HTML probe including response-body transfer. If Hostinger stalls,
// the TV eventually offers retry rather than spinning forever before iframe load.
const PROBE_TIMEOUT_MS=12000;
const probe=()=>findRacePlayerSource(async path=>{
 const controller=new AbortController();
 const deadline=setTimeout(()=>controller.abort(),PROBE_TIMEOUT_MS);
 try{
  const response=await fetch(path+'?build=photo-finish-tv-params-20261104-v1',{
   cache:'no-store',redirect:'follow',signal:controller.signal
  });
  const html=response.ok?await response.text():'';
  return {ok:response.ok,text:async()=>html};
 }finally{clearTimeout(deadline);}
});
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
 modeBadge.textContent=replay?'REPLAY · ARCHIVO':'● EN VIVO';
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
 for(const button of quickChannels){
  button.setAttribute('aria-pressed',String(button.dataset.tvSwitch===active));
 }
 if(transitionLabel)transitionLabel.textContent='SINTONIZANDO '+track.name.toUpperCase();
 environmentDeck.setTrack(active);
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
   'CARRERA '+String(current.slot+1).padStart(3,'0')+'/480 · '+phaseText(phaseFor(current.slotSeconds));
 }
 $('tv-local-time').textContent=localTime.format(new Date())+' UTC−3';
}
function signalReady(expectedSerial=serial){
 if(expectedSerial!==serial)return false;
 try{
  const message=frame.contentDocument?.getElementById('status')?.textContent?.trim()||'';
  if(/^ERROR\b/i.test(message)){
   setError('El motor 3D informó un error de carga. Abrí la carrera directamente o reintentá la señal.');
   return false;
  }
 }catch{}
 if(!validFrameDoc())return false;
 if(frameReadySerial===expectedSerial){uncover();return true;}
 frameReadySerial=expectedSerial;
 disconnectReadyObserver();
 lastTuneLatencyMs=Math.max(0,Math.round(performance.now()-tuneStartedAt));
 lastTuneError='';successfulTuneCount++;
 clearTimeout(loadTimer);clearInterval(framePoller);
 frame.hidden=false;frame.style.visibility='visible';loading.hidden=true;errorBox.hidden=true;
 // Begin CSS fade as soon as the verified 3D scene is ready; do not rely
 // exclusively on a future animation frame under heavy software WebGL load.
 uncover();
 const release=()=>{if(expectedSerial===serial)uncover();};
 setTimeout(release,350);
 requestAnimationFrame(()=>requestAnimationFrame(release));
 try{
  audioButton.disabled=!frame.contentDocument?.querySelector('#sound');
  setShot(activeShot);
  environmentDeck.apply();
  parameterDeck.apply();
 }catch(err){console.warn('Optional TV director settings:',err);}
 setTimeout(()=>{
  if(expectedSerial!==serial||!validFrameDoc())return;
  try{environmentDeck.apply();parameterDeck.apply();}catch(err){
   console.warn('Late TV director settings:',err);
  }
 },1100);
 try{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('resize'));}catch{}
 return true;
}
function disconnectReadyObserver(){readyObserver?.disconnect();readyObserver=null;}
// DOM-ready is not 3D-ready: the async horse loader enables #start only
// after all twelve actors have been constructed. Observe that exact signal,
// keeping the existing timer as a recovery path for rewritten/slow documents.
function connectReadyObserver(expectedSerial){
 disconnectReadyObserver();
 try{
  const start=frame.contentDocument?.getElementById('start');
  if(!start)return;
  readyObserver=new MutationObserver(()=>{
   if(expectedSerial!==serial){disconnectReadyObserver();return;}
   signalReady(expectedSerial);
  });
  readyObserver.observe(start,{attributes:true,attributeFilter:['disabled']});
  signalReady(expectedSerial);
 }catch{}
}
function watchLoad(expectedSerial){
 clearTimeout(loadTimer);clearInterval(framePoller);
 framePoller=setInterval(()=>{
  if(expectedSerial!==serial){clearInterval(framePoller);return;}
  signalReady(expectedSerial);
 },250);
 loadTimer=setTimeout(()=>{
  if(expectedSerial!==serial||loading.hidden)return;
  if(signalReady(expectedSerial))return;
  setError('La señal no terminó de cargar. Probá de nuevo o abrí la carrera directamente.');
 },75000);
}
async function tune(id,requestedReplay=null,changeUrl=true){
 const track=getTrack(id);if(!track)return;
 active=track.id;replay=requestedReplay;
 const current=++serial;
 disconnectReadyObserver();
 tuneStartedAt=performance.now();lastTuneLatencyMs=null;lastTuneError='';
 clearTimeout(loadTimer);clearInterval(framePoller);
 frameReadySerial=-1;
 syncPanel();showProgramGuide();
 if(changeUrl)setUrl();
 // Fade out the old channel before releasing its WebGL canvas.
 cover();
 if(smoothSwitch)await wait(270);
 if(current!==serial)return;
 setBusy();
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
  signalReady(serial);
  return;
 }
 // Correct markup is not the same as a ready WebGL scene. Loading horses
 // is asynchronous: keep polling, do not send a valid page into the fallback.
 if(hasRaceDocument()){
  watchLoad(serial);
  connectReadyObserver(serial);
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
for(const button of quickChannels){
 button.addEventListener('click',()=>tune(button.dataset.tvSwitch,null));
}
for(const button of shotButtons){
 button.addEventListener('click',()=>setShot(button.dataset.tvShot));
}
for(const card of cards){
 const button=card.querySelector('[data-tv-tune]');
 button?.addEventListener('click',()=>{tune(card.dataset.track,null);screen.scrollIntoView({behavior:'smooth',block:'center'});});
}
liveButton.addEventListener('click',()=>tune(active,null));
$('tv-replay-again').addEventListener('click',()=>{if(replay)tune(active,replay,false);});
$('tv-retry').addEventListener('click',()=>{sourcePromise=null;source=null;tune(active,replay,false);});
audioButton.addEventListener('click',()=>{
 if(audioButton.disabled)return;
 const doc=frame.contentDocument;
 const ambience=doc?.getElementById('sound'),voice=doc?.getElementById('voice');
 if(!ambience)return;
 const desired=!soundEnabled;
 for(const button of [ambience,voice]){
  if(!button)continue;
  const pressed=button.getAttribute('aria-pressed')==='true';
  if(pressed!==desired)button.click();
 }
 soundEnabled=[ambience,voice].some(button=>button?.getAttribute('aria-pressed')==='true');
 audioButton.setAttribute('aria-pressed',String(soundEnabled));
 audioButton.textContent=soundEnabled?'🔇 Silenciar transmisión':'🔊 Activar sonido';
});
$('tv-fullscreen').addEventListener('click',()=>{
 if(document.fullscreenElement)document.exitFullscreen();
 else if(screen.requestFullscreen)screen.requestFullscreen();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)showProgramGuide();});
const ticker=setInterval(showProgramGuide,1000);
window.addEventListener('pagehide',()=>{clearInterval(ticker);clearInterval(framePoller);clearTimeout(loadTimer);disconnectReadyObserver();environmentDeck.dispose();parameterDeck.dispose();frame.src='about:blank';},{once:true});
showProgramGuide();
if(new URLSearchParams(location.search).get('tv-qa')==='1'){
 window.__satoshiTvQA=Object.freeze({
  snapshot:()=>({track:active,shot:activeShot,transition:screen.classList.contains('is-switching'),
   src:frame.getAttribute('src'),ready:validFrameDoc(),
   tuning:Object.freeze({lastTuneLatencyMs,successfulTuneCount,failedTuneCount,lastTuneError}),
   environment:environmentDeck.snapshot(),parameters:parameterDeck.snapshot()}),
  shot:setShot
 });
}
if(window.self===window.top){
 tune(active,replay,false);
}else{
 // Hostinger sometimes rewrites a missing /broadcast/ path to this same page.
 // A framed TV hub must NEVER create another frame (recursive embedding).
 document.documentElement.dataset.tvNestedHub='blocked';
 frame.src='about:blank';
 setError('Esta ruta sirvió la página de canales en lugar de la carrera 3D.');
}
