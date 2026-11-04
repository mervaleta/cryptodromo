import {getTripleRaceFixture,TRIPLE_RACES_PER_DAY} from '/race-lab/source/src/data/tripleRaceFixture.js?v=alpha19-live-1';
import {createOfficialRace,officialRanking} from '/race-lab/source/src/data/officialRace.js?v=crp-20261102';
import {TRACK_DEFS} from '/visual-lab/tripleLiveSchedule.js?v=alpha19-live-1';

const $=id=>document.getElementById(id);
const controls=$('archive-controls'),day=$('archive-day'),track=$('archive-track');
const search=$('archive-search'),tbody=$('archive-results'),count=$('archive-count');
const prev=$('archive-prev'),next=$('archive-next');
const params=new URLSearchParams(location.search);
const trackNames=Object.fromEntries(TRACK_DEFS.map(t=>[t.id,t.name]));
const validTrack=TRACK_DEFS.some(t=>t.id===params.get('track'));
for(let i=0;i<7;i++){
 const option=document.createElement('option');
 option.value=String(i);option.textContent='Día sintético '+(i+1)+' de 7';
 day.append(option);
}
const userDay=Number(params.get('day'));
day.value=params.has('day')&&Number.isInteger(userDay)&&userDay>=0&&userDay<7?String(userDay):'0';
track.value=validTrack?params.get('track'):'all';
search.value=/^[\w-]{1,12}$/.test(params.get('q')||'')?params.get('q'):'';

let page=0,filtered=[],currentDay=0;
const perPage=24;
const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=String(text??'');return e};
const textTime=minute=>{
 const h=Math.floor(minute/60),m=minute%60;
 return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':30';
};
function filter(){
 const d=Number(day.value),key=search.value.trim().toUpperCase(),selected=track.value;
 const result=[];
 for(let minute=0;minute<TRIPLE_RACES_PER_DAY;minute++){
   const t=TRACK_DEFS[minute%3];
   if(selected!=='all'&&selected!==t.id)continue;
   const race=getTripleRaceFixture(minute,d);
   if(key&&!race.entries.some(entry=>entry.symbol.includes(key)||entry.name.toUpperCase().includes(key)))continue;
   result.push({minute,trackId:t.id});
 }
 currentDay=d;filtered=result;page=0;
 const url=new URL(location.href);url.searchParams.set('day',String(d));
 if(selected!=='all')url.searchParams.set('track',selected);else url.searchParams.delete('track');
 if(key)url.searchParams.set('q',key);else url.searchParams.delete('q');
 history.replaceState(null,'',url.pathname+url.search);
 render();
}
function render(){
 const max=Math.max(0,Math.ceil(filtered.length/perPage)-1);
 page=Math.min(max,Math.max(0,page));
 const slice=filtered.slice(page*perPage,(page+1)*perPage);
 const rows=slice.map(({minute,trackId})=>{
   const race=getTripleRaceFixture(minute,currentDay);
   const ranking=officialRanking(createOfficialRace(race.entries));
   const tr=document.createElement('tr');
   for(const content of [textTime(minute),trackNames[trackId],
      'Nº '+String(minute+1).padStart(4,'0'),ranking[0]?.entry.symbol||'—',
      race.entries.map(e=>e.symbol).join(' · ')])tr.append(make('td',content));
   tr.children[3].style.color='#a5f3c1';tr.children[3].style.fontWeight='850';
   const action=document.createElement('td'),link=document.createElement('a');
   link.textContent='Ver repetición en TV →';
   link.href='/stadiums/crypto/live/?track='+encodeURIComponent(trackId)+
     '&replayDay='+currentDay+'&replayMinute='+minute+'#tv-station';
   action.append(link);tr.append(action);return tr;
 });
 tbody.replaceChildren(...(rows.length?rows:[(()=>{
   const row=document.createElement('tr'),cell=make('td','Sin carreras con esos filtros.');
   cell.colSpan=6;row.append(cell);return row;
 })()]));
 count.textContent=filtered.length.toLocaleString('es-AR')+' carreras en el filtro · Página '+(page+1)+' de '+(max+1);
 prev.disabled=page===0;next.disabled=page===max;
}
controls.addEventListener('submit',e=>{e.preventDefault();filter()});
day.addEventListener('change',filter);
track.addEventListener('change',filter);
prev.addEventListener('click',()=>{page--;render()});
next.addEventListener('click',()=>{page++;render()});
filter();
