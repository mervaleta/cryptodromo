import * as THREE from 'three';
/**
 * Stadium floodlighting. Fixture meshes are emissive; real spotlights
 * illuminate the track surface and animated horses. All FX are cosmetic.
 * Fixed number of lights, no per-frame allocations or shadows.
 */
export function createNightLights(scene,{start=-246,finish=246}={}){
 const root=new THREE.Group();root.name='Satoshi Nakamoto · adjustable floodlighting';scene.add(root);
 const fixtures=[],beams=[],pools=[],supports=[];
 // Wide fill ensures the entire straight is usable at night, between spot pools.
 // The dimmer and master switch control this fill as well.
 const courseFill=new THREE.DirectionalLight('#dae9ff',0);
 courseFill.position.set(0,96,68);courseFill.target.position.set(0,0,0);
 courseFill.castShadow=false;root.add(courseFill,courseFill.target);
 const arenaBounce=new THREE.HemisphereLight(0xbfd7e6,0x173328,0);
 root.add(arenaBounce);
 const stem=new THREE.MeshStandardMaterial({color:'#465b59',metalness:.74,roughness:.33});
 const lightMat=new THREE.MeshStandardMaterial({color:'#fff4cd',emissive:'#ffffff',emissiveIntensity:0,metalness:.05,roughness:.24});
 const poolCanvas=document.createElement('canvas');poolCanvas.width=poolCanvas.height=128;
 const ctx=poolCanvas.getContext('2d'),grad=ctx.createRadialGradient(64,64,2,64,64,63);
 grad.addColorStop(0,'rgba(255,244,212,0.45)');grad.addColorStop(.3,'rgba(255,233,182,0.26)');grad.addColorStop(1,'rgba(255,215,135,0)');
 ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
 const poolTex=new THREE.CanvasTexture(poolCanvas);poolTex.colorSpace=THREE.SRGBColorSpace;
 const positions=[];
 for(const x of [start+28,0,finish-28])for(const side of [-1,1])positions.push({x,z:side<0?-33:34,side});
 const lampGeo=new THREE.BoxGeometry(4.0,.62,1.65);
 const beamGeo=new THREE.ConeGeometry(13,29,12,1,true);beamGeo.translate(0,-14.5,0);
 const poolGeo=new THREE.PlaneGeometry(78,35);
 for(let i=0;i<positions.length;i++){
  const {x,z,side}=positions[i];
  const support=new THREE.Mesh(new THREE.CylinderGeometry(.19,.26,23,8),stem);
  support.position.set(x,11.5,z);support.castShadow=true;root.add(support);supports.push(support);
  const luminaire=new THREE.Mesh(lampGeo,lightMat.clone());luminaire.position.set(x,23.1,z);
  luminaire.castShadow=false;root.add(luminaire);
  const light=new THREE.SpotLight('#fff5d7',0,130,Math.PI/2.5,.88,1.3);
  light.position.set(x,22.8,z);
  light.castShadow=false;
  light.target.position.set(x,0,0);
  root.add(light,light.target);
  const beam=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({
   color:'#c8f2e8',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  }));
  beam.position.set(x,22.7,z);beam.scale.set(1,.82,1);root.add(beam);beam.lookAt(x,0,0);
  const pool=new THREE.Mesh(poolGeo,new THREE.MeshBasicMaterial({
   map:poolTex,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  }));
  pool.position.set(x,.048,side<0?-10:10);pool.rotation.x=-Math.PI/2;root.add(pool);
  fixtures.push({light,luminaire,baseX:x,baseZ:z});
  beams.push(beam);pools.push(pool);
 }
 const state={enabled:true,dimmer:.84,color:'#fff3d4',effect:'steady',night:false};
 const tmp=new THREE.Color(),original=new THREE.Color();
 const blend=new THREE.Color();
 function configure({enabled=state.enabled,dimmer=state.dimmer,color=state.color,effect=state.effect,night=state.night}={}){
  state.enabled=!!enabled;state.dimmer=Math.max(0,Math.min(1,Number(dimmer)||0));
  state.color=color;state.effect=effect;state.night=!!night;
  update(0);
 }
 function update(seconds=0){
  const base=state.enabled?(state.night?1:.30)*state.dimmer:0;
  original.set(state.color);
  courseFill.color.copy(original).lerp(new THREE.Color('#c4dff5'),.34);
  courseFill.intensity=base*.85;
  arenaBounce.color.copy(original).lerp(new THREE.Color('#bcd6eb'),.6);
  arenaBounce.intensity=base*.42;
  for(let i=0;i<fixtures.length;i++){
   const f=fixtures[i],phase=i/fixtures.length,theta=seconds;
   let gain=1,color=original;
   if(state.effect==='pulse')gain=.59+.41*Math.sin(theta*2.7+i*.19)**2;
   if(state.effect==='chase')gain=(Math.floor(theta*2.4)%fixtures.length===i)?1:.33;
   if(state.effect==='wave')gain=.50+.50*Math.sin(theta*1.9+f.baseX*.024)**2;
   if(state.effect==='rainbow'){tmp.setHSL((phase+theta*.055)%1,.65,.72);color=tmp;gain=.80;}
   const intensity=base*gain;
   f.light.intensity=intensity*1600;
   f.light.color.copy(color);
   f.luminaire.material.emissive.copy(color);
   f.luminaire.material.emissiveIntensity=intensity*2.8;
   beams[i].material.color.copy(color);
   beams[i].material.opacity=intensity*.065;
   pools[i].material.color.copy(color);
   pools[i].material.opacity=intensity*.7;
  }
 }
 update(0);
 return {root,fixtures,state,configure,update,dispose(){
   for(const f of fixtures){f.luminaire.material.dispose();f.light.dispose();}
   for(const mesh of [...beams,...pools])mesh.material.dispose();
   lampGeo.dispose();beamGeo.dispose();poolGeo.dispose();poolTex.dispose();stem.dispose();lightMat.dispose();
   root.removeFromParent();
 }};
}
