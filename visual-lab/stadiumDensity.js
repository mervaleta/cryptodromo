/**
 * Alpha18: additive stadium-density scenery, opt-in integration.
 * Does not create horses, races, scoring, camera rigs, timers or a second stadium.
 * Uses instancing for crowd/rails/seats/flags and explicit off-track geometry.
 *
 * LIVE straight course: running envelope |z| <= 20.2. Decorative layer begins
 * at z <= -25.5; trackside modular stands are centered at x=-210,-5,207.
 */
export const DENSITY_STANDS=Object.freeze([
 Object.freeze({x:-210,width:101}),Object.freeze({x:-5,width:122}),
 Object.freeze({x:207,width:101})
]);
export const DENSITY_PRESETS=Object.freeze({
 eco:Object.freeze({railSpacing:11,seatRows:3,crowdPerStand:38,flagsPerStand:9,trees:0}),
 balanced:Object.freeze({railSpacing:6,seatRows:5,crowdPerStand:130,flagsPerStand:20,trees:10}),
 high:Object.freeze({railSpacing:4,seatRows:7,crowdPerStand:230,flagsPerStand:32,trees:18})
});
export const HORSE_VISUAL_TUNING=Object.freeze({
 baselineHeight:2.85,
 recommendedHeight:2.92,
 maxWithoutGateRevision:2.92,
 gateRoofHeight:3.02,
 warning:'Do not exceed the starting gate clearance without raising gate geometry.'
});
export function densityPreset(quality='balanced',softwareGPU=false){
 return DENSITY_PRESETS[softwareGPU?'eco':quality]||DENSITY_PRESETS.balanced;
}
export function safeHorseHeight(requested=HORSE_VISUAL_TUNING.recommendedHeight){
 const n=Number(requested);
 return Number.isFinite(n)?Math.max(2.7,Math.min(HORSE_VISUAL_TUNING.maxWithoutGateRevision,n)):
  HORSE_VISUAL_TUNING.baselineHeight;
}
export function validateDensityLayout(){
 return DENSITY_STANDS.every(({x,width})=>x-width/2>=-400&&x+width/2<=400)&&
  -25.5 < -20.2;
}
/**
 * THREE injected for independent unit testing and to avoid a second copy of
 * Three.js. Can be attached after the original venue and before render loop.
 */
