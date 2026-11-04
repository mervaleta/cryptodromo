/**
 * Three original closed-loop procedural car circuits.
 * Visual geometry only. Official distances/ranking stay in logic.js.
 */
import * as THREE from 'three';
import {GRID_LEAD_BACK_METERS,GRID_ROW_GAP_METERS,GRID_COLUMN_STAGGER_METERS} from './logic.js';

const POINTS={
  speed:[[-245,0],[-215,-111],[-155,-149],[175,-149],[229,-107],[250,0],[228,112],[168,148],[-173,148],[-233,108]],
  technical:[[-230,-20],[-190,-105],[-85,-145],[18,-76],[90,-151],[219,-95],[233,46],[125,146],[24,87],[-85,157],[-215,91]],
  street:[[-209,-77],[-89,-124],[16,-107],[87,-157],[209,-117],[234,-25],[127,22],[200,139],[68,161],[-20,83],[-108,133],[-234,91]]
};
const WIDTH=54,SEGMENTS=320;
const color=(hex)=>new THREE.Color(hex);
function makeText(text,ink='#ffffff',back='#101e25'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle=back;ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='#ffffff33';ctx.lineWidth=12;ctx.strokeRect(8,8,1008,240);
  ctx.fillStyle=ink;ctx.font='900 92px Arial, sans-serif';ctx.textAlign='center';
  ctx.textBaseline='middle';ctx.fillText(text,512,129,960);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}
