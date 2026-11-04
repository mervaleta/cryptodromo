/**
 * Original low-poly Formula-style generator, no third-party model files.
 * Every token has stable paint, number, nose and wing configuration.
 */
import * as THREE from 'three';

function hash(str){
  let h=2166136261;
  for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}
function bannerTexture(symbol,number,primary){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0a1018';ctx.fillRect(0,0,512,256);
  ctx.fillStyle=primary;ctx.fillRect(0,0,512,18);ctx.fillRect(0,238,512,18);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffffff';
  ctx.font='900 118px Arial,sans-serif';ctx.fillText(symbol,256,113,480);
  ctx.font='800 38px Arial,sans-serif';ctx.fillText('#'+number+'  CRYPTÓDROMO',256,205,480);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function createFormulaCar(entry,number){
  const h=hash(entry.symbol),variant=h%4;
  const root=new THREE.Group(),resources=[],wheels=[];
  root.name='Formula CRP '+entry.symbol;
  const own=x=>(resources.push(x),x);
  const paint=own(new THREE.MeshStandardMaterial({color:entry.color,metalness:.46,roughness:.32}));
  const dark=own(new THREE.MeshStandardMaterial({color:'#141b25',metalness:.42,roughness:.55}));
  const trim=own(new THREE.MeshStandardMaterial({color:variant%2?'#faf3d9':'#19d8d1',metalness:.3,roughness:.4}));
  const tire=own(new THREE.MeshStandardMaterial({color:'#101113',metalness:0,roughness:.94}));
  const hub=own(new THREE.MeshStandardMaterial({color:'#c0c6ca',metalness:.8,roughness:.2}));
  const addBox=(x,y,z,l,hg,w,m)=>{
    const mesh=new THREE.Mesh(own(new THREE.BoxGeometry(l,hg,w)),m);
    mesh.position.set(x,y,z);root.add(mesh);return mesh;
  };
  // Body, long nose, airbox, cockpit and variable aerodynamic package.
  addBox(-.25,.76,0,5.8,.55,1.66,paint);
  addBox(2.72,.54,0,3.6+variant*.17,.26,.74,paint);
  addBox(4.62,.33,0,.8,.13,4.35,paint);
  addBox(4.14,.41,0,1.2,.11,3.65,trim);
  addBox(-3.35,.66,0,2.4,.35,2.65,dark);
  addBox(-4.15,1.53,0,.66,.16,3.8+variant*.12,paint);
  addBox(-4.15,1.27,0,.78,.14,3.2,trim);
  for(const side of [-1,1]){
    addBox(-3.98,1.05,side*1.08,.18,.96,.19,dark);
    addBox(-.6,.57,side*1.21,2.6,.26,.56,trim);
    addBox(1.75,.68,side*.73,2.2,.24,.26,dark);
  }
  // Recognizable driver cockpit: seat, helmet, and structural halo.
  addBox(-.63,1.2,0,1.42,.41,1.08,dark);
  const helmet=new THREE.Mesh(own(new THREE.SphereGeometry(.43,12,8)),trim);
  helmet.position.set(-.88,1.58,0);root.add(helmet);
  addBox(.45,1.83,0,2.1,.13,.14,dark);
  addBox(1.3,1.51,0,.12,.63,.12,dark);
  for(const side of [-1,1])addBox(-.45,1.53,side*.58,.15,.59,.13,dark);
  addBox(-2.2,1.5,0,1.4,.48,.9,paint);
  const cylinder=own(new THREE.CylinderGeometry(1.03,1.03,.87,16));
  const hubGeo=own(new THREE.CylinderGeometry(.36,.36,.91,12));
  for(const x of [-2.9,3.15])for(const side of [-1,1]){
    const group=new THREE.Group();group.position.set(x,1.05,side*1.72);
    const wheel=new THREE.Mesh(cylinder,tire);wheel.rotation.x=Math.PI/2;group.add(wheel);
    const center=new THREE.Mesh(hubGeo,hub);center.rotation.x=Math.PI/2;group.add(center);
    root.add(group);wheels.push(group);
  }
  const sign=own(bannerTexture(entry.symbol,number,entry.color));
  const signMat=own(new THREE.MeshBasicMaterial({map:sign,transparent:false,side:THREE.DoubleSide}));
  const sticker=new THREE.Mesh(own(new THREE.PlaneGeometry(1.75,1.05)),signMat);
  sticker.rotation.x=-Math.PI/2;sticker.rotation.z=-Math.PI/2;
  sticker.position.set(.6,1.055,0);root.add(sticker);
  const board=new THREE.Mesh(own(new THREE.PlaneGeometry(.88,.6)),signMat);
  board.rotation.y=Math.PI/2;board.position.set(-3.53,1.07,-1.23);root.add(board);
  // Six distinct silhouettes through body length, aero and colour combinations.
  root.userData={symbol:entry.symbol,number,variant,liveryId:'CRP-'+String(number).padStart(3,'0')};
  return {
    root,
    updateWheelRotation(deltaMeters){
      const delta=Math.max(-15,Math.min(15,deltaMeters))/1.03;
      for(const wheel of wheels)wheel.rotation.z-=delta;
    },
    dispose(){
      root.parent?.remove(root);
      for(const object of resources)object.dispose?.();
    }
  };
}
