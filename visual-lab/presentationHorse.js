import * as THREE from 'three';
import {createHorse} from '/race-lab/source/src/horse.js?v=alpha18-gaitmane-1';
/** Dedicated preview; reuses Racers horse rig, never touches race horses or clocks. */
export function mountPresentationHorse(container){
 const noop=()=>{};
 if(!container){console.warn('Optional presentation horse container is absent');return {show:noop,dispose:noop};}
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(34,1,.1,80);camera.position.set(6,3.2,7);camera.lookAt(0,1.3,0);
 scene.add(new THREE.HemisphereLight(0xe5f5ff,0x253b31,2.4));
 const key=new THREE.DirectionalLight(0xffe8c2,3);key.position.set(-4,9,5);scene.add(key);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
 catch(error){
  container.dataset.preview='unavailable';
  console.warn('Second WebGL context unavailable, main race stays active:',error);
  return {show:noop,dispose:noop};
 }
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 container.append(renderer.domElement);
 let horse=null,serial=0,active=true,previous=performance.now();
 function resize(){const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 async function show(entry){
  const request=++serial;
  try{
   const next=await createHorse({coat:entry.coat||'#956342',accent:entry.color||'#f7931a',symbol:entry.symbol||'BTC',height:2.85,mode:'Walk'});
   if(!active||request!==serial){next.dispose();return;}
   if(horse)horse.dispose();
   horse=next;scene.add(horse.root);horse.play('Walk');container.dataset.preview='ready';
  }catch(err){container.dataset.preview='unavailable';console.warn('Presentation horse preview:',err);}
 }
 function frame(now){
  if(!active)return;
  const dt=Math.min(.05,(now-previous)/1000);previous=now;
  if(horse&&container.offsetParent!==null){horse.update(dt);horse.root.rotation.y=.17*Math.sin(now*.0005);renderer.render(scene,camera);}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 return {show,dispose(){active=false;serial++;observer.disconnect();horse?.dispose();renderer.dispose();renderer.domElement.remove();}};
}
