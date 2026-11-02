import * as THREE from 'three';
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
      return new GLTFLoader().parseAsync(binary,new URL('../assets/',import.meta.url).href);
    })();
  }
  return assetPromise;
}

function makeBadgeTexture(symbol,accent){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#081b16';ctx.fillRect(0,0,384,128);
  ctx.fillStyle=accent;ctx.fillRect(0,0,13,128);ctx.fillStyle='#f6f4e8';
  ctx.font='bold 62px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbol,198,68);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export async function createHorse({coat='#956342',accent='#f7931a',symbol='BTC',height=2.5,phase=0,mode='Gallop'}={}){
  const asset=await loadHorseAsset(),model=clone(asset.scene);model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model,true),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const visual=new THREE.Group();model.position.set(-center.x,-bounds.min.y,-center.z);visual.add(model);visual.scale.setScalar(height/size.y);visual.rotation.y=Math.PI/2;
  const root=new THREE.Group();root.add(visual);const materials=new Set(),colorBindings=[];
  model.traverse(object=>{
    if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
    const source=Array.isArray(object.material)?object.material:[object.material];
    const assigned=source.map(original=>{
      const material=original.clone();material.metalness=0;material.roughness=.78;colorBindings.push({material,name:original.name});materials.add(material);return material;
    });
    object.material=Array.isArray(object.material)?assigned:assigned[0];
  });
  const badgeMaterial=new THREE.SpriteMaterial({map:makeBadgeTexture(symbol,accent),depthTest:true});
  const badge=new THREE.Sprite(badgeMaterial);badge.position.set(0,height+.55,0);badge.scale.set(1.25,.42,1);root.add(badge);
  const mixer=new THREE.AnimationMixer(model),clips=asset.animations.filter(clip=>!clip.name.includes('|'));let action;
  const api={
    root,clips:clips.map(clip=>clip.name),
    play(name='Gallop',fade=.2){const clip=clips.find(item=>item.name===name);if(!clip)return;const next=mixer.clipAction(clip);if(next===action)return;next.reset().play();if(action)next.crossFadeFrom(action,fade,true);action=next;},
    setAppearance({coat:nextCoat=coat,accent:nextAccent=accent,symbol:nextSymbol=symbol}={}){
      const base=new THREE.Color(nextCoat);
      for(const binding of colorBindings){if(binding.name==='Main')binding.material.color.copy(base);else if(binding.name==='Main_Dark')binding.material.color.copy(base).multiplyScalar(.64);else if(binding.name==='Main_Light')binding.material.color.copy(base).lerp(new THREE.Color('#e9c6a0'),.2);}
      const old=badgeMaterial.map;badgeMaterial.map=makeBadgeTexture(nextSymbol,nextAccent);badgeMaterial.needsUpdate=true;old?.dispose();
      coat=nextCoat;accent=nextAccent;symbol=nextSymbol;
    },
    update(delta,speed=1){mixer.update(Math.min(Math.max(delta,0),.1)*Math.max(0,speed));},
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);materials.forEach(material=>material.dispose());badgeMaterial.map?.dispose();badgeMaterial.dispose();root.removeFromParent();}
  };
  api.play(mode,0);mixer.update(phase);return api;
}
