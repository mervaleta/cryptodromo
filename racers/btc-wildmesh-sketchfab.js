/**
 * BTC WildMesh profile adapter (Sketchfab original, noncommercial).
 * Uses the project token palette and the Sketchfab Viewer API to tint the
 * AUTHOR'S materials, retaining their PBR textures, lighting and rig.
 * The uploaded retargeted Gallop .glb is a distinct, not-yet-hosted asset.
 * Other 99 horses never use this file. Credits and CC BY-NC: /licences/.
 */
const MODEL_ID='65d6a70a6721495f938c93e80a5998e4';
const VIEWER_API='https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
const DEFAULT_PALETTE={
  accent:'#f7931a', coat:'#55352c', mane:'#342922',tail:'#342922',hoof:'#25201f'
};
let sdkPromise;
function loadSDK(){
 if(typeof window.Sketchfab==='function')return Promise.resolve(window.Sketchfab);
 if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=VIEWER_API;script.async=true;
  script.onload=()=>typeof window.Sketchfab==='function'
   ?resolve(window.Sketchfab):reject(new Error('Sketchfab Viewer SDK unavailable'));
  script.onerror=()=>reject(new Error('Sketchfab Viewer SDK network error'));
  document.head.append(script);
 }).catch(err=>{sdkPromise=null;throw err});
 return sdkPromise;
}
function safeColor(value,fallback){
 return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
}
function rgb(hex){
 const n=parseInt(hex.slice(1),16);
 return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];
}
function mixToWhite(color,factor){
 return rgb(color).map(v=>Math.min(1,Math.max(0,1-(1-v)*factor)));
}
function appearance(token){
 const p=token?.mayaAppearance||{};
 return {
  symbol:'BTC',
  accent:safeColor(token?.color,DEFAULT_PALETTE.accent),
  coat:safeColor(p.coatColor||token?.coat,DEFAULT_PALETTE.coat),
  mane:safeColor(p.maneColor,DEFAULT_PALETTE.mane),
  tail:safeColor(p.tailColor||p.maneColor,DEFAULT_PALETTE.tail),
  hoof:safeColor(p.hoofColor,DEFAULT_PALETTE.hoof)
 };
}
function tintMaterials(api,colors,qa){
 if(typeof api.getMaterialList!=='function')return;
 api.getMaterialList((error,materials)=>{
  if(error||!Array.isArray(materials)){
   qa.state='material-list-unavailable';
   return;
  }
  qa.found=materials.map(m=>m.name);
  const candidates={
   M_Body:mixToWhite(colors.coat,.20),   // preserve original photorealistic coat texture
   M_Eye:[1,1,1],                        // don't dye eyes
   M_Hair:mixToWhite(colors.mane,.32),
   M_Saddle1:mixToWhite(colors.accent,.98), // Bitcoin-orange racing tack
   M_Saddle2:mixToWhite(colors.accent,.98)
  };
  let changed=0;
  for(const material of materials){
   const key=Object.keys(candidates).find(name=>
    material.name===name||material.name?.startsWith(name+'.')||
    material.name?.startsWith(name+'_'));
   if(!key)continue;
   const channel=material.channels;
   if(!channel)continue;
   const value=candidates[key];
   let didSet=false;
   for(const name of ['AlbedoPBR','DiffusePBR','DiffuseColor']){
    if(!channel[name])continue;
    // Never replace baked texture, normal map, rig or geometry.
    channel[name].color=[...value];
    didSet=true;
   }
   if(!didSet)continue;
   try{
    api.setMaterial(material,()=>{
     changed++;
     qa.updated=changed;
     qa.state='applied';
    });
   }catch(e){qa.state='update-error';}
  }
  if(!changed&&qa.state!=='applied')qa.state='material-updates-requested';
 });
}

