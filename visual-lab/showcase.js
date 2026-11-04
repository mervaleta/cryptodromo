/**
 * Opt-in showcase launcher. Uses the existing manual replay controller:
 * no fixture, price, result, WebGL or live-schedule mutations.
 */
export function showcaseEnabled(search=''){
 return new URLSearchParams(search).get('showcase')==='1';
}
export function installShowcase({doc=document,search=location.search}={}){
 if(!showcaseEnabled(search))return null;
 const host=doc.querySelector('#panel-race');
 if(!host)return null;
 const wrapper=doc.createElement('div');
 wrapper.id='crp-showcase';wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Demostración guiada');
 wrapper.innerHTML='<div class="crp-showcase-title">✦ DEMOSTRACIÓN CRYPTÓDROMO</div><p>Una carrera completa con cotizaciones sintéticas reproducibles. No representa precios reales ni habilita apuestas.</p><button type="button" id="crp-showcase-launch" class="primary">▶ VER CARRERA DEMO</button><span id="crp-showcase-state" role="status" aria-live="polite">Esperando a los 12 corredores…</span>';
 host.prepend(wrapper);
 const launch=wrapper.querySelector('#crp-showcase-launch');
 const state=wrapper.querySelector('#crp-showcase-state');
 let started=false;
 function ready(){const start=doc.querySelector('#start');return !!start&&!start.disabled;}
 function refresh(){if(!started){launch.disabled=!ready();state.textContent=ready()?'Lista para comenzar · 12 corredores':'Preparando escena 3D y caballos…';}}
 refresh();
 const observer=new MutationObserver(refresh);
 const start=doc.querySelector('#start');
 if(start)observer.observe(start,{attributes:true,attributeFilter:['disabled']});
 const timeout=setTimeout(()=>{if(!ready()&&!started)state.textContent='La escena está tardando en cargar. Esperá a que estén listos los caballos.';},45000);
 launch.addEventListener('click',()=>{
  if(started||!ready())return;
  const replay=doc.querySelector('#replay-mode');
  const auto=doc.querySelector('#automatic-label');
  // Manual mode is required for a deterministic, uninterrupted 60-second replay.
  if(auto&&!auto.hidden&&replay)replay.click();
  const reset=doc.querySelector('#reset');
  if(reset&&!reset.hidden)reset.click();
  const button=doc.querySelector('#start');
  if(!button||button.disabled){state.textContent='No se pudo iniciar el replay. Usá los controles manuales.';return;}
  button.click();
  started=true;launch.disabled=true;
  state.textContent='Carrera en curso · los resultados aparecen al cruzar la meta.';
  observer.disconnect();clearTimeout(timeout);
 });
 return {element:wrapper,dispose(){observer.disconnect();clearTimeout(timeout);wrapper.remove();}};
}
