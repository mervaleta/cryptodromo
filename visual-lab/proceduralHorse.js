import * as THREE from 'three';
import {hashHorseSeed,solveLegIK} from './proceduralMath.js?v=alpha20-procedural-2';

/* CRP Alpha20: fully generated visual horse. No GLB, sprites, PNG, FBX or clip assets.
 * +X forward, +Y up, ground y=0. The authoritative race engine moves root.
 * Geometry and gait are presentation only and must never determine rank/price.
 */
const UP=new THREE.Vector3(0,1,0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const FACES={eco:10,balanced:16,cinematic:22};
const SEGMENTS=[
 [0,1,2,3,4,5],[1,2],[0,1,6,4,3],[0,1,6,2,3],[5,6,1,2],
 [0,5,6,2,3],[0,5,6,4,3,2],[0,1,2],[0,1,2,3,4,5,6],[0,1,2,3,5,6]
];
const STROKES=[[-.005,.104,.119,.025],[.06,.055,.022,.091],
 [.06,-.055,.022,.091],[-.005,-.106,.119,.025],[-.067,-.055,.022,.091],
 [-.067,.055,.022,.091],[-.005,0,.119,.023]];
function loft(points,sides=18){
 const verts=[],uv=[],tri=[];
 const control=points.map(p=>new THREE.Vector3(p[0],p[1],p[2]));
 const curve=new THREE.CatmullRomCurve3(control,false,'centripetal');
 const rings=(points.length-1)*4;
 for(let i=0;i<=rings;i++){
  const t=i/rings,k=t*(points.length-1),j=Math.min(points.length-2,Math.floor(k));
  const w=k-j,at=curve.getPoint(t),v=curve.getTangent(t).normalize();
  const normal=new THREE.Vector3(-v.y,v.x,0).normalize();
  const ry=THREE.MathUtils.lerp(points[j][3],points[j+1][3],w);
  const rz=THREE.MathUtils.lerp(points[j][4],points[j+1][4],w);
  for(let s=0;s<=sides;s++){
   const a=s/sides*Math.PI*2;
   verts.push(at.x+normal.x*ry*Math.cos(a),
              at.y+normal.y*ry*Math.cos(a),at.z+rz*Math.sin(a));
   uv.push(t,s/sides);
   if(i<rings&&s<sides){const n=i*(sides+1)+s;
    tri.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(tri);g.computeVertexNormals();return g;
}
function coatMaterial(color,seed){
 const m=new THREE.MeshStandardMaterial({color,roughness:.86,metalness:0,side:THREE.DoubleSide});
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vCrpCoatPosition;')
   .replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvCrpCoatPosition=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vCrpCoatPosition;\n'+
   'float crpHorseHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}\n'+
   'float crpHorseNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(crpHorseHash(i),crpHorseHash(i+vec3(1.,0.,0.)),f.x),mix(crpHorseHash(i+vec3(0.,1.,0.)),crpHorseHash(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(crpHorseHash(i+vec3(0.,0.,1.)),crpHorseHash(i+vec3(1.,0.,1.)),f.x),mix(crpHorseHash(i+vec3(0.,1.,1.)),crpHorseHash(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}\n');
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\n'+
   'vec3 crpP=vCrpCoatPosition+vec3('+Number(seed%130/15).toFixed(3)+',0.,0.);'+
   'float crpF=(crpHorseNoise(crpP*25.)-.5)*.13+(crpHorseNoise(crpP*107.)-.5)*.04;'+
   'diffuseColor.rgb*=1.+crpF;');
 };
 m.customProgramCacheKey=()=> 'crp-procedural-coat-v2:'+seed;
 return m;
}
function capsuleBetween(parent,geometry,material,radius){
 const m=new THREE.Mesh(geometry,material);m.castShadow=true;parent.add(m);
 const d=new THREE.Vector3(),mid=new THREE.Vector3(),a3=new THREE.Vector3(),b3=new THREE.Vector3();
 return {mesh:m,fit(a,b){
   a3.set(a.x,a.y,a.z);b3.set(b.x,b.y,b.z);d.subVectors(b3,a3);
   mid.addVectors(a3,b3).multiplyScalar(.5);
   m.position.copy(mid);m.quaternion.setFromUnitVectors(UP,d.clone().normalize());
   m.scale.set(radius,d.length(),radius);
 }};
}
export function createProceduralRaceHorse({
 coat='#935b38',accent='#f7931a',symbol='BTC',stallNumber=1,
 height=2.85,phase=0,mode='Gallop',quality='balanced'
}={}){
 const seed=hashHorseSeed(symbol);
 const level=FACES[quality]?quality:'balanced',sides=FACES[level];
 const root=new THREE.Group(),bank=new THREE.Group();
 root.add(bank);bank.position.y=1.41;
 const scaffold=new THREE.Group();scaffold.position.y=-1.41;bank.add(scaffold);
 const body=new THREE.Group();scaffold.add(body);
 const geos=new Set(),mats=new Set(),hair=[];
 const ownG=g=>(geos.add(g),g),ownM=m=>(mats.add(m),m);
 const shade=ownM(coatMaterial(coat,seed));
 const mane=ownM(new THREE.MeshStandardMaterial({color:new THREE.Color(coat).multiplyScalar(.30),roughness:.97}));
 const dark=ownM(new THREE.MeshStandardMaterial({color:'#27201c',roughness:.74}));
 const silk=ownM(new THREE.MeshStandardMaterial({color:accent,roughness:.75,side:THREE.DoubleSide}));
 const bone=ownM(new THREE.MeshStandardMaterial({color:'#efeadd',roughness:.84}));
 const skin=ownM(new THREE.MeshStandardMaterial({color:'#ba9177',roughness:.85}));
 const eye=ownM(new THREE.MeshPhysicalMaterial({color:'#100d0b',roughness:.16,clearcoat:.9}));
 const sphere=ownG(new THREE.SphereGeometry(1,sides,Math.max(8,Math.round(sides*.75))));
 const limbG=ownG(new THREE.CylinderGeometry(1,1,1,Math.max(7,Math.round(sides*.65))));
 const hairG=ownG(new THREE.ConeGeometry(.035,1,5));
 function add(g,m,parent=body){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function ell(x,y,z,rx,ry,rz,m,parent=body){const o=add(sphere,m,parent);o.position.set(x,y,z);o.scale.set(rx,ry,rz);return o;}
 add(ownG(loft([[-1.31,1.52,0,.015,.017],[-1.09,1.52,0,.43,.42],
 [-.54,1.52,0,.47,.52],[.02,1.50,0,.44,.47],[.58,1.54,0,.47,.46],
 [.94,1.54,0,.39,.39],[1.12,1.54,0,.014,.014]],sides+4)),shade);
 ell(-.98,1.49,0,.43,.45,.43,shade);ell(.69,1.50,0,.41,.44,.43,shade);
 const neck=new THREE.Group();body.add(neck);
 add(ownG(loft([[.59,1.65,0,.24,.28],[.81,1.88,0,.28,.29],
 [1.10,2.18,0,.22,.22],[1.34,2.28,0,.12,.14]],sides)),shade,neck);
 const head=ell(1.48,2.20,0,.33,.20,.18,shade,neck);head.rotation.z=-.21;
 ell(1.80,2.08,0,.18,.125,.16,shade,neck);
 ell(1.89,2.04,0,.11,.065,.14,dark,neck);
 for(const side of [-1,1]){
  ell(1.58,2.26,side*.155,.054,.054,.033,eye,neck);
  const ear=add(ownG(new THREE.ConeGeometry(.083,.24,8)),shade,neck);
  ear.position.set(1.26,2.45,side*.11);ear.rotation.z=-.26;
 }
 const limbs=[];
 for(const hind of [false,true])for(const side of [-1,1]){
  const hip={x:hind?-.98:.75,y:hind?1.34:1.36,z:side*.31};
  const upper=capsuleBetween(body,limbG,shade,hind?.124:.113);
  const lower=capsuleBetween(body,limbG,shade,hind?.085:.079);
  const joint=ell(0,0,hip.z,.11,.12,.105,shade);
  const hoof=ell(0,0,hip.z,.165,.10,.13,dark);
  limbs.push({hip,upper,lower,joint,hoof,hind,side,offset:hind?(side<0?2.55:3.04):(side<0?0:.56)});
 }
 const hairs=level==='eco'?8:level==='cinematic'?22:14;
 for(let i=0;i<hairs;i++){
  const t=i/Math.max(1,hairs-1);
  const o=add(hairG,mane,neck);
  o.position.set(.66+t*.58,2.00+t*.40,.01+Math.sin(seed+i*13)*.055);
  o.scale.set(1,.17+t*.06,1);o.rotation.z=-.43;
  hair.push({mesh:o,phase:i*.47,type:'mane',base:o.rotation.z});
 }
 for(let i=0;i<12;i++){
  const o=add(hairG,mane,body);
  o.position.set(-1.40-i*.021,1.52-i*.023,(i-5.5)*.014);
  o.scale.set(1,.38-i*.008,1);o.rotation.z=Math.PI*.40;
  hair.push({mesh:o,phase:i*.31,type:'tail',base:o.rotation.z});
 }
 // Jockey and saddle are solid generated meshes; no decals or raster number texture.
 const pad=add(ownG(new THREE.BoxGeometry(.80,.07,.91)),silk);
 pad.position.set(-.10,2.00,0);
 const saddle=add(ownG(new THREE.BoxGeometry(.65,.11,.54)),dark);
 saddle.position.set(-.15,2.08,0);
 const rider=new THREE.Group();body.add(rider);
 const torso=ell(.14,2.45,0,.34,.24,.245,silk,rider);torso.rotation.z=.47;
 ell(-.24,2.22,0,.21,.16,.26,bone,rider);
 ell(.48,2.64,0,.13,.15,.13,skin,rider);
 ell(.47,2.76,0,.16,.11,.15,silk,rider);
 for(const side of [-1,1]){
  const armA={x:.28,y:2.53,z:side*.17},elbow={x:.53,y:2.32,z:side*.20},
    hand={x:1.05,y:2.16,z:side*.17};
  capsuleBetween(rider,limbG,silk,.065).fit(armA,elbow);
  capsuleBetween(rider,limbG,bone,.052).fit(elbow,hand);
  ell(hand.x,hand.y,hand.z,.065,.06,.06,dark,rider);
  const hip={x:-.21,y:2.20,z:side*.19},knee={x:.21,y:2.03,z:side*.34},
    boot={x:.65,y:1.63,z:side*.30};
  capsuleBetween(rider,limbG,bone,.094).fit(hip,knee);
  capsuleBetween(rider,limbG,dark,.075).fit(knee,boot);
  ell(boot.x,boot.y-.045,boot.z,.15,.075,.082,dark,rider);
 }
 const panels=[];
 const number=Math.max(1,Math.min(12,Math.trunc(Number(stallNumber)||1)));
 const digits=String(number).split('').map(Number);
 for(const side of [-1,1]){
  const panel=add(ownG(new THREE.BoxGeometry(.52,.31,.035)),silk);
  panel.position.set(-.11,1.87,side*.485);panels.push(panel);
  digits.forEach((d,j)=>{
   const cx=-.18+j*.19+(digits.length===1?.08:0);
   for(const n of SEGMENTS[d]){const [x,y,w,h]=STROKES[n];
    const rect=add(ownG(new THREE.BoxGeometry(w*.74,h*.84,.012)),bone);
    rect.position.set(cx+x*.75,1.87+y*.85,side*.515);
   }
  });
 }
 root.scale.setScalar(Math.max(.45,height)/2.85);
 let gaitMode=mode,clock=phase*Math.PI*2,wind=.55,wetness=0,targetBank=0;
 function update(dt,rate=1){
  const step=clamp(dt,0,.10),r=clamp(rate,.2,3.2);
  const motion=gaitMode==='Idle'?0:gaitMode==='Walk'?.31:gaitMode==='Trot'?.58:1;
  clock+=step*(motion?10.0*r:1.3);
  const bounce=motion*(.045*Math.sin(2*clock)+.030*Math.sin(clock+.4));
  body.position.y=bounce;
  neck.rotation.z=motion*.035*Math.cos(clock+.5);
  rider.rotation.z=motion*.030*Math.sin(clock+.7);
  const excursion=.29*motion;
  for(const limb of limbs){
   const a=clock+limb.offset,stepX=excursion*Math.cos(a);
   const lift=motion*.20*Math.max(0,Math.sin(a));
   const end={x:limb.hip.x+stepX,y:.135-body.position.y+lift,z:limb.hip.z};
   const knee=solveLegIK(limb.hip,end,.70,.73,limb.hind?-1:1);
   limb.upper.fit(limb.hip,knee);limb.lower.fit(knee,end);
   limb.joint.position.set(knee.x,knee.y,knee.z);
   limb.hoof.position.set(end.x+.040,end.y-.045,end.z);
   limb.hoof.rotation.z=-.17*motion*Math.sin(a);
  }
  for(const h of hair){
   h.mesh.rotation.z=h.base+(h.type==='mane'?-1:1)*(motion*.07*Math.sin(clock+h.phase)+wind*.025*Math.sin(clock*.3+h.phase));
  }
  bank.rotation.z+=(targetBank-bank.rotation.z)*(1-Math.exp(-step*5));
 }
 function setAppearance({coat:newCoat,accent:newAccent}={}){
  if(newCoat){shade.color.set(newCoat);mane.color.copy(new THREE.Color(newCoat).multiplyScalar(.3));}
  if(newAccent)silk.color.set(newAccent);
 }
 function setWetness(x){wetness=clamp(x,0,1);shade.roughness=.86-wetness*.30;}
 function setVisualQuality(q){const low=q==='performance'||q==='eco';
  hair.forEach((h,i)=>{h.mesh.visible=!low||i%2===0;});}
 function dispose(){root.removeFromParent();for(const m of mats)m.dispose();for(const g of geos)g.dispose();}
 update(0);return {root,generated:true,backend:'procedural-v1',seed,update,play(n='Gallop'){gaitMode=n;},
  setAppearance,setWetness,setVisualQuality,setCoatFinish(){},
  setWind(v){wind=clamp(v,0,2);},setBank(v){targetBank=clamp(v,-.12,.12);},
  dispose,get stats(){return {drawMeshes:root.getObjectByProperty?countMeshes(root):0}}};
}
function countMeshes(root){let n=0;root.traverse(o=>{if(o.isMesh)n++});return n;}
