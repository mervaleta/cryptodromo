import {getRaceFixture,RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {liveSlot} from '../visual-lab/liveSchedule.js';
const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  return '<tr><td><b>#'+String(i+1).padStart(3,'0')+'</b></td><td>'+fixture.time+'</td><td class="entries">'+fixture.entries.map(e=>'<a href="/racers/#'+encodeURIComponent(e.symbol)+'" style="color:'+e.color+'" title="'+escape(e.name)+'">'+escape(e.symbol)+'</a>').join(' · ')+'</td><td><span class="pill'+(current?' upcoming':'')+'">'+state+'</span></td></tr>';
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
