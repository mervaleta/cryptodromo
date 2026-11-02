import * as THREE from 'three';
import { createHorse } from '../race-lab/source/src/horse.js?v=alpha08-surface-1';

export function createPreview(canvas,onFailure=()=>{}){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,50);
  camera.position.set(3.7,2.6,6.5);camera.lookAt(0,1.1,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x65714c,2.1));
  const sun=new THREE.DirectionalLight(0xfff1da,2.6);sun.position.set(2,6,5);scene.add(sun);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.85,1.95,.12,64),new THREE.MeshStandardMaterial({color:0x243b26,roughness:.92}));platform.position.y=-.02;scene.add(platform);
  let horse,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,selection=0;
  const resize=()=>{const box=canvas.parentElement;if(!box)return;renderer.setSize(box.clientWidth,box.clientHeight,false);camera.aspect=box.clientWidth/box.clientHeight;camera.updateProjectionMatrix();};
  new ResizeObserver(resize).observe(canvas.parentElement);resize();
  async function select(token){
    const request=++selection;
    try{
      const next=await createHorse({coat:token.coat,accent:token.color,symbol:token.symbol,height:2.5,mode:paused?'Idle':'Gallop'});
      if(request!==selection){next.dispose();return;}
      next.root.scale.setScalar(.78);scene.add(next.root);next.play(paused?'Idle':'Gallop',0);
      const previous=horse;horse=next;if(previous){scene.remove(previous.root);previous.dispose();}
    }catch(error){if(request===selection){console.warn('Cryptodromo horse preview fallback:',error);onFailure(token,error);}}
  }
  function pause(value){paused=value;horse?.play(paused?'Idle':'Gallop',.25);}
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(!document.hidden)horse?.update(dt);renderer.render(scene,camera);});
  return {select,pause,dispose(){selection++;renderer.setAnimationLoop(null);horse?.dispose();renderer.dispose();}};
}
