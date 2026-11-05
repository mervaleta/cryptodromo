/**
 * Hipódromo Satoshi Nakamoto · complementary physical architecture.
 *
 * Coordinates are LOCAL to scene.js's existing vip Group at (0,0,-78) in the
 * translated pavilion (-67 Z). This module never moves the track, building,
 * cameras, horses or scoring. No remote assets; only two shadowless local facade lights.
 *
 * Historic reference: Twin Spires (octagonal cupolas, projecting cornices,
 * iron-supported stands) and Palermo's articulated neoclassical grandstand.
 * This is an original interpretation, not a replica.
 */
export const PAVILION_DETAIL_BOUNDS=Object.freeze({
 minX:-35.5,maxX:35.5,minY:1.16,maxY:23.4,minZ:-5.2,maxZ:14.6
});
export const PAVILION_DETAIL_ID='satoshi-vip-architecture-20261105-v1';

const decorativeGroups=new Set(['Detail · crown dentils','Detail · copper roof seams','Detail · balustrade balusters']);
const inBounds=([x,y,z,w,h,d])=>
 x-w/2>=PAVILION_DETAIL_BOUNDS.minX-.001 &&
 x+w/2<=PAVILION_DETAIL_BOUNDS.maxX+.001 &&
 y-h/2>=PAVILION_DETAIL_BOUNDS.minY-.001 &&
 y+h/2<=PAVILION_DETAIL_BOUNDS.maxY+.001 &&
 z-d/2>=PAVILION_DETAIL_BOUNDS.minZ-.001 &&
 z+d/2<=PAVILION_DETAIL_BOUNDS.maxZ+.001;

