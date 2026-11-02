/** 2.5D vector master preview: a single 12-pose silhouette reused for every token.
 * Three.js presents it as a billboard; Canvas2D is the fallback without WebGL.
 * Visual-only: result and position calculations remain entirely separate.
 */
import * as THREE from 'three';
import {createVectorHorseTexture,drawHorse,paletteForToken} from './vector-horse.js';
const masterPromise=fetch('/racers/horse-master.v1.json',{cache:'force-cache'})
  .then(response=>{if(!response.ok)throw Error('Horse master HTTP '+response.status);return response.json();});
export function createPreview(canvas,onFailure=()=>{}){
 let renderer=null,context=null,sprite=null,texture=null,master=null,selected=null;
 let elapsed=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,disposed=false;
 let pending=0,clock=new THREE.Clock(),observer,frameId,stageAspect=1.45;
 const indicator=document.querySelector('#preview-state');
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-2.4,2.4,1.8,-1.8,.1,30);
 camera.position.set(0,0,8);camera.lookAt(0,0,0);
 try{
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
   renderer.outputColorSpace=THREE.SRGBColorSpace;
 }catch(error){console.warn('WebGL unavailable, using Canvas2D vector horse:',error);context=canvas.getContext('2d');}
 function resize(){
   if(disposed)return;
   const container=canvas.parentElement;
   if(!container)return;
   const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);
   if(renderer){renderer.setSize(w,h,false);const ratio=w/h;stageAspect=ratio;camera.left=-2.35*ratio;camera.right=2.35*ratio;camera.top=2.35;camera.bottom=-2.35;camera.updateProjectionMatrix();if(sprite){const size=4.1*Math.min(1,ratio);sprite.scale.set(size,size,1);}}
   else{const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 }
 observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
 async function select(token){
   selected=token;const request=++pending;
   indicator&&(indicator.textContent='PREPARANDO MASTER VECTORIAL');
   try{
     master=await masterPromise;
     if(disposed||request!==pending)return;
     if(renderer){
       texture?.dispose();sprite?.material?.dispose();if(sprite)scene.remove(sprite);
       texture=createVectorHorseTexture(THREE,master,token,{size:512,fps:12,zoomToArt:true});
       const material=new THREE.SpriteMaterial({map:texture.texture,transparent:true,depthWrite:false,alphaTest:.015,toneMapped:false});
       sprite=new THREE.Sprite(material);const size=4.1*Math.min(1,stageAspect);sprite.scale.set(size,size,1);scene.add(sprite);
       texture.update(elapsed);
     }
     indicator&&(indicator.textContent='VECTORIAL · 12 POSES · SOMBRAS Y POLVO');
   }catch(error){if(disposed||request!==pending)return;console.error('Vector horse failed:',error);onFailure(token,error);}
 }
 function pause(value){paused=!!value;}
 function tick(){
   if(disposed)return;
   const dt=Math.min(.05,clock.getDelta());if(!paused&&!document.hidden)elapsed+=dt;
   if(renderer){if(texture&&master)texture.update(elapsed);renderer.render(scene,camera);}
   else if(context&&selected&&master){context.clearRect(0,0,canvas.width,canvas.height);
     const scale=Math.min(canvas.width/158,canvas.height/120);
     const dx=(canvas.width-158*scale)*.5-12*scale;
     const dy=(canvas.height-100*scale)*.5-76*scale;
     drawHorse(context,master,{frame:Math.floor(elapsed*12),palette:paletteForToken(selected),scale,offsetX:dx,offsetY:dy,dustLevel:1.2,shadowLevel:1.1});
   }
   frameId=requestAnimationFrame(tick);
 }
 frameId=requestAnimationFrame(tick);
 return {select,pause,dispose(){disposed=true;pending++;observer?.disconnect();cancelAnimationFrame(frameId);texture?.dispose();sprite?.material?.dispose();renderer?.dispose();}};
}