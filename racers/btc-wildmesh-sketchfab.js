/**
 * BTC-only, attribution-preserving interactive Sketchfab embed.
 * Visual fallback when the owner-provided WildMesh GLB cannot yet be served.
 * This is the ORIGINAL preview, not the retargeted Gallop clip.
 * Attribution/license disclosure at /licences/. Other horses never use this.
 */
const MODEL_ID='65d6a70a6721495f938c93e80a5998e4';
export function createWildMeshSketchfabFallback(canvas){
 const container=canvas.parentElement;
 if(!container)throw Error('BTC preview container missing');
 container.style.position='relative';
 const layer=document.createElement('div');
 layer.id='btc-wildmesh-source-embed';
 layer.hidden=true;
 layer.style.cssText='position:absolute;inset:0;z-index:3;background:#111916;overflow:hidden';
 const iframe=document.createElement('iframe');
 iframe.title='Caballo realista WildMesh 3D, demostración interactiva original de Sketchfab';
 iframe.loading='lazy';
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.allow='autoplay; fullscreen; xr-spatial-tracking';
 iframe.allowFullscreen=true;
 iframe.style.cssText='display:block;width:100%;height:100%;border:0';
 iframe.src='https://sketchfab.com/models/'+MODEL_ID+'/embed?autostart=1&ui_infos=0&ui_controls=1&ui_watermark=1&ui_watermark_link=1&ui_help=0';
 layer.append(iframe);
 const caption=document.createElement('div');
 caption.style.cssText='position:absolute;bottom:0;left:0;right:0;padding:6px 10px;background:rgba(7,16,12,.92);color:#dce9d8;font:11px/1.3 system-ui,sans-serif;pointer-events:auto';
 caption.textContent='WildMesh 3D · vista interactiva del autor (sin galope transferido) · ';
 const licensing=document.createElement('a');
 licensing.href='/licences/';licensing.textContent='Licencia CC BY-NC 4.0';licensing.style.color='#b9f68b';
 caption.append(licensing);layer.append(caption);
 container.append(layer);
 let active=false;
 return {
  show(){
   active=true;layer.hidden=false;
   canvas.style.visibility='hidden';canvas.setAttribute('aria-hidden','true');
   const motion=document.querySelector('#motion');if(motion)motion.hidden=true;
   const status=document.querySelector('#preview-state');if(status)status.textContent='BTC · WILDMESH · DEMO INTERACTIVA DEL AUTOR';
  },
  hide(){
   active=false;layer.hidden=true;
   canvas.style.visibility='visible';canvas.removeAttribute('aria-hidden');
   const motion=document.querySelector('#motion');if(motion)motion.hidden=false;
  },
  get active(){return active;},
  dispose(){layer.remove();canvas.style.visibility='visible';canvas.removeAttribute('aria-hidden');}
 };
}
