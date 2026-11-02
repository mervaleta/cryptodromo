import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {buildRosterStats} from '../visual-lab/rosterStats.js';
import {liveSlot,formatCountdown} from '../visual-lab/liveSchedule.js';
import {illustrativeRatios} from './botRatios.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stats=buildRosterStats();let activeIndex=-1;
function render(){
 const now=liveSlot();$('race').textContent='Próxima largada '+now.next.label+' · jornada '+(now.next.dayIndex+1)+'/7 · cuenta regresiva '+formatCountdown(now.secondsToNext);
 if(activeIndex===now.next.index)return;
 activeIndex=now.next.index;
 const race=getRaceFixture(now.next.slot,now.next.dayIndex);
 const model=illustrativeRatios(race.entries,stats);
 $('odds').innerHTML=model.results.map((row,i)=>'<tr><td class="score">'+(i+1)+'</td><td><a class="token" href="/racers/#'+encodeURIComponent(row.symbol)+'"><i class="swatch" style="background:'+row.color+'"></i>'+escape(row.symbol)+'</a><span class="muted">'+escape(row.name)+'</span></td><td><b>'+row.percent.toFixed(1)+'%</b></td><td class="score">'+row.fairRatio.toFixed(2)+'×</td><td><span class="pill">'+(i<3?'Favorito ilustrativo':'Pelotón')+'</span></td></tr>').join('');
 $('bots').innerHTML=model.bots.map(({bot,ranking})=>'<article class="bot"><strong>'+escape(bot.name)+'</strong><p>'+escape(bot.description)+'</p><div>Top 3: '+ranking.map((r,i)=>'<span class="selection">'+(i+1)+' · '+escape(r.symbol)+' '+(r.probability*100).toFixed(1)+'%</span>').join(' ')+'</div></article>').join('');
}
render();setInterval(render,1000);
