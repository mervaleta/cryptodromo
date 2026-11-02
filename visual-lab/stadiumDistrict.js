import {getStadiumPreset} from '../race-lab/source/src/stadium/presets.js';

/**
 * Alpha14 scenery adapter. Reuses the SAME venue identity / palette as /estadio/.
 * Only builds the non-race exterior district. No new course, grandstand, crowd,
 * sky, rain, cameras, audio or spotlights. XZ ground plane, Y vertical.
 */
export function createLiveStadiumDistrict({THREE,scene,stadiumId='satoshi',quality='balanced'}={}){
  if(!THREE||!scene)throw new Error('THREE and scene required');
  const preset=getStadiumPreset(stadiumId),palette=preset.palette;
  const root=new THREE.Group();root.name='Cryptodromo · exterior del '+preset.name;
  scene.add(root);
  const geometries=new Set(),materials=new Set(),textures=new Set(),decorative=[];
  const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m),texture=t=>(textures.add(t),t);
  const cube=geo(new THREE.BoxGeometry(1,1,1)),cone=geo(new THREE.ConeGeometry(1,1,7)),
    trunkGeo=geo(new THREE.CylinderGeometry(.56,.72,1,6));
  const surface=(color,extra={})=>mat(new THREE.MeshStandardMaterial({color,roughness:.84,...extra}));
  const M={
    stone:surface(palette.wall),roof:surface(palette.roof),glass:surface(0x31514c,{roughness:.32,metalness:.12}),
    bronze:surface(palette.metal,{metalness:.25,roughness:.45}),accent:surface(palette.accent),
    plaza:surface(0x788478),grass:surface(palette.grass),iron:surface(0x394f48),
    sign:surface(palette.accent,{emissive:palette.accent,emissiveIntensity:.04}),
    tree:surface(palette.trees),bark:surface(0x635b43),bench:surface(0x6d5540)};
  const staticParts=new THREE.Group(),details=new THREE.Group();
  root.add(staticParts,details);
  const mesh=(geometry,material,parent=staticParts)=>{
    const item=new THREE.Mesh(geometry,material);item.castShadow=false;item.receiveShadow=false;parent.add(item);
    return item;
  };
  const box=(parent,x,y,z,w,h,d,material)=>{
    const item=mesh(cube,material,parent);item.position.set(x,y,z);item.scale.set(w,h,d);return item;
  };
  function instanced(parent,geometry,material,instances,name){
    const object=new THREE.InstancedMesh(geometry,material,instances.length);
    object.name=name;object.castShadow=false;object.receiveShadow=false;
    const dummy=new THREE.Object3D();
    for(let i=0;i<instances.length;i++){
      const p=instances[i];dummy.position.set(p[0],p[1],p[2]);dummy.scale.set(p[3],p[4],p[5]);
      dummy.rotation.y=p[6]||0;dummy.updateMatrix();object.setMatrixAt(i,dummy.matrix);
    }
    object.instanceMatrix.needsUpdate=true;object.computeBoundingSphere();parent.add(object);return object;
  }
  function textSign(label,x,y,z,width=28,height=3){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
    const c=canvas.getContext('2d');c.fillStyle='#11291f';c.fillRect(0,0,1024,128);
    c.fillStyle='#'+palette.accent.toString(16).padStart(6,'0');c.fillRect(0,0,1024,7);
    c.fillStyle='#fff1d7';c.font='bold 61px Arial';c.textAlign='center';c.textBaseline='middle';
    c.fillText(label,512,69,950);
    const tx=texture(new THREE.CanvasTexture(canvas));tx.colorSpace=THREE.SRGBColorSpace;
    const sign=mesh(geo(new THREE.PlaneGeometry(width,height)),
      mat(new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide})),staticParts);
    sign.position.set(x,y,z);return sign;
  }
  // The original Alpha14 12-lane circuit remains at z=-20..20, its full
  // existing grandstand at z=-33..-80. Our entire district stays off-course.
  box(staticParts,0,-.19,-180,540,.19,31,M.plaza);
  box(staticParts,0,.025,-204,420,.09,3,M.bronze);
  // Entrance concourse behind original grandstand, with distinct visitor functions.
  const entrance=new THREE.Group();entrance.name='Acceso, boleterías y pabellones';staticParts.add(entrance);
  for(const [x,w,title] of [[-210,48,'BOLETERÍA'],[210,48,'INFORMACIÓN']]){
    box(entrance,x,4.3,-188,w,8.6,18,M.stone);
    box(entrance,x,9.3,-188,w+2,1.1,21,M.roof);
    textSign(title,x,6,-176,w-4,2.9);
  }
  for(const x of [-134,134]){
    box(entrance,x,9,-203,2.6,18,3,M.stone);
    box(entrance,x,18.3,-203,11,2,5,M.bronze);
  }
  box(entrance,0,18,-203,270,3,5,M.roof);
  textSign(preset.signs.gate,0,20.6,-200,105,4.1);
  // Merchants and civic facilities: no advertisements or financial wagers.
  const shopLabels=['CAFETERÍA','FAN SHOP','MUSEO','PRIMEROS AUXILIOS','SERVICIOS'];
  const shopPos=[-145,-70,0,75,150];
  for(let i=0;i<shopPos.length;i++){
    const x=shopPos[i];
    box(entrance,x,4,-235,51,8,24,M.stone);
    box(entrance,x,8.5,-235,54,1,26,i%2?M.roof:M.bronze);
    textSign(shopLabels[i],x,6.2,-221,43,2.7);
  }
  // Stable operations are on the western edge, away from broadcast cameras.
  const stables=new THREE.Group();stables.name='Caballerizas, paddock y veterinaria';staticParts.add(stables);
  const barnPlaces=[[-365,-126],[-365,-159],[-365,-192]];
  for(const [x,z] of barnPlaces){
    box(stables,x,4.5,z,43,9,21,M.stone);
    box(stables,x,9.4,z,45,1.1,24,M.roof);
    for(let i=-1;i<=1;i++)box(stables,x-21.7,3.4,z+i*6.3,.25,5.8,4,M.glass);
  }
  // Decorative paddock ring and access points: only the perimeter posts.
  const posts=[],radius=29;
  for(let i=0;i<56;i++){
    const a=i*Math.PI*2/56;
    posts.push([-297+Math.cos(a)*radius,.75,-174+Math.sin(a)*radius,.23,1.5,.23]);
  }
  instanced(stables,cube,M.iron,posts,'Paddock fence');
  textSign(preset.signs.paddock,-302,8,-211,57,3.4);
  box(stables,-365,4.4,-239,47,8.8,18,M.stone);
  textSign('VETERINARIA',-365,6.5,-229,43,2.8);
  // Media and services to the east.
  const service=new THREE.Group();service.name='Broadcast y mantenimiento';staticParts.add(service);
  box(service,359,9,-174,52,18,31,M.stone);
  box(service,359,18.8,-174,55,1.2,34,M.roof);
  textSign('BROADCAST',359,13,-158,45,3.1);
  for(const x of [305,383])box(service,x,4.2,-235,33,8.4,23,M.stone);
  textSign('CENTRO TÉCNICO',305,7,-221,30,2.2);
  // Promenade paving, ornamental trees and park furniture use instancing.
  const trees=[],trunks=[],lampPosts=[],lampTops=[],benches=[];
  let seed=preset.seed;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<42;i++){
    const x=-385+i*18.5;
    const z=i%2===0?-260:-280;
    const h=6+rand()*4;
    trunks.push([x,h/2,z,.7,h,.7]);
    trees.push([x,h+3,z,3.5,7,3.5]);
  }
  for(let i=0;i<21;i++){
    const x=-367+i*36.7;
    lampPosts.push([x,4,-211,.25,8,.25]);
    lampTops.push([x,8.25,-211,1.5,.5,1.5]);
    benches.push([x,.6,-217,4,.5,1.25]);
  }
  instanced(details,trunkGeo,M.bark,trunks,'Árboles de paseo');
  instanced(details,cone,M.tree,trees,'Copas de paseo');
  instanced(details,cube,M.iron,lampPosts,'Faroles del paseo');
  instanced(details,cube,M.sign,lampTops,'Faroles iluminables');
  instanced(details,cube,M.bench,benches,'Bancos del parque');
  const low=quality==='eco'||quality==='low';
  details.visible=!low;
  const baselineRoof=M.roof.color.clone(),baseWall=M.stone.color.clone();
  function setEnvironment({hour=17.5,type='clear',wetness=0}={}){
    const night=hour<6||hour>=19||type==='night';
    const wet=Math.max(0,Math.min(1,Number(wetness)||0));
    M.sign.emissiveIntensity=night?1.25:.08;
    M.roof.color.copy(baselineRoof).lerp(new THREE.Color(0x192c2c),wet*.33);
    M.stone.color.copy(baseWall).lerp(new THREE.Color(0x515b55),wet*.17);
    M.roof.roughness=.85-wet*.35;
  }
  function setQuality(next='balanced'){details.visible=next!=='eco'&&next!=='low';}
  function dispose(){
    root.removeFromParent();root.clear();
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }
  return {root,preset,setEnvironment,setQuality,dispose,
    stats:{exteriorOnly:true,addsTrack:false,addsGrandstand:false,addsCrowd:false,addsRain:false,
      venueId:preset.id,featureCount:shopLabels.length+4}};
}
