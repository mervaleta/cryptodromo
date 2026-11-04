/**
 * Two TRUE orbital annuli sewn to the eleven boundary vertices of each
 * eye opening in Horse_VR_2017.ma. No guessed projected lids and no texture.
 * The old cosmetic strip was placed outside these original anatomical holes.
 */
import * as THREE from 'three';
import {BTC_EYE_LAYOUT,eyeNormal} from './btc-maya-eye-layout.js?v=btc-face-poll-tail-20261104-v15';

function makeOrbitAnnulus(source,positions,side,coatColor){
 const e=BTC_EYE_LAYOUT;
 const boundary=side<0?e.boundary.left:e.boundary.right;
 if(positions.length/3<5406||boundary.length!==11)
  throw Error('BTC eye repair requires the verified Maya 2017 socket loops');
 const normal=eyeNormal(side),center=[side*e.x,e.y,e.z];
 const xyz=[],colors=[],idx=[];
 for(const id of boundary){
  const p=[positions[id*3],positions[id*3+1],positions[id*3+2]];
  if(!p.every(Number.isFinite)||Math.abs(p[1]-e.y)>.0017)
   throw Error('BTC eye socket border changed; refusing detached eyelid');
  const r=[p[0]-center[0],p[1]-center[1],p[2]-center[2]];
  // Exact outer rim copies the real 2017 mesh edge. This means it cannot
  // hover in front of the head or leave a triangular hole behind it.
  xyz.push(...p);
  colors.push(1,1,1);
  const inner=p.map((x,i)=>center[i]+.56*r[i]+normal[i]*.000076);
  xyz.push(...inner);
  const darken=p[2]>e.z?.76:.88;
  colors.push(darken,darken*.95,darken*.90);
 }
 for(let i=0;i<boundary.length;i++){
  const a=2*i,b=2*((i+1)%boundary.length),c=a+1,d=b+1;
  idx.push(a,b,c,c,b,d);
 }
 const geom=new THREE.BufferGeometry();
 geom.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geom.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geom.setIndex(idx);
 geom.computeVertexNormals();geom.computeBoundingSphere();
 const bone=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(bone<0)throw Error('Native Head joint required for welded orbital annulus');
 const indices=new Uint16Array(xyz.length/3*4);
 const weights=new Float32Array(xyz.length/3*4);
 for(let i=0;i<xyz.length/3;i++){indices[i*4]=bone;weights[i*4]=1;}
 geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
 geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 const material=new THREE.MeshPhysicalMaterial({
  name:'BTC anatomical eye socket skin, warm sculpted lid',
  color:coatColor,vertexColors:true,metalness:0,roughness:.82,
  sheen:.07,sheenRoughness:.95,clearcoat:0,side:THREE.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-.3,polygonOffsetUnits:-.3
 });
 const mesh=new THREE.SkinnedMesh(geom,material);
 mesh.name='BTC original Maya '+(side<0?'left':'right')+' eye rim sewn to socket';
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);mesh.bindMode=source.bindMode;
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
 return {mesh,geom,material};
}
export function createBTCMayaFaceDetails(source,skinAt,positions,{coatColor='#9e6444'}={}){
 const components=[
  makeOrbitAnnulus(source,positions,-1,coatColor),
  makeOrbitAnnulus(source,positions,1,coatColor)
 ];
 return {
  surfaces:components.length,
  triangles:components.reduce((n,c)=>n+c.geom.index.count/3,0),
  continuity:'native-11-edge-closed-orbits-v15',
  socketBoundaryVertices:22,
  dispose(){for(const c of components){
   c.mesh.removeFromParent();c.geom.dispose();c.material.dispose();
  }}
 };
}
