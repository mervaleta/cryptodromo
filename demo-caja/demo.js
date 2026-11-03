import {WITHDRAWAL_METHODS,quoteWithdrawal,requestWithdrawal,advanceWithdrawal} from '../features/simulated-economy/withdrawals.js';
import {FIAT_METHODS,CRYPTO_RATES,quoteDeposit,createDepositIntent,resolveDepositIntent} from '../features/simulated-economy/deposits.js';
import {getRaceFixture,RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {liveSlot,formatCountdown} from '../visual-lab/liveSchedule.js';
import {loadState,saveState,activeAccount,addAccount,switchAccount,topUp,buyCredits,sellCredits,quoteTicket,placeTicket,settleTickets,rankAccounts} from '../features/simulated-economy/ledger.js';
const $=id=>document.getElementById(id);
const store=window.localStorage;let s=loadState(store),activeQuote=null,choices=[];
const money=n=>(n/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
const number=n=>Number(n).toLocaleString('es-AR');
const escapeText=(parent,value,tag='span')=>{const el=document.createElement(tag);el.textContent=String(value);parent.append(el);return el};
const show=(id,text)=>{$(id).textContent=String(text)};
const update=()=>{try{saveState(store,s)}catch(e){show('accountStatus','Advertencia: no se puede guardar en este navegador. '+e.message)}render()};
const run=(fn,target)=>{try{fn();show(target,'Operación ficticia registrada correctamente.');update()}catch(e){show(target,e.message)}};
function resolve(day,slot){
 const fixture=getRaceFixture(slot,day);
 const ranking=officialRanking(createOfficialRace(fixture.entries));
 return ranking.map(p=>p.entry.symbol);
}
function settle(){
 let count=0;
 try{count=settleTickets(s,resolve,Date.now()).length}catch(e){console.error('No se pudo verificar una liquidación demo',e)}
 if(count)update();
 return count;
}
function render(){
 const a=activeAccount(s);
 $('player').replaceChildren();
 if(!s.accounts.length){const o=new Option('Primero creá un jugador','');$('player').add(o)}
 else for(const acc of s.accounts){const o=new Option(acc.alias,acc.id);$('player').add(o)}
 $('player').value=a?.id||'';
 show('usd',a?money(a.usdCents):'0,00');show('credits',number(a?.credits||0));
 for(const id of ['fund','buy','sell','place','confirmDeposit','cancelDeposit','requestWithdraw','advanceWithdraw'])$(id).disabled=!a;
 $('ticketList').replaceChildren();$('ledgerList').replaceChildren();$('leaders').replaceChildren();renderDeposits(a);renderWithdrawals(a);
 if(a){
  for(const t of [...a.tickets].reverse().slice(0,100)){const li=document.createElement('li');
   escapeText(li,'#'+t.raceId+' · '+t.runner+' · '+t.kind+' · '+number(t.stake)+' CR · '+t.status+' · '+number(t.payout)+' CR');
   $('ticketList').append(li);
  }
  for(const l of [...a.ledger].reverse().slice(0,100)){const li=document.createElement('li');
   escapeText(li,l.type+' · '+(l.amount>0?'+':'')+number(l.amount)+' '+(l.currency==='USD_CENTS'?'centavos USD demo':'CR'));
   escapeText(li,' · '+new Date(l.at).toLocaleString('es-AR'),'small');$('ledgerList').append(li)}
 }
 if(!a?.tickets.length)escapeText($('ticketList'),'No hay tickets todavía.','li');
 if(!a?.ledger.length)escapeText($('ledgerList'),'Todavía no hay movimientos.','li');
 for(const row of rankAccounts(s)){const tr=document.createElement('tr');for(const v of [row.alias,row.settled,row.wins,row.accuracy.toFixed(1)+'%',row.net])escapeText(tr,v,'td');$('leaders').append(tr)}
 preview();
}
function renderDeposits(a){
 $('depositList').replaceChildren();$('depositIntent').replaceChildren();
 const deposits=Array.isArray(a?.deposits)?a.deposits:[];
 for(const d of [...deposits].reverse().slice(0,60)){
  const li=document.createElement('li');
  escapeText(li,d.channel+' '+d.method+' · '+d.amount+' '+d.currency+' → USD demo '+money(d.creditedCents)+' · '+d.status);
  escapeText(li,' · '+d.id.slice(0,8),'small');$('depositList').append(li);
  if(d.status==='pending')$('depositIntent').add(new Option(d.method+' · '+money(d.creditedCents)+' USD demo · '+d.id.slice(0,8),d.id));
 }
 if(!deposits.length)escapeText($('depositList'),'No hay solicitudes todavía.','li');
 const pending=$('depositIntent').options.length>0;
 $('confirmDeposit').disabled=!pending;$('cancelDeposit').disabled=!pending;
}
function updateDepositMethods(){
 const channel=$('depositChannel').value;
 $('depositMethod').replaceChildren();
 const methods=channel==='fiat'?FIAT_METHODS:CRYPTO_RATES;
 for(const [symbol,desc] of Object.entries(methods))$('depositMethod').add(new Option(typeof desc==='string'?desc:desc.name+' · cotización fija de prueba',symbol));
 previewDeposit();
}
function previewDeposit(){
 try{
  const q=quoteDeposit({channel:$('depositChannel').value,method:$('depositMethod').value,packageUsd:Number($('pack').value)});
  show('depositQuote','Importe ficticio a enviar: '+q.amount+' '+q.currency+' · Acreditación: USD demo '+money(q.creditedCents)+' · Comisión: '+money(q.feeCents)+' USD demo'+(q.rateUsd?' · tasa fija 1 '+q.method+' = '+q.rateUsd+' USD demo':''));
 }catch(e){show('depositQuote',e.message)}
}
function renderWithdrawals(a){
 const priorSelected=$('withdrawIntent').value; $('withdrawIntent').replaceChildren();$('withdrawList').replaceChildren();
 const ws=Array.isArray(a?.withdrawals)?a.withdrawals:[];
 for(const w of [...ws].reverse().slice(0,80)){
  const li=document.createElement('li');
  escapeText(li,w.method+' · USD demo '+money(w.amountCents)+' · tarifa '+money(w.feeCents)+' · neto '+money(w.netCents)+' · '+w.status);
  $('withdrawList').append(li);
  if(['pending','approved','processing'].includes(w.status))$('withdrawIntent').add(new Option(w.id.slice(0,8)+' · '+w.status+' · USD '+money(w.amountCents),w.id));
 }
 if(!ws.length)escapeText($('withdrawList'),'No hay retiros ficticios registrados.','li');
 if([...$('withdrawIntent').options].some(o=>o.value===priorSelected))$('withdrawIntent').value=priorSelected;
 const selection=ws.find(w=>w.id===$('withdrawIntent').value);
 const actions={pending:[['approve','Aprobar'],['reject','Rechazar y devolver'],['cancel','Cancelar y devolver']],approved:[['process','Enviar a procesamiento'],['reject','Rechazar y devolver'],['cancel','Cancelar y devolver']],processing:[['complete','Completar'],['fail','Falló: devolver saldo']]};
 $('withdrawAction').replaceChildren();
 for(const [code,label] of actions[selection?.status]||[])$('withdrawAction').add(new Option(label,code));
 $('advanceWithdraw').disabled=!selection;
}
function previewWithdraw(){
 try{const q=quoteWithdrawal({method:$('withdrawMethod').value,amountCents:Math.round(Number($('withdrawAmount').value)*100)});
 show('withdrawQuote','Débito total: USD demo '+money(q.amountCents)+' · comisión: USD demo '+money(q.feeCents)+' · neto estimado: USD demo '+money(q.netCents)+' · ninguna transferencia externa.');
 }catch(e){show('withdrawQuote',e.message)}
}
function getChoices(){
 const now=liveSlot(),time=Date.now(),out=[];
 // Do not offer the in-progress race. Offer the next four future slots.
 for(let offset=1;offset<=4;offset++){
  const globalSlot=now.slot+offset;
  const day=(now.dayIndex+Math.floor(globalSlot/RACES_PER_DAY))%7,slot=globalSlot%RACES_PER_DAY;
  const startsAt=time+now.secondsToNext*1000+(offset-1)*180000;
  const raceId=day*RACES_PER_DAY+slot;
  const fixture=getRaceFixture(slot,day);
  out.push({raceId,day,slot,startsAt,fixture});
 }
 return out;
}
function races(){
 const current=$('race').value;choices=getChoices();$('race').replaceChildren();
 for(const c of choices){const text='Día '+(c.day+1)+' · #'+String(c.slot+1).padStart(3,'0')+' · '+c.fixture.time+' (AR)';
  $('race').add(new Option(text,String(c.raceId)))}
 if(choices.some(c=>String(c.raceId)===current))$('race').value=current;
 else $('race').value=String(choices[0].raceId);
 runners();
}
function runners(){
 const c=choices.find(x=>String(x.raceId)===$('race').value);if(!c)return;
 const current=$('runner').value;$('runner').replaceChildren();
 for(const e of c.fixture.entries)$('runner').add(new Option(e.symbol+' · '+e.name,e.symbol));
 if(c.fixture.entries.some(e=>e.symbol===current))$('runner').value=current;
 preview();
}
function preview(){
 const c=choices.find(x=>String(x.raceId)===$('race').value);
 if(!c)return;
 const kind=$('betKind').value,stake=Number($('stake').value);
 const odds=kind==='WIN'?8:kind==='PLACE'?4:2.5;
 show('odds',odds+'×');
 show('potential',Number.isSafeInteger(stake)&&stake>0?number(Math.floor(stake*odds))+' CR':'—');
 const close=Math.ceil((c.startsAt-Date.now()-5000)/1000);
 show('raceInfo','Largada '+c.fixture.time+' AR · '+c.fixture.entries.length+' corredores · cierre '+(close>0?formatCountdown(close):'CERRADO'));
 let note='Confirmá para emitir un ticket ficticio.';
 try{activeQuote=quoteTicket({raceId:c.raceId,day:c.day,slot:c.slot,runner:$('runner').value,kind,stake,decimalOdds:odds,startsAt:c.startsAt});note='Debita '+number(stake)+' CR · paga hasta '+number(activeQuote.potentialPayout)+' CR brutos si acertás.'}
 catch(e){activeQuote=null;note=e.message}
 show('ticketSummary',note);$('place').disabled=!activeAccount(s)||!activeQuote;
 show('buyPreview',Number.isFinite(Number($('buyAmount').value))? 'Recibís aproximadamente '+number(Math.round(Number($('buyAmount').value)*100))+' CR':'—');
 show('sellPreview',Number.isFinite(Number($('sellAmount').value))?'Recibís USD demo '+money(Number($('sellAmount').value)):'—');
}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{
 for(const tab of document.querySelectorAll('[data-view]'))tab.setAttribute('aria-selected',String(tab===b));
 for(const pane of document.querySelectorAll('.pane'))pane.hidden=pane.id!==b.dataset.view;
});
$('create').onclick=()=>run(()=>addAccount(s,$('newAlias').value),'accountStatus');
$('player').onchange=()=>run(()=>switchAccount(s,$('player').value),'accountStatus');
$('fund').onclick=()=>run(()=>createDepositIntent(s,{channel:$('depositChannel').value,method:$('depositMethod').value,packageUsd:Number($('pack').value)}),'fundStatus');
$('confirmDeposit').onclick=()=>run(()=>resolveDepositIntent(s,$('depositIntent').value,'confirmed'),'depositStatus');
$('cancelDeposit').onclick=()=>run(()=>resolveDepositIntent(s,$('depositIntent').value,'cancelled'),'depositStatus');
$('depositChannel').addEventListener('change',updateDepositMethods);
$('depositMethod').addEventListener('change',previewDeposit);
$('pack').addEventListener('change',previewDeposit);
$('buy').onclick=()=>run(()=>buyCredits(s,Number($('buyAmount').value)),'changeStatus');
$('sell').onclick=()=>run(()=>sellCredits(s,Number($('sellAmount').value)),'changeStatus');
$('requestWithdraw').onclick=()=>run(()=>requestWithdrawal(s,{method:$('withdrawMethod').value,amountCents:Math.round(Number($('withdrawAmount').value)*100)}),'withdrawStatus');
$('advanceWithdraw').onclick=()=>run(()=>advanceWithdrawal(s,$('withdrawIntent').value,$('withdrawAction').value),'withdrawAdvanceStatus');
$('withdrawIntent').addEventListener('change',()=>renderWithdrawals(activeAccount(s)));
for(const id of ['withdrawMethod','withdrawAmount'])$(id).addEventListener('input',previewWithdraw);
$('place').onclick=()=>run(()=>{
 // Compare the requested race to live fixture again, never trust a frozen UI selection.
 const c=choices.find(x=>x.raceId===activeQuote?.raceId);
 if(!c)throw Error('Seleccioná una carrera válida');
 const fresh=liveSlot(),currentRace=fresh.dayIndex*RACES_PER_DAY+fresh.slot;
 if(c.raceId===currentRace||Date.now()>=c.startsAt-5000)throw Error('Esta carrera ya cerró');
 if(!c.fixture.entries.some(e=>e.symbol===activeQuote.runner))throw Error('El corredor no figura en el fixture');
 placeTicket(s,activeQuote,Date.now());
},'ticketStatus');
$('race').onchange=runners;
for(const id of ['runner','betKind','stake','buyAmount','sellAmount'])$(id).addEventListener('input',preview);
updateDepositMethods();races();render();previewWithdraw();settle();
let prevRace='';
setInterval(()=>{
 const now=liveSlot(),key=now.dayIndex+':'+now.slot;
 if(prevRace!==key){prevRace=key;races()}
 else preview();
 settle();
},1000);
