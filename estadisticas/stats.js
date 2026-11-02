import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {buildRosterStats} from '../visual-lab/rosterStats.js';
import {liveSlot,formatCountdown} from '../visual-lab/liveSchedule.js';
const $=id=>document.getElementById(id);
const labels={star:'Estrella',core:'Principal',challenger:'Desafiante'};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-AR',{maximumFractionDigits:2});
const stats=buildRosterStats();
const all=TOKEN_ROSTER.map(t=>({...t,...stats.get(t.symbol)}));
$('runners').textContent=String(all.length);
function render(){
 const q=$('search').value.trim().toLocaleLowerCase('es');
 const tier=$('tier').value,order=$('order').value;
 const items=all.filter(t=>(tier==='all'||t.tier===tier)&&(!q||t.symbol.toLowerCase().includes(q)||t.name.toLocaleLowerCase('es').includes(q)));
 items.sort((a,b)=>order==='averagePlace'?a.averagePlace-b.averagePlace:b[order]-a[order]||b.wins-a.wins||a.symbol.localeCompare(b.symbol));
 $('status').textContent=items.length+' de '+all.length+' corredores · 7 jornadas sintéticas';
 $('ranking').innerHTML=items.map((t,i)=>'<tr><td>'+(i+1)+'</td><td><a class="token" href="/racers/#'+encodeURIComponent(t.symbol)+'"><i class="dot" style="background:'+t.color+'"></i>'+escape(t.symbol)+'</a><br><span class="muted">'+escape(t.name)+'</span></td><td>'+labels[t.tier]+'</td><td>'+fmt(t.starts)+'</td><td>'+fmt(t.wins)+'</td><td>'+fmt(t.podiums)+'</td><td>'+fmt(t.winRatePct)+'%</td><td>'+fmt(t.averagePlace)+'</td></tr>').join('');
}
function renderSchedule(){
 const now=liveSlot();
 $('next').textContent=formatCountdown(now.secondsToNext);
 const rows=[];
 for(let offset=1;offset<=5;offset++){
  const slot=(now.slot+offset)%480, day=(now.dayIndex+Math.floor((now.slot+offset)/480))%7;
  const f=getRaceFixture(slot,day);
  const m=slot*3;
  rows.push('<tr><td>'+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+'</td><td>'+(day+1)+' / 7</td><td>#'+(slot+1)+'</td><td>'+f.entries.map(t=>'<a href="/racers/#'+encodeURIComponent(t.symbol)+'">'+escape(t.symbol)+'</a>').join(' · ')+'</td></tr>');
 }
 $('upcoming').innerHTML=rows.join('');
}
for(const id of ['search','order','tier'])$(id).addEventListener(id==='search'?'input':'change',render);
render();renderSchedule();setInterval(renderSchedule,1000);
