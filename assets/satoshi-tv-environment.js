/**
 * Environment remote for the embedded SAME-ORIGIN 3D race scene.
 * Every action targets an existing visual control. It never accesses price,
 * official ranking, race fixtures, horse physics or the broadcast clock.
 */
export function createTvEnvironmentDeck({frame,root,onShot}={}){
 if(!frame||!root||typeof onShot!=='function')throw new TypeError('TV environment deck missing');
 const state={
  weather:'auto',hour:'auto',lights:true,dimmer:84,pattern:'steady',
  perimeter:true,color:'#fff3d4',cloud:52,fog:100
 };
 const touched=new Set();
 const status=root.querySelector('#tv-env-status');
 const buttonGroups={
  weather:[...root.querySelectorAll('[data-tv-weather]')],
  hour:[...root.querySelectorAll('[data-tv-hour]')],
  light:[...root.querySelectorAll('[data-tv-light]')],
  fog:[...root.querySelectorAll('[data-tv-fog]')]
 };
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)));
 const labelMap={auto:'Automático',noon:'Sol',golden:'Atardecer',night:'Noche',rain:'Lluvia'};
 function getDocument(){
  try{
   const doc=frame.contentDocument;
   return doc?.querySelector('#raceCanvas')&&doc?.querySelector('#weather')?doc:null;
  }catch{return null;}
 }
 function change(doc,id,value){
  const input=doc.getElementById(id);
  if(!input)return false;
  if(input.type==='checkbox')input.checked=Boolean(value);
  else if(input.value!==String(value))input.value=String(value);
  const EventClass=doc.defaultView.Event;
  input.dispatchEvent(new EventClass('input',{bubbles:true}));
  input.dispatchEvent(new EventClass('change',{bubbles:true}));
  return true;
 }
 function redraw(){
  for(const button of buttonGroups.weather)
   button.setAttribute('aria-pressed',String(button.dataset.tvWeather===state.weather));
  for(const button of buttonGroups.hour)
   button.setAttribute('aria-pressed',String(button.dataset.tvHour===state.hour));
  for(const button of buttonGroups.light){
   const action=button.dataset.tvLight;
   if(['power','perimeter','steady','pulse'].includes(action))
    button.setAttribute('aria-pressed',String(action==='power'?state.lights:
     action==='perimeter'?state.perimeter:state.pattern===action));
  }
  buttonGroups.fog.forEach(button=>
   button.setAttribute('aria-pressed',String(state.fog>100)));
  if(status)status.textContent='Clima '+labelMap[state.weather]+' · Hora '+
   (state.hour==='auto'?'automática':String(Math.floor(Number(state.hour)/60)).padStart(2,'0')+':'+String(Number(state.hour)%60).padStart(2,'0'))+
   ' · Reflectores '+(state.lights?state.dimmer+'%':'apagados');
 }
 function apply(){
  const doc=getDocument();
  if(!doc)return false;
  // Preserve the real manual/automatic solar source in the existing engine.
  if(touched.has('weather'))change(doc,'weather',state.weather);
  if(touched.has('hour')){
   change(doc,'weather','auto');
   change(doc,'daytime-auto',state.hour==='auto');
   if(state.hour!=='auto')change(doc,'daytime',state.hour);
   if(touched.has('weather')&&state.weather!=='auto')change(doc,'weather',state.weather);
  }
  if(touched.has('light-power'))change(doc,'light-power',state.lights);
  if(touched.has('light-dimmer'))change(doc,'light-dimmer',state.dimmer);
  if(touched.has('light-pattern'))change(doc,'light-pattern',state.pattern);
  if(touched.has('light-perimeter'))change(doc,'light-perimeter',state.perimeter);
  if(touched.has('light-color'))change(doc,'light-color',state.color);
  if(touched.has('cloud'))change(doc,'cloud-cover',state.cloud);
  if(touched.has('fog'))change(doc,'fog-intensity',state.fog);
  return true;
 }
 const buttons=[...root.querySelectorAll('[data-tv-weather],[data-tv-hour],[data-tv-light],[data-tv-cloud],[data-tv-fog],[data-tv-stage]')];
 function handleClick(event){
  const button=event.currentTarget;
  if(button.hasAttribute('data-tv-stage')){
   onShot(button.dataset.tvStage);return;
  }
  if(button.hasAttribute('data-tv-weather')){
   state.weather=button.dataset.tvWeather;
   touched.add('weather');
  }else if(button.hasAttribute('data-tv-hour')){
   state.hour=button.dataset.tvHour;
   state.weather='auto';
   touched.add('hour');touched.add('weather');
  }else if(button.hasAttribute('data-tv-cloud')){
   state.cloud=clamp(Math.round((state.cloud+(button.dataset.tvCloud==='up'?20:-20))/5)*5,0,100);
   touched.add('cloud');
  }else if(button.hasAttribute('data-tv-fog')){
   state.fog=state.fog>100?100:220;touched.add('fog');
  }else if(button.hasAttribute('data-tv-light')){
   const action=button.dataset.tvLight;
   if(action==='power'){state.lights=!state.lights;touched.add('light-power');}
   else if(action==='up'||action==='down'){
    state.dimmer=clamp(state.dimmer+(action==='up'?15:-15),0,100);
    state.lights=true;touched.add('light-dimmer');touched.add('light-power');
   }else if(action==='steady'||action==='pulse'){
    state.pattern=action;touched.add('light-pattern');
   }else if(action==='perimeter'){
    state.perimeter=!state.perimeter;touched.add('light-perimeter');
   }else if(action==='warm'||action==='cool'){
    state.color=action==='warm'?'#fff3d4':'#a4d5ff';touched.add('light-color');
   }
  }
  redraw();apply();
 }
 for(const button of buttons)button.addEventListener('click',handleClick);
 function setTrack(id){
  const link=root.querySelector('[data-tv-stadium-link]');
  if(link&&['muybridge','genesis','vint-cerf'].includes(id))
   link.href='/estadio/?venue=crypto&course='+encodeURIComponent(id);
 }
 function dispose(){for(const button of buttons)button.removeEventListener('click',handleClick);}
 redraw();
 return Object.freeze({
  apply,setTrack,dispose,
  snapshot:()=>Object.freeze({...state,ready:!!getDocument(),touched:[...touched]})
 });
}
