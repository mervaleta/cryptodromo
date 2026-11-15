/**
 * BTC horse motion source, 15 November 2026.
 * Original Sketchfab previews only: do not alter CC BY-ND meshes, morphs,
 * textures, animation clips or geometry. External Bitcoin brand shell is our
 * own UI and independent of the original model.
 */
export const BTC_CYCLE_BUILD='btc-native-run-cycle-20261115-v1';
export const CYCLES=Object.freeze({
 run:{uid:'8451f03cb1564436bfaa3964dd619a86',label:'Carrera',title:'Horse Run Cycle On Place'},
 trot:{uid:'7e24b8c46d284b519d416035e6445903',label:'Trote',title:'Horse Trot'},
 walk:{uid:'93b53ddcec414592842753d1819f3133',label:'Paso',title:'Horse Walk'}
});
const safeHex=(v,f)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
export function createBTCCyclePreview(canvas){
 const container=canvas.parentElement;
 if(!container)throw new Error('BTC horse-view container missing');
 container.style.position='relative';
 const layer=document.createElement('section');
 layer.id='btc-native-cycle';
 layer.setAttribute('aria-label','Caballo BTC con ciclos de carrera originales');
 layer.hidden=true;
 layer.style.cssText='position:absolute;inset:0;z-index:5;overflow:hidden;background:#111816';
 const viewer=document.createElement('iframe');
 viewer.title='Animación 3D original del caballo, por Amitesh Nandan';
 viewer.allow='autoplay; fullscreen; xr-spatial-tracking';
 viewer.allowFullscreen=true;
 viewer.referrerPolicy='strict-origin-when-cross-origin';
 viewer.loading='eager';
 viewer.style.cssText='border:0;width:100%;height:100%;display:block';
 layer.append(viewer);
 const header=document.createElement('div');
 header.style.cssText='position:absolute;top:9px;left:9px;right:9px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;pointer-events:none';
 const identity=document.createElement('div');
 identity.style.cssText='display:flex;align-items:center;gap:9px;border:1px solid #f7931a;background:rgba(11,16,14,.91);border-radius:8px;padding:7px 10px;color:#fff;box-shadow:0 3px 16px #0009;font:700 12px/1.1 system-ui,sans-serif';
 const icon=document.createElement('img');
 icon.src='/assets/crypto-logos/btc.svg';icon.alt='';
 icon.width=30;icon.height=30;
 const label=document.createElement('span');
 label.textContent='BITCOIN';
 const detail=document.createElement('small');
 detail.textContent='BTC · #F7931A';
 detail.style.cssText='display:block;font-size:9px;color:#f7bc73;margin-top:3px;letter-spacing:.12em';
 label.append(detail);
 identity.append(icon,label);
 const modes=document.createElement('div');
 modes.style.cssText='display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;pointer-events:auto';
 const buttons={};
 let mode='run',active=false;
 const attribution=document.createElement('div');
 attribution.style.cssText='position:absolute;left:0;right:0;bottom:0;z-index:3;padding:6px 12px;background:rgba(7,16,11,.94);font:10px/1.35 system-ui,sans-serif;color:#e7e8db;display:flex;gap:7px;flex-wrap:wrap';
 const author=document.createElement('span');
 author.textContent='Animación: Amitesh Nandan · Modelo: Tomasz Jurczyk · Texturas: Didac Ruiz · Rig: Carlos Contreras';
 const lic=document.createElement('a');
 lic.href='/licences/';lic.textContent='CC BY-ND 4.0 / créditos';lic.style.color='#f7931a';
 attribution.append(author,lic);
 const frame=document.createElement('div');
 frame.style.cssText='position:absolute;inset:0;border:2px solid #f7931a44;pointer-events:none';
 function open(modeName){
  if(!CYCLES[modeName])return;
  const newMode=modeName;
  if(mode===newMode&&viewer.src)return;
  mode=newMode;
  for(const [name,btn] of Object.entries(buttons)){
   const selected=name===mode;
   btn.setAttribute('aria-pressed',String(selected));
   btn.style.background=selected?'#f7931a':'rgba(8,14,12,.94)';
   btn.style.color=selected?'#12160e':'#f1f3e8';
  }
  const item=CYCLES[mode];
  viewer.title=item.title+' · 3D original de Amitesh Nandan';
  // These are canonical author's embeds, NOT edited GLBs.
  viewer.src='https://sketchfab.com/models/'+item.uid+
   '/embed?autostart=1&animation_autoplay=1&ui_animations=1&ui_controls=1&ui_watermark=1&ui_watermark_link=1&ui_help=0&ui_theme=dark';
 }
 for(const [name,cycle] of Object.entries(CYCLES)){
  const b=document.createElement('button');b.type='button';
  b.textContent=cycle.label;
  b.setAttribute('aria-label','Animación '+cycle.label);
  b.style.cssText='padding:8px 10px;border:1px solid #e6ae67;border-radius:5px;background:rgba(8,14,12,.94);color:white;cursor:pointer;font:700 11px system-ui,sans-serif';
  b.addEventListener('click',()=>open(name));
  buttons[name]=b;modes.append(b);
 }
 header.append(identity,modes);
 layer.append(frame,header,attribution);
 container.append(layer);
 function show(token){
  active=true;layer.hidden=false;
  const tint=safeHex(token?.color,'#f7931a');
  identity.style.borderColor=tint;
  frame.style.borderColor=tint+'66';
  lic.style.color=tint;
  canvas.style.visibility='hidden';canvas.setAttribute('aria-hidden','true');
  const motion=document.querySelector('#motion');
  if(motion)motion.hidden=true;
  const status=document.querySelector('#preview-state');
  if(status)status.textContent='BTC · CARRERA ORIGINAL 3D · RUN / TROT / WALK';
  if(!viewer.src)open('run');
 }
 function hide(){
  active=false;layer.hidden=true;
  canvas.style.visibility='visible';canvas.removeAttribute('aria-hidden');
  const motion=document.querySelector('#motion');
  if(motion)motion.hidden=false;
 }
 return {
  show,hide,get active(){return active;},
  snapshot(){return {ready:active,mode,version:BTC_CYCLE_BUILD,source:CYCLES[mode].uid,author:'Amitesh Nandan',originalMorphCycle:true,modelEdited:false};},
  dispose(){viewer.src='about:blank';layer.remove();canvas.style.visibility='visible';canvas.removeAttribute('aria-hidden');}
 };
}
