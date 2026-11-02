import {getRaceFixture,RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {liveSlot} from '../visual-lab/liveSchedule.js';
const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only use verified, locally hosted token artwork. For the rest of the 100-token
// roster show the token's initials rather than an incorrect cryptocurrency logo.
const localTokenLogos = new Set(["1inch","aave","ada","algo","atom","avax","bat","bch","bnb","btc","chz","comp","crv","dash","doge","dot","enj","etc","eth","fil","gno","grt","icp","kcs","ksm","link","lpt","ltc","mana","neo","qnt","ray","sand","snx","sol","stx","sushi","theta","trx","uni","vet","xlm","xmr","xrp","xtz","zec","zil"]);
function runnerLink(token) {
 const symbol = String(token.symbol);
 const iconName = symbol.toLowerCase();
 const icon = localTokenLogos.has(iconName)
  ? '<img class="fixture-token-icon" src="/assets/crypto-logos/'+iconName+'.svg" alt="" width="20" height="20" loading="lazy" decoding="async">'
  : '<span class="fixture-token-fallback" aria-hidden="true">'+escape(symbol.slice(0,2))+'</span>';
 return '<a class="fixture-token" href="/racers/#'+encodeURIComponent(symbol)+'" title="'+escape(token.name)+'" style="color:'+escape(token.color)+'">'+icon+'<span class="fixture-symbol">'+escape(symbol)+'</span></a>';
}
// Keep the fixture legible if a local image isn't present on a partially synced deploy.
$('rows').addEventListener('error',event=>{
 const img=event.target;
 if(!(img instanceof HTMLImageElement)||!img.classList.contains('fixture-token-icon'))return;
 const symbol=img.closest('.fixture-token')?.querySelector('.fixture-symbol')?.textContent||'?';
 const placeholder=document.createElement('span');
 placeholder.className='fixture-token-fallback';
 placeholder.setAttribute('aria-hidden','true');
 placeholder.textContent=symbol.slice(0,2);
 img.replaceWith(placeholder);
},true);
const now=liveSlot();let day=now.dayIndex,offset=Math.floor(now.slot/24)*24;
$('day').value=String(day);
$('hour').innerHTML=Array.from({length:24},(_,h)=>'<option value="'+h+'">'+String(h).padStart(2,'0')+':00</option>').join('');
$('hour').value=String(Math.floor(now.slot/20));
function render(){
 const query=$('search').value.trim().toLocaleLowerCase('es');
 const filtered=[];
 for(let i=0;i<RACES_PER_DAY;i++){
  const fixture=getRaceFixture(i,day);
  if(!query||fixture.entries.some(e=>(e.symbol+' '+e.name).toLocaleLowerCase('es').includes(query)))filtered.push({i,fixture});
 }
 offset=Math.min(Math.max(0,offset),Math.max(0,Math.ceil(filtered.length/24)-1)*24);
 const view=filtered.slice(offset,offset+24);
 $('rows').innerHTML=view.map(({i,fixture})=>{
  const current=day===now.dayIndex&&i===now.slot;
  const state=day!==now.dayIndex?'Ciclo semanal':i<now.slot||current&&now.slotSeconds>=60?'Finalizada':current?'En curso':'Programada';
  return '<tr><td><b>#'+String(i+1).padStart(3,'0')+'</b></td><td>'+fixture.time+'</td><td class="entries">'+fixture.entries.map(runnerLink).join(' ')+'</td><td><span class="pill'+(current?' upcoming':'')+'">'+state+'</span></td></tr>';
 }).join('');
 $('summary').textContent='Día '+(day+1)+' de 7 · '+filtered.length+' carreras encontradas · mostrando '+(view.length?offset+1:0)+'-'+(offset+view.length);
 $('pages').textContent=(view.length?offset+1:0)+'–'+(offset+view.length)+' / '+filtered.length;
 $('previous').disabled=offset===0;$('following').disabled=offset+24>=filtered.length;
}
$('day').addEventListener('change',()=>{day=Number($('day').value);offset=0;render();});
$('search').addEventListener('input',()=>{offset=0;render();});
$('hour').addEventListener('change',()=>{offset=Number($('hour').value)*20;render();});
$('previous').addEventListener('click',()=>{offset=Math.max(0,offset-24);render();});
$('following').addEventListener('click',()=>{offset+=24;render();});
render();
