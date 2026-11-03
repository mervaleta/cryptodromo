/**
 * One instanced draw call for contact-synchronised dirt/damp spray.
 * Complements existing trackSurface.js prints and shadows; never duplicates them.
 * No timers, textures, external requests, smoke sprites or per-contact meshes.
 */
export const DUST_PRESETS=Object.freeze({eco:64,balanced:128,high:224});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const hide=(mesh,dummy,index)=>{
 dummy.position.set(0,-100,0);dummy.scale.setScalar(.00001);dummy.rotation.set(0,0,0);
 dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);
};
export function createContactSpray({THREE,scene,quality='balanced'}={}){
 if(!THREE?.InstancedMesh||!scene)throw Error('THREE and scene required');
 const capacity=DUST_PRESETS.high,particles=Array.from({length:capacity},()=>({
  age:1,life:.6,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,color:'#8d7658'
 }));
 const geometry=new THREE.IcosahedronGeometry(1,0);
 const material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.30,depthWrite:false});
 const mesh=new THREE.InstancedMesh(geometry,material,capacity);
 mesh.name='Alpha21 · hoof-synchronised contact spray';
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
 mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 const dummy=new THREE.Object3D(),color=new THREE.Color();
 let limit=DUST_PRESETS[quality]||DUST_PRESETS.balanced,head=0,wetness=0,surface='dirt',enabled=true;
 for(let i=0;i<capacity;i++)hide(mesh,dummy,i);
 mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);
 function emit({x,z,heading=0,force=1,side=1,qualityScale=1}={}){
  if(!enabled||surface==='synthetic'||!Number.isFinite(x)||!Number.isFinite(z))return 0;
  const count=limit>=224?2:1,amount=clamp(force,0,1.5)*clamp(qualityScale,0,2);
  if(amount<.12)return 0;
  for(let j=0;j<count;j++){
   const p=particles[head],step=(head*31+17)%97/97;
   const scatter=(step-.5)*(j?1.35:.75);
   p.age=0;p.life=(wetness>.4?.33:.48)+(head%7)*.033;
   p.x=x-Math.cos(heading)*(.25+j*.13)-Math.sin(heading)*side*.35;
   p.z=z+Math.cos(heading)*side*.35+Math.sin(heading)*scatter;
   p.y=.11;p.vy=(wetness>.4?.55:.95)*amount*(.75+step*.45);
   p.vx=-Math.cos(heading)*(.65+step)*amount+scatter*.6;
   p.vz=-Math.sin(heading)*(.65+step)*amount+scatter*.6;
   p.size=(wetness>.4?.065:.09)+amount*.068;
   p.color=wetness>.4?'#7a9699':surface==='grass'?'#8b9870':'#a48c68';
   color.set(p.color);mesh.setColorAt(head,color);
   head=(head+1)%limit;
  }
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  return count;
 }
 function update(dt=0){
  const step=clamp(dt,0,.12);
  for(let i=0;i<capacity;i++){
   const p=particles[i];
   if(i>=limit||p.age>=p.life){hide(mesh,dummy,i);continue;}
   p.age+=step;
   if(p.age>=p.life){hide(mesh,dummy,i);continue;}
   const drag=Math.exp(-step*(wetness>.4?3.5:1.9));
   p.vx*=drag;p.vz*=drag;p.vy-=step*1.3;
   p.x+=p.vx*step;p.z+=p.vz*step;p.y=Math.max(.08,p.y+p.vy*step);
   const life=1-p.age/p.life;
   const size=p.size*(.35+life*.9);
   dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,0);
   dummy.scale.set(size,size*.67,size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
 }
 function setEnvironment({wet=wetness,type=surface}={}){
  wetness=clamp(wet,0,1);
  surface=['dirt','grass','synthetic'].includes(type)?type:'dirt';
 }
 function setQuality(q){
  limit=DUST_PRESETS[q]||DUST_PRESETS.balanced;
  head=0;
  for(const p of particles)p.age=p.life;
  update(0);
 }
 function setEnabled(value){enabled=!!value;if(!enabled)reset();}
 function reset(){head=0;for(const p of particles)p.age=p.life;update(0);}
 function dispose(){reset();mesh.removeFromParent();geometry.dispose();material.dispose();}
 return {mesh,emit,update,setQuality,setEnvironment,setEnabled,reset,dispose,
   get capacity(){return limit},get wetness(){return wetness},get enabled(){return enabled}};
}
