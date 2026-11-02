import * as THREE from 'three';
import {trackPoint} from './trackMath.js?v=a08-2';

function ribbon(mode,material,width=40){
 const n=250,positions=[],uv=[],idx=[];
 for(let i=0;i<=n;i++){
  const p=i/n,c=trackPoint(mode,p),half=width/2;
  for(let j of [-1,1]){
   positions.push(c.x+j*c.sideX*half,.080,c.z+j*c.sideZ*half);
   uv.push(p*18,j===-1?0:1);
  }
  if(i<n){const a=2*i;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(idx);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,material);
 mesh.receiveShadow=true;mesh.castShadow=false;
 mesh.material.side=THREE.DoubleSide;return mesh;
}
function rail(mode,offset,material,group){
 const points=[];
 for(let i=0;i<=250;i++){
  const p=i/250,c=trackPoint(mode,p);
  points.push(new THREE.Vector3(c.x+offset*c.sideX,1.2,c.z+offset*c.sideZ));
 }
 const curve=new THREE.CatmullRomCurve3(points,mode==='oval','centripetal');
 const geo=new THREE.TubeGeometry(curve,350,.10,4,mode==='oval');
 const m=new THREE.Mesh(geo,material);m.castShadow=false;group.add(m);
 const postGeo=new THREE.CylinderGeometry(.06,.08,1.25,5),posts=new THREE.InstancedMesh(postGeo,material,mode==='oval'?120:95);
 const dummy=new THREE.Object3D(),count=posts.count;
 for(let i=0;i<count;i++){
  const p=i/count,c=trackPoint(mode,p);
  dummy.position.set(c.x+c.sideX*offset,.67,c.z+c.sideZ*offset);
  dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);
 }
 posts.instanceMatrix.needsUpdate=true;group.add(posts);
}
function lines(mode,material,group){
 for(let l=1;l<12;l++){
  const verts=[];
  for(let i=0;i<=200;i++){
   const c=trackPoint(mode,i/200,l);
   verts.push(c.x,.103,c.z);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  group.add(new THREE.Line(g,material));
 }
}
export function createAlternativeTracks(scene,trackMaterial,railMaterial){
 const courses={};
 for(const mode of ['s-bend','oval']){
  const group=new THREE.Group();group.name='CRYPTODROMO · '+mode;scene.add(group);
  group.add(ribbon(mode,trackMaterial));
  rail(mode,-21,railMaterial,group);
  rail(mode,21,railMaterial,group);
  const markMat=new THREE.LineBasicMaterial({color:'#f4e0ba',opacity:.22,transparent:true});
  lines(mode,markMat,group);
  // Start and official finish: grounded stripes, not hovering decorations.
  const finish=trackPoint(mode,1,5.5),start=trackPoint(mode,0,5.5);
  const lineMat=new THREE.MeshBasicMaterial({color:'#fff8e7',side:THREE.DoubleSide});
  for(const point of [start,finish]){
   const m=new THREE.Mesh(new THREE.PlaneGeometry(40,.33),lineMat);
   m.rotation.x=-Math.PI/2;
   m.rotation.z=point.heading;
   m.position.set(point.x,.108,point.z);group.add(m);
  }
  courses[mode]=group;
  group.visible=false;
 }
 return {courses,select(mode){
   for(const [name,group] of Object.entries(courses))group.visible=name===mode;
 }};
}