export function createSatoshiPavilionDetail({THREE,parent,quality='balanced'}={}){
 if(!THREE||!parent)throw new TypeError('THREE and existing vip parent required');
 const root=new THREE.Group();
 root.name='Satoshi · supports, portico, balcony and roof articulation';
 const basic=new THREE.Group(),ornament=new THREE.Group();
 root.add(basic,ornament);parent.add(root);
 const geometries=[],materials=[],meshGroups=[];
 const boxGeometry=new THREE.BoxGeometry(1,1,1);
 const columnGeometry=new THREE.CylinderGeometry(.42,.49,1,10);
 geometries.push(boxGeometry,columnGeometry);
 const createMat=(color,roughness=.82,metalness=0,emissive=0x000000)=>{
  const m=new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:0});
  materials.push(m);return m;
 };
 const stone=createMat(0xc6c3b3,.92);
 const ivory=createMat(0xe9e4d5,.85);
 const bronze=createMat(0xb79960,.44,.46);
 const iron=createMat(0x27443e,.57,.34);
 const glass=createMat(0x183c40,.23,.22);
 const amber=createMat(0xf4c98d,.59,.12,0xffbb6d);
 const dummy=new THREE.Object3D();
 function batch(name,items,geom,material,group=basic){
  if(!items.length)return null;
  for(const item of items)if(!inBounds(item))throw new RangeError(name+' outside known pavilion base/forecourt: '+item);
  const object=new THREE.InstancedMesh(geom,material,items.length);
  object.name=name;
  object.castShadow=false;object.receiveShadow=true;
  for(let i=0;i<items.length;i++){
   const [x,y,z,w,h,d,yaw=0,pitch=0,roll=0]=items[i];
   dummy.position.set(x,y,z);dummy.scale.set(w,h,d);
   dummy.rotation.set(pitch,yaw,roll);dummy.updateMatrix();
   object.setMatrixAt(i,dummy.matrix);
  }
  object.instanceMatrix.needsUpdate=true;
  object.computeBoundingSphere();
  group.add(object);meshGroups.push(object);return object;
 }
 const stoneParts=[],ivoryParts=[],metalParts=[],bronzeParts=[],glassParts=[],glowParts=[];
 const columns=[],caps=[],roofSeams=[],dentils=[],balusters=[];
 const add=(array,x,y,z,w,h,d,rot=0,pitch=0,roll=0)=>{
  array.push([x,y,z,w,h,d,rot,pitch,roll]);
 };
 // Existing upper pavilion shell begins at y=4.5 and its actual foundation
 // ends at y=1.215. Two inhabited ground-level wings close this 3.3m gap,
 // reserving a wide central vestibule rather than sealing the entire passage.
 for(const side of [-1,1]){
  add(stoneParts,side*20,2.835,0,28,3.19,8.8);
  add(ivoryParts,side*20,4.45,4.65,29.6,.32,.47);
  // Framed ground-floor glazed bays between the structural piers.
  for(const x of [11.5,20,28.5]){
   add(glassParts,side*x,2.95,4.61,3.65,2.05,.09);
   add(ivoryParts,side*x,4.02,4.78,4.08,.17,.24);
   add(ivoryParts,side*x,1.89,4.78,4.08,.17,.24);
   add(bronzeStrip(),side*x,2.95,4.77,.09,2.05,.13);
  }
 }
 // Load-bearing open arcade: each column reaches the ground or the
 // forecourt, rather than disappearing beneath the floating first floor.
 for(const x of [-32,-24,-16,-8,8,16,24,32]){
  add(columns,x,3.78,5.02,1,5.0,1);
  add(caps,x,6.36,5.02,1.32,.38,1.32);
  add(caps,x,1.31,5.02,1.32,.30,1.32);
 }
 for(const x of [-29,-17,-5,5,17,29]){
  add(columns,x,3.74,8.68,.93,4.76,.93);
  add(caps,x,6.23,8.68,1.26,.38,1.26);
  add(caps,x,1.32,8.68,1.26,.30,1.26);
 }
 // Canopy and upper promenade form a continuous load path above the arcade.
 add(stoneParts,0,6.28,6.8,70.7,.65,6.6);
 add(ivoryParts,0,6.76,9.99,70.7,.23,.37);
 add(ironParts(),0,7.22,10.12,70.4,.12,.14);
 add(ironParts(),0,7.95,10.12,70.4,.12,.14);
 for(let x=-34;x<=34;x+=1.7)add(balusters,x,7.55,10.12,.105,.75,.13);
 // Vestibule doors, sidelights and a real lintel rather than a flat decal.
 add(glassParts,-2.0,2.76,4.79,3.83,2.87,.13);
 add(glassParts,2.0,2.76,4.79,3.83,2.87,.13);
 add(metalParts,-4.12,2.79,4.97,.18,3.13,.23);
 add(metalParts,4.12,2.79,4.97,.18,3.13,.23);
 add(metalParts,0,2.79,4.97,.13,3.13,.23);
 add(ivoryParts,0,4.51,4.94,9.03,.34,.36);
 for(const x of [-3.2,3.2])add(bronzeStrip(),x,2.8,5.03,.08,.45,.08);
 // Detailed facade has exposed window lintels, vertical articulation and
 // dentil cornice, but never hides the existing twin towers or front sign.
 add(ivoryParts,0,17.65,5.16,70.1,.42,.55);
 add(bronzeStrip(),0,18.06,5.27,70.8,.10,.23);
 for(let x=-34;x<=34;x+=1.7)add(dentils,x,17.38,5.32,.65,.45,.54);
 for(const x of [-34.1,-30,-23.2,-16.4,-9.6,-2.8,4,10.8,17.6,24.4,31.2]){
  add(ivoryParts,x,12.2,4.96,.35,11.2,.48);
 }
 // Copper flashing and standing seams articulate the existing upper roof.
 for(let x=-33;x<=33;x+=2.75)add(roofSeams,x,19.97,-.4,.085,.12,9.1);
 add(metalParts,0,19.93,5.21,70.9,.18,.20);
 add(metalParts,0,19.93,-5.0,70.9,.18,.20);
 // A central ceremonial pediment bridges the two existing spires.
 // Its outline stays below the roofline of both octagonal cupolas.
 add(ivoryParts,0,20.12,5.16,20,.52,.60);
 add(ironParts(),0,21.18,5.20,13.1,.16,.27,0,0,.31);
 add(ironParts(),0,21.18,5.20,13.1,.16,.27,0,0,-.31);
 add(bronzeStrip(),0,22.39,5.22,.6,.59,.6);
 // Night-only reflective entrance sconces; emissive materials do not
 // introduce expensive dynamic PointLights or shadow maps.
 for(const x of [-34,-9,9,34]){
  add(glowParts,x,5.0,5.04,.36,.77,.21);
 }
 function bronzeStrip(){return bronzeParts;}
 function ironParts(){return metalParts;}
 batch('Structure · ground floor and balcony',stoneParts,boxGeometry,stone);
 batch('Structure · limestone trim and architraves',ivoryParts,boxGeometry,ivory);
 batch('Structure · arcade columns',columns,columnGeometry,stone);
 batch('Structure · capitals and bases',caps,boxGeometry,bronze);
 batch('Structure · portal and rail hardware',metalParts,boxGeometry,iron);
 batch('Structure · gilded arch accents',bronzeParts,boxGeometry,bronze);
 batch('Structure · recessed glass and doors',glassParts,boxGeometry,glass);
 batch('Detail · crown dentils',dentils,boxGeometry,ivory,ornament);
 batch('Detail · copper roof seams',roofSeams,boxGeometry,bronze,ornament);
 batch('Detail · balustrade balusters',balusters,boxGeometry,iron,ornament);
 batch('Detail · sconce lenses',glowParts,boxGeometry,amber,ornament);
 // Two restrained, shadowless facade wash lights live in VIP-local coordinates.
 // They are not race floodlights and cannot affect course geometry.
 const facadeWash=[];
 for(const x of [-20,20]){
  const lamp=new THREE.SpotLight(0xffdfae,0,48,Math.PI/3,.74,2);
  lamp.position.set(x,8.6,14.2); // stays inside the published detail envelope
  lamp.target.position.set(x,12.6,4.6);
  lamp.castShadow=false;
  root.add(lamp,lamp.target);
  facadeWash.push(lamp);
 }
 let night=false,wetness=0,qualityMode=quality;
 function updateWash(){
  const enabled=night&&qualityMode!=='eco'&&qualityMode!=='low';
  for(const lamp of facadeWash)lamp.intensity=enabled?950:0;
 }

 function setEnvironment({night:nextNight=false,wetness:nextWet=0}={}){
  night=Boolean(nextNight);
  wetness=Math.max(0,Math.min(1,Number(nextWet)||0));
  amber.emissiveIntensity=night?1.3:.055;
  glass.roughness=.23-wetness*.09;
  iron.roughness=.57-wetness*.13;
  bronze.roughness=.44-wetness*.08;
  updateWash();
 }
 function setQuality(next='balanced'){
  qualityMode=next;
  ornament.visible=next!=='eco'&&next!=='low';
  updateWash();
 }
 function dispose(){
  root.removeFromParent();root.clear();
  geometries.forEach(item=>item.dispose());
  materials.forEach(item=>item.dispose());
  facadeWash.forEach(lamp=>lamp.dispose?.());
 }
 setEnvironment();setQuality(quality);
 return {
  root,setEnvironment,setQuality,dispose,
  stats:Object.freeze({
   version:PAVILION_DETAIL_ID,
   geometryOnly:true,changesCourse:false,changesCamera:false,
   tracksAffected:0,instances:meshGroups.reduce((sum,m)=>sum+m.count,0),
   batches:meshGroups.length,foundationSupported:true,
   colonnade:columns.length,canopy:true,hasGroundEntrance:true,
   facadeLights:facadeWash.length,shadowsAdded:0,
   bounds:PAVILION_DETAIL_BOUNDS
  }),
  get environment(){return {night,wetness,washIntensity:facadeWash[0]?.intensity||0};}
 };
}
