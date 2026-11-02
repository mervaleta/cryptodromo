import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {buildSyntheticCareers} from '../alpha15/careers.js?v=alpha15-1';
import {liveSlot,formatCountdown} from '../visual-lab/liveSchedule.js';
import {illustrativeRatios} from './botRatios.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let activeKey='';
function knownForm(now){
 const cutoff=now.slotSeconds>=60?now.slot:now.slot-1;
 const day=now.dayIndex;
 if(day===0&&cutoff<0)return new Map();
 const prior=day>0&&cutoff<0?{day:day-1,slot:479}:{day,slot:cutoff};
 return buildSyntheticCareers({throughDay:prior.day,throughSlot:prior.slot}).careers;
}
function render(){
 const now=liveSlot();$('race').textContent='Próxima largada '+now.next.label+' · jornada '+(now.next.dayIndex+1)+'/7 · cuenta regresiva '+formatCountdown(now.secondsToNext);
 const key=now.next.index+':'+now.dayIndex+':'+(now.slotSeconds>=60?'settled':'racing');
 if(activeKey===key)return;
 activeKey=key;
 const race=getRaceFixture(now.next.slot,now.next.dayIndex);
 const stats=knownForm(now);
 const neutral=new Map(race.entries.map(entry=>[entry.symbol,{wins:0,podiums:0,starts:0,averagePlace:6.5}]));
 for(const [symbol,st] of stats)neutral.set(symbol,st);
 const model=illustrativeRatios(race.entries,neutral);
 $('odds').innerHTML=model.results.map((row,i)=>'<tr><td class="score">'+(i+1)+'</td><td><a class="token" href="/racers/#'+encodeURIComponent(row.symbol)+'"><i class="swatch" style="background:'+row.color+'"></i>'+escape(row.symbol)+'</a><span class="muted">'+escape(row.name)+'</span></td><td><b>'+row.percent.toFixed(1)+'%</b></td><td class="score">'+row.fairRatio.toFixed(2)+'×</td><td><span class="pill">'+(i<3?'Favorito ilustrativo':'Pelotón')+'</span></td></tr>').join('');
 $('bots').innerHTML=model.bots.map(({bot,ranking})=>'<article class="bot"><strong>'+escape(bot.name)+'</strong><p>'+escape(bot.description)+'</p><div>Top 3: '+ranking.map((r,i)=>'<span class="selection">'+(i+1)+' · '+escape(r.symbol)+' '+(r.probability*100).toFixed(1)+'%</span>').join(' ')+'</div></article>').join('');
}
render();setInterval(render,1000);
