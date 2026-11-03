/**
 * ZED-inspired Sports Laboratory. READ ONLY.
 * Uses the current Cryptodromo deterministic synthetic race contract, never
 * changes score, horse animation, fixture, wagers or stadium state.
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js?v=coat-20261102';
import {RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js?v=alpha03-coats-2';
import {syntheticRaceRecord,syntheticAudit,assertSyntheticRaceRecord} from '../alpha15/raceRecords.js';
import {buildSyntheticCareers} from '../alpha15/careers.js';
import {liveSlot} from '../visual-lab/liveSchedule.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const tokens=new Map(TOKEN_ROSTER.map(x=>[x.symbol,x]));
const fmt=n=>Number(n).toLocaleString('es-AR',{maximumFractionDigits:2});
const percent=n=>Number(n).toLocaleString('es-AR',{maximumFractionDigits:1})+'%';
const padded=n=>String(n).padStart(3,'0');
const safeSymbol=s=>tokens.has(s)?s:'BTC';
const observedCutoff=()=>{
 const now=liveSlot(), index=now.index-(now.slotSeconds>=60?0:1);
 return index<0?FIXTURE_DAYS*RACES_PER_DAY-1:index;
};
const slotToCutoff=n=>({throughDay:Math.floor(n/RACES_PER_DAY),throughSlot:n%RACES_PER_DAY});
let careerCache={key:'',value:null};
function careers(index){
 if(careerCache.key===String(index))return careerCache.value;
 const value=buildSyntheticCareers(slotToCutoff(index));
 careerCache={key:String(index),value};
 return value;
}
function options(current){
 return TOKEN_ROSTER.map(t=>'<option value="'+esc(t.symbol)+'"'+(t.symbol===current?' selected':'')+'>'+esc(t.symbol+' · '+t.name)+'</option>').join('');
}
function card(token,stats){
 const form=stats.recentForm.length?stats.recentForm.map(x=>'<span class="place '+(x===1?'first':'')+'">'+x+'°</span>').join(''):'<small>Sin carreras en el corte</small>';
 return '<div class="identity"><i style="background:'+esc(token.color)+'"></i><div><strong>'+esc(token.name)+'</strong><span>'+esc(token.symbol)+' · '+esc(token.tier)+'</span></div><a href="/racers/#'+encodeURIComponent(token.symbol)+'">Ficha 3D</a></div>'+
 '<div class="metrics"><div><span>Carreras</span><b>'+fmt(stats.starts)+'</b></div><div><span>Victorias</span><b>'+fmt(stats.wins)+'</b></div><div><span>Podios</span><b>'+fmt(stats.podiums)+'</b></div><div><span>% victorias</span><b>'+percent(stats.winRatePct)+'</b></div><div><span>Posición media</span><b>'+(stats.averagePlace===null?'—':fmt(stats.averagePlace))+'</b></div><div><span>Racha máxima</span><b>'+fmt(stats.longestWinStreak)+'</b></div></div><h3>Forma reciente</h3><div class="form">'+form+'</div>';
}
function scanMeetings(left,right,lastIndex){
 let meetings=0,leftWins=0,rightWins=0,close=0,latest=[];
 for(let index=0;index<=lastIndex;index++){
  const rec=syntheticRaceRecord(Math.floor(index/RACES_PER_DAY),index%RACES_PER_DAY);
  const a=rec.finish.find(x=>x.symbol===left), b=rec.finish.find(x=>x.symbol===right);
  if(!a||!b)continue;
  meetings++;
  if(a.place<b.place)leftWins++;else rightWins++;
  if(Math.abs(a.finishTimeSeconds-b.finishTimeSeconds)<0.15)close++;
  latest.push({record:rec,a,b});
  if(latest.length>6)latest.shift();
 }
 return {meetings,leftWins,rightWins,close,latest:latest.reverse()};
}
function raceLink(rec){
 return '<a href="#race='+rec.race.dayIndex+'-'+rec.race.slotIndex+'">Día '+rec.race.day+' · #'+padded(rec.race.number)+'</a>';
}
function renderDuel(){
 const a=safeSymbol($('token-a').value),b=safeSymbol($('token-b').value);
 const cutoff=$('scope').value==='cycle'?FIXTURE_DAYS*RACES_PER_DAY-1:observedCutoff();
 const snapshot=careers(cutoff),sa=snapshot.careers.get(a),sb=snapshot.careers.get(b);
 $('profile-a').innerHTML=card(tokens.get(a),sa);
 $('profile-b').innerHTML=card(tokens.get(b),sb);
 const duel=$('duel');
 if(a===b){duel.innerHTML='<p>Elegí dos corredores diferentes para ver los enfrentamientos.</p>';return;}
 const summary=scanMeetings(a,b,cutoff);
 duel.innerHTML='<h3>Historial cara a cara</h3><div class="duel-score"><div><b>'+summary.leftWins+'</b><span>'+esc(a)+' por delante</span></div><div><b>'+summary.meetings+'</b><span>Enfrentamientos</span></div><div><b>'+summary.rightWins+'</b><span>'+esc(b)+' por delante</span></div></div>'+
 '<p class="muted">'+summary.close+' llegadas con diferencia inferior a 0,15 s virtuales. Solo se computan carreras donde participan ambos.</p>'+
 '<div class="scroll"><table><thead><tr><th>Carrera</th><th>'+esc(a)+'</th><th>'+esc(b)+'</th><th>Ganó el duelo</th></tr></thead><tbody>'+
 summary.latest.map(x=>'<tr><td>'+raceLink(x.record)+'</td><td>'+x.a.place+'°</td><td>'+x.b.place+'°</td><td><b>'+esc(x.a.place<x.b.place?a:b)+'</b></td></tr>').join('')+'</tbody></table></div>';
 $('scope-label').textContent=$('scope').value==='cycle'?'Ciclo completo sintético. Incluye carreras futuras del fixture reproducible, NO transmisiones observadas.':'Hasta la última carrera completada en el horario del estadio. No es un registro de emisiones verificadas.';
}
function renderArchive(){
 const day=Number($('archive-day').value),page=Number($('archive-page').value);
 const start=page*24, query=$('archive-symbol').value.trim().toUpperCase();
 const rows=[];
 for(let i=start;i<Math.min(start+24,RACES_PER_DAY);i++){
  const rec=syntheticRaceRecord(day,i);
  if(query&&!rec.finish.some(x=>x.symbol===query))continue;
  rows.push('<tr><td>'+raceLink(rec)+'</td><td>'+esc(rec.race.startTime)+'</td><td><a href="/racers/#'+esc(rec.summary.winner)+'">'+esc(rec.summary.winner)+'</a></td><td>'+esc(rec.summary.runnerUp)+'</td><td>'+fmt(rec.summary.firstSecondMarginMeters)+' m</td></tr>');
 }
 $('archive-rows').innerHTML=rows.join('')||'<tr><td colspan="5">No hay coincidencias en esta página.</td></tr>';
 $('archive-count').textContent='Jornada '+(day+1)+' · carreras '+(start+1)+'–'+Math.min(start+24,RACES_PER_DAY)+' de 480 · fuente synthetic-v1';
}
function renderAudit(day,slot){
 if(!Number.isInteger(day)||day<0||day>=FIXTURE_DAYS||!Number.isInteger(slot)||slot<0||slot>=RACES_PER_DAY)return;
 const rec=syntheticRaceRecord(day,slot);
 assertSyntheticRaceRecord(rec);
 const audit=syntheticAudit(day,slot);
 $('audit-title').textContent='Acta sintética · Día '+(day+1)+' · carrera #'+padded(slot+1);
 $('audit-body').textContent=JSON.stringify({record:rec,audit},null,2);
 $('audit').hidden=false;
 $('audit').scrollIntoView({behavior:'smooth',block:'start'});
}
function readHash(){
 const match=location.hash.match(/^#race=(\d+)-(\d+)$/);
 if(match)renderAudit(Number(match[1]),Number(match[2]));
}
$('token-a').innerHTML=options('BTC');$('token-b').innerHTML=options('ETH');
$('archive-day').innerHTML=Array.from({length:FIXTURE_DAYS},(_,d)=>'<option value="'+d+'">Jornada '+(d+1)+'</option>').join('');
$('archive-page').innerHTML=Array.from({length:RACES_PER_DAY/24},(_,p)=>'<option value="'+p+'">Carreras '+(p*24+1)+'–'+((p+1)*24)+'</option>').join('');
$('archive-symbol').innerHTML='<option value="">Todos los corredores</option>'+options('');
for(const id of ['token-a','token-b','scope'])$(id).addEventListener('change',renderDuel);
for(const id of ['archive-day','archive-page','archive-symbol'])$(id).addEventListener('change',renderArchive);
$('audit-close').addEventListener('click',()=>{$('audit').hidden=true;history.replaceState(null,'',location.pathname);});
$('audit-copy').addEventListener('click',()=>navigator.clipboard?.writeText($('audit-body').textContent));
window.addEventListener('hashchange',readHash);
$('scope').value='observed';
renderDuel();renderArchive();readHash();
