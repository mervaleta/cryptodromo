import {listGrandPrix,grandPrixResult,grandPrixStandings,grandPrixRivalries,prepareGrandPrixReplay,replayFrame,GRAND_PRIX_COUNT} from '../sports/grandPrix.js?v=gp-1';
import {RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {liveSlot} from '../visual-lab/liveSchedule.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const events=listGrandPrix(),fmt=n=>Number(n).toLocaleString('es-AR');
const slot=liveSlot();
const cutoff=Math.max(-1,slot.index-(slot.slotSeconds>=60?0:1));
const cycleLimit=RACES_PER_DAY*7-1;
let replay=null,elapsed=0,playing=false,lastFrame=0,animationId=0;
const sourceNotice='Repetición calculada de datos sintéticos predeterminados; no es una grabación verificada de la transmisión.';
function sourceMode(){return $('visibility').value==='archive'?'archive':'scheduled';}
function effectiveCutoff(){return sourceMode()==='archive'?cycleLimit:cutoff;}
function link(symbol){return '<a href="/racers/#'+encodeURIComponent(symbol)+'">'+esc(symbol)+'</a>';}
function leaderboard(){
 const result=grandPrixStandings(effectiveCutoff()),rows=result.standings.filter(s=>s.starts>0);
 $('completed').textContent=String(result.eventsCompleted)+' / '+GRAND_PRIX_COUNT;
 $('champion').textContent=rows[0]?.symbol||'—';
 $('standings').innerHTML=rows.slice(0,50).map((r,i)=>
 '<tr><td>'+(i+1)+'</td><td><span class="token"><i class="swatch" style="background:'+esc(r.color)+'"></i>'+link(r.symbol)+'</span></td><td><strong>'+fmt(r.points)+'</strong></td><td>'+r.starts+'</td><td>'+r.wins+'</td><td>'+r.podiums+'</td><td>'+(r.trophies.length?'<span class="trophy" title="'+r.trophies.length+' victorias en Grandes Premios">🏆 × '+r.trophies.length+'</span>':'—')+'</td></tr>').join('')||'<tr><td colspan="7">Todavía no se disputaron clásicos en este ciclo.</td></tr>';
 const rivals=grandPrixRivalries(effectiveCutoff(),8);
 $('rivals').innerHTML=rivals.map(r=>'<div class="event"><div><strong>'+link(r.first)+' vs '+link(r.second)+'</strong><small>'+r.meetings+' enfrentamientos · '+r.podiumBattles+' duelos de podio</small></div><div class="event-meta">'+r.firstAhead+' - '+r.secondAhead+'</div></div>').join('')||'<p class="empty">Las rivalidades aparecerán cuando dos corredores se hayan enfrentado en varios Grandes Premios.</p>';
}
function calendar(){
 const day=Number($('day').value),cut=effectiveCutoff();
 $('events').innerHTML=events.filter(e=>e.dayIndex===day).map(event=>{
  const completed=event.absoluteIndex<=cut;
  const result=completed?grandPrixResult(event):null;
  return '<div class="event"><div><strong>'+esc(event.name)+'</strong><small>Jornada '+(day+1)+' · carrera #'+String(event.slotIndex+1).padStart(3,'0')+' · '+esc(event.time)+' AR · '+event.participants.length+' caballos</small><span class="event-meta">'+(completed?'Ganador: '+esc(result.winner):'Programada · resultado oculto')+'</span></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-gp="'+esc(event.id)+'" '+(completed?'':'disabled')+'>Replay 2D</button>'+(completed?'<a style="padding:10px 12px;border:1px solid #567d63;border-radius:5px;color:#d8eccf;text-decoration:none;white-space:nowrap" href="/grandes-premios/replay-3d/?day='+event.dayIndex+'&race='+event.slotIndex+(sourceMode()==='archive'?'&archive=1':'')+'">Replay 3D</a>':'')+'</div></div>';
 }).join('');
}
function render(){
 leaderboard();calendar();
 if(replay && replay.event.absoluteIndex>effectiveCutoff()){
  closeReplay();
 }
}
function closeReplay(){
 playing=false;replay=null;cancelAnimationFrame(animationId);
 $('replay').hidden=true;$('replay-empty').hidden=false;
}
function showReplay(event){
 if(event.absoluteIndex>effectiveCutoff())return;
 replay=prepareGrandPrixReplay(event);elapsed=0;playing=false;lastFrame=0;
 cancelAnimationFrame(animationId);
 $('replay-empty').hidden=true;$('replay').hidden=false;
 $('replay-title').textContent=event.name+' · jornada '+(event.dayIndex+1)+' · carrera #'+(event.slotIndex+1);
 $('replay-label').textContent=sourceNotice;
 $('replay-winner').textContent='Resultado sintético: '+replay.record.finish.slice(0,3).map(x=>x.place+'° '+x.symbol).join(' · ');
 $('scrub').value='0';$('play').textContent='Reproducir';
 draw();$('replay').scrollIntoView({block:'start',behavior:'smooth'});
}
function draw(){
 if(!replay)return;
 const canvas=$('replay-canvas'),ctx=canvas.getContext('2d');
 if(!ctx){$('replay-label').textContent='No se pudo inicializar el canvas.';return;}
 const {width:w,height:h}=canvas;
 ctx.fillStyle='#0c2418';ctx.fillRect(0,0,w,h);
 const padLeft=88,padRight=70,top=62,laneH=35,laneGap=2,trackWidth=w-padLeft-padRight;
 ctx.fillStyle='#85c99b';ctx.font='bold 24px system-ui';ctx.fillText('CRYPTÓDROMO · GRAND PRIX REPLAY',28,35);
 ctx.fillStyle='#e5c17c';ctx.font='bold 15px system-ui';ctx.fillText(elapsed.toFixed(1)+' / 60.0 s',w-145,33);
 ctx.strokeStyle='#c3c79b';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(padLeft+trackWidth,top-10);ctx.lineTo(padLeft+trackWidth,top+12*(laneH+laneGap));ctx.stroke();
 const f=replayFrame(replay,elapsed);
 // Display lanes are stable. Final finishing order comes only from the official race contract.
 f.forEach((horse,index)=>{
  const y=top+index*(laneH+laneGap),x=padLeft+trackWidth*horse.fraction;
  ctx.fillStyle=index%2?'#183f29':'#234b31';ctx.fillRect(padLeft,y,trackWidth,laneH);
  ctx.fillStyle='#dce6d8';ctx.font='bold 15px system-ui';ctx.fillText(horse.symbol,10,y+23);
  for(let m=0;m<=4;m++){
   const lx=padLeft+trackWidth*m/4;ctx.strokeStyle='rgba(230,245,207,.09)';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(lx,y);ctx.lineTo(lx,y+laneH);ctx.stroke();
  }
  ctx.fillStyle=horse.color;ctx.beginPath();ctx.roundRect(Math.max(padLeft+4,Math.min(x,padLeft+trackWidth)),y+5,24,24,7);ctx.fill();
  ctx.fillStyle='#07140d';ctx.font='bold 11px system-ui';ctx.fillText(String(index+1),Math.max(padLeft+10,Math.min(x+6,padLeft+trackWidth+6)),y+22);
 });
 ctx.fillStyle='#a7c2ad';ctx.font='13px system-ui';
 ctx.fillText('0 m',padLeft,top+12*(laneH+laneGap)+30);
 ctx.fillText('META 1000 m',padLeft+trackWidth-90,top+12*(laneH+laneGap)+30);
 $('scrub').value=String(elapsed);$('clock').textContent=elapsed.toFixed(1)+' / 60';
}
function frame(timestamp){
 if(!playing||!replay)return;
 if(!lastFrame)lastFrame=timestamp;
 const dt=Math.min((timestamp-lastFrame)/1000,.15);lastFrame=timestamp;
 elapsed=Math.min(60,elapsed+dt*Number($('speed').value));
 draw();
 if(elapsed>=60){playing=false;$('play').textContent='Reproducir';return;}
 animationId=requestAnimationFrame(frame);
}
$('day').innerHTML=Array.from({length:7},(_,i)=>'<option value="'+i+'">Jornada '+(i+1)+'</option>').join('');
$('day').value=String(slot.dayIndex);
$('day').addEventListener('change',calendar);
$('visibility').addEventListener('change',render);
$('events').addEventListener('click',e=>{
 const btn=e.target.closest('button[data-gp]');if(!btn||btn.disabled)return;
 const event=events.find(x=>x.id===btn.dataset.gp);if(event)showReplay(event);
});
$('play').addEventListener('click',()=>{
 if(!replay)return;
 if(elapsed>=60)elapsed=0;
 playing=!playing;$('play').textContent=playing?'Pausar':'Reproducir';
 lastFrame=0;if(playing)animationId=requestAnimationFrame(frame);else cancelAnimationFrame(animationId);
});
$('restart').addEventListener('click',()=>{
 playing=false;cancelAnimationFrame(animationId);
 elapsed=0;lastFrame=0;$('play').textContent='Reproducir';draw();
});
$('scrub').addEventListener('input',event=>{
 playing=false;cancelAnimationFrame(animationId);
 elapsed=Number(event.target.value);lastFrame=0;$('play').textContent='Reproducir';draw();
});
render();
