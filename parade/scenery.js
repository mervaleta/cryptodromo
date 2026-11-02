import * as THREE from 'three';
/**
 * Parade village, designed around the oval, not the old 810m-long grandstand.
 * Stand fragments total 324m, leaving visible gaps to the paddock, stalls
 * and service accesses. Instanced crowd + bulbs; only three real point lights.
 * Decorative only, never changes timing or horse positions.
 */
export function createParadeVillage(scene,{quality='balanced'}={}){
 const root=new THREE.Group();root.name='Cryptódromo · barrio vivo, tribunas modulares';scene.add(root);
 const resources={geometries:new Set(),materials:new Set(),textures:new Set()};
 const geo=g=>(resources.geometries.add(g),g);
 const mat=m=>(resources.materials.add(m),m);
 const texture=t=>(resources.textures.add(t),t);
 const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
 const cylGeo=geo(new THREE.CylinderGeometry(.5,.5,1,9));
 const coneGeo=geo(new THREE.ConeGeometry(1,1,4));
 const sphGeo=geo(new THREE.SphereGeometry(1,8,6));
 const surface=(color,options={})=>mat(new THREE.MeshStandardMaterial({color,roughness:.85,...options}));
 const M={
  stone:surface('#b2b5aa'),steel:surface('#3b5550',{metalness:.42,roughness:.49}),
  wood:surface('#7e6449'),roof:surface('#29443b',{metalness:.18}),
  seat:surface('#2c5550'),ivory:surface('#e6d5ac'),
  terracotta:surface('#b36848'),cobalt:surface('#36738b'),
  red:surface('#b65d55'),hay:surface('#c6a369'),sack:surface('#d2bf96'),
  water:surface('#487b89',{roughness:.22,metalness:.14}),
  grass:surface('#477050'),road:surface('#626965'),
  lamp:surface('#ffead0',{emissive:'#ffd6a5',emissiveIntensity:1.6}),
  tent:surface('#cfbc8a', {side:THREE.DoubleSide})
 };
 function mesh(geometry,material,parent=root){
  const o=new THREE.Mesh(geometry,material);o.castShadow=false;o.receiveShadow=false;
  parent.add(o);return o;
 }
 function cube(parent,x,y,z,w,h,d,material){
  const o=mesh(boxGeo,material,parent);o.position.set(x,y,z);o.scale.set(w,h,d);return o;
 }
 function cylinder(parent,x,y,z,r,h,material,rot=0){
  const o=mesh(cylGeo,material,parent);o.position.set(x,y,z);o.scale.set(r,h,r);o.rotation.z=rot;return o;
 }
 function cone(parent,x,y,z,r,h,material){
  const o=mesh(coneGeo,material,parent);o.position.set(x,y,z);o.scale.set(r,h,r);o.rotation.y=Math.PI/4;return o;
 }
 function sign(label,parent,x,y,z,width=18){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#102820';ctx.fillRect(0,0,512,96);
  ctx.fillStyle='#c8ad74';ctx.fillRect(0,0,512,5);ctx.fillRect(0,90,512,6);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 43px system-ui,Arial,sans-serif';ctx.fillStyle='#fff0c9';
  ctx.fillText(label,256,48,485);
  const tx=texture(new THREE.CanvasTexture(canvas));tx.colorSpace=THREE.SRGBColorSpace;
  const plane=mesh(geo(new THREE.PlaneGeometry(width,width*96/512)),
    mat(new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide})),parent);
  plane.position.set(x,y,z);return plane;
 }
 // Exposed plaza circulation, south of the oval (+Z), outside ±21m lanes.
 const plaza=new THREE.Group();plaza.name='Plaza de visitantes, comida y logística';root.add(plaza);
 cube(plaza,0,-.34,144,770,.22,87,M.road);
 cube(plaza,0,-.19,111,730,.08,5,M.ivory);
 cube(plaza,0,-.26,186,790,.10,11,M.road);
 // Three short stands instead of one enormous 810m block.
 const stands=new THREE.Group();stands.name='Tres tribunas bajas separadas';root.add(stands);
 const standCenters=[-210,-5,207],standW=[101,122,101];
 for(let i=0;i<standCenters.length;i++){
  const x=standCenters[i],width=standW[i],piece=new THREE.Group();
  piece.name='Tribuna '+(i+1);stands.add(piece);
  cube(piece,x,1.7,-114,width,3.4,18,M.stone);
  for(let row=0;row<7;row++){
   const y=3.9+row*.93,z=-107-row*2.6;
   cube(piece,x,y,z,width,.3,2.7,row%3===0?M.ivory:M.seat);
   cube(piece,x,y+.34,z+1.2,width,.11,.12,M.steel);
  }
  // Short roof and lighting (not an uninterrupted shadow-casting mega-roof).
  cube(piece,x,12.8,-115,width+2,.56,23,M.roof);
  for(const end of [-1,1])cylinder(piece,x+end*(width/2-3),6.4,-127,.28,12.2,M.steel);
  sign(i===1?'GRAN TRIBUNA':i===0?'TRIBUNA ESTE':'TRIBUNA OESTE',piece,x,11.9,-103,Math.min(42,width*.46));
 }
 // A lightweight crowd with stable instance colors and no per-person shadows.
 const crowdN=quality==='eco'?96:quality==='cinematic'?315:220;
 const torso=new THREE.InstancedMesh(boxGeo,mat(new THREE.MeshStandardMaterial({roughness:.9,vertexColors:false,color:'#ffffff'})),crowdN);
 const heads=new THREE.InstancedMesh(sphGeo,surface('#d7b9a1'),crowdN);
 torso.name='Público · cuerpos instanciados';heads.name='Público · cabezas instanciadas';
 torso.castShadow=false;heads.castShadow=false;torso.receiveShadow=false;heads.receiveShadow=false;
 let seed=20261102;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const colors=['#d5d3c1','#4d8f7d','#d2ae70','#8cbad0','#b36952','#f0c8ad','#6e859e'];
 const transform=new THREE.Object3D();
 for(let i=0;i<crowdN;i++){
  const s=i%3,x=standCenters[s],width=standW[s];
  const row=Math.floor(rand()*7),z=-107-row*2.6;
  const cx=x+(rand()-.5)*(width-8),y=4.7+row*.93;
  transform.position.set(cx,y,z);transform.scale.set(.65,1.35,.45);transform.updateMatrix();
  torso.setMatrixAt(i,transform.matrix);torso.setColorAt(i,new THREE.Color(colors[Math.floor(rand()*colors.length)]));
  transform.position.set(cx,y+1.04,z);transform.scale.set(.43,.43,.43);transform.updateMatrix();
  heads.setMatrixAt(i,transform.matrix);
 }
 torso.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
 if(torso.instanceColor)torso.instanceColor.needsUpdate=true;
 stands.add(torso,heads);
 // Food-court: six vendor stalls, with awnings, lightboxes and distinct colors.
 const food=new THREE.Group();food.name='Paseo de puestos de comida rápida';plaza.add(food);
 const labels=['HAMBURGUESAS','PIZZAS','CAFÉ','EMPANADAS','JUGOS','HELADOS'];
 const roofs=[M.terracotta,M.roof,M.cobalt,M.red,M.terracotta,M.cobalt];
 for(let i=0;i<labels.length;i++){
  const x=-270+i*106;
  const market=new THREE.Group();market.name='Puesto: '+labels[i];food.add(market);
  cube(market,x,2,154,22,4,14,M.wood);
  cube(market,x,4.6,154,26,.55,18,roofs[i]);
  cube(market,x,2.3,146.8,18,1.2,1.2,M.ivory);
  for(const end of [-1,1])cube(market,x+end*11.8,2.4,145.8,.3,4.8,.3,M.steel);
  sign(labels[i],market,x,5.1,145.5,20);
  // Food service at the back, public boardwalk in front.
  cube(market,x,.18,141,25,.16,6,M.road);
 }
 // Four canvas tents, structural poles, flaglets and seating.
 const camp=new THREE.Group();camp.name='Carpas de visitantes y descanso';plaza.add(camp);
 for(let i=0;i<4;i++){
  const x=-240+i*152,z=189;
  const tent=new THREE.Group();tent.name='Carpa '+(i+1);camp.add(tent);
  cube(tent,x,.12,z,23,.2,19,M.wood);
  for(const dx of [-9,9])for(const dz of [-7,7])cylinder(tent,x+dx,2.4,z+dz,.13,4.8,M.steel);
  const roof=mesh(coneGeo,i%2?M.ivory:M.tent,tent);roof.scale.set(17,6,13);
  roof.position.set(x,7.15,z);roof.rotation.y=Math.PI/4;
  cube(tent,x,1.8,z+1,10,1,3,M.wood);
 }
 // Machinery and horse supplies. Vehicles are parked OUTSIDE the racing oval.
 const yard=new THREE.Group();yard.name='Maquinaria y aprovisionamiento de caballos';root.add(yard);
 const equipmentX=[355,403,451];
 for(let i=0;i<equipmentX.length;i++){
  const x=equipmentX[i],z=94+i*24;
  const lorry=new THREE.Group();lorry.name=i===0?'Camión alisador de pista':'Vehículo de mantenimiento';yard.add(lorry);
  cube(lorry,x,2.1,z,12,3.8,5.3,i%2?M.terracotta:M.cobalt);
  cube(lorry,x+4,3.6,z,4.6,3.3,5.0,M.stone);
  cube(lorry,x+5.6,3.9,z,1,1.65,3.2,M.water);
  for(const side of [-1,1])for(const dx of [-3.5,3.7]){
   const wheel=cylinder(lorry,x+dx,1,z+side*2.8,1.05,1.1,M.steel,Math.PI/2);
   wheel.rotation.x=Math.PI/2;
  }
  if(i===0){
   cube(lorry,x-8,.7,z,5,.45,7,M.steel);
   for(let n=0;n<7;n++)cube(lorry,x-9.4,.35,z-3+n,1,.7,.08,M.wood);
  }
 }
 const supplies=new THREE.Group();supplies.name='Depósito de forraje, agua, herramientas y arreos';yard.add(supplies);
 for(let i=0;i<32;i++){
  const x=336+(i%8)*2.7,y=.68+Math.floor(i/8)*1.45,z=176+(i%3)*1.5;
  cube(supplies,x,y,z,2.3,1.2,1.5,M.hay);
 }
 for(let i=0;i<14;i++){
  const x=390+(i%7)*2.1,z=172+Math.floor(i/7)*3.1;
  const sack=cylinder(supplies,x,.76,z,.57,1.5,M.sack);
  sack.rotation.z=(i%3-1)*.11;
 }
 for(const x of [352,376,404]){
  cube(supplies,x,.65,162,7,1.1,3.5,M.steel);
  cube(supplies,x,1.21,162,6.5,.12,3,M.water);
 }
 // Lamps: 18 upper stands + 30 footpath = ONE emissive instanced draw call.
 const lampLocations=[];
 for(const center of standCenters)for(let i=-2;i<=3;i++){
  const x=center+i*16;
  lampLocations.push([x,11.6,-109]);
 }
 for(let i=0;i<30;i++){
  const x=-370+i*25;
  lampLocations.push([x,7.0,112]);
 }
 const lightPosts=new THREE.InstancedMesh(cylGeo,M.steel,lampLocations.length);
 const lightBulbs=new THREE.InstancedMesh(sphGeo,M.lamp,lampLocations.length);
 for(let i=0;i<lampLocations.length;i++){
  const [x,y,z]=lampLocations[i],height=y-0.45;
  transform.position.set(x,height*.5,z);transform.scale.set(.12,height,.12);transform.updateMatrix();
  lightPosts.setMatrixAt(i,transform.matrix);
  transform.position.set(x,y,z);transform.scale.set(.65,.36,.65);transform.updateMatrix();
  lightBulbs.setMatrixAt(i,transform.matrix);
 }
 lightPosts.instanceMatrix.needsUpdate=true;lightBulbs.instanceMatrix.needsUpdate=true;
 root.add(lightPosts,lightBulbs);
 // A few restrained physically illuminating lights, NOT 48 shadowed points.
 const actualLights=[];
 for(const [x,z] of [[-210,-113],[0,-113],[205,-113],[0,150]]){
  const l=new THREE.PointLight('#ffe0b5',0,78,2);
  l.position.set(x,12,z);l.castShadow=false;root.add(l);actualLights.push(l);
 }
 // Vendor area visitors stroll slowly on paved pedestrian paths.
 const walkers=Array.from({length:14},(_,i)=>{
  const person=new THREE.Group();person.name='Visitante '+(i+1);
  const clothes=surface(colors[i%colors.length]);
  cube(person,0,1.05,0,.7,1.3,.45,clothes);
  const head=mesh(sphGeo,M.sack,person);head.position.set(0,1.95,0);head.scale.set(.37,.37,.37);
  plaza.add(person);
  return {person,phase:i*.73,baseX:-340+i*50,z:115+(i%3)*5};
 });
 let lastAnimate=-Infinity,lightIntensity=1;
 function setEnvironment({night=false,wetness=0,lightLevel=1}={}){
  const dusk=night?1:.12;
  lightIntensity=Math.max(0,Math.min(2,Number(lightLevel)||0));
  M.lamp.emissiveIntensity=dusk*3.6*lightIntensity;
  for(const l of actualLights)l.intensity=dusk*75*lightIntensity;
  M.roof.roughness=.38+Math.min(1,Math.max(0,Number(wetness)||0))*.08;
 }
 function setQuality(next){
  const low=next==='eco';
  walkers.forEach((w,i)=>{w.person.visible=!low||i<5});
  torso.count=low?Math.min(crowdN,75):next==='cinematic'?crowdN:Math.min(crowdN,190);
  heads.count=torso.count;
  actualLights.forEach((l,i)=>{l.visible=!low||i===1});
 }
 function update(seconds){
  const t=Math.max(0,Number(seconds)||0);
  if(t-lastAnimate<.09)return;lastAnimate=t;
  walkers.forEach((w,i)=>{
   const u=t*.35+w.phase;
   w.person.position.set(w.baseX+Math.sin(u)*8,0,w.z+Math.cos(u*.47)*1.7);
   w.person.rotation.y=Math.sin(u)*.3;
  });
 }
 function dispose(){
  root.removeFromParent();root.clear();
  for(const g of resources.geometries)g.dispose();
  for(const m of resources.materials)m.dispose();
  for(const t of resources.textures)t.dispose();
 }
 setEnvironment();setQuality(quality);
 return {root,setEnvironment,setQuality,update,dispose,
  stats:Object.freeze({stands:3,standLengthMeters:standW.reduce((a,b)=>a+b,0),foodStalls:6,
    tents:4,maintenanceVehicles:3,feedHayBales:32,walkers:14,bulbs:lampLocations.length,realPointLights:4}),
  sights:Object.freeze([
    {id:'tribunas',name:'Tribunas y público',x:0,y:7,z:-115},
    {id:'comida',name:'Paseo gastronómico',x:0,y:4,z:151},
    {id:'carpas',name:'Carpas y paseo',x:-8,y:4,z:187},
    {id:'maquinas',name:'Mantenimiento y alisadora',x:395,y:3,z:118},
    {id:'insumos',name:'Insumos y forraje',x:368,y:3,z:173},
    {id:'pista',name:'Óvalo y caballos',x:0,y:1,z:72}
  ])};
}
