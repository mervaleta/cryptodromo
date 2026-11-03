/**
 * Alpha22 original mesh jockey and reins, optional for close anatomy review.
 * Keeps Alpha20 procedural LIVE feature parity without importing a character
 * file, sprite or 2D atlas. Entire costume is generated 3D geometry.
 */
import {addLoft} from './horseGeometry.js';
import {makeSurfaceMaterial} from './horseShader.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const TAU=Math.PI*2;
export function createProceduralJockey({THREE,parent,accent='#e5bc79',
 quality='balanced',visible=true}={}){
 if(!THREE?.Group||!parent)throw Error('THREE and a parent group required');
 const root=new THREE.Group();root.name='Original geometric jockey';
 root.position.set(-.10,2.15,0);parent.add(root);
 const boneMaterials=[];
 const ownMaterial=m=>(boneMaterials.push(m),m);
 const silk=ownMaterial(makeSurfaceMaterial(THREE,accent,{roughness:.64,clearcoat:.12}));
 const skin=ownMaterial(makeSurfaceMaterial(THREE,'#b58a65',{roughness:.81}));
 const boots=ownMaterial(makeSurfaceMaterial(THREE,'#231f22',{roughness:.52,clearcoat:.10}));
 const pant=ownMaterial(makeSurfaceMaterial(THREE,'#e1ddd3',{roughness:.85}));
 const visor=ownMaterial(makeSurfaceMaterial(THREE,'#11181b',{roughness:.40}));
 const trim=ownMaterial(makeSurfaceMaterial(THREE,'#f1e8c8',{roughness:.77}));
 const geo=[];
 function loft(name,sections,material){
  const o=addLoft({THREE,parent:root,sections,material,quality,name});
  geo.push(o.geometry);return o;
 }
 function sphere(name,at,size,material,segments=12){
  const g=new THREE.SphereGeometry(1,segments,Math.max(7,segments-2));
  geo.push(g);const mesh=new THREE.Mesh(g,material);
  mesh.name=name;mesh.position.set(...at);mesh.scale.set(...size);
  mesh.castShadow=quality==='high';root.add(mesh);return mesh;
 }
 // Hip, shoulder and forward-leaning torso, lower than the 3.02m gate roof.
 loft('Jockey crouched torso',[
  [-.13,0,0,.05,.12],[-.02,.12,0,.16,.23],
  [.18,.29,0,.20,.21],[.36,.42,0,.15,.19],
  [.47,.45,0,.03,.08]
 ],silk);
 // Throat, neck and head: center y2.70, helmet peak y2.92 world.
 loft('Jockey neck',[
  [.36,.38,0,.06,.067],[.42,.50,0,.075,.072],[.47,.54,0,.01,.01]
 ],skin);
 sphere('Jockey face',[.50,.56,0],[.115,.13,.122],skin,14);
 sphere('Helmet skull',[.48,.70,0],[.145,.110,.15],silk,16);
 sphere('Helmet dark rim',[.56,.662,0],[.135,.031,.148],visor,12);
 sphere('Helmet brim',[.61,.655,0],[.112,.018,.135],boots,10);
 // Lightweight geometry-based diagonal jersey stripe.
 loft('Jockey jersey diagonal trim',[
  [.10,.24,-.19,.014,.017],[.21,.34,-.20,.035,.023],
  [.30,.41,-.16,.013,.014]
 ],trim);
 for(const side of [-1,1]){
  const z=side*.19;
  loft('Jockey upper arm '+side,[
   [.28,.39,z,.09,.09],[.41,.30,side*.22,.075,.073],
   [.55,.16,side*.23,.065,.062]
  ],silk);
  loft('Jockey forearm '+side,[
   [.54,.18,side*.23,.068,.064],[.70,.08,side*.22,.064,.06],
   [.89,-.005,side*.18,.051,.049]
  ],pant);
  sphere('Jockey glove '+side,[.90,-.02,side*.175],[.073,.048,.051],boots,11);
  loft('Jockey thigh '+side,[
   [-.12,.01,side*.15,.12,.115],[.04,-.11,side*.24,.12,.105],
   [.22,-.12,side*.30,.091,.083]
  ],pant);
  loft('Jockey boot '+side,[
   [.20,-.13,side*.30,.090,.085],
   [.33,-.28,side*.32,.079,.079],
   [.48,-.37,side*.31,.055,.07]
  ],boots);
  sphere('Boot toe '+side,[.51,-.39,side*.31],[.115,.055,.084],boots,12);
 }
 // Reins follow cheek and jaw near the horse's body. Original tubing, no image.
 const reins=[];
 for(const side of [-1,1]){
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
   new THREE.Vector3(1.00,-.01,side*.18),
   new THREE.Vector3(1.20,.08,side*.20),
   new THREE.Vector3(1.57,.06,side*.17),
   new THREE.Vector3(1.83,.04,side*.14)
  ]),16,.013,5,false);
  geo.push(g);
  const mesh=new THREE.Mesh(g,boots);
  mesh.name='Original 3D reins '+side;
  root.add(mesh);reins.push(mesh);
 }
 root.visible=visible;
 let active=!!visible;
 function update(phase=0,strength=0){
  const a=TAU*phase,s=clamp(strength,0,1.8);
  root.rotation.z=s*.028*Math.sin(a+.63);
  root.rotation.x=s*.013*Math.sin(a*2+.31);
 }
 function setAccent(color){silk.color.set(color);}
 function setVisible(value){active=!!value;root.visible=active;}
 function dispose(){
  root.removeFromParent();geo.forEach(g=>g.dispose());
  boneMaterials.forEach(m=>m.dispose());
 }
 return {root,update,setAccent,setVisible,dispose,get visible(){return active},
  get estimatedHeight(){return root.position.y+.81}};
}
