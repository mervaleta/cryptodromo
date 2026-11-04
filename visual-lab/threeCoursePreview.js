import {trackPoint} from './trackMath.js';
import {STADIUM_COURSES} from './threeCourseLayout.js';

/**
 * SATOSHI NAKAMOTO / MASTER THREE-COURSE PLAN v2.
 * One exterior Muybridge oval around the Vint Cerf infield S, with the
 * Genesis diagonal beyond the northern perimeter.
 *
 * The three physical meshes NEVER decide results: their world transform is
 * explicitly derived from the broadcast trackPoint modes. Only scenery,
 * railings and the museum camera use these coordinates.
 */
export const THREE_COURSE_POSITIONS=Object.freeze({
 muybridge:Object.freeze({mode:'oval',centerZ:0,scaleX:1,scaleZ:1.09,angle:0,color:0x986a44,surface:'clay'}),
 genesis:Object.freeze({mode:'straight',centerZ:205,scaleX:.76,scaleZ:1,angle:-.21,color:0xcbb28d,surface:'synthetic'}),
 'vint-cerf':Object.freeze({mode:'s-bend',centerZ:0,scaleX:.70,scaleZ:1,angle:0,color:0x467c59,surface:'turf'})
});
export const SATOSHI_COURSE_MASTER='satoshi-three-course-master-v2';
export const SATOSHI_MIN_SAMPLE_CLEARANCE=10;
const RAD=Math.PI*2;

export function stadiumCoursePoint(id,p,lateral=0){
 const config=THREE_COURSE_POSITIONS[id];
 if(!config||!Number.isFinite(p)||!Number.isFinite(lateral))throw new RangeError('Unknown course or invalid progress');
 const point=trackPoint(config.mode,p);
 const x=point.x*config.scaleX+lateral*point.sideX;
 const z=point.z*config.scaleZ+lateral*point.sideZ;
 const c=Math.cos(config.angle),s=Math.sin(config.angle);
 return {x:x*c-z*s,z:x*s+z*c+config.centerZ};
}
export function stadiumCourseTangent(id,p){
 const first=stadiumCoursePoint(id,Math.max(0,p-.0001));
 const last=stadiumCoursePoint(id,Math.min(1,p+.0001));
 const dx=last.x-first.x,dz=last.z-first.z;
 const length=Math.hypot(dx,dz)||1;
 return {x:dx/length,z:dz/length};
}
export function courseBoundaryClearance(a,b,samples=240){
 let min=Infinity;
 for(let i=0;i<=samples;i++){
  const progress=i/samples;
  for(const edge of [-20.5,0,20.5]){
   const pos=stadiumCoursePoint(a,progress,edge);
   for(let j=0;j<=samples;j++){
    const otherProgress=j/samples;
    for(const otherEdge of [-20.5,0,20.5]){
     const q=stadiumCoursePoint(b,otherProgress,otherEdge);
     min=Math.min(min,Math.hypot(q.x-pos.x,q.z-pos.z));
    }
   }
  }
 }
 return min;
}

