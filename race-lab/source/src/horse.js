import * as THREE from 'three';
import {createGaitRefiner} from './gaitRefiner.js?v=alpha09-1';
import {createFurIdentity} from './horseLivery.js?v=alpha14-ticker-1';
import {smoothHorseNormals} from './horseSurface.js?v=alpha08-1';
import {createWindMane} from './windMane.js?v=alpha18-gaitmane-1';
import {createHorseSurfaceFinish} from './horseVisualQuality.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

let assetPromise;
const MODEL_URL=new URL('../assets/horse.glb.gz',import.meta.url);

async function loadHorseAsset(){
  if(!assetPromise){
    assetPromise=(async()=>{
      const response=await fetch(MODEL_URL);
      if(!response.ok)throw new Error('No se pudo cargar el caballo 3D: '+response.status);
      if(typeof DecompressionStream!=='function')throw new Error('Este navegador no admite el modelo comprimido.');
      const compressed=await response.arrayBuffer();
      const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      const binary=await new Response(stream).arrayBuffer();
      const gltf=await new GLTFLoader().parseAsync(binary,new URL('../assets/',import.meta.url).href);
      smoothHorseNormals(gltf.scene,{strength:.91});
      return gltf;
    })();
  }
  return assetPromise;
}

export async function createHorse({coat='#956342',accent='#f7931a',symbol='BTC',height=2.5,phase=0,mode='Gallop',maneMotion=true,maneGait=null,gaitCorrectionStrength=.40}={}){
  const asset=await loadHorseAsset(),model=clone(asset.scene);model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model,true),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const visual=new THREE.Group();model.position.set(-center.x,-bounds.min.y,-center.z);visual.add(model);visual.scale.setScalar(height/size.y);visual.rotation.y=Math.PI/2;
  // Pivot the whole animal around its body, not its hooves, while leaning into corners.
  const bankPivot=new THREE.Group();bankPivot.position.y=height*.46;
  visual.position.y=-height*.46;bankPivot.add(visual);
  const root=new THREE.Group();root.add(bankPivot);
  let bankGoal=0;const materials=new Set(),colorBindings=[];
  model.traverse(object=>{
    if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
    const source=Array.isArray(object.material)?object.material:[object.material];
    const assigned=source.map(original=>{
      const material=original.clone();material.metalness=0;material.roughness=.87;material.flatShading=false;colorBindings.push({material,name:original.name,mesh:object});materials.add(material);return material;
    });
    object.material=Array.isArray(object.material)?assigned:assigned[0];
  });
  // The token identity is pigment in the model's own fur, never a hovering sign.
  const identity=createFurIdentity(colorBindings);
  const surfaceFinish=createHorseSurfaceFinish(colorBindings,{quality:'balanced'});
  // Wind animates only the existing Hair vertices before skeletal skinning.
  // The GLB, gait clips, horse silhouette and livery textures stay intact.
  const mane=createWindMane(colorBindings,{seed:phase});
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let maneWind=.55;
  const originalTones=new Map();let currentWetness=0;
  function tintWetness(){
    for(const {material} of colorBindings){
      const base=originalTones.get(material);if(!base)continue;
      material.color.copy(base).multiplyScalar(1-currentWetness*.24);
      material.roughness=.87-currentWetness*.27;
      material.clearcoat&&(material.clearcoat=currentWetness*.15);
    }
    surfaceFinish.setWetness(currentWetness);
  }
  const mixer=new THREE.AnimationMixer(model),clips=asset.animations.filter(clip=>!clip.name.includes('|'));let action;
  // Preserve the authored Gallop when desired; race callers keep .40 by default.
  const gait=createGaitRefiner(model,{strength:THREE.MathUtils.clamp(Number.isFinite(gaitCorrectionStrength)?gaitCorrectionStrength:.40,0,1)});
  const api={
    root,clips:clips.map(clip=>clip.name),
    get hoofPhase(){return gait.phase;},
    get maneWindEnabled(){return mane.enabled;},
    get maneMotion(){return mane.motion;},
    setWind(level=.55){maneWind=Math.max(0,Math.min(2,Number(level)||0));},
    setBank(radians=0){bankGoal=Math.max(-.12,Math.min(.12,Number(radians)||0));},
    setWetness(level){currentWetness=Math.max(0,Math.min(1,Number(level)||0));tintWetness();},
    setVisualQuality(name){surfaceFinish.setQuality(name);},
    setCoatFinish(level){surfaceFinish.setFinish(level);},
    play(name='Gallop',fade=.2){const clip=clips.find(item=>item.name===name);if(!clip)return;const next=mixer.clipAction(clip);if(next===action)return;next.reset().play();if(action)next.crossFadeFrom(action,fade,true);action=next;},
    setAppearance({coat:nextCoat=coat,accent:nextAccent=accent,symbol:nextSymbol=symbol}={}){
      identity.apply({coat:nextCoat,accent:nextAccent,symbol:nextSymbol});
      for(const {material} of colorBindings)originalTones.set(material,material.color.clone());
      tintWetness();
      coat=nextCoat;accent=nextAccent;symbol=nextSymbol;
    },
    update(delta,speed=1){
      gait.reset();
      const step=Math.min(Math.max(delta,0),.10),rate=Math.max(0,speed);
      bankPivot.rotation.x+=(bankGoal-bankPivot.rotation.x)*(1-Math.exp(-step*5));
      mixer.update(step*rate);
      if(action?.getClip().name==='Gallop'){
        // The native Gallop clip is 0.583s; lock corrective keys to its clock.
        gait.refine(step,rate,action.time/action.getClip().duration);
      }
      mane.update(step,{wind:maneWind,speed:rate,gait:maneGait||action?.getClip().name,motionEnabled:maneMotion,reducedMotion:!!reducedMotion?.matches});
    },
    dispose(){bankGoal=0;bankPivot.rotation.x=0;mane.dispose();gait.reset();mixer.stopAllAction();mixer.uncacheRoot(model);identity.dispose();surfaceFinish.dispose();materials.forEach(material=>material.dispose());root.removeFromParent();}
  };
  api.setAppearance({coat,accent,symbol});
  api.play(mode,0);mixer.update(phase);return api;
}
