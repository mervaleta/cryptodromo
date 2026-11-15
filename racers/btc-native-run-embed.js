/**
 * BTC · original morph-target horse run cycle.
 * Source animation/model hosted by its author on Sketchfab.
 * Attribution: Amitesh Nandan, original model Tomasz Jurczyk,
 * textures Didac Ruiz, rig Carlos Contreras.
 * License in supplied GLB: CC BY-ND 4.0. The original 3D source is NOT modified.
 * A BTC-branded overlay sits outside the embedded original model.
 * This component is used for BTC only; all 99 other runners stay untouched.
 */
const MODEL_ID='8451f03cb1564436bfaa3964dd619a86';
const SOURCE_URL='https://sketchfab.com/3d-models/horse-run-cycle-on-place-'+MODEL_ID;

export function createBTCRunEmbed(canvas){
 const holder=canvas.parentElement;
 if(!holder)throw Error('Horse 3D container not found');
 holder.style.position='relative';
 const container=document.createElement('section');
 container.id='btc-original-run-embed';
 container.hidden=true;
 container.setAttribute('aria-label','Caballo BTC: carrera animada original de Amitesh Nandan');
 container.style.cssText='position:absolute;inset:0;z-index:3;overflow:hidden;background:#090e0c';
 const iframe=document.createElement('iframe');
 iframe.title='Horse Run Cycle On Place, modelo 3D animado original, Amitesh Nandan';
 iframe.loading='eager';
 iframe.allow='autoplay; fullscreen; xr-spatial-tracking';
 iframe.allowFullscreen=true;
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;border:0';
 iframe.src='https://sketchfab.com/models/'+MODEL_ID+'/embed'
   +'?autostart=1&animation_autoplay=1&ui_animations=1&ui_controls=1'
   +'&ui_watermark=1&ui_watermark_link=1&ui_infos=1&ui_theme=dark';
 container.append(iframe);

 const brand=document.createElement('div');
 brand.style.cssText='position:absolute;top:12px;left:12px;z-index:1;display:flex;gap:10px;align-items:center;padding:9px 12px;color:#fff;background:rgba(10,15,15,.88);border:1px solid #f7931a;border-radius:7px;box-shadow:0 4px 18px #0008;pointer-events:none;font:700 12px system-ui,sans-serif';
 const icon=document.createElement('img');
 icon.src='/assets/crypto-logos/btc.svg';icon.alt='';icon.style.cssText='height:31px;width:31px;object-fit:contain';
 const label=document.createElement('span');
 label.textContent='BITCOIN · BTC';
 brand.append(icon,label);
 container.append(brand);
 const info=document.createElement('div');
 info.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:1;background:rgba(7,14,11,.94);color:#dce7d7;padding:6px 10px;font:11px/1.4 system-ui,sans-serif';
 info.append(document.createTextNode('RUN NATIVO · Amitesh Nandan · CC BY-ND 4.0 · '));
 const attribution=document.createElement('a');
 attribution.href=SOURCE_URL;attribution.target='_blank';attribution.rel='noopener noreferrer';
 attribution.style.color='#fdb15a';attribution.textContent='Ver modelo original';
 info.append(attribution);
 info.append(document.createTextNode(' · '));
 const licence=document.createElement('a');
 licence.href='/licences/';licence.style.color='#fdb15a';licence.textContent='Licencias';
 info.append(licence);
 container.append(info);
 holder.append(container);

 let visible=false;
 return {
  show(){
   visible=true;container.hidden=false;
   canvas.hidden=true;canvas.setAttribute('aria-hidden','true');
   const motion=document.getElementById('motion');
   if(motion)motion.hidden=true;
   const state=document.getElementById('preview-state');
   if(state)state.textContent='BTC · CARRERA NATIVA · 12 POSES';
  },
  hide(){
   visible=false;container.hidden=true;
   canvas.hidden=false;canvas.removeAttribute('aria-hidden');
   const motion=document.getElementById('motion');
   if(motion)motion.hidden=false;
  },
  get active(){return visible;},
  snapshot(){return {active:visible,modelId:MODEL_ID,animation:'native-morph-run',source:'sketchfab',license:'CC-BY-ND-4.0',originalAsset:true,gallopRetarget:false};},
  dispose(){
   container.remove();canvas.hidden=false;canvas.removeAttribute('aria-hidden');
  }
 };
}
