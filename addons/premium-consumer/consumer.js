/** Cryptódromo consumer layer. Presentation only; official race and wallet remain server-owned. */
import {getRaceFixture} from '/race-lab/source/src/data/raceFixture.js';
import {liveSlot,formatCountdown} from '/visual-lab/liveSchedule.js';

const MARKETS={WIN:{name:'Ganador',odds:8000},PLACE:{name:'Top 2',odds:4000},SHOW:{name:'Podio',odds:2500}};
const fmt=n=>Number(n).toLocaleString('es-AR',{maximumFractionDigits:0});
const $=(base,selector)=>base.querySelector(selector);
const element=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
function raceOptions(round){
  if(!Number.isSafeInteger(round)||round<0)throw Error('Programa no disponible');
  return Array.from({length:4},(_,n)=>{
    const abs=round+n+1,index=((abs%3360)+3360)%3360,day=Math.floor(index/480),slot=index%480;
    const race=getRaceFixture(slot,day);
    if(race.entries.length!==12||new Set(race.entries.map(e=>e.symbol)).size!==12)throw Error('Fixture inconsistente');
    return {abs,day,slot,time:race.time,entries:race.entries};
  });
}
function quote(stake,market){
  const n=Number(stake);
  if(!Number.isSafeInteger(n)||n<1||n>10000)throw Error('Ingresá entre 1 y 10.000 CR');
  if(!Object.hasOwn(MARKETS,market))throw Error('Mercado no disponible');
  return {stake:n,payout:Math.floor(n*MARKETS[market].odds/1000)};
}
function start(){
 const main=document.querySelector('main.shell'),stage=main?.querySelector('.stage');
 if(!main||!stage||document.body.dataset.premiumMounted)return;
 document.body.dataset.premiumMounted='1';
 const bar=element('section','pm-bar');bar.setAttribute('aria-label','Programa de carreras');
 bar.innerHTML='<div class="pm-program"><span class="pm-eyebrow">CRYPTÓDROMO · WORLD RACING</span><strong data-program>Próxima carrera</strong><small>12 corredores · mercados en créditos</small></div><div class="pm-count"><span>PRÓXIMA LARGADA</span><strong data-count>--:--</strong></div><nav aria-label="Accesos rápidos"><a href="#premium-markets">Mercados</a><a href="/resultados/">Resultados</a><a href="/demo-caja/">Mi cuenta</a></nav>';
 main.insertBefore(bar,stage);
 const area=element('section','pm-board');area.id='premium-markets';area.setAttribute('aria-label','Selección de apuestas');
 area.innerHTML=`<div class="pm-heading"><div><span class="pm-eyebrow">TAQUILLA · GRAN PREMIO</span><h2>Elegí tu favorito</h2><p>Las posiciones se definen en la pista. El ticket se registra y liquida en la cuenta única.</p></div><div class="pm-money"><span>SALDO DISPONIBLE</span><strong data-balance>··· CR</strong><a href="/demo-caja/">Gestionar cuenta</a></div></div>
  <div class="pm-race"><div data-racestatus>Consultando programa</div><label for="pm-raceselect">Próxima carrera <select id="pm-raceselect" data-race></select></label></div>
  <div class="pm-columns"><div class="pm-card"><div class="pm-cardhead"><h3>Corredores</h3><span>12 participantes</span></div><div class="pm-runners" data-runners role="group" aria-label="Elegir caballo"></div></div>
  <div class="pm-card pm-ticket"><div class="pm-cardhead"><h3>Ticket</h3><span>RESUMEN</span></div><p class="pm-choice" data-choice>Seleccioná un corredor</p><div class="pm-markets" role="group" aria-label="Mercado de apuesta"><button type="button" data-market="WIN" aria-pressed="true">Ganador <b>8,00×</b></button><button type="button" data-market="PLACE" aria-pressed="false">Top 2 <b>4,00×</b></button><button type="button" data-market="SHOW" aria-pressed="false">Podio <b>2,50×</b></button></div><label class="pm-amount">IMPORTE EN CRÉDITOS<input data-stake type="number" min="1" max="10000" step="1" inputmode="numeric" value="100"></label><div class="pm-presets" role="group" aria-label="Importe rápido"><button data-quick="50">50</button><button data-quick="100">100</button><button data-quick="500">500</button><button data-quick="1000">1.000</button></div><div class="pm-payout"><span>RETORNO BRUTO POSIBLE</span><strong data-payout>··· CR</strong></div><div class="pm-review" data-review hidden></div><p class="pm-message" role="alert" data-error hidden></p><p class="pm-confirm" role="status" data-success hidden></p><button class="pm-submit" type="button" data-submit disabled>Revisar ticket</button><button class="pm-edit" type="button" data-edit hidden>Editar selección</button><small class="pm-foot">Cuotas y cierre sujetos a validación del servidor. Modo presentación, sin transferencias de dinero.</small></div></div>
  <div class="pm-history"><div class="pm-cardhead"><h3>Mis últimos tickets</h3><a href="/demo-caja/">Ver movimientos</a></div><div data-history>Consultando operaciones…</div></div>`;
 stage.insertAdjacentElement('afterend',area);
 const q=s=>$(area,s),balance=q('[data-balance]'),raceselect=q('[data-race]'),runners=q('[data-runners]'),choice=q('[data-choice]'),stake=q('[data-stake]'),payout=q('[data-payout]'),submit=q('[data-submit]'),review=q('[data-review]'),edit=q('[data-edit]'),error=q('[data-error]'),success=q('[data-success]'),history=q('[data-history]');
 let state=null,races=[],selection={abs:null,runner:null,market:'WIN',stake:100},reviewing=false,pending=null,busy=false,loading=false;
 const notice=(text='')=>{error.hidden=!text;error.textContent=text};
 const current=()=>races.find(x=>x.abs===selection.abs);
 const dirty=()=>{reviewing=false;pending=null;success.hidden=true;drawTicket()};
 function drawTicket(){
   const runner=current()?.entries.find(e=>e.symbol===selection.runner);
   choice.textContent=runner?`${runner.name||runner.symbol} · ${runner.symbol}`:'Seleccioná un corredor';
   for(const b of area.querySelectorAll('[data-market]'))b.setAttribute('aria-pressed',String(b.dataset.market===selection.market));
   let result=null;try{result=quote(selection.stake,selection.market)}catch{}
   payout.textContent=result&&runner?`${fmt(result.payout)} CR`:'··· CR';
   submit.disabled=busy||!state||!runner||!result;
   submit.textContent=busy?'Procesando…':reviewing?'Confirmar ticket':'Revisar ticket';
   review.hidden=!reviewing;edit.hidden=!reviewing;
   if(reviewing&&runner&&result){review.textContent=`Carrera #${selection.abs} · ${runner.symbol} · ${MARKETS[selection.market].name}. Importe: ${fmt(result.stake)} CR. Retorno bruto posible: ${fmt(result.payout)} CR.`}
 }
 function drawRunners(){
   runners.replaceChildren();const race=current();if(!race)return;
   for(const [i,horse] of race.entries.entries()){
     const btn=element('button','pm-runner');btn.type='button';btn.setAttribute('aria-pressed',String(horse.symbol===selection.runner));
     const number=element('span','pm-number',String(i+1).padStart(2,'0'));const dot=element('i','');dot.style.backgroundColor=/^#[\da-fA-F]{6}$/.test(horse.color)?horse.color:'#48cba0';
     const title=element('strong','',horse.symbol),name=element('small','',horse.name||horse.symbol);
     btn.append(number,dot,title,name);btn.addEventListener('click',()=>{selection.runner=horse.symbol;dirty();drawRunners()});runners.append(btn);
   }
 }
 function drawHistory(){history.replaceChildren();const recent=state?.tickets?.slice(0,4)||[];
   if(!recent.length){history.append(element('p','','Todavía no hay tickets registrados.'));return}
   for(const t of recent){const row=element('div','pm-entry');row.append(element('span','',`#${t.absolute_round} · ${t.runner} · ${MARKETS[t.market]?.name||t.market}`),element('strong','',`${fmt(t.stake)} CR`),element('small','',({pending:'Pendiente',won:'Ganado',lost:'No premiado',refunded:'Reintegrado'})[t.status]||String(t.status)));history.append(row)}
 }
 function render(){
   const previous=selection.abs;
   races=raceOptions(Number(state.current_round));selection.abs=races.find(r=>r.abs===previous)?.abs||races[0].abs;
   if(!current().entries.some(e=>e.symbol===selection.runner))selection.runner=null;
   balance.textContent=`${fmt(state.wallet?.credits||0)} CR`;
   raceselect.replaceChildren();for(const r of races)raceselect.add(new Option(`J${r.day+1} · #${r.slot+1} · ${r.time} AR`,String(r.abs)));
   raceselect.value=String(selection.abs);
   q('[data-racestatus]').textContent=`Jornada ${current().day+1} · Carrera #${current().slot+1} · 12 caballos`;
   drawRunners();drawHistory();drawTicket();
 }
 async function api(action,body){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
   try{
     const response=await fetch(`/api/demo-wallet.php?action=${encodeURIComponent(action)}`,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{Accept:'application/json'},body:body?JSON.stringify({...body,csrf:state?.csrf}):undefined,signal:controller.signal});
     const data=await response.json().catch(()=>{throw Error('La cuenta no devolvió información válida')});
     if(!response.ok||!data.ok)throw Error(data.error||'No se pudo procesar la operación');return data;
   }finally{clearTimeout(timer)}
 }
 async function refresh(){if(busy||document.hidden||loading)return;loading=true;try{state=await api('bootstrap');render();notice()}catch(e){notice('Cuenta temporalmente no disponible: '+e.message)}finally{loading=false}}
 async function place(){
   if(busy||!state)return;let result;
   try{result=quote(selection.stake,selection.market);if(!current().entries.some(e=>e.symbol===selection.runner))throw Error('Seleccioná un corredor');}catch(e){notice(e.message);return}
   if(!reviewing){reviewing=true;notice();drawTicket();return}
   const payload={absolute_round:selection.abs,runner:selection.runner,market:selection.market,stake:result.stake};
   if(!pending)pending={...payload,key:'consumer:'+token()};
   busy=true;drawTicket();notice();
   try{state=await api('bet_place',pending);pending=null;reviewing=false;render();success.hidden=false;success.textContent='Ticket confirmado. Podés seguirlo en el historial.'}
   catch(e){notice(`No se confirmó el ticket: ${e.message}. Reintentá sin duplicarlo.`)}
   finally{busy=false;drawTicket()}
 }
 raceselect.addEventListener('change',()=>{selection.abs=Number(raceselect.value);selection.runner=null;dirty();drawRunners()});
 for(const b of area.querySelectorAll('[data-market]'))b.addEventListener('click',()=>{selection.market=b.dataset.market;dirty()});
 for(const b of area.querySelectorAll('[data-quick]'))b.addEventListener('click',()=>{selection.stake=Number(b.dataset.quick);stake.value=String(selection.stake);dirty()});
 stake.addEventListener('input',()=>{selection.stake=stake.value;dirty()});submit.addEventListener('click',place);edit.addEventListener('click',()=>{reviewing=false;drawTicket()});
 // Don't remove technical controls or alter the engine: expose them on demand.
 const tech=main.querySelector('.below > section.panel:first-child');
 if(tech){tech.classList.add('pm-tech');const h=tech.querySelector(':scope > h2');if(h){const toggle=element('button','pm-toggle','Mostrar controles de producción');toggle.type='button';toggle.setAttribute('aria-expanded','false');h.insertAdjacentElement('afterend',toggle);tech.classList.add('pm-closed');toggle.addEventListener('click',()=>{const opening=tech.classList.toggle('pm-closed');toggle.setAttribute('aria-expanded',String(!opening));toggle.textContent=opening?'Mostrar controles de producción':'Ocultar controles de producción'})}}
 const update=()=>{try{const r=liveSlot();bar.querySelector('[data-program]').textContent=`${r.racing?'EN VIVO':'PRÓXIMA CARRERA'} · J${(r.racing?r.dayIndex:r.next.dayIndex)+1} / #${(r.racing?r.slot:r.next.slot)+1} · ${r.racing?String(Math.floor(r.slot*3/60)).padStart(2,'0')+':'+String(r.slot*3%60).padStart(2,'0'):r.next.label}`;bar.querySelector('[data-count]').textContent=formatCountdown(r.secondsToNext)}catch{bar.querySelector('[data-count]').textContent='--:--'}};
 update();refresh();setInterval(update,1000);setInterval(refresh,10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){update();refresh()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