export function createCarCircuit(track){
  if(!POINTS[track.layout])throw new Error('Unknown procedural car layout');
  const root=new THREE.Group(), disposables=[];
  root.name='Autódromo / '+track.name;
  const own=(thing)=>{disposables.push(thing);return thing;};
  const material=(c,roughness=.9,metalness=.0)=>own(new THREE.MeshStandardMaterial({color:c,roughness,metalness}));
  const mGround=material(track.layout==='street'?'#18252d':'#284a36');
  const mRoad=material('#252c35',.91);
  const mRunoff=material('#414b4e');
  const mWhite=material('#e7e9dc');
  const mBlue=material('#24ccd1');
  const mRed=material('#e95157');
  const mSteel=material('#8996a2',.47,.45);
  const mStand=material('#394958'),mRoof=material('#0d1824');
  const curve=own(new THREE.CatmullRomCurve3(POINTS[track.layout].map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal',.5));
  function strip(inner,outer,height,mat){
    const vertices=[],indices=[];
    for(let i=0;i<=SEGMENTS;i++){
      const t=i/SEGMENTS,p=curve.getPointAt(t),dir=curve.getTangentAt(t);
      const nx=-dir.z,nz=dir.x;
      vertices.push(p.x+nx*inner,height,p.z+nz*inner,p.x+nx*outer,height,p.z+nz*outer);
      if(i<SEGMENTS){const n=2*i;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=false;root.add(mesh);return mesh;
  }
  const ground=new THREE.Mesh(own(new THREE.PlaneGeometry(2200,1600)),mGround);
  ground.rotation.x=-Math.PI/2;ground.position.y=-.38;root.add(ground);
  strip(-WIDTH/2-8,WIDTH/2+8,-.12,mRunoff);
  strip(-WIDTH/2,WIDTH/2,-.06,mRoad);
  strip(-WIDTH/2-2,-WIDTH/2+.3,-.035,mRed);
  strip(WIDTH/2-.3,WIDTH/2+2,-.035,mWhite);
  for(let side of [-1,1]){
    const rail=[];
    for(let i=0;i<=200;i++){
      const p=curve.getPointAt(i/200),d=curve.getTangentAt(i/200),n=new THREE.Vector3(-d.z,0,d.x);
      rail.push(p.clone().addScaledVector(n,side*(WIDTH/2+7)).add(new THREE.Vector3(0,1.7,0)));
    }
    const geo=own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail),280,.38,5,false));
    const mesh=new THREE.Mesh(geo,mSteel);root.add(mesh);
  }
  for(let i=0;i<95;i++){
    const t=i/95,p=curve.getPointAt(t),d=curve.getTangentAt(t);
    const nx=-d.z,nz=d.x;
    for(const side of [-1,1]){
      if(i%2===0){
        const curb=new THREE.Mesh(own(new THREE.BoxGeometry(2.8,.055,1.2)),i%4===0?mWhite:mRed);
        curb.position.set(p.x+nx*(WIDTH/2-1.2)*side,-.002,p.z+nz*(WIDTH/2-1.2)*side);
        curb.rotation.y=-Math.atan2(d.z,d.x);root.add(curb);
      }
    }
  }
  // Start/finish chequer line (NOT twelve starting positions abreast).
  const start=curve.getPointAt(0),startDir=curve.getTangentAt(0);
  const startYaw=-Math.atan2(startDir.z,startDir.x);
  for(let i=0;i<12;i++){
    for(let j=0;j<2;j++){
      const cell=new THREE.Mesh(own(new THREE.BoxGeometry(1.85,.025,3.75)),(i+j)%2?mWhite:mRoad);
      cell.position.set(start.x-startDir.z*((i-5.5)*3.75)+startDir.x*j*1.85,.015,
        start.z+startDir.x*((i-5.5)*3.75)+startDir.z*j*1.85);
      cell.rotation.y=startYaw;root.add(cell);
    }
  }
  const box=(w,h,d,mat,x,y,z)=>{
    const mesh=new THREE.Mesh(own(new THREE.BoxGeometry(w,h,d)),mat);
    mesh.position.set(x,y,z);root.add(mesh);return mesh;
  };
  // Grandstands, race-control tower and light pylons.
  const positionShift=track.layout==='technical'?12:0;
  for(const side of [-1,1]){
    const z=side*254;
    box(236,12,26,mStand,positionShift,6,z);
    box(243,2,33,mRoof,positionShift,14,z);
    for(let seat=0;seat<20;seat++){
      const mm=(seat%4===0)?mRed:(seat%4===1?mWhite:mBlue);
      box(9,4,2,mm,-109+seat*11+positionShift,16,side*247);
    }
  }
  box(28,54,25,mStand,-286,27,0);
  box(32,4,31,mRoof,-286,56,0);
  box(38,3,32,mBlue,-286,45,0);
  const accent=color(track.accent);
  const emitter=own(new THREE.MeshBasicMaterial({color:accent}));
  for(const x of [-225,-110,0,110,225])for(const z of [-220,220]){
    box(.9,37,.9,mSteel,x,18.5,z);
    box(6,1.2,1.8,emitter,x,37.4,z);
    const light=new THREE.PointLight(accent,track.layout==='street'?9:4,130,2);
    light.position.set(x,38,z);root.add(light);
  }
  const textTexture=own(makeText(track.name.toUpperCase()));
  const adMaterial=own(new THREE.MeshBasicMaterial({map:textTexture,side:THREE.DoubleSide}));
  for(const z of [-235,235]){
    const advert=new THREE.Mesh(own(new THREE.PlaneGeometry(105,26)),adMaterial);
    advert.position.set(-3,31,z);advert.rotation.y=z<0?0:Math.PI;root.add(advert);
  }
  // A distinctive centrepiece per circuit.
  if(track.layout==='street'){
    const tower=box(32,135,30,mStand,0,67,0);
    box(35,5,35,emitter,0,138,0);
    tower.rotation.y=.13;
    for(let y=15;y<120;y+=17)box(33,3,32,emitter,0,y,0);
  }else if(track.layout==='technical'){
    for(let i=0;i<4;i++)box(24,28+i*9,24,i%2?mStand:mRoof,-80+i*50,14+i*4.5,-9);
  }else{
    box(140,7,30,mRoof,0,18,0);
    box(110,10,16,mStand,0,9,0);
  }
  // Two-column qualifying grid: 6 staggered rows, all behind the finish line.
  // These are markings, not an alternative timing or scoring engine.
  for(let i=0;i<12;i++){
    const row=Math.floor(i/2),col=i%2;
    const behind=GRID_LEAD_BACK_METERS+row*GRID_ROW_GAP_METERS+
      col*GRID_COLUMN_STAGGER_METERS;
    const lateral=col===0?-6:6;
    const p=pose(-behind,lateral);
    const gridMark=own(new THREE.BoxGeometry(9.6,.022,.13));
    const shortMark=own(new THREE.BoxGeometry(.13,.022,5.4));
    for(const x of [-4.8,4.8]){
      const mark=new THREE.Mesh(shortMark,mWhite);
      mark.position.set(p.x+Math.cos(p.heading)*x,.018,p.z-Math.sin(p.heading)*x);
      mark.rotation.y=p.heading;root.add(mark);
    }
    for(const z of [-2.7,2.7]){
      const mark=new THREE.Mesh(gridMark,i===0?mBlue:mWhite);
      mark.position.set(p.x+Math.sin(p.heading)*z,.018,p.z+Math.cos(p.heading)*z);
      mark.rotation.y=p.heading;root.add(mark);
    }
  }
  function pose(meters,lateralMeters=0){
    const u=((meters/1000)%1+1)%1,p=curve.getPointAt(u),t=curve.getTangentAt(u);
    return {x:p.x-t.z*lateralMeters,z:p.z+t.x*lateralMeters,y:.3,heading:-Math.atan2(t.z,t.x)};
  }
  function dispose(){
    root.parent?.remove(root);
    for(const res of disposables)if(res&&typeof res.dispose==='function')res.dispose();
  }
  return {root,pose,dispose,lengthMeters:1000,layout:track.layout};
}
