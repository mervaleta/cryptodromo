/**
 * Sculpted four-hoof keratin shells aligned to the supplied Maya horse's
 * measured hoof footprints. Kept in original GLB rest space and skinned to
 * the existing Gallop; no additional rigs, image planes or external assets.
 */
import * as THREE from 'three';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createBTCSculptedHooves(source,skinAt,{hoofColor='#37302b'}={}){
 const xyz=[],skinIndices=[],skinWeights=[],colors=[],indexes=[],groups=[];
 const SIDES=32;
 const feet=[
  {x:-.00265,y:-.0162,front:true},
  {x:.00265,y:-.0162,front:true},
  {x:-.00278,y:.01045,front:false},
  {x:.00278,y:.01045,front:false}
 ];
 for(const [footIndex,foot] of feet.entries()){
  const start=xyz.length/3;
  // The closed oval sole, flaring hoof wall, bevel and coronet are distinct.
  // One continuous, tapering sculpt from sole through coronary band
  // and well UP the pastern. The previous shell stopped at z=.00306
  // while the animated leg started higher, creating detached boots.
  const rings=[
   {z:.00002,scale:1.06,forward:1.12},
   {z:.00034,scale:1.10,forward:1.15},
   {z:.00112,scale:1.04,forward:1.10},
   {z:.00189,scale:.94,forward:1.02},
   {z:.00258,scale:.82,forward:.94},
   {z:.00330,scale:.69,forward:.87},
   {z:.00426,scale:.54,forward:.80},
   {z:.00555,scale:.41,forward:.74}
  ];
  const yToe=foot.front?-.00017:-.00012;
  const rx=foot.front?.00099:.00106;
  const ry=foot.front?.00137:.00129;
  for(let row=0;row<rings.length;row++){
   const r=rings[row];
   for(let j=0;j<SIDES;j++){
    const theta=j*TAU/SIDES,cs=Math.cos(theta),sn=Math.sin(theta);
    // Longer toe (forward/negative Y), narrower round heel.
    const toe=sn<0?r.forward:.94;
    const sideScale=1+.014*Math.sin(theta*5+footIndex*3);
    const x=foot.x+cs*rx*r.scale*sideScale;
    const y=foot.y+sn*ry*r.scale*toe+yToe*(1-row/(rings.length-1));
    xyz.push(x,y,r.z);
    // Hoof shells must follow the SAME interpolated bone influences as the
    // adjoining native Maya fetlocks. A single skin sample at the hoof center
    // previously caused four detached rigid boots during the real Gallop.
    const sk=skinAt(x,y,r.z);
    const sum=sk.weights.reduce((a,b)=>a+b,0)||1;
    for(let b=0;b<4;b++){skinIndices.push(sk.joints[b]||0);skinWeights.push((sk.weights[b]||0)/sum);}
    const streak=.93+.055*Math.sin(theta*14+footIndex*4)
       +.03*Math.sin(theta*23+row*.2);
    const bottom=.80+.20*row/(rings.length-1);
    const toeGlow=1+.065*Math.max(0,-sn);
    colors.push(streak*bottom*toeGlow,streak*bottom*.96,streak*bottom*.90);
   }
  }
  const indexStart=indexes.length;
  // Soft continuous hoof wall with true beveled edges, no angular block.
  for(let row=0;row<rings.length-3;row++)for(let j=0;j<SIDES;j++){
   const jn=(j+1)%SIDES,a=start+row*SIDES+j,b=start+row*SIDES+jn,
    c=start+(row+1)*SIDES+j,d=start+(row+1)*SIDES+jn;
   indexes.push(a,b,c,b,d,c);
  }
  const hoofTriangleCount=indexes.length-indexStart;
  groups.push({start:indexStart,count:hoofTriangleCount,materialIndex:0});
  const ringStart=indexes.length;
  // A soft raised coronet gradually becomes skin, across two rings,
  // with no hard material cut or floating shoe mouth.
  for(let row=rings.length-3;row<rings.length-1;row++){
   for(let j=0;j<SIDES;j++){
    const next=(j+1)%SIDES;
    const a=start+row*SIDES+j,b=start+row*SIDES+next;
    const c=start+(row+1)*SIDES+j,d=start+(row+1)*SIDES+next;
    indexes.push(a,b,c,b,d,c);
   }
  }
  groups.push({start:ringStart,count:indexes.length-ringStart,materialIndex:1});
 }
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indexes);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 for(const g of groups)geo.addGroup(g.start,g.count,g.materialIndex);
 geo.computeVertexNormals();geo.computeBoundingSphere();
 const shell=new THREE.MeshPhysicalMaterial({
  name:'BTC warm sculpted keratin',color:/^#[0-9a-f]{6}$/i.test(hoofColor)?hoofColor:'#654734',
  vertexColors:true,metalness:0,roughness:.77,
  clearcoat:.045,clearcoatRoughness:.68,side:THREE.DoubleSide
 });
 const coronet=new THREE.MeshStandardMaterial({
  name:'BTC blended skin-to-hoof pastern',color:'#885e46',vertexColors:true,
  metalness:0,roughness:.86,side:THREE.DoubleSide
 });
 const mesh=new THREE.SkinnedMesh(geo,[shell,coronet]);
 mesh.name='BTC Maya four sculpted hooves with true horn wall and coronet';
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);mesh.bindMode=source.bindMode;
 source.parent.add(mesh);
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 return {hooves:4,vertices:xyz.length/3,mesh,
  dispose(){mesh.removeFromParent();geo.dispose();shell.dispose();coronet.dispose();}
 };
}
