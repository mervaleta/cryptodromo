// Mesh2Motion CC0 sample horse and motion library, visual-only experiment.
// Assets © Mesh2Motion; released CC0. App adapter by Cryptodromo.
// The model and source rig are separate: skin weights are estimated in memory once.
// Does NOT use the old Quaternius horse or NONECG geometry.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const BASE = 'https://cdn.jsdelivr.net/gh/Mesh2Motion/mesh2motion-app@ec0669b9a2258605c8df267e225cbfa64489a628/static/assets/horse/';
const ANIMATIONS = Object.freeze({Idle:'idle',Walk:'walk',Trot:'trot',Gallop:'run',Run:'run'});
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let masterPromise;
const tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3(),tmpP=new THREE.Vector3(),tmpD=new THREE.Vector3();

function attachProceduralSurface(material,kind){
  if(kind!=='coat')return material;
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vHorseLocal;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvHorseLocal = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vHorseLocal;\nfloat horseNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float n=dot(i,vec3(1.,57.,113.));return mix(mix(mix(fract(sin(n)*43758.5453),fract(sin(n+1.)*43758.5453),f.x),mix(fract(sin(n+57.)*43758.5453),fract(sin(n+58.)*43758.5453),f.x),f.y),mix(mix(fract(sin(n+113.)*43758.5453),fract(sin(n+114.)*43758.5453),f.x),mix(fract(sin(n+170.)*43758.5453),fract(sin(n+171.)*43758.5453),f.x),f.y),f.z);}');
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\nfloat coarse=horseNoise(vHorseLocal*15.);float fine=horseNoise(vHorseLocal*112.);diffuseColor.rgb*=0.82+0.24*coarse+0.07*fine;');
  };
  material.customProgramCacheKey=()=> 'cryptodromo-horse-fur-v1';
  return material;
}
function createMaterial(kind,coat){
  const colors={coat, mane:'#211a1a',eye:'#241711',hoof:'#2b2521'};
  return attachProceduralSurface(new THREE.MeshPhysicalMaterial({
    color:colors[kind]||coat,roughness:kind==='eye'?0.13:kind==='hoof'?0.73:0.89,
    metalness:0,clearcoat:kind==='eye'?0.9:0.06,
    clearcoatRoughness:kind==='eye'?0.08:0.6,
    side:THREE.FrontSide
  }),kind);
}
function materialKind(name){
  return /eye|iris/i.test(name)?'eye':/hoof|shoe/i.test(name)?'hoof':
    /mane|tail|hair/i.test(name)?'mane':'coat';
}
function boneSegments(bones) {
  return bones.map((bone,index)=>{
    bone.getWorldPosition(tmpB);
    const end=tmpB.clone();
    let start;
    if(bone.parent?.isBone){bone.parent.getWorldPosition(tmpA);start=tmpA.clone();}
    else if(bone.children.some(c=>c.isBone)){bone.children.find(c=>c.isBone).getWorldPosition(tmpA);start=tmpA.clone();}
    else start=end.clone().addScalar(0.001);
    return {index,start,end};
  });
}
function skinWeights(geometry,segments){
  const positions=geometry.getAttribute('position'), count=positions.count;
  const indexes=new Uint16Array(count*4),weights=new Float32Array(count*4);
  for(let n=0;n<count;n++){
    tmpP.fromBufferAttribute(positions,n);
    const picks=[];
    for(const seg of segments){
      tmpD.subVectors(seg.end,seg.start);
      const denominator=Math.max(tmpD.lengthSq(),1e-8);
      const t=THREE.MathUtils.clamp(tmpP.clone().sub(seg.start).dot(tmpD)/denominator,0,1);
      tmpA.copy(seg.start).addScaledVector(tmpD,t);
      const d=tmpP.distanceToSquared(tmpA);
      if(picks.length<4){picks.push([seg.index,d]);picks.sort((a,b)=>a[1]-b[1]);}
      else if(d<picks[3][1]){picks[3]=[seg.index,d];picks.sort((a,b)=>a[1]-b[1]);}
    }
    let total=0;
    for(let j=0;j<picks.length;j++){indexes[n*4+j]=picks[j][0];weights[n*4+j]=1/Math.pow(Math.max(picks[j][1],0.0003),1.5);total+=weights[n*4+j];}
    for(let j=0;j<4;j++)weights[n*4+j]=total?weights[n*4+j]/total:0;
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indexes,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
}
function badge(symbol,color){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#10231a';ctx.fillRect(0,0,384,128);
  ctx.fillStyle=color;ctx.fillRect(0,0,14,128);
  ctx.fillStyle='#ffffff';ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbol,196,65);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));
  sprite.scale.set(1.1,.36,1);return sprite;
}
async function makeMaster(){
  const [model,rig,...actions]=await Promise.all([
    loader.loadAsync(BASE+'model.glb'),loader.loadAsync(BASE+'skeleton.glb'),
    ...Object.values(ANIMATIONS).filter((v,i,a)=>a.indexOf(v)===i).map(name=>loader.loadAsync(BASE+'animations/'+name+'.glb'))
  ]);
  const bones=[];
  rig.scene.updateMatrixWorld(true);
  rig.scene.traverse(item=>{if(item.isBone)bones.push(item);});
  if(bones.length<10)throw new Error('Mesh2Motion horse rig incomplete');
  const segments=boneSegments(bones), skeleton=new THREE.Skeleton(bones);
  const group=new THREE.Group();group.name='Mesh2MotionRiggedHorse';
  const original=new THREE.Group();original.name='HorseSkeleton';original.add(rig.scene);group.add(original);
  model.scene.updateMatrixWorld(true);
  let meshCount=0;
  model.scene.traverse(src=>{
    if(!src.isMesh)return;
    const geo=src.geometry.clone();geo.applyMatrix4(src.matrixWorld);
    skinWeights(geo,segments);
    const material=createMaterial(materialKind(src.name),'#6e5143');
    const skinned=new THREE.SkinnedMesh(geo,material);
    skinned.name=src.name||('HorseMesh'+meshCount);
    group.add(skinned);
    meshCount++;
  });
  if(!meshCount)throw new Error('Mesh2Motion horse model missing geometry');
  group.updateMatrixWorld(true);
  const boundBones=[];group.traverse(o=>{if(o.isBone)boundBones.push(o);});
  const boundSkeleton=new THREE.Skeleton(boundBones);
  group.traverse(o=>{if(o.isSkinnedMesh){o.bind(boundSkeleton,new THREE.Matrix4());o.normalizeSkinWeights();o.castShadow=true;o.receiveShadow=true;}});
  const clips={};
  const assetKeys=Object.values(ANIMATIONS).filter((v,i,a)=>a.indexOf(v)===i);
  actions.forEach((gltf,i)=>{
    const clip=gltf.animations[0];if(clip)clips[assetKeys[i]]=clip;
  });
  if(!clips.idle||!clips.run||!clips.trot||!clips.walk)throw new Error('Horse animation clips incomplete');
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  if(!(size.y>0.01))throw new Error('Horse model dimensions invalid');
  const center=bounds.getCenter(new THREE.Vector3());
  const offset=new THREE.Group();offset.add(group);
  group.position.set(-center.x,-bounds.min.y,-center.z);
  offset.scale.setScalar(2.5/size.y);
  return {offset,clips};
}
export async function createMotionHorse({coat='#6e5143',accent='#f7931a',symbol='BTC',mode='Idle'}={}){
  if(!masterPromise)masterPromise=makeMaster().catch(e=>{masterPromise=undefined;throw e;});
  const template=await masterPromise,visual=cloneSkinned(template.offset);
  const root=new THREE.Group();root.add(visual);
  const materials=new Set(),horseParts=[];
  visual.traverse(o=>{
    if(!o.isMesh)return;
    const kind=materialKind(o.name),mat=createMaterial(kind,coat);
    o.material=mat;materials.add(mat);horseParts.push({mat,kind});
  });
  let label=badge(symbol,accent);label.position.set(0,3,0);root.add(label);
  const skeletonMixer=new THREE.AnimationMixer(visual),clips=template.clips;
  let active;
  const api={
    root,clips:['Idle','Walk','Trot','Gallop','Run'],
    play(name='Idle',fade=.22){
      const key=ANIMATIONS[name]||'idle',clip=clips[key];
      if(!clip)return;
      const next=skeletonMixer.clipAction(clip);
      if(active===next)return;
      next.reset().setLoop(THREE.LoopRepeat,Infinity).setEffectiveTimeScale(1).play();
      if(active)next.crossFadeFrom(active,fade,true);
      active=next;
    },
    setAppearance({coat:nextCoat=coat,accent:nextAccent=accent,symbol:nextSymbol=symbol}={}){
      horseParts.forEach(({mat,kind})=>{if(kind==='coat')mat.color.set(nextCoat);});
      label.material.map.dispose();label.material.dispose();root.remove(label);
      label=badge(nextSymbol,nextAccent);label.position.set(0,3,0);root.add(label);
    },
    // Advance only by elapsed render time. Market inputs and track speed never alter this loop.
    update(delta){skeletonMixer.update(Math.min(Math.max(0,delta),.1));},
    dispose(){skeletonMixer.stopAllAction();skeletonMixer.uncacheRoot(visual);materials.forEach(m=>m.dispose());label.material.map.dispose();label.material.dispose();root.removeFromParent();}
  };
  api.play(mode,0);return api;
}
