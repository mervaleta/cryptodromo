import {listClubs,clubSportsProfile,normalizeFanPreferences,chooseMainClub,togglePinnedClub,FAN_PREF_KEY} from '../sports/fanClubs.js';
import {liveSlot} from '../visual-lab/liveSchedule.js';
const $=id=>document.getElementById(id);
const clubs=listClubs(),lookup=new Map(clubs.map(c=>[c.symbol,c]));
const now=liveSlot(),cutoff=Math.max(-1,now.index-(now.slotSeconds>=60?0:1));
let state=normalizeFanPreferences(null),selected='BTC';
try{state=normalizeFanPreferences(JSON.parse(localStorage.getItem(FAN_PREF_KEY)||'null'));}catch{}
const persist=()=>{
 try{localStorage.setItem(FAN_PREF_KEY,JSON.stringify(state));return true;}
 catch{return false;}
};
const make=(tag,text,cls)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=text;
 if(cls)node.className=cls;
 return node;
};
function status(message){$('notice').textContent=message;}
function listItems(target,lines,empty){
 target.replaceChildren();
 if(!lines.length){target.append(make('li',empty));return;}
 for(const line of lines){
  const li=make('li',line);
  target.append(li);
 }
}
function renderRoster(){
 const q=$('club-search').value.trim().toLocaleLowerCase('es');
 const visible=clubs.filter(c=>(c.symbol+' '+c.assetName+' '+c.name).toLocaleLowerCase('es').includes(q));
 $('club-count').textContent=visible.length+' de '+clubs.length+' clubes';
 const nodes=visible.map(c=>{
  const b=make('button',undefined,'club-card');
  b.type='button';b.dataset.symbol=c.symbol;b.setAttribute('aria-pressed',String(c.symbol===selected));
  b.setAttribute('aria-label','Mostrar tribuna '+c.name);
  const swatch=make('i');swatch.style.background=c.color;
  const label=make('span'),title=make('strong',c.symbol),detail=make('small',c.assetName);
  label.append(title,detail);b.append(swatch,label);
  b.addEventListener('click',()=>{selected=c.symbol;render();});
  return b;
 });
 $('club-roster').replaceChildren(...nodes);
}
function renderLocal(){
 const my=state.mainClub;
 $('my-club').textContent=my?'Mi club principal: '+my+' · '+lookup.get(my).assetName:'Todavía no elegiste club.';
 $('pinned-list').replaceChildren(...state.pinned.map(symbol=>{
  const b=make('button',symbol+' · '+lookup.get(symbol).assetName,'pill');
  b.type='button';b.addEventListener('click',()=>{selected=symbol;render();});
  return b;
 }));
 $('make-primary').textContent=state.mainClub===selected?'✓ Mi club principal':'Elegir mi club';
 $('pin-club').textContent=state.pinned.includes(selected)?'Quitar de favoritos':'Fijar favorito';
 $('clear-main').disabled=!state.mainClub;
}
function render(){
 const club=lookup.get(selected),record=clubSportsProfile(selected,cutoff);
 const {sporting,upcoming,rivalries}=record;
 const color=make('span',undefined,'swatch');color.style.background=club.color;
 const title=make('div'),name=make('strong',club.name),desc=make('small',club.assetName+' · '+club.tier);
 title.append(name,desc);$('club-identity').replaceChildren(color,title);
 $('club-horse').href='/racers/#'+encodeURIComponent(selected);
 $('club-metrics').replaceChildren(...[
  ['Carreras GP',sporting.starts],['Victorias',sporting.wins],['Podios',sporting.podiums],['Puntos',sporting.points]
 ].map(([label,value])=>{
  const node=make('div'),b=make('b',String(value)),s=make('span',label);
  node.append(b,s);return node;
 }));
 $('club-form').replaceChildren(...(sporting.recentForm.length?sporting.recentForm.map(place=>make('span',place+'°','place')):[make('span','Todavía sin carreras GP terminadas','muted')]));
 listItems($('club-trophies'),sporting.trophies.map(t=>'🏆 '+t.name+' · jornada '+t.day),'Todavía no obtuvo un título en este corte.');
 listItems($('club-next'),upcoming.slice(0,6).map(e=>e.name+' · jornada '+(e.dayIndex+1)+' · '+e.time+' AR'),'Sin Grandes Premios pendientes en el ciclo actual.');
 listItems($('club-rivals'),rivalries.map(r=>{
  const opponent=r.first===selected?r.second:r.first;
  return 'Contra '+opponent+' · '+r.meetings+' duelos · '+(r.first===selected?r.firstAhead:r.secondAhead)+' por delante';
 }),'Sin rivalidades repetidas todavía.');
 renderRoster();renderLocal();
}
$('club-search').addEventListener('input',renderRoster);
$('make-primary').addEventListener('click',()=>{
 state=chooseMainClub(state,selected);
 status(persist()?'Preferencia guardada solamente en este navegador.':'Almacenamiento deshabilitado; la elección no se conservó.');
 render();
});
$('pin-club').addEventListener('click',()=>{
 try{
  state=togglePinnedClub(state,selected);
  status(persist()?'Lista de tribunas guardada localmente.':'No se pudo guardar en este navegador.');
 }catch(error){status('Podés fijar hasta cinco clubes. Quitá uno antes de agregar otro.');}
 render();
});
$('clear-main').addEventListener('click',()=>{
 state=chooseMainClub(state,null);
 status(persist()?'Dejaste el club principal.':'Cambio local; no se pudo guardar.');
 render();
});
$('export-local').addEventListener('click',()=>{
 const file=new Blob([JSON.stringify({exportedBy:'cryptodromo-demo-local',...state},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),a=make('a');
 a.href=url;a.download='cryptodromo-mis-clubes.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('Preferencias exportadas. No contienen datos de cuenta.');
});
const deepLink=new URLSearchParams(location.search).get('symbol')?.toUpperCase();
if(lookup.has(deepLink))selected=deepLink;
render();
