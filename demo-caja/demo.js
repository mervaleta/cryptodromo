import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
const $=id=>document.getElementById(id);
let state=null,csrf='',selectedRace='';
const fmt=n=>(Number(n)/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
const integer=n=>Number(n).toLocaleString('es-AR');
const ui=(id,value)=>{$(id).textContent=String(value)};
const entry=(holder,value)=>{const li=document.createElement('li');li.textContent=String(value);holder.append(li)};
const amounts={BTC:70000,ETH:3500,USDT:1,SOL:150};
const withdrawFees={bank:[25,100,500],crypto_usdt:[50,50,1000],crypto_btc:[100,75,1500]};
const uid=()=>{const bytes=crypto.getRandomValues(new Uint8Array(16));return 'op:'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')};
async function api(action,body=null){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch('/api/demo-wallet.php?action='+encodeURIComponent(action),{
   method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',
   headers:body?{'Content-Type':'application/json'}:{'Accept':'application/json'},
   body:body?JSON.stringify({...body,key:uid(),csrf}):undefined,signal:controller.signal
  });
  const data=await response.json().catch(()=>{throw Error('La API no devolvió JSON. Comprobá que PHP esté disponible.')});
  if(!response.ok||!data.ok)throw Error(data.error||'Operación no disponible');
  return data;
 }finally{clearTimeout(timer)}
}
async function refresh(){
 const v=await api('bootstrap');state=v;csrf=v.csrf;render();
}
async function operation(action,values,target){
 if(!state)return;
 const button=document.activeElement;if(button instanceof HTMLButtonElement)button.disabled=true;
 try{const v=await api(action,values);state=v;csrf=v.csrf;render();ui(target,v.replayed?'La solicitud ya estaba registrada.':'Operación ficticia registrada.')}
 catch(e){ui(target,e.message)}
 finally{if(button instanceof HTMLButtonElement)button.disabled=false}
}
function methods(){
 $('method').replaceChildren();
 const opts=$('channel').value==='fiat'?{card:'Tarjeta ficticia',bank:'Transferencia ficticia'}:
 {BTC:'Bitcoin · demo',ETH:'Ethereum · demo',USDT:'USDT · demo',SOL:'Solana · demo'};
 for(const [code,label]of Object.entries(opts))$('method').add(new Option(label,code));
 previewDeposit();
}
function previewDeposit(){
 const usd=Number($('package').value),method=$('method').value;
 const amount=$('channel').value==='fiat'?usd.toFixed(2)+' USD demo':(usd/(amounts[method]||1)).toFixed(8)+' '+method;
 ui('depositPreview','Importe ficticio: '+amount+' · acreditación USD demo '+fmt(usd*100)+' · comisión: 0. Sin QR, dirección ni pago real.');
}
function renderIntents(kind,selectId,historyId){
 const intents=kind==='deposit'?state.deposits:state.withdrawals;
 const root=$(historyId),select=$(selectId),old=select.value;
 root.replaceChildren();select.replaceChildren();
 for(const d of intents){
  entry(root,d.method+' · USD demo '+fmt(d.usd_cents)+' · '+d.status+' · '+d.id.slice(0,12));
  if(kind==='deposit'&&d.status==='pending'||kind==='withdrawal'&&['pending','approved','processing'].includes(d.status))
   select.add(new Option(d.method+' · '+fmt(d.usd_cents)+' USD · '+d.status,d.id));
 }
 if([...select.options].some(x=>x.value===old))select.value=old;
 if(!intents.length)entry(root,'Sin movimientos.');
}
function renderWithdrawActions(){
 const w=state?.withdrawals?.find(x=>x.id===$('withdrawId').value);
 const opts={pending:[['approve','Aprobar'],['cancel','Cancelar y devolver'],['reject','Rechazar y devolver']],approved:[['process','Procesar'],['cancel','Cancelar y devolver'],['reject','Rechazar y devolver']],processing:[['complete','Completar'],['fail','Fallar y devolver']]}[w?.status]||[];
 $('transition').replaceChildren();
 for(const [code,label]of opts)$('transition').add(new Option(label,code));
 $('withdrawAdvance').disabled=!opts.length;
}
function renderRaces(){
 const old=$('race').value||selectedRace;
 $('race').replaceChildren();
 const current=Number(state.current_round);
 if(!Number.isInteger(current))return;
 for(let offset=1;offset<=4;offset++){
  const absolute=current+offset,index=((absolute%3360)+3360)%3360,day=Math.floor(index/480),slot=index%480;
  const race=getRaceFixture(slot,day);
  $('race').add(new Option('Jornada '+(day+1)+' · #'+(slot+1)+' · '+race.time+' AR',String(absolute)));
 }
 if([...$('race').options].some(o=>o.value===old))$('race').value=old;
 selectedRace=$('race').value;
 renderRunners();
}
function renderRunners(){
 const race=Number($('race').value),index=((race%3360)+3360)%3360;
 const fixture=getRaceFixture(index%480,Math.floor(index/480));
 const old=$('runner').value;$('runner').replaceChildren();
 for(const horse of fixture.entries)$('runner').add(new Option(horse.symbol+' · '+horse.name,horse.symbol));
 if(fixture.entries.some(h=>h.symbol===old))$('runner').value=old;
 previewBet();
}
function previewBet(){
 const stake=Number($('stake').value),odds={WIN:8,PLACE:4,SHOW:2.5}[$('market').value];
 ui('betPreview','Carrera absoluta #'+$('race').value+' · '+$('runner').value+' · '+(Number.isInteger(stake)&&stake>0?integer(stake):'—')+' CR a cuota '+odds+'× · premio bruto posible '+(Number.isInteger(stake)&&stake>0?integer(Math.floor(stake*odds)):'—')+' CR. Ticket sujeto al cierre del servidor.');
}
function previewWithdraw(){
 const method=$('withdrawMethod').value,cents=Math.round(Number($('withdrawAmount').value)*100),fee=withdrawFees[method];
 if(!Number.isSafeInteger(cents)||cents<fee[2]){ui('withdrawPreview','Importe menor al mínimo ficticio: '+fmt(fee[2])+' USD demo.');return}
 const cost=fee[0]+Math.ceil(cents*fee[1]/10000);
 ui('withdrawPreview','Reservás USD demo '+fmt(cents)+' · comisión '+fmt(cost)+' · neto simulado '+fmt(cents-cost));
}
function render(){
 const w=state.wallet||{};
 ui('alias',w.alias||'Invitado');ui('usd',fmt(w.usd_cents||0));ui('held',fmt(w.held_cents||0));ui('cr',integer(w.credits||0));
 renderIntents('deposit','depositId','depositHistory');
 renderIntents('withdrawal','withdrawId','withdrawHistory');
 renderWithdrawActions();
 for(const id of ['depositConfirm','depositCancel'])$(id).disabled=!$('depositId').value;
 const lh=$('ledgerHistory'),th=$('ticketHistory');lh.replaceChildren();th.replaceChildren();
 for(const l of state.ledger)entry(lh,l.kind+' · '+(Number(l.delta)>0?'+':'')+integer(l.delta)+' '+l.currency+' ('+l.bucket+') · '+l.created_at);
 for(const t of state.tickets)entry(th,'#'+t.absolute_round+' · '+t.runner+' '+t.market+' · '+integer(t.stake)+' CR · '+t.status+' · premio '+integer(t.payout)+' CR');
 if(!state.ledger.length)entry(lh,'No hay movimientos.');if(!state.tickets.length)entry(th,'No hay tickets.');
 renderRaces();previewWithdraw();previewDeposit();
}
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>{
 for(const tab of document.querySelectorAll('[data-tab]'))tab.setAttribute('aria-selected',String(tab===b));
 for(const section of document.querySelectorAll('main.cash > section'))section.hidden=section.id!==b.dataset.tab;
});
$('channel').onchange=methods;$('method').onchange=previewDeposit;$('package').onchange=previewDeposit;
$('depositCreate').onclick=()=>operation('deposit_create',{channel:$('channel').value,method:$('method').value,package_usd:Number($('package').value)},'depositMsg');
$('depositConfirm').onclick=()=>operation('deposit_confirm',{intent:$('depositId').value},'depositActionMsg');
$('depositCancel').onclick=()=>operation('deposit_cancel',{intent:$('depositId').value},'depositActionMsg');
$('buy').onclick=()=>operation('exchange_buy',{amount_cents:Math.round(Number($('buyAmount').value)*100)},'exchangeMsg');
$('sell').onclick=()=>operation('exchange_sell',{amount_cents:Number($('sellAmount').value)},'exchangeMsg');
$('race').onchange=renderRunners;$('runner').onchange=previewBet;$('market').onchange=previewBet;$('stake').oninput=previewBet;
$('betPlace').onclick=()=>operation('bet_place',{absolute_round:Number($('race').value),runner:$('runner').value,market:$('market').value,stake:Number($('stake').value)},'betMsg');
$('withdrawMethod').onchange=previewWithdraw;$('withdrawAmount').oninput=previewWithdraw;
$('withdrawCreate').onclick=()=>operation('withdraw_create',{method:$('withdrawMethod').value,amount_cents:Math.round(Number($('withdrawAmount').value)*100)},'withdrawMsg');
$('withdrawId').onchange=renderWithdrawActions;
$('withdrawAdvance').onclick=()=>operation('withdraw_action',{intent:$('withdrawId').value,transition:$('transition').value},'withdrawActionMsg');
methods();
refresh().catch(e=>{ui('fatal','La billetera compartida no pudo iniciarse: '+e.message);$('fatal').hidden=false});
setInterval(()=>{if(document.visibilityState==='visible')refresh().catch(e=>console.error('Refresh de caja demo fallido',e))},15000);