export function createWildMeshSketchfabFallback(canvas){
 const container=canvas.parentElement;
 if(!container)throw Error('BTC preview container missing');
 container.style.position='relative';
 const layer=document.createElement('div');
 layer.id='btc-wildmesh-source-embed';
 layer.hidden=true;
 layer.style.cssText='position:absolute;inset:0;z-index:3;background:#0c1512;overflow:hidden';
 const iframe=document.createElement('iframe');
 iframe.title='Caballo realista WildMesh 3D · versión Bitcoin, modelo del autor';
 iframe.loading='eager';
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.allow='autoplay; fullscreen; xr-spatial-tracking';
 iframe.allowFullscreen=true;
 iframe.style.cssText='display:block;width:100%;height:100%;border:0';
 layer.append(iframe);

 // The native model receives the actual Bitcoin palette through Sketchfab API.
 // This supplemental race identity uses the SAME values from tokenRoster/editor.
 const heading=document.createElement('div');
 heading.style.cssText='position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:10px;padding:9px 13px;background:rgba(9,16,17,.86);border:1px solid rgba(247,147,26,.75);border-radius:7px;color:#fff;box-shadow:0 3px 22px #0008;pointer-events:none;font:700 12px system-ui,sans-serif';
 const logo=document.createElement('img');
 logo.src='/assets/crypto-logos/btc.svg';logo.alt='';
 logo.style.cssText='width:31px;height:31px;object-fit:contain';
 const label=document.createElement('span');
 label.style.cssText='display:grid;gap:2px;letter-spacing:.025em';
 const labelName=document.createElement('strong');labelName.textContent='BITCOIN · BTC';
 const labelHint=document.createElement('small');
 labelHint.textContent='PURA SANGRE · IDENTIDAD DE MERCADO';
 labelHint.style.cssText='font-size:8px;font-weight:600;letter-spacing:.12em;opacity:.74';
 label.append(labelName,labelHint);heading.append(logo,label);layer.append(heading);
 const border=document.createElement('div');
 border.style.cssText='position:absolute;inset:0;z-index:1;border:2px solid rgba(247,147,26,.43);pointer-events:none';
 layer.append(border);
 const caption=document.createElement('div');
 caption.style.cssText='position:absolute;bottom:0;left:0;right:0;padding:7px 12px;background:rgba(7,16,12,.92);color:#dce9d8;font:11px/1.3 system-ui,sans-serif;pointer-events:auto';
 caption.append(document.createTextNode('WildMesh 3D · original interactivo; galope adaptado aún no publicado · '));
 const licensing=document.createElement('a');
 licensing.href='/licences/';licensing.textContent='CC BY-NC 4.0 y créditos';licensing.style.color='#fba83c';
 caption.append(licensing);layer.append(caption);
 container.append(layer);

 let active=false,initialized=false,viewer=null,theme=DEFAULT_PALETTE;
 let qa={ready:false,state:'not-initialized',updated:0,found:[],model:'wildmesh-original',gallop:false};
 let fallbackTimer=null;
 const originalSrc='https://sketchfab.com/models/'+MODEL_ID+
  '/embed?autostart=1&ui_infos=0&ui_controls=1&ui_watermark=1&ui_watermark_link=1&ui_help=0';

 function plainEmbed(){
  if(qa.ready)return;
  qa.state='iframe-fallback';
  iframe.src=originalSrc;
 }
 function init(){
  if(initialized)return;
  initialized=true;
  qa.state='loading-sdk';
  fallbackTimer=setTimeout(plainEmbed,12000);
  loadSDK().then(Sketchfab=>{
   if(qa.state==='iframe-fallback')return;
   const client=new Sketchfab('1.12.1',iframe);
   client.init(MODEL_ID,{
    autostart:1,preload:0,ui_infos:0,ui_controls:1,ui_watermark:1,
    ui_watermark_link:1,ui_help:0,ui_theme:'dark',
    success(api){
     viewer=api;
     qa.state='starting-viewer';
     api.addEventListener('viewerready',()=>{
      if(fallbackTimer)clearTimeout(fallbackTimer);
      qa.ready=true;
      qa.state='viewer-ready';
      tintMaterials(api,theme,qa);
     });
     api.start();
    },
    error(){plainEmbed();}
   });
  }).catch(error=>{
   console.warn('WildMesh branding SDK fallback:',error);
   plainEmbed();
  });
 }
 function show(token){
  active=true;theme=appearance(token);
  border.style.borderColor=theme.accent+'77';
  heading.style.borderColor=theme.accent+'bb';
  licensing.style.color=theme.accent;
  layer.hidden=false;
  canvas.style.visibility='hidden';canvas.setAttribute('aria-hidden','true');
  const motion=document.querySelector('#motion');if(motion)motion.hidden=true;
  const status=document.querySelector('#preview-state');
  if(status)status.textContent='BTC · WILDMESH · PALETA BITCOIN · VISTA 3D ORIGINAL';
  init();
  if(qa.ready&&viewer)tintMaterials(viewer,theme,qa);
 }
 function hide(){
  active=false;layer.hidden=true;
  canvas.style.visibility='visible';canvas.removeAttribute('aria-hidden');
  const motion=document.querySelector('#motion');if(motion)motion.hidden=false;
 }
 return {
  show,hide,get active(){return active;},
  snapshot(){return {...qa,active,palette:{...theme}};},
  dispose(){
   if(fallbackTimer)clearTimeout(fallbackTimer);
   layer.remove();canvas.style.visibility='visible';canvas.removeAttribute('aria-hidden');
  }
 };
}
