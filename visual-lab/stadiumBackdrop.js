import * as THREE from 'three';
/**
 * Alpha13 low-draw-call world backdrop. Decorative only.
 * All scenery is outside the 12-lane racing envelope and has no shadows.
 */
export function createStadiumBackdrop(scene,{softwareGPU=false,mobile=false}={}){
 const root=new THREE.Group();root.name='Cryptodromo · parklands and city horizon';scene.add(root);
 let state=619707;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const buildingN=softwareGPU?24:mobile?45:95;
 const geo=new THREE.BoxGeometry(1,1,1);
 const facade=new THREE.MeshStandardMaterial({color:'#657776',roughness:.9,metalness:.03});
 const skyline=new THREE.InstancedMesh(geo,facade,buildingN);
 const buildings=[];
 skyline.castShadow=false;skyline.receiveShadow=false;skyline.frustumCulled=false;
 const colors=['#536864','#75867f','#6e7a79','#8c8b7c','#4e686b','#617a70','#687676'];
 const dummy=new THREE.Object3D();
 for(let i=0;i<buildingN;i++){
  const back=i%2===0;
  const x=(rand()-.5)*1100,z=back?-315-rand()*95:315+rand()*105;
  const w=7+rand()*20,h=9+rand()*49,d=8+rand()*14;
  dummy.position.set(x,h/2-.25,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
  skyline.setMatrixAt(i,dummy.matrix);skyline.setColorAt(i,new THREE.Color(colors[Math.floor(rand()*colors.length)]));
  buildings.push({x,z,w,h,d});
 }
 skyline.instanceMatrix.needsUpdate=true;
 if(skyline.instanceColor)skyline.instanceColor.needsUpdate=true;
 root.add(skyline);
 // Human-scale window bays and parapets make the distant town read as actual
 // buildings rather than unadorned skyline boxes. Both are a single draw call.
 const roofGeo=new THREE.BoxGeometry(1,1,1);
 const roofMaterial=new THREE.MeshStandardMaterial({color:'#354e4c',metalness:.24,roughness:.72});
 const parapets=new THREE.InstancedMesh(roofGeo,roofMaterial,buildings.length);
 const windowGeo=new THREE.BoxGeometry(1,1,1),windowPositions=[];
 for(const building of buildings){
  const {x,z,w,h,d}=building;
  dummy.position.set(x,h+.26,z);
  dummy.rotation.set(0,0,0);
  dummy.scale.set(w+.9,.52,d+1.1);
  dummy.updateMatrix();
  parapets.setMatrixAt(windowPositions.length===-1?0:buildings.indexOf(building),dummy.matrix);
  const cols=Math.min(9,Math.max(2,Math.floor(w/3.0)));
  const rows=Math.min(13,Math.max(2,Math.floor(h/4.4)));
  // Facade faces the stadium, independently of which side of the track.
  const facingZ=z<0?z+d/2+.065:z-d/2-.065;
  for(let row=0;row<rows;row++){
   const height=2.7+row*(h-4.2)/rows;
   for(let col=0;col<cols;col++){
    const bx=x-w*.5+(col+.5)*w/cols;
    windowPositions.push([bx,height,facingZ,Math.min(1.5,w/cols*.48),1.7,.10]);
   }
  }
 }
 parapets.instanceMatrix.needsUpdate=true;
 parapets.castShadow=false;parapets.receiveShadow=false;
 parapets.computeBoundingSphere();root.add(parapets);
 const glassMaterial=new THREE.MeshStandardMaterial({
  color:'#b0c2b8',metalness:.10,roughness:.44,
  emissive:'#ffdfac',emissiveIntensity:.06
 });
 const windows=new THREE.InstancedMesh(windowGeo,glassMaterial,windowPositions.length);
 for(let i=0;i<windowPositions.length;i++){
  const [x,y,z,w,h,d]=windowPositions[i];
  dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);
  dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix);
 }
 windows.instanceMatrix.needsUpdate=true;
 windows.castShadow=false;windows.receiveShadow=false;
 windows.computeBoundingSphere();root.add(windows);
 // Forest edge uses instancing, two draw calls for the entire woodland.
 const forestGroup=new THREE.Group();forestGroup.name='Backdrop · perimeter woodland';root.add(forestGroup);
 const forestN=softwareGPU?75:mobile?140:280;
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.5,.7,1,5),new THREE.MeshStandardMaterial({color:'#4d4b39',roughness:1}),forestN);
 const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,6),new THREE.MeshStandardMaterial({color:'#376047',roughness:1}),forestN);
 const greens=['#34563b','#496d42','#375f4b','#567149','#2e5142'];
 for(let i=0;i<forestN;i++){
  const back=i%2===0;
  const x=(rand()-.5)*1100,z=back?-290-rand()*35:245+rand()*34;
  const h=8+rand()*16,r=3+rand()*4.5;
  dummy.position.set(x,h*.24,z);dummy.scale.set(1,h*.48,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,h*.69,z);dummy.scale.set(r,h*.73,r);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
  crowns.setColorAt(i,new THREE.Color(greens[Math.floor(rand()*greens.length)]));
 }
 for(const mesh of [trunks,crowns]){
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;forestGroup.add(mesh);
 }
 // Service road, maintenance buildings and race-day equipment beyond the outer fence.
 const roadMaterial=new THREE.MeshStandardMaterial({color:'#56625b',roughness:1});
 const road=new THREE.Mesh(new THREE.BoxGeometry(1060,.07,9),roadMaterial);
 road.position.set(0,-.08,268);road.receiveShadow=false;root.add(road);
 const barnMat=new THREE.MeshStandardMaterial({color:'#a2a296',roughness:.88});
 const roofMat=new THREE.MeshStandardMaterial({color:'#374e48',roughness:.83});
 for(let i=0;i<7;i++){
  const x=-430+i*133,y=4.5,z=285+(i%2)*17;
  const barn=new THREE.Mesh(new THREE.BoxGeometry(26,9,13),barnMat);
  barn.position.set(x,y,z);root.add(barn);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(18,5.5,4),roofMat);
  roof.position.set(x,11.3,z);roof.rotation.y=Math.PI/4;root.add(roof);
 }
 const bannerMaterial=new THREE.MeshBasicMaterial({color:'#d2b779',side:THREE.DoubleSide});
 for(let i=0;i<16;i++){
  const banner=new THREE.Mesh(new THREE.PlaneGeometry(2.8,5.2),bannerMaterial);
  banner.position.set(-405+i*54,5,234);root.add(banner);
 }
 let night=false,wetness=0;
 function setEnvironment({night:nextNight=false,wetness:nextWet=0}={}){
  night=Boolean(nextNight);
  wetness=Math.max(0,Math.min(1,Number(nextWet)||0));
  glassMaterial.emissiveIntensity=night?.96:.055;
  facade.roughness=.9-wetness*.12;
  roofMaterial.roughness=.72-wetness*.16;
 }
 function setQuality(next='balanced'){
  // Window detail may be omitted on the strictest GPU budget; the building
  // silhouettes and roofs themselves always remain in the world.
  windows.visible=next!=='eco'&&next!=='low';
 }
 function setTreeVisible(visible){forestGroup.visible=Boolean(visible);}
 function dispose(){
  root.removeFromParent();
  const geometries=new Set(),materials=new Set();
  root.traverse(object=>{
   if(object.geometry)geometries.add(object.geometry);
   if(object.material){
    const all=Array.isArray(object.material)?object.material:[object.material];
    for(const m of all)materials.add(m);
   }
  });
  for(const item of geometries)item.dispose();
  for(const item of materials)item.dispose();
  root.clear();
 }
 setEnvironment();setQuality(softwareGPU?'eco':'balanced');
 return {root,setEnvironment,setQuality,setTreeVisible,dispose,
  stats:Object.freeze({
   version:'satoshi-world-backdrop-facades-v1',
   buildings:buildingN,windowBays:windowPositions.length,
   roofDrawGroups:1,windowDrawGroups:1,
   affectsRace:false
  })};
}
