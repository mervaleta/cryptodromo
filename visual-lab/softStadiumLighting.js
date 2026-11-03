/** CRP soft stadium lighting, standalone and opt-in. 
 * Uses one directional source and unlit glow sprites; NO per-bulb shadows.
 * Caller owns update and dispose; designed for Alpha18 Three.js scene.
 */
export function createSoftStadiumLighting({THREE,scene,quality='balanced',radius=11}={}){
 if(!THREE||!scene)throw Error('THREE and scene required');
 const settings={intensity:1,glow:.85,spread:1,temperature:4100,night:true,quality};
 const lights=[],sprites=[],textures=[];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
 const limits={low:8,balanced:20,high:36};
 const count=limits[quality]||limits.balanced;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const g=canvas.getContext('2d');
 const ramp=g.createRadialGradient(64,64,0,64,64,64);
 ramp.addColorStop(0,'rgba(255,255,255,1)');ramp.addColorStop(.10,'rgba(255,245,222,.92)');
 ramp.addColorStop(.28,'rgba(255,225,180,.40)');ramp.addColorStop(.56,'rgba(255,212,152,.10)');
 ramp.addColorStop(1,'rgba(255,205,140,0)');
 g.fillStyle=ramp;g.fillRect(0,0,128,128);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);
 const group=new THREE.Group();group.name='CRP soft stadium light accents';scene.add(group);
 const bulbMat=new THREE.SpriteMaterial({map:tex,color:0xffedcc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.72,toneMapped:false});
 const positions=[];
 for(let i=0;i<count;i++){
  const lane=Math.floor(i/2),side=i%2?-1:1;
  positions.push({x:(lane-Math.floor(count/4))*radius*1.6,y:21,z:side*105});
 }
 for(const pos of positions){
  const sprite=new THREE.Sprite(bulbMat.clone());sprite.position.set(pos.x,pos.y,pos.z);sprite.scale.set(17,17,1);group.add(sprite);sprites.push(sprite);
 }
 // Two broad fill lights rather than N shadow-casting point lights.
 for(const side of [-1,1]){
  const l=new THREE.DirectionalLight(0xffe0ad,.5);
  l.position.set(side*65,110,side*55);l.castShadow=false;scene.add(l);lights.push(l);
 }
 function apply(patch={}){
  Object.assign(settings,patch);
  settings.intensity=clamp(settings.intensity,0,2.5);
  settings.glow=clamp(settings.glow,0,2);
  settings.spread=clamp(settings.spread,.4,2.5);
  settings.temperature=clamp(settings.temperature,2400,7500);
  const warm=clamp((7500-settings.temperature)/5100,0,1);
  const color=new THREE.Color().setRGB(1,1-.21*warm,1-.45*warm);
  bulbMat.color.copy(color);
  sprites.forEach((s,i)=>{s.visible=i<Math.min(count,limits[settings.quality]||limits.balanced);s.material.opacity=settings.night?.6*settings.glow:0;s.scale.setScalar(18*settings.spread);s.scale.z=1;s.material.color.copy(color);});
  lights.forEach(l=>{l.intensity=settings.night?.55*settings.intensity:0;l.color.copy(color);});
  return {...settings};
 }
 function dispose(){group.parent?.remove(group);sprites.forEach(s=>s.material.dispose());lights.forEach(l=>{l.parent?.remove(l);l.dispose?.()});bulbMat.dispose();textures.forEach(t=>t.dispose())}
 apply();
 return {apply,dispose,get settings(){return {...settings}},get fixtureCount(){return count}};
}
