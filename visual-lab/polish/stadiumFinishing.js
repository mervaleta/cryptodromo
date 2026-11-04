/**
 * Alpha21 stadium finishing layer. Opt-in, exterior-only and instanced.
 * Does NOT generate tracks, spectators, horses, weather, camera rigs or scores.
 * The straight Satoshi course is within |z|<=20.2; this kit stays at z>=57.
 * Reuse the same THREE context and scene, and dispose explicitly.
 */
export const STADIUM_THEMES=Object.freeze({
 satoshi:{accent:'#d8b76b',bg:'#0d2420',title:'SATOSHI NAKAMOTO',story:['GENESIS BLOCK','PISTA MUYBRIDGE','PROOF OF RACE']},
 merval:{accent:'#80c8e2',bg:'#102638',title:'BUENOS AIRES · MERVAL',story:['PLAZA FINANCIERA','CAMPANAS DE MERCADO','GRAN PREMIO MERVAL']},
 'wall-street':{accent:'#ceb78a',bg:'#172a37',title:'WALL STREET',story:['FINANCIAL DISTRICT','OPENING BELL','MARKET VELOCITY']},
 tokyo:{accent:'#e8a8a7',bg:'#2a1c2c',title:'TOKYO',story:['PACIFIC EXCHANGE','TOKYO SESSION','MIDNIGHT CIRCUIT']},
 london:{accent:'#a5bbd4',bg:'#1c2738',title:'LONDON',story:['CITY OF LONDON','MARKET HOURS','THAMES CIRCUIT']},
 commodities:{accent:'#dabb7a',bg:'#37271b',title:'COMMODITIES',story:['METALS','ENERGY','GRAIN TRACK']},
 forex:{accent:'#a3d3b5',bg:'#162f28',title:'FOREX',story:['GLOBAL CURRENCIES','CROSS RATES','TWENTY-FOUR SEVEN']},
 champions:{accent:'#f1ca6a',bg:'#251c3c',title:'CHAMPIONS',story:['MASTERS MEET','WORLD CIRCUIT','FINAL PODIUM']}
});
export const DECOR_OFF_TRACK_Z=57;
export const DECOR_PRESETS=Object.freeze({eco:0,balanced:1,high:2});
export function validateDecorFootprint(){
 return DECOR_OFF_TRACK_Z>53&&DECOR_OFF_TRACK_Z>20.2+30;
}
export function getStadiumTheme(id='satoshi'){return STADIUM_THEMES[id]||STADIUM_THEMES.satoshi;}
export function createStadiumFinishing({THREE,scene,stadiumId='satoshi',quality='balanced'}={}){
 if(!THREE?.InstancedMesh||!scene)throw Error('THREE and scene required');
 if(!validateDecorFootprint())throw Error('Stadium decor infringes track safety boundary');
 const theme=getStadiumTheme(stadiumId),root=new THREE.Group();
 root.name='Alpha21 · stadium identity and broadcast finishing';
 const geo=[],materials=[],textures=[];
 const ownGeo=g=>(geo.push(g),g),ownMat=m=>(materials.push(m),m);
 const box=ownGeo(new THREE.BoxGeometry(1,1,1));
 const iron=ownMat(new THREE.MeshStandardMaterial({color:0x4c625c,metalness:.63,roughness:.40}));
 const bronze=ownMat(new THREE.MeshStandardMaterial({color:new THREE.Color(theme.accent),metalness:.54,roughness:.42}));
 const concrete=ownMat(new THREE.MeshStandardMaterial({color:0x67736b,metalness:.06,roughness:.91}));
 const glow=ownMat(new THREE.MeshStandardMaterial({color:new THREE.Color(theme.bg),emissive:new THREE.Color(theme.accent),emissiveIntensity:.18,metalness:.32,roughness:.44}));
 const dummy=new THREE.Object3D();let phase='presentation',night=false,wet=0,mode=quality;
 const signGroup=new THREE.Group();root.add(signGroup);
 function instances(name,mat,items,cast=false){
  const m=new THREE.InstancedMesh(box,mat,items.length);m.name=name;
  m.castShadow=cast;m.receiveShadow=false;m.frustumCulled=false;
  items.forEach(([x,y,z,w,h,d,angle=0],i)=>{
   dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);
   dummy.scale.set(w,h,d);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
  });
  m.instanceMatrix.needsUpdate=true;root.add(m);return m;
 }
 const piers=[],caps=[],walls=[],led=[],floor=[];
 // Edge-side lamps and distance markers on the opposite side of the
 // existing -25.5m spectator rail. No overlaps with the original finish gantry.
 for(let i=0;i<9;i++){
  const x=-360+i*90;
  piers.push([x,3.2,61,.4,6.4,.4]);
  caps.push([x,6.5,61,3.6,.25,.85]);
  led.push([x,5.9,60.51,3.15,.49,.10]);
  floor.push([x,.17,61,4.6,.33,2.3]);
 }
 // Six discrete race-day sponsor-free status panels along the far edge.
 for(let i=0;i<6;i++){
  const x=-305+i*122;
  walls.push([x,1.18,57.4,37,2.05,.3]);
  led.push([x,2.15,57.19,34,.11,.16]);
 }
 // A single photo-finish camera housing OUTSIDE the course perimeter.
 piers.push([398,4.5,61,.92,9,.92]);
 caps.push([398,9.1,61,5,1.45,3.4]);
 walls.push([398,5.2,61,2.7,1.4,2.7]);
 const steelMesh=instances('Broadcast · steel supports',iron,piers);
 instances('Broadcast · antique metal trim',bronze,caps);
 instances('Broadcast · external consoles',concrete,walls.concat(floor));
 const luminousMesh=instances('Broadcast · illuminated running edges',glow,led);
 const signage=[];
 function sign(text,x,y,z,w=31,h=2.6){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('2D canvas required for stadium signs');
  ctx.fillStyle=theme.bg;ctx.fillRect(0,0,1024,160);
  ctx.fillStyle=theme.accent;ctx.fillRect(0,0,1024,11);
  ctx.fillStyle='#f9f5e9';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 59px Arial,sans-serif';ctx.fillText(text,512,89,940);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  textures.push(texture);
  const material=ownMat(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  const geometry=ownGeo(new THREE.PlaneGeometry(w,h));
  const plane=new THREE.Mesh(geometry,material);
  plane.position.set(x,y,z);plane.rotation.y=0;plane.castShadow=false;
  signGroup.add(plane);signage.push(plane);
 }
 const text=theme.story;
 sign(text[0],-245,3.35,57.08,32,2.65);
 sign(text[1],-2,3.35,57.08,32,2.65);
 sign(text[2],245,3.35,57.08,32,2.65);
 scene.add(root);
 function update({racePhase=phase,localHour=17.5,wetness=wet}={}){
  phase=racePhase;night=localHour<6||localHour>=19;
  wet=Math.max(0,Math.min(1,Number(wetness)||0));
  glow.emissiveIntensity=(night?.68:.25)*(phase==='race'?1.3:phase==='results'?1.65:1);
  bronze.roughness=.42-wet*.17;iron.roughness=.40-wet*.14;
  concrete.roughness=.91-wet*.15;
 }
 function setQuality(next){
  mode=DECOR_PRESETS[next]===undefined?'balanced':next;
  signGroup.visible=mode!=='eco';
  luminousMesh.visible=mode!=='eco';
 }
 function dispose(){
  root.removeFromParent();root.clear();
  geo.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 }
 setQuality(quality);update();
 return {root,setQuality,update,dispose,theme,
  stats:{trackModified:false,crowdAdded:false,lightsAdded:0,meshes:4,signs:signage.length,
   renderLayers:4+signage.length,clearanceZ:DECOR_OFF_TRACK_Z}};
}
