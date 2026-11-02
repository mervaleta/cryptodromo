import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js?v=alpha03-coats-2';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js?v=crp-20261102';
import {liveSlot,formatCountdown} from '../visual-lab/liveSchedule.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:3});
const now=liveSlot(),count=RACES_PER_DAY*FIXTURE_DAYS;
const latest=now.index-(now.slotSeconds>=60?0:1);
let entries=[];
try { entries=Array.from({length:18},(_,offset)=>{
 const index=((latest-offset)%count+count)%count,day=Math.floor(index/RACES_PER_DAY),slot=index%RACES_PER_DAY;
 const race=getRaceFixture(slot,day);
 const ranking=officialRanking(createOfficialRace(race.entries));
 return {index,day,slot,race,ranking};
});} catch(error){
 console.error('CRP results data out of sync',error);
 $('race-meta').textContent='No se pudo verificar el fixture sintético. Actualizá la página; los resultados quedan ocultos hasta validar los datos.';
 $('race-meta').style.color='#f2c887';
 $('winner').textContent='No disponible';$('last-race').textContent='—';
}
if(entries.length){
$('last-race').textContent='#'+String(entries[0].slot+1).padStart(3,'0');
$('winner').textContent=entries[0].ranking[0].entry.symbol;
$('race-select').innerHTML=entries.map((x,i)=>'<option value="'+i+'">Día '+(x.day+1)+' · '+x.race.time+' · Carrera '+x.race.number+'</option>').join('');
function render(){
 const x=entries[Number($('race-select').value)||0];
 $('race-meta').textContent='Jornada '+(x.day+1)+'/7 · Carrera '+x.race.number+'/'+RACES_PER_DAY+' · '+x.race.time+' (hora del estadio) · 12 caballos · método CRP-DOSE-FAIR-V1';
 $('results').innerHTML=x.ranking.map((p,i)=>'<tr><td class="score">'+(i+1)+'</td><td><a class="token" href="/racers/#'+encodeURIComponent(p.entry.symbol)+'"><i class="swatch" style="background:'+p.entry.color+'"></i>'+escape(p.entry.symbol)+'</a><span class="muted">'+escape(p.entry.name)+'</span></td><td>'+fmt(p.finishTime)+' s</td><td>'+fmt(p.input1+p.input2)+'%</td><td>'+fmt(p.distanceAt60)+' m</td></tr>').join('');
}
$('race-select').addEventListener('change',render);
$('recent').innerHTML=entries.slice(0,8).map((x,i)=>'<button class="control" type="button" data-index="'+i+'">'+x.race.time+' · '+escape(x.ranking[0].entry.symbol)+'</button>').join('');
$('recent').addEventListener('click',e=>{const button=e.target.closest('button[data-index]');if(button){$('race-select').value=button.dataset.index;render();}});
setInterval(()=>{$('next').textContent=formatCountdown(liveSlot().secondsToNext);},1000);
render();}
$('next').textContent=formatCountdown(now.secondsToNext);
