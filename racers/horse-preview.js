import * as THREE from 'three';
import { createHorse as createLegacyHorse } from '../race-lab/source/src/horse.js';
import { createMotionHorse } from './mesh2motion-horse.js';

export function createPreview(canvas,onFailure=()=>{}){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,50);
  camera.position.set(3.7,2.6,6.5);camera.lookAt(0,1.1,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x65714c,2.1));
  const sun=new THREE.DirectionalLight(0xfff1da,2.6);sun.position.set(2,6,5);scene.add(sun);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.85,1.95,.12,64),new THREE.MeshStandardMaterial({color:0x243b26,roughness:.92}));
  platform.position.y=-.02;scene.add(platform);
  let horse,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,selection=0,gait='Gallop',source='motion',disposed=false;
  const indicator=document.querySelector('#preview-state');
  const actions=document.querySelector('.stage-bottom');
  const label=document.createElement('label');label.style.cssText='display:flex;gap:7px;align-items:center;font-size:11px;color:#b5c2bb';
  label.textContent='Movimiento';
  const selectGait=document.createElement('select');selectGait.id='horse-gait';
  selectGait.setAttribute('aria-label','Seleccionar movimiento del caballo');
  selectGait.style.cssText='background:#10251b;color:#fff;border:1px solid #526356;border-radius:4px;padding:6px;max-width:140px';
  for(const [key,name] of [['Idle','Reposo'],['Walk','Paso'],['Trot','Trote'],['Gallop','Galope']]){
    const option=document.createElement('option');option.value=key;option.textContent=name;if(key===gait)option.selected=true;selectGait.append(option);
  }
  label.append(selectGait);actions?.insertBefore(label,actions.querySelector('#motion'));
  const resize=()=>{if(disposed)return;const box=canvas.parentElement;if(!box)return;const w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
  function applyGait(){
    if(!horse)return;
    const effective=paused?'Idle':source==='legacy'&&gait==='Trot'?'Walk':gait;
    horse.play(effective,.2);
  }
  selectGait.addEventListener('change',()=>{gait=selectGait.value;applyGait();});
  async function select(token){
    const request=++selection;
    let next,chosen='motion';
    try {
      indicator.textContent='CARGANDO CABALLO CC0 · ESQUELETO Y MOVIMIENTO';
      try {
        next=await createMotionHorse({coat:token.coat,accent:token.color,symbol:token.symbol,mode:'Idle'});
      }catch(error){
        chosen='legacy';
        console.warn('Mesh2Motion horse not ready; reverting to existing horse:',error);
        next=await createLegacyHorse({coat:token.coat,accent:token.color,symbol:token.symbol,height:2.5,mode:'Idle'});
      }
      if(request!==selection||disposed){next.dispose();return;}
      source=chosen;next.root.scale.setScalar(.78);scene.add(next.root);
      const previous=horse;horse=next;if(previous){scene.remove(previous.root);previous.dispose();}
      selectGait.querySelector('[value="Trot"]').disabled=source==='legacy';
      if(source==='legacy'&&gait==='Trot'){gait='Gallop';selectGait.value=gait;}
      indicator.textContent=source==='motion'?'3D CC0 · REPOSO / PASO / TROTE / CARRERA':'3D COMPATIBILIDAD · TROTE NO DISPONIBLE';
      applyGait();
    } catch(error){
      if(request===selection&&!disposed){console.warn('3D horse preview unavailable:',error);onFailure(token,error);}
    }
  }
  function pause(value){paused=value;applyGait();}
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(!document.hidden)horse?.update(dt);renderer.render(scene,camera);});
  return {select,pause,dispose(){disposed=true;selection++;observer.disconnect();label.remove();renderer.setAnimationLoop(null);horse?.dispose();renderer.dispose();}};
}
