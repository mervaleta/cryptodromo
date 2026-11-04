/**
 * BTC eyelid assembly v14, built directly around the actual sculpted eye
 * globes on the ORIGINAL Head joint. The earlier nearest-skin projected
 * triangles sheared in front and profile view and created black glints.
 * There are no standalone tear duct triangles or floating decals.
 */
import * as THREE from 'three';
const PI=Math.PI;
const EYE={x:.002235,y:-.02814,z:.04257,radius:.000385};
function eyelid(source,head,coatColor,upper){
 const geometry=new THREE.BufferGeometry(),positions=[],joints=[],weights=[],tints=[],indices=[];
 const SEG=48,ROWS=3,arc=upper?0:PI;
 for(const side of [-1,1]){
  const base=positions.length/3;
  for(let row=0;row<=ROWS;row++){
   const t=row/ROWS;
   for(let i=0;i<=SEG;i++){
    const a=arc+PI*i/SEG;
    // Soft, elliptical skin fold at the globe edge. Both parts follow the
    // exact same Head transform and use a single continuous radial strip.
    const yy=Math.cos(a),zz=Math.sin(a);
    const ry=.000345+.000195*t,rz=.000307+.000184*t;
    const outer=EYE.x+.000245-.000038*t;
    const sculpt=(1-Math.cos(a*2))*.000019*(1-t);
    const x=side*(outer+sculpt);
    const y=EYE.y+ry*yy;
    const z=EYE.z+rz*zz;
    positions.push(x,y,z);
    joints.push(head,0,0,0);weights.push(1,0,0,0);
    const dark=upper?.75:.81;
    const tint=dark+(1-dark)*t;
    tints.push(tint,tint*.985,tint*.955);
   }
  }
  for(let row=0;row<ROWS;row++)for(let i=0;i<SEG;i++){
   const a=base+row*(SEG+1)+i,b=a+1,c=a+(SEG+1),d=c+1;
   indices.push(a,c,b,b,c,d);
  }
 }
 geometry.setIndex(indices);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(tints,3));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new THREE.MeshPhysicalMaterial({
  name:upper?'BTC anatomical superior palpebra':'BTC anatomical inferior palpebra',
  color:coatColor instanceof THREE.Color?coatColor:new THREE.Color('#a96a43'),
  vertexColors:true,metalness:0,roughness:.87,
  sheen:.09,clearcoat:0,side:THREE.DoubleSide,depthWrite:true
 });
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name=upper?'BTC smooth bilateral upper eyelids':'BTC smooth bilateral lower eyelids';
 mesh.position.copy(source.position);
 mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);
 mesh.bindMode=source.bindMode;
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
 return {mesh,geometry,material};
}
export function createBTCMayaFaceDetails(source,skinAt,positions,{coatColor}={}){
 const head=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(head<0)throw Error('BTC eyelids require original Head joint');
 const layers=[
  eyelid(source,head,coatColor,true),
  eyelid(source,head,coatColor,false)
 ];
 return {
  surfaces:layers.length,
  triangles:layers.reduce((n,c)=>n+c.geometry.index.count/3,0),
  eyeAssembly:'concentric-skinned-palpebra-v14',
  dispose(){
   for(const layer of layers){
    layer.mesh.removeFromParent();layer.geometry.dispose();layer.material.dispose();
   }
  }
 };
}
