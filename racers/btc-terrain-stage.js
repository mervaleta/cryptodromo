import * as THREE from 'three';
import {createHoofTerrainFX} from '../visual-lab/hoofTerrainFX.js?v=btc-ground-prints-scale-20261105-v1';

/**
 * Independent, showroom-sized terrain response for the stationary BTC atelier.
 * Uses the exact same hoof collider/particles as the race; never changes the
 * original Gallop, model geometry, financial dose or world race positions.
 */
const COLORS={dirt:'#8d7354',sand:'#e2c792',grass:'#537b40'};
function makeTerrainTexture(type){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=COLORS[type];ctx.fillRect(0,0,256,256);
 let seed=18711+type.length*7907;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const n=type==='grass'?9500:6800;
 for(let i=0;i<n;i++){
   const x=rnd()*256,y=rnd()*256,r=.3+rnd()*(type==='grass'?1.1:2.1);
   ctx.fillStyle=rnd()>.5?'rgba(255,250,206,.10)':'rgba(21,20,14,.11)';
   ctx.fillRect(x,y,r,type==='grass'?r*2.8:r);
 }
 if(type==='sand'){
   ctx.strokeStyle='rgba(255,255,224,.14)';ctx.lineWidth=1;
   for(let j=0;j<26;j++){
     ctx.beginPath();const y=j*10;
     for(let x=0;x<=256;x+=4){
       const z=y+Math.sin(x*.082+j*.83)*2.1;
       if(x===0)ctx.moveTo(x,z);else ctx.lineTo(x,z);
     }
     ctx.stroke();
   }
 }else if(type==='grass'){
   ctx.fillStyle='rgba(230,247,184,.055)';
   for(let x=0;x<256;x+=64)ctx.fillRect(x,0,27,256);
 }
 const tex=new THREE.CanvasTexture(canvas);
 tex.colorSpace=THREE.SRGBColorSpace;
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2.4,1.65);
 tex.anisotropy=4;
 return tex;
}
export function createBTCTerrainStage(scene,{platform,pedestalRing,renderer}={}){
 if(!scene||!renderer)throw TypeError('scene and renderer required');
 const baseMat=new THREE.MeshStandardMaterial({color:'#19261e',metalness:.10,roughness:.87});
 const baseGeo=new THREE.BoxGeometry(7.7,.14,4.75);
 const base=new THREE.Mesh(baseGeo,baseMat);base.position.y=-.055;
 base.receiveShadow=true;scene.add(base);
 const groundMat=new THREE.MeshStandardMaterial({color:'#ffffff',metalness:0,roughness:.96});
 const groundGeo=new THREE.PlaneGeometry(7.55,4.55);
 const ground=new THREE.Mesh(groundGeo,groundMat);
 ground.rotation.x=-Math.PI/2;ground.position.y=.026;
 ground.receiveShadow=true;scene.add(ground);
 const seamsMat=new THREE.MeshBasicMaterial({color:'#d5c8a7',transparent:true,opacity:.22,depthWrite:false});
 const borderGeo=new THREE.BoxGeometry(7.7,.025,.047);
 const borders=[];
 for(const z of [-2.32,2.32]){
   const rail=new THREE.Mesh(borderGeo,seamsMat);
   rail.position.set(0,.028,z);scene.add(rail);borders.push(rail);
 }
 const fx=createHoofTerrainFX(scene,{lanes:1,quality:'balanced',surface:'dirt',seed:100819,imprintScale:.32,imprintLimit:36});
 fx.setLayout('straight');
 const textures=new Map();
 let surface='dirt',visible=true,wetness=0,wasRunning=false;
 function setVisible(next){
   visible=Boolean(next);
   base.visible=ground.visible=visible;
   for(const border of borders)border.visible=visible;
   fx.marks.visible=fx.shadows.visible=fx.cloud.visible=visible;
   if(platform)platform.visible=!visible;
   if(pedestalRing)pedestalRing.visible=!visible;
   if(!visible){fx.reset();wasRunning=false;}
 }
 function setSurface(next='dirt'){
   if(next!=='off'&&!Object.hasOwn(COLORS,next))return;
   surface=next;
   const enabled=next!=='off';
   setVisible(enabled);
   if(enabled){
     if(!textures.has(next))textures.set(next,makeTerrainTexture(next));
     groundMat.map=textures.get(next);
     groundMat.roughness=next==='grass'?.91:.99;
     groundMat.needsUpdate=true;
     fx.setSurface(next);fx.setWetness(wetness);fx.reset();
   }
 }
 function setWetness(level){
   wetness=Math.max(0,Math.min(1,Number(level)||0));
   fx.setWetness(wetness);
   const dark=1-wetness*.33;
   groundMat.color.setRGB(dark,dark,dark*(1-wetness*.06));
   groundMat.roughness=Math.max(.4,.96-wetness*.42);
 }
 function setQuality(next){fx.setQuality(next);}
 function update({horse,dt=0,running=false,speed=1,wind=.3}={}){
   if(!visible)return;
   const active=Boolean(horse)&&Boolean(running);
   if(active!==wasRunning&&active===false)fx.stepHorse(0,{model:horse,dt:0,running:false});
   wasRunning=active;
   if(horse)fx.stepHorse(0,{model:horse,dt,speed,running:active});
   const belt=active?Math.max(.2,Math.min(4,1.65*speed)):0;
   const step=Math.max(0,Math.min(.06,Number(dt)||0));
   const texture=groundMat.map;
   if(texture&&belt)texture.offset.x=(texture.offset.x-belt*step/6.5)%1;
   fx.update(step,{wind,pixelRatio:renderer.getPixelRatio(),scrollSpeed:belt});
 }
 function reset(){fx.reset();wasRunning=false;}
 function dispose(){
   fx.dispose();base.removeFromParent();ground.removeFromParent();
   borders.forEach(r=>r.removeFromParent());
   groundGeo.dispose();groundMat.dispose();baseGeo.dispose();baseMat.dispose();
   borderGeo.dispose();seamsMat.dispose();
   for(const tex of textures.values())tex.dispose();
   if(platform)platform.visible=true;
   if(pedestalRing)pedestalRing.visible=true;
 }
 setSurface('dirt');
 return {setVisible,setSurface,setWetness,setQuality,update,reset,dispose,
   snapshot:()=>({surface,visible,wetness,...fx.stats})};
}