export function buildThreeCoursePreview({THREE,scene,quality='medium'}={}){
 if(!THREE||!scene)throw new TypeError('THREE and scene required');
 const root=new THREE.Group();
 root.name='SATOSHI_NAKAMOTO_THREE_COURSE_MASTER_V2';
 scene.add(root);
 const geometries=new Set(),materials=new Set(),textures=new Set();
 const ownGeo=g=>(geometries.add(g),g);
 const ownMat=m=>(materials.add(m),m);
 const ownTex=t=>(textures.add(t),t);
 const mat=(hex,extra={})=>ownMat(new THREE.MeshStandardMaterial({color:hex,roughness:.88,...extra}));
 const grass=mat(0x466a45),northLawn=mat(0x4c7152),walk=mat(0x9b907b),dark=mat(0x2b3935);
 const white=mat(0xe7eadf,{roughness:.6}),chalk=mat(0xfcf3da,{roughness:.85});
 const bronze=mat(0xcfa86e,{metalness:.26,roughness:.52});
 const greenLight=mat(0x72ecaf,{emissive:0x30c878,emissiveIntensity:.45,roughness:.4});
 const cube=ownGeo(new THREE.BoxGeometry(1,1,1));
 const pole=ownGeo(new THREE.CylinderGeometry(.09,.12,1,6));
 const detail=quality==='low'?96:quality==='high'?320:192;
 const courseGroups=new Map(),trackMaterials=new Map();
 let ribbonCount=0,lightCount=0,signCount=0;

 function mesh(geometry,material,parent=root){
  const object=new THREE.Mesh(geometry,material);
  object.castShadow=false;object.receiveShadow=true;parent.add(object);return object;
 }
 function box(parent,x,y,z,width,height,depth,material){
  const item=mesh(cube,material,parent);
  item.position.set(x,y,z);item.scale.set(width,height,depth);
  return item;
 }
 function bridge(parent,a,b,y,thickness,material){
  const start=new THREE.Vector3(a.x,y,a.z),end=new THREE.Vector3(b.x,y,b.z);
  const delta=end.clone().sub(start);
  const rod=mesh(ownGeo(new THREE.CylinderGeometry(thickness,thickness,delta.length(),7)),material,parent);
  rod.position.copy(start).add(end).multiplyScalar(.5);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return rod;
 }
 // Strong shared base, but the historic grandstand, clubhouse and forest are
 // owned by venue.js. No second stadium building, crowd, weather or sky.
 box(root,0,-.28,0,750,.14,223,grass);
 box(root,0,-.30,206,750,.15,216,northLawn);
 box(root,0,-.20,310,700,.07,5,walk);
 // Visitor circulation runs outside the tracks, not through the lanes.
 for(const x of [-330,330])box(root,x,-.18,98,6,.06,345,walk);
 box(root,0,-.19,115,720,.07,5,walk);

 function signTexture(label,accent){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0a1816';ctx.fillRect(0,0,1024,128);
  ctx.fillStyle=accent;ctx.fillRect(0,0,1024,9);
  ctx.fillStyle='#f3f6ed';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 54px Arial';ctx.fillText(label,512,72,950);
  const texture=ownTex(new THREE.CanvasTexture(canvas));
  texture.colorSpace=THREE.SRGBColorSpace;
  return ownMat(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:false}));
 }
 function addRaceBanner(group,id,p,label,shade){
  const left=stadiumCoursePoint(id,p,-19),right=stadiumCoursePoint(id,p,19);
  for(const point of [left,right]){
   const column=mesh(ownGeo(new THREE.CylinderGeometry(.27,.38,7.7,7)),dark,group);
   column.position.set(point.x,3.85,point.z);
  }
  bridge(group,left,right,8,.24,white);
  const mid={x:(left.x+right.x)/2,z:(left.z+right.z)/2};
  const material=signTexture(label,shade);
  const board=mesh(ownGeo(new THREE.PlaneGeometry(34,3.0)),material,group);
  board.position.set(mid.x,6.8,mid.z);
  const crossX=right.x-left.x,crossZ=right.z-left.z;
  board.rotation.y=-Math.atan2(crossZ,crossX);
  signCount++;
 }
 function ribbon(group,id,halfWidth,y,material){
  const vertices=[],indices=[];
  for(let i=0;i<=detail;i++){
   const p=i/detail,a=stadiumCoursePoint(id,p,-halfWidth),b=stadiumCoursePoint(id,p,halfWidth);
   vertices.push(a.x,y,a.z,b.x,y,b.z);
   if(i<detail){
    const n=i*2;
    indices.push(n,n+2,n+1,n+1,n+2,n+3);
   }
  }
  const geometry=ownGeo(new THREE.BufferGeometry());
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const surface=mesh(geometry,material,group);
  surface.material.side=THREE.DoubleSide;
  ribbonCount++;
 }
 function dashedLanes(group,id){
  const vertices=[];
  const segments=quality==='low'?70:quality==='high'?180:100;
  for(let lane=1;lane<=11;lane++){
   const side=(lane-6)*2.55;
   for(let i=0;i<segments;i+=3){
    const a=stadiumCoursePoint(id,i/segments,side);
    const b=stadiumCoursePoint(id,Math.min(1,(i+1.5)/segments),side);
    vertices.push(a.x,.17,a.z,b.x,.17,b.z);
   }
  }
  const g=ownGeo(new THREE.BufferGeometry());
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  group.add(new THREE.LineSegments(g,ownMat(new THREE.LineBasicMaterial({color:0xf3eedc,transparent:true,opacity:.55}))));
 }
 function rail(group,id,lateral){
  const points=[];
  for(let i=0;i<detail;i++){
   const pos=stadiumCoursePoint(id,i/detail,lateral);
   points.push(new THREE.Vector3(pos.x,1.40,pos.z));
  }
  if(id!=='muybridge'){
   const pos=stadiumCoursePoint(id,1,lateral);points.push(new THREE.Vector3(pos.x,1.40,pos.z));
  }
  const closed=id==='muybridge';
  const curve=new THREE.CatmullRomCurve3(points,closed,'centripetal');
  const tube=mesh(ownGeo(new THREE.TubeGeometry(curve,detail,.095,5,closed)),white,group);
  tube.receiveShadow=false;
  const count=quality==='low'?30:quality==='high'?88:54;
  const inst=new THREE.InstancedMesh(pole,dark,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const pt=stadiumCoursePoint(id,i/count,lateral);
   dummy.position.set(pt.x,.76,pt.z);
   dummy.scale.set(1,1.5,1);dummy.updateMatrix();
   inst.setMatrixAt(i,dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate=true;group.add(inst);
 }
 function startingLine(group,id,p,finish=false){
  const strips=12,material1=finish?white:chalk,material2=finish?dark:bronze;
  const mid=stadiumCoursePoint(id,p);
  const tangent=stadiumCourseTangent(id,p);
  // Checkerboard at the official VISUAL start/finish only. Race result
  // continues to come from officialRace.js, never this landmark.
  for(let lane=0;lane<strips;lane++){
   const lateral=(lane-5.5)*2.55;
   const pos=stadiumCoursePoint(id,p,lateral);
   const stripe=box(group,pos.x,.19,pos.z,2.0,.028,2.55,
    lane%2?material1:material2);
   stripe.rotation.y=-Math.atan2(tangent.z,tangent.x);
  }
  const side=stadiumCoursePoint(id,p,25);
  const marker=box(group,side.x,2.3,side.z,1.4,4.6,1.4,finish?bronze:dark);
  const cap=box(group,side.x,4.8,side.z,2.5,.4,2.5,greenLight);
  marker.name=finish?'META_OFICIAL_VISUAL':'SALIDA_VISUAL';
 }
 function trackLights(group,id){
  const count=quality==='low'?8:quality==='high'?24:14;
  const posts=new THREE.InstancedMesh(pole,dark,count);
  const glows=new THREE.InstancedMesh(cube,greenLight,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const pos=stadiumCoursePoint(id,(i+.5)/count,i%2?28:-28);
   dummy.position.set(pos.x,6,pos.z);
   dummy.scale.set(3,12,3);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);
   dummy.position.set(pos.x,12.2,pos.z);
   dummy.scale.set(2.5,.7,1.0);dummy.updateMatrix();glows.setMatrixAt(i,dummy.matrix);
  }
  posts.instanceMatrix.needsUpdate=true;
  glows.instanceMatrix.needsUpdate=true;
  group.add(posts,glows);lightCount+=count;
 }
 for(const course of STADIUM_COURSES){
  const id=course.id,config=THREE_COURSE_POSITIONS[id];
  const group=new THREE.Group();group.name='SATOSHI_TRACK_'+id.toUpperCase();root.add(group);
  courseGroups.set(id,group);
  const m=mat(config.color,{roughness:config.surface==='turf'?.98:.89,emissive:config.color,emissiveIntensity:.025});
  trackMaterials.set(id,m);
  ribbon(group,id,20.5,.056,dark);ribbon(group,id,17,.096,m);
  dashedLanes(group,id);
  rail(group,id,-20);rail(group,id,20);
  startingLine(group,id,id==='muybridge'?0:.01,false);
  if(id!=='muybridge')startingLine(group,id,1,true);
  trackLights(group,id);
  const color='#'+config.color.toString(16).padStart(6,'0');
  addRaceBanner(group,id,id==='muybridge'?0:.012,(id==='muybridge'?'MUYBRIDGE · OVALO':id==='genesis'?'GENESIS · RECTA DIAGONAL':'VINT CERF · CIRCUITO S'),color);
 }
 // Two compact uncovered spectator banks for Genesis, leaving the existing
 // venue.js historic main grandstand untouched.
 const stands=new THREE.Group();stands.name='GENESIS_SPECTATOR_BANKS';root.add(stands);
 for(const centerX of [-157,157]){
  box(stands,centerX,.45,319,130,.9,31,walk);
  for(let tier=0;tier<5;tier++)box(stands,centerX,1.4+tier*1.15,321+tier*4.2,128,.7,3.4,tier%2?white:bronze);
  box(stands,centerX,9.5,345,132,.6,24,dark);
 }
 let focusId=null;
 function setFocus(id=null){
  if(id!==null&&!courseGroups.has(id))throw new RangeError('Unknown focus course');
  focusId=id;
  for(const [course,material] of trackMaterials){
   material.emissiveIntensity=id===null?.045:id===course?.24:.015;
  }
  return focusId;
 }
 setFocus(null);
 return {
  root,
  courses:STADIUM_COURSES.map(course=>course.id),
  get focus(){return focusId;},
  setFocus,
  stats:Object.freeze({ribbonCount,lightCount,signCount,courseCount:courseGroups.size,layoutVersion:SATOSHI_COURSE_MASTER}),
  dispose(){
   scene.remove(root);root.clear();
   geometries.forEach(g=>g.dispose());
   textures.forEach(t=>t.dispose());
   materials.forEach(m=>m.dispose());
  }
 };
}
