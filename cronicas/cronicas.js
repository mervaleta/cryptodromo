import {liveSlot} from '../visual-lab/liveSchedule.js';
import {RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js?v=alpha03-coats-2';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js?v=coat-20261102';
import {buildSyntheticChronicle} from '../alpha15/chronicle.js';
import {buildSyntheticCareers} from '../alpha15/careers.js';
const $=id=>document.getElementById(id);
const current=liveSlot();
const completed=current.slotSeconds>=60?current.index:(current.index-1+7*RACES_PER_DAY)%(7*RACES_PER_DAY);
const actualDay=Math.floor(completed/RACES_PER_DAY),actualSlot=completed%RACES_PER_DAY;
let selectedDay=actualDay,activeCareers=null;
const categories={'first-win':'PRIMER TRIUNFO','streak':'RACHA DE VICTORIAS',
 'photo-finish':'LLEGADA AJUSTADA','challenger-win':'REVELACIÓN','result':'ACTA DEL DÍA'};
for(let day=0;day<7;day++){
 const option=document.createElement('option');
 option.value=String(day);option.textContent='Jornada '+(day+1)+' / 7';
 $('journal-day').append(option);
}
$('journal-day').value=String(actualDay);
for(const entry of TOKEN_ROSTER){
 const option=document.createElement('option');option.value=entry.symbol;
 option.textContent=entry.symbol+' · '+entry.name;$('horse').append(option);
}
$('horse').value='BTC';
function renderHorse(){
 const h=activeCareers?.careers.get($('horse').value);
 const profile=$('career'),rivals=$('rivals');profile.replaceChildren();rivals.replaceChildren();
 if(!h)return;
 $('profile-note').textContent=h.name+' ('+h.symbol+') · '+h.tier+
   ' · carreras sintéticas contabilizadas hasta el corte seleccionado. '+h.recentForm.length+
   ' posiciones recientes: '+(h.recentForm.join(' · ')||'sin participaciones')+'.';
 const cells=[
  ['Participaciones',h.starts],['Victorias',h.wins],['Podios',h.podiums],
  ['Porcentaje de triunfos',h.winRatePct.toFixed(1)+'%'],
  ['Mejor puesto',h.bestPlace??'—'],['Puesto medio',h.averagePlace?.toFixed(2)??'—'],
  ['Racha máxima',h.longestWinStreak],['Mejor tiempo virtual',h.fastest1000mSeconds?.toFixed(3)+' s'||'—']
 ];
 for(const [name,val] of cells){
  const card=document.createElement('div');card.className='metric';
  const label=document.createElement('span');label.textContent=name;
  const value=document.createElement('b');value.textContent=String(val);
  card.append(label,value);profile.append(card);
 }
 for(const rival of h.rivals){
  const item=document.createElement('div');item.className='rival';
  item.textContent=rival.symbol+' · '+rival.meetings+' enfrentamientos · '+rival.placedAhead+
   ' por delante · '+rival.podiumDuels+' duelos de podio';
  rivals.append(item);
 }
 if(!h.rivals.length){
  const p=document.createElement('p');p.className='muted';p.textContent='Sin rivales registrados en este corte.';
  rivals.append(p);
 }
}
function renderJournal(){
 selectedDay=Number($('journal-day').value);
 const all=$('journal-cutoff').value==='all';
 const cutoff=!all&&selectedDay===actualDay?actualSlot:RACES_PER_DAY-1;
 const archive=buildSyntheticChronicle({dayIndex:selectedDay,throughSlot:cutoff,limit:12});
 activeCareers=buildSyntheticCareers({throughDay:selectedDay,throughSlot:cutoff});
 $('day').textContent=String(selectedDay+1)+'/7';
 $('race').textContent='#'+String(cutoff+1).padStart(3,'0');
 $('journal-status').textContent='Jornada '+(selectedDay+1)+' · hasta carrera '+(cutoff+1)+
  ' de '+RACES_PER_DAY+' · '+archive.racesExamined+' actas sintéticas examinadas · '+
  (all?'archivo reproducible completo':'solo carreras finalizadas para el día actual')+'.';
 const root=$('articles');root.replaceChildren();
 for(const story of archive.highlights){
  const article=document.createElement('article');article.className='story';
  const tag=document.createElement('div');tag.className='tag';
  tag.textContent=(categories[story.kind]||'CRÓNICA')+' · CARRERA '+(story.slot+1);
  const title=document.createElement('h3');title.textContent=story.title;
  const text=document.createElement('p');text.textContent=story.body;
  const notice=document.createElement('small');
  notice.textContent='Borrador automático · simulación sintética · no observado en vivo';
  article.append(tag,title,text,notice);root.append(article);
 }
 if(!archive.highlights.length){
  const p=document.createElement('p');p.textContent='No hay historias calculadas para este corte.';
  root.append(p);
 }
 renderHorse();
}
$('journal-day').addEventListener('change',renderJournal);
$('journal-cutoff').addEventListener('change',renderJournal);
$('horse').addEventListener('change',renderHorse);
$('back-live').addEventListener('click',()=>{
 $('journal-day').value=String(actualDay);$('journal-cutoff').value='last';renderJournal();
});
renderJournal();
