import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
export function createPreview(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,50);
 camera.position.set(3.7,2.6,6.5);camera.lookAt(0,1.25,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x65714c,2.5));const sun=new THREE.DirectionalLight(0xfff1da,3);sun.position.set(2,6,5);scene.add(sun);
 const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.85,1.95,.12,64),new THREE.MeshStandardMaterial({color:0x243b26,roughness:1}));platform.position.y=-.02;scene.add(platform);
 let horse,paused=false;
function makeCanvasTexture(text, color){
  const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');
  ctx.fillStyle='#08120e';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.fillRect(0,0,9,c.height);
  ctx.font='800 56px Inter,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4faf6';ctx.fillText(text,c.width/2+4,c.height/2+2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function link(parent, a, b, radius, material, radial=8){
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va),mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.82,radius,delta.length(),radial),material);
  mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;
}
function makeLeg(horse,x,z,coat,phase){
  const pivot=new THREE.Group();pivot.position.set(x,.86,z);horse.add(pivot);
  link(pivot,[0,0,0],[-.02,-.72,0],.072,coat,6);
  const hoof=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.15),new THREE.MeshStandardMaterial({color:0x221e1b,roughness:.8}));hoof.position.set(.03,-.75,0);hoof.castShadow=true;pivot.add(hoof);
  return {pivot,phase};
}
function makeHorse(racer,index){
  const root=new THREE.Group();scene.add(root);
  const coat=new THREE.MeshStandardMaterial({color:racer.coat,roughness:.72});
  const coatLight=new THREE.MeshStandardMaterial({color:new THREE.Color(racer.coat).multiplyScalar(1.13),roughness:.7});
  const dark=new THREE.MeshStandardMaterial({color:0x241e1c,roughness:.9});
  const cloth=new THREE.MeshStandardMaterial({color:racer.color,roughness:.55,metalness:.08});
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),coat);body.scale.set(.83,.42,.31);body.position.set(-.04,1.18,0);body.castShadow=true;root.add(body);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),coatLight);chest.scale.set(.31,.42,.32);chest.position.set(.53,1.23,0);chest.castShadow=true;root.add(chest);
  link(root,[.42,1.36,0],[.72,1.99,0],.19,coatLight,10);
  const head=new THREE.Mesh(new THREE.SphereGeometry(1,14,12),coatLight);head.scale.set(.31,.24,.22);head.rotation.z=.22;head.position.set(.83,2.02,0);head.castShadow=true;root.add(head);
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({color:0x9b7460,roughness:.8}));muzzle.scale.set(.17,.12,.16);muzzle.position.set(1.06,1.9,0);root.add(muzzle);
  for(const z of [-.12,.12]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),dark);eye.position.set(.91,2.09,z);root.add(eye);const ear=new THREE.Mesh(new THREE.ConeGeometry(.065,.24,6),coat);ear.position.set(.74,2.27,z*.7);ear.rotation.z=-.16;root.add(ear);}
  // Mane is a row of small, individually reusable geometry pieces.
  for(let i=0;i<4;i++){const mane=new THREE.Mesh(new THREE.ConeGeometry(.13,.32,5),dark);mane.position.set(.39+i*.13,2.03-i*.09,(i%2?-.08:.08));mane.rotation.z=-.8;mane.castShadow=true;root.add(mane);}
  const saddle=new THREE.Mesh(new THREE.BoxGeometry(.45,.11,.43),cloth);saddle.position.set(-.05,1.6,0);saddle.castShadow=true;root.add(saddle);
  const saddlePad=new THREE.Mesh(new THREE.BoxGeometry(.6,.06,.48),new THREE.MeshStandardMaterial({color:0xf1e8d5,roughness:.85}));saddlePad.position.set(-.08,1.51,0);root.add(saddlePad);
  for(let i=0;i<2;i++){const tail=link(root,[-.77-i*.13,1.36-i*.12,0],[-1.03-i*.13,1.3-i*.12,0],.11-i*.025,dark,6);tail.castShadow=true;}
  const legs=[makeLeg(root,-.49,.2,coat,0),makeLeg(root,-.49,-.2,coat,Math.PI),makeLeg(root,.48,.2,coat,Math.PI),makeLeg(root,.48,-.2,coat,0)];
  const badge=new THREE.Mesh(new THREE.PlaneGeometry(.82,.35),new THREE.MeshBasicMaterial({map:makeCanvasTexture(racer.symbol,racer.color),transparent:false,side:THREE.DoubleSide}));badge.position.set(-.1,2.55,0);badge.rotation.x=-.35;root.add(badge);
  return {root,legs,racer,index,progress:0,position:0,base:0,delta:0,coat,coatLight,cloth,badge,latestMove:0};
}

 const resize=()=>{const box=canvas.parentElement;renderer.setSize(box.clientWidth,box.clientHeight,false);camera.aspect=box.clientWidth/box.clientHeight;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(canvas.parentElement);resize();
 const clock=new THREE.Clock();let t=0;
 renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(!paused&&!document.hidden)t+=dt;if(horse){horse.root.position.y=paused?0:Math.max(0,Math.sin(t*16)*.035);horse.legs.forEach(l=>l.pivot.rotation.z=paused?0:Math.sin(t*8+l.phase)*.42);}renderer.render(scene,camera);});
 return {pause(value){paused=value;},select(token){if(horse){scene.remove(horse.root);const geometries=new Set(),materials=new Set();horse.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});}horse=makeHorse(token,0);}};
}
