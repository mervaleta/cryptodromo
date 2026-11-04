/**
 * Contextual broadcast submenus. Clicking ANY quick-access icon opens parameters
 * for that group as well as performing the main action.
 * Values are visual-only, retained while tuning CH1/CH2/CH3.
 */
const SCHEMAS=Object.freeze({
 camera:[
  ['camera-zoom','Óptica / FOV',18,90,1,50],
  ['camera-angle','Giro horizontal',-180,180,1,0],
  ['camera-pitch','Inclinación',-75,75,1,0],
  ['camera-height','Altura',-20,140,1,0],
  ['camera-distance','Distancia (%)',30,340,5,100],
  ['camera-lateral','Desplazamiento lateral',-90,90,1,0]
 ],
 weather:[
  ['rain-intensity','Intensidad de lluvia (%)',0,100,5,70],
  ['cloud-cover','Nubosidad (%)',0,100,5,52],
  ['fog-intensity','Niebla (%)',0,240,5,100]
 ],
 light:[
  ['light-dimmer','Potencia reflectores (%)',0,100,1,84],
  ['light-spread','Apertura del haz (°)',25,88,1,62],
  ['light-ambient','Luz ambiental (%)',0,200,5,100],
  ['light-color','Temperatura / color','color','#fff3d4']
 ],
 hour:[
  ['daytime','Hora solar (minutos)',0,1439,5,720],
  ['daytime-auto','Seguir reloj del estadio','checkbox',true]
 ],
 stage:[
  ['tv-scenery-crowd','Público y espectadores','checkbox',true],
  ['tv-scenery-trees','Arbolado exterior','checkbox',true],
  ['tv-scenery-splits','Mojones parciales','checkbox',true],
  ['tv-scenery-details','Escenografía detallada','checkbox',true]
 ],
 replay:[
  ['tv-replay-speed','Velocidad de cámara lenta','select',[
    ['0.25','0,25×'],['0.5','0,5×'],['1','1×']
  ],'0.5'],
  ['tv-replay-pre','Segundos previos al cruce',1,6,.2,3.6],
  ['tv-replay-hold','Pausa antes del acta (s)',0,5,.2,2.2]
 ]
});
const childId=id=>id.startsWith('tv-')?null:id;
export function createTvParameterMenus({frame,root}){
 if(!frame||!root)throw new TypeError('TV parameter panel missing');
 const title=root.querySelector('[data-panel-title]'),body=root.querySelector('[data-panel-body]');
 const saved=new Map(),meta=new Map();
 let current=null;
 const categoryFor=button=>button.hasAttribute('data-tv-shot')?'camera':
  button.hasAttribute('data-tv-stage')?'stage':
  button.hasAttribute('data-tv-replay-panel')?'replay':
  button.hasAttribute('data-tv-hour')?'hour':
  button.hasAttribute('data-tv-weather')||button.hasAttribute('data-tv-cloud')||
   button.hasAttribute('data-tv-fog')?'weather':
  button.hasAttribute('data-tv-light')?'light':null;
 function actual(id,fallback){
  if(saved.has(id))return saved.get(id);
  try{
   const input=frame.contentDocument?.getElementById(id);
   if(input)return input.type==='checkbox'?input.checked:input.value;
  }catch{}
  return fallback;
 }
 function send(type,settings){
  try{
   const win=frame.contentWindow;
   if(win&&frame.contentDocument?.getElementById('raceCanvas'))
    win.postMessage({type,settings},location.origin);
  }catch{}
 }
 function setInput(id,value){
  const doc=frame.contentDocument,el=doc?.getElementById(id);
  if(!el)return;
  if(el.type==='checkbox')el.checked=Boolean(value);
  else el.value=String(value);
  const EventClass=doc.defaultView.Event;
  el.dispatchEvent(new EventClass('input',{bubbles:true}));
  el.dispatchEvent(new EventClass('change',{bubbles:true}));
 }
 function apply(){
  let scenic={},replay={};
  for(const [id,value] of saved){
   if(id.startsWith('tv-scenery-'))scenic[id.slice(11)]=Boolean(value);
   else if(id.startsWith('tv-replay-'))replay[id.slice(10)]=value;
   else {
    try{setInput(id,value);}catch{}
   }
  }
  if(Object.keys(scenic).length)send('CRP_TV_SCENERY',scenic);
  if(Object.keys(replay).length)send('CRP_TV_REPLAY',replay);
 }
 function createField([id,label,...spec]){
  const outer=document.createElement('label');outer.className='tv-parameter-field';
  const span=document.createElement('span');span.textContent=label;outer.appendChild(span);
  const control=spec[0]==='checkbox'?document.createElement('input'):
    spec[0]==='select'?document.createElement('select'):document.createElement('input');
  control.id='director-'+id;control.dataset.parameter=id;
  if(spec[0]==='checkbox'){control.type='checkbox';control.checked=Boolean(actual(id,spec[1]));}
  else if(spec[0]==='select'){
   for(const [value,name] of spec[1]){
    const item=document.createElement('option');item.value=value;item.textContent=name;
    control.appendChild(item);
   }
   control.value=String(actual(id,spec[2]));
  }else if(spec[0]==='color'){
   control.type='color';control.value=String(actual(id,spec[1]));
  }else{
   const [min,max,step,fallback]=spec;
   control.type='range';control.min=String(min);control.max=String(max);control.step=String(step);
   control.value=String(actual(id,fallback));
  }
  const output=document.createElement('output');output.className='tv-parameter-value';
  const display=()=>{output.textContent=control.type==='checkbox'?(control.checked?'Sí':'No'):
    id==='daytime'?String(Math.floor(Number(control.value)/60)).padStart(2,'0')+':'+
      String(Math.round(Number(control.value)%60)).padStart(2,'0'):String(control.value);};
  display();
  control.addEventListener('input',()=>{
   saved.set(id,control.type==='checkbox'?control.checked:control.value);
   display();apply();
  });
  control.addEventListener('change',()=>{
   saved.set(id,control.type==='checkbox'?control.checked:control.value);
   display();apply();
  });
  outer.appendChild(control);outer.appendChild(output);
  return outer;
 }
 function openFor(button){
  const group=categoryFor(button);
  if(!group||!SCHEMAS[group])return;
  current=group;root.hidden=false;
  title.textContent=(button.getAttribute('title')||button.getAttribute('aria-label')||'Control')+
   ' · parámetros '+group;
  body.replaceChildren(...SCHEMAS[group].map(createField));
  root.dataset.category=group;
  root.querySelector('[data-panel-close]')?.focus({preventScroll:true});
 }
 function listener(event){
  const button=event.target.closest(
   '[data-tv-shot],[data-tv-stage],[data-tv-weather],[data-tv-cloud],[data-tv-fog],[data-tv-light],[data-tv-hour],[data-tv-replay-panel]'
  );
  if(button)openFor(button);
 }
 // The listener is on document so all existing quick-access buttons work.
 document.addEventListener('click',listener);
 root.querySelector('[data-panel-close]')?.addEventListener('click',()=>{
  root.hidden=true;current=null;
 });
 function dispose(){document.removeEventListener('click',listener);}
 return Object.freeze({apply,openFor,dispose,snapshot:()=>({
  open:!root.hidden,category:current,parameters:Object.fromEntries(saved)
 })});
}
