import {selectBroadcastShot} from '../director.js';
import {rendererSettings} from '../quality.js';
import {buildSyntheticChronicle} from '../chronicle.js';
import {buildSyntheticCareers} from '../careers.js';
import {TOKEN_ROSTER} from '../../race-lab/source/src/data/tokenRoster.js';
const $=id=>document.getElementById(id);
for(let day=0;day<7;day++){
 const option=document.createElement('option');option.value=String(day);
 option.textContent='Día '+(day+1);$('day').append(option);
}
for(const runner of TOKEN_ROSTER){
 const opt=document.createElement('option');opt.value=runner.symbol;
 opt.textContent=runner.symbol+' · '+runner.name;$('horse').append(opt);
}
$('horse').value='BTC';
function renderDirector(){
 const elapsed=Number($('elapsed').value);
 $('timeLabel').textContent=elapsed+' s';
 const phase=elapsed<60?'race':elapsed<120?'results':'presentation';
 const item=selectBroadcastShot({elapsed,phase,layout:'oval',progress:elapsed/60,minDwell:0});
 $('shot').textContent=item.shot;
 $('reason').textContent=item.reason;
}
function renderQuality(){
 const p=rendererSettings($('quality').value,{devicePixelRatio:2});
 $('settings').replaceChildren();
 const entries=[['Pixel ratio máximo',p.pixelRatioCap.toFixed(2)],['Mapa de sombra',p.shadowResolution+' px'],
  ['Público',Math.round(p.crowdFactor*100)+'%'],['Partículas',Math.round(p.particleFactor*100)+'%']];
 for(const [name,value] of entries){
  const el=document.createElement('span'),label=document.createTextNode(name),num=document.createElement('b');
  num.textContent=value;el.append(label,num);$('settings').append(el);
 }
}
let latestCareers=null;
function renderProfile(){
 const runner=latestCareers?.careers.get($('horse').value);
 $('career').replaceChildren();$('rivals').replaceChildren();
 if(!runner)return;
 $('profileMeta').textContent=runner.name+' · carrera sintética hasta la fecha seleccionada';
 for(const [label,value] of [['Participaciones',runner.starts],['Victorias',runner.wins],
  ['Podios',runner.podiums],['Puesto medio',runner.averagePlace?.toFixed(2)||'—'],
  ['Mejor puesto',runner.bestPlace??'—'],['Racha máxima',runner.longestWinStreak]]){
  const el=document.createElement('span'),heading=document.createElement('b');
  heading.textContent=String(value);el.append(label,heading);$('career').append(el);
 }
 const title=document.createElement('h3');title.textContent='Rivales más frecuentes';$('rivals').append(title);
 const description=document.createElement('p');
 description.textContent=runner.rivals.map(x=>x.symbol+' · '+x.meetings+' cruces').join('  ·  ')||'Sin enfrentamientos registrados en este corte.';
 $('rivals').append(description);
}
function renderArchive(){
 const day=Number($('day').value),cut=Math.max(1,Math.min(480,Math.floor(Number($('slot').value)||1)));
 $('slot').value=String(cut);
 const chronicle=buildSyntheticChronicle({dayIndex:day,throughSlot:cut-1,limit:6});
 latestCareers=buildSyntheticCareers({throughDay:day,throughSlot:cut-1});
 $('digestMeta').textContent='Día '+(day+1)+' · '+cut+' carreras del día · '+chronicle.racesExamined+
   ' carreras del ciclo analizadas · borrador sintético';
 $('digest').replaceChildren();
 for(const item of chronicle.highlights){
  const el=document.createElement('article');el.className='item';
  const tag=document.createElement('small');tag.textContent='CARRERA '+(item.slot+1)+' · '+item.kind;
  const title=document.createElement('strong');title.textContent=item.title;
  const body=document.createElement('p');body.textContent=item.body;
  el.append(tag,title,body);$('digest').append(el);
 }
 renderProfile();
}
$('elapsed').addEventListener('input',renderDirector);
$('quality').addEventListener('change',renderQuality);
$('horse').addEventListener('change',renderProfile);
for(const id of ['day','slot'])$(id).addEventListener(id==='slot'?'change':'change',renderArchive);
renderDirector();renderQuality();renderArchive();
