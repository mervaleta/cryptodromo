/* CRP visual cockpit, opt-in: mountVisualCockpit({container,lighting,camera,horses}).
 * Existing engine controls remain intact. No localStorage or hidden network calls.
 */
const TABS=[
 {id:'light',label:'☀ Luces'},
 {id:'camera',label:'◎ Cámara'},
 {id:'horses',label:'♞ Caballos'},
 {id:'performance',label:'⚙ Rendimiento'}
];
const $=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
export function mountVisualCockpit({container,lighting,camera,horses,environment,performance}={}){
 if(!container)throw Error('Cockpit container is required');
 const root=$('section','crp-cockpit');root.setAttribute('aria-label','Configuración visual');
 const tabs=$('div','crp-cockpit__tabs');tabs.setAttribute('role','tablist');
 const panel=$('div','crp-cockpit__panel');panel.setAttribute('role','tabpanel');
 const status=$('p','crp-cockpit__status','Los cambios afectan únicamente a la presentación visual.');
 root.append(tabs,panel,status);container.append(root);
 let selected='light';
 function change(id){selected=id;for(const b of tabs.children){const on=b.dataset.tab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1}panel.replaceChildren();render(id)}
 const makeRange=(label,min,max,step,value,fn)=>{
  const box=$('label','crp-cockpit__field');box.append($('span','',label));
  const input=$('input');input.type='range';Object.assign(input,{min,max,step,value});const out=$('output','',String(value));input.addEventListener('input',()=>{out.textContent=input.value;fn(Number(input.value))});
  box.append(input,out);panel.append(box);
 };
 const makeSelect=(label,options,value,fn)=>{
  const box=$('label','crp-cockpit__field');box.append($('span','',label));const select=$('select');
  for(const [v,title] of options){const opt=$('option','',title);opt.value=v;select.append(opt)}select.value=value;select.addEventListener('change',()=>fn(select.value));box.append(select);panel.append(box);
 };
 const button=(label,fn)=>{const b=$('button','crp-cockpit__quick',label);b.type='button';b.addEventListener('click',fn);panel.append(b)};
 function render(id){
  if(id==='light'){
   if(!lighting){panel.append($('p','','Conectá el módulo de iluminación para activar estos ajustes.'));return}
   const s=lighting.settings;
   makeRange('Intensidad',0,2.5,.05,s.intensity,v=>lighting.apply({intensity:v}));
   makeRange('Difuminado / halo',0,2,.05,s.glow,v=>lighting.apply({glow:v}));
   makeRange('Dispersión',.4,2.5,.05,s.spread,v=>lighting.apply({spread:v}));
   makeRange('Temperatura (K)',2400,7500,100,s.temperature,v=>lighting.apply({temperature:v}));
   if(environment){makeRange('Exposición',.6,1.6,.05,environment.settings.exposure,v=>environment.setExposure(v));makeRange('Niebla',.2,2.5,.1,environment.settings.fog,v=>environment.setFog(v));}
   button(s.night?'☀ Modo día':'☾ Modo noche',()=>{lighting.apply({night:!lighting.settings.night});change('light')});
  }else if(id==='camera'){
   if(!camera){panel.append($('p','','Conectá el módulo de cámara para activar estos ajustes.'));return}
   const s=camera.get();
   if(camera.getMode&&camera.setMode)makeSelect('Modo de cámara',[['free','Vuelo libre'],['orbit','Órbita'],['follow','Seguir caballo'],['crane','Grúa']],camera.getMode(),v=>camera.setMode(v));
   makeSelect('Botón para orientar',[[2,'Derecho'],[0,'Izquierdo']].map(([a,b])=>[String(a),b]),String(s.lookButton),v=>camera.setLookButton(Number(v)));
   makeRange('Sensibilidad',.001,.012,.0005,s.sensitivity,v=>camera.setSensitivity(v));
   button(s.invertY?'Invertir Y: activado':'Invertir Y: desactivado',()=>{camera.setInvertY(!camera.get().invertY);change('camera')});
  }else if(id==='horses'){
   if(!horses){panel.append($('p','','Conectá el acabado PBR para activar estos ajustes.'));return}
   makeSelect('Calidad', [['performance','Rendimiento'],['balanced','Equilibrada'],['cinematic','Cinematográfica']],horses.settings.quality,v=>horses.setQuality(v));
   makeRange('Acabado del pelaje',0,1,.05,horses.settings.finish,v=>horses.setFinish(v));
   makeRange('Humedad',0,1,.05,horses.settings.wetness,v=>horses.setWetness(v));
   if(horses.setWind)makeRange('Viento en crines',0,2,.1,horses.settings.wind,v=>horses.setWind(v));
  }else{
   panel.append($('p','','La calidad reduce sombras y halos. Los cambios se aplican a la escena.'));
   if(performance)makeSelect('Perfil de rendimiento',[['eco','Económica'],['balanced','Equilibrada'],['cinematic','Cinematográfica']],performance.getQuality(),v=>performance.setQuality(v));
   if(lighting)panel.append($('p','','Halos disponibles: '+lighting.fixtureCount));
  }
 }
 for(const t of TABS){
  const b=$('button','crp-cockpit__tab',t.label);b.type='button';b.dataset.tab=t.id;b.setAttribute('role','tab');b.addEventListener('click',()=>change(t.id));
  b.addEventListener('keydown',e=>{const a=[...tabs.children],i=a.indexOf(b);if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const n=a[(i+(e.key==='ArrowRight'?1:-1)+a.length)%a.length];n.focus();change(n.dataset.tab)}});
  tabs.append(b);
 }
 change(selected);
 return {element:root,select:change,dispose(){root.remove()}};
}