export function createStadiumDensity({THREE,scene,quality='balanced',softwareGPU=false}={}){
 if(!THREE||!scene)throw new Error('THREE and scene are required');
 const preset=densityPreset(quality,softwareGPU);
 const root=new THREE.Group();root.name='Alpha18 · densidad de tribunas y borde de pista';
 const geos=[],mats=[],objects=[];
 const geometry=g=>(geos.push(g),g),material=m=>(mats.push(m),m);
 const cube=geometry(new THREE.BoxGeometry(1,1,1));
 const body=geometry(new THREE.CylinderGeometry(.22,.29,.66,5));
 const head=geometry(new THREE.SphereGeometry(.22,6,5));
 const M={
  iron:material(new THREE.MeshStandardMaterial({color:0x405b50,roughness:.72,metalness:.22})),
  gold:material(new THREE.MeshStandardMaterial({color:0xc8a86e,roughness:.61,metalness:.22})),
  stone:material(new THREE.MeshStandardMaterial({color:0x8d9584,roughness:.96})),
  seat:material(new THREE.MeshStandardMaterial({color:0x245244,roughness:.94})),
  cloth:material(new THREE.MeshStandardMaterial({color:0xede0c3,roughness:1})),
  skin:material(new THREE.MeshStandardMaterial({color:0xc9a484,roughness:1})),
  turf:material(new THREE.MeshStandardMaterial({color:0x315b3e,roughness:1}))
 };
 const dummy=new THREE.Object3D();
 function instance(name,geo,mat,items,colors){
  if(!items.length)return null;
  const mesh=new THREE.InstancedMesh(geo,mat,items.length);
  mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=false;
  for(let i=0;i<items.length;i++){
   const [x,y,z,w,h,d,rot=0]=items[i];
   dummy.position.set(x,y,z);dummy.rotation.set(0,rot,0);
   dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   if(colors)mesh.setColorAt(i,new THREE.Color(colors[i%colors.length]));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  root.add(mesh);objects.push(mesh);return mesh;
 }
 const rails=[],goldRails=[],railPosts=[],steps=[],seats=[],bodies=[],heads=[],flags=[],planters=[];
 // Safety rail remains 5.3 m outside the course. Trackside spectator barrier
 // sits at -31.5, leaving a safe 6 m gap behind the rail.
 for(const z of [-25.5,-31.5]){
  rails.push([0,1.25,z,810,.12,.12]);
  rails.push([0,.65,z,810,.09,.09]);
  for(let x=-402;x<=402;x+=preset.railSpacing)railPosts.push([x,.73,z,.11,1.46,.11]);
 }
 // Three trackside modular fronts. Preserve existing rear grandstands, district,
 // paddock and paths; only this additive scenery moves towards the course.
 for(const stand of DENSITY_STANDS){
  const {x,width}=stand;
  steps.push([x,1.45,-39.8,width+3,2.8,14.8]);
  steps.push([x,2.55,-48.5,width+3,4.5,2.1]);
  for(let row=0;row<preset.seatRows;row++){
   const z=-36.5-row*2.2,y=3.04+row*.57;
   seats.push([x,y-.24,z,width-2,.28,1.8]);
   for(let sx=x-width/2+4;sx<x+width/2-3;sx+=2.7){
    if((Math.round(sx*3)+row)%13===0)continue; // aisles
    seats.push([sx,y,z,1.9,.35,1.18]);
   }
  }
  goldRails.push([x,4.05,-33.5,width+3,.12,.13]);
  for(let sx=x-width/2;sx<=x+width/2;sx+=preset.railSpacing){
   railPosts.push([sx,2.35,-33.5,.13,3.4,.13]);
  }
  // Banner line makes empty concourse legible without introducing logos.
  for(let j=0;j<preset.flagsPerStand;j++){
   const sx=x-width/2+(j+.5)*width/preset.flagsPerStand;
   flags.push([sx,5.0,-32.9,1.15,.55,.08]);
  }
  for(let i=0;i<preset.crowdPerStand;i++){
   // Seeded deterministic population. No frame updates, no random flicker.
   const seed=(i*16807+Math.floor((x+250)*97))>>>0;
   const row=seed%preset.seatRows;
   const u=((Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
   const sx=x+(u-.5)*(width-7),sz=-36.5-row*2.2;
   const sy=3.65+row*.57;
   bodies.push([sx,sy,sz,1,1,1]);
   heads.push([sx,sy+.49,sz,1,1,1]);
  }
 }
 // Low-planter rhythm fills the visually empty gap between track and stands,
 // while keeping a generous 52m clear central concourse.
 for(let x=-380;x<=380;x+=28){
  if(Math.abs(x)<38)continue; // preserve central VIP / finish vista
  planters.push([x,.45,-57,7,.9,2.2]);
 }
 instance('Track rail · longitudinal safety beams',cube,M.iron,rails);
 instance('Track rail · gold top beam',cube,M.gold,goldRails);
 instance('Track rail · balusters',cube,M.iron,railPosts);
 instance('Stands · stepped apron',cube,M.stone,steps);
 instance('Stands · tiered seating',cube,M.seat,seats);
 instance('Stands · audience torsos',body,M.cloth,bodies,
  ['#e9dbbc','#326e65','#c06e4d','#d9c99c','#68929d','#72916d']);
 instance('Stands · audience heads',head,M.skin,heads,
  ['#b68b6b','#d8b38e','#96745f','#e1bda0']);
 instance('Stands · pennants',cube,M.gold,flags);
 instance('Concourse · planted separators',cube,M.turf,planters);
 scene.add(root);
 function setQuality(next='balanced'){
  // Reduce geometry without rebuilding: hide only secondary scenery in eco.
  const eco=next==='eco'||next==='low';
  for(const mesh of objects){
   if(mesh.name.includes('pennants')||mesh.name.includes('planted'))
    mesh.visible=!eco;
  }
 }
 function dispose(){
  root.removeFromParent();root.clear();
  geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
 }
 return {root,dispose,setQuality,stats:{
  additiveOnly:true,courseModified:false,horseModified:false,cameraModified:false,
  stands:DENSITY_STANDS.length,instanceGroups:objects.length,
  crowd:bodies.length,seatPieces:seats.length,rails:railPosts.length
 }};
}
