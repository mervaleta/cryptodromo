/**
 * BTC Harmony: two small sculpted alert pinnae.
 * Rest-space geometry and all weights use the ORIGINAL Head bone, so the
 * leaves follow the authored Gallop without a second rig or a billboard.
 * Deliberately art-directed: soft teardrop silhouette, rounded inner ear,
 * slightly asymmetrical angle. No false long rabbit-ear spikes.
 */
import * as THREE from 'three';
const PI=Math.PI;
export function createBTCHarmonyEars(source,{coatColor}={}){
 const headBone=source.skeleton.bones.findIndex(b=>b.name==='Head');
 if(headBone<0)throw Error('BTC Harmony requires original Head joint');
 const positions=[],weights=[],indices=[],colors=[];
 const SEGMENTS=15,ACROSS=6;
 function addVertex(x,y,z,r,g,b){
  positions.push(x,y,z);
  weights.push(headBone,0,0,0);
  colors.push(r,g,b);
  return positions.length/3-1;
 }
 for(const side of [-1,1]){
  const base=positions.length/3;
  // One smooth double-sided taper per ear, slightly different natural tilt.
  for(let face=0;face<2;face++){
   for(let row=0;row<=SEGMENTS;row++){
    const t=row/SEGMENTS;
    const balloon=Math.pow(Math.max(0,Math.sin(PI*t)),.76);
    const halfWidth=.00022*(1-t)+.00060*balloon+.000060;
    const z=.04505+.00318*t+.00010*Math.sin(PI*t);
    const cx=side*(.00148+.00016*t + (side>0?.00006:0)*t);
    const cy=-.02586-.00092*t+.00026*Math.sin(PI*t);
    for(let col=0;col<=ACROSS;col++){
     const across=col/ACROSS*2-1;
     // A convex front and a round outer back, tapering to a neat tip.
     const swell=(1-across*across)*balloon;
     const y=cy+(face===0?-.00017-.00017*swell:.00018+.00022*swell);
     const x=cx+across*halfWidth;
     const edge=Math.abs(across);
     const shade=face===0?(1.02-.22*edge):(.73+.11*(1-edge));
     // Muted rosé velvet on the inner ear, chestnut rim and back.
     const inner=face===0?(1-edge)*balloon:0;
     addVertex(x,y,z,
      shade*(1+.07*inner),shade*(.83+.10*inner),shade*(.72+.09*inner));
    }
   }
  }
  const span=(SEGMENTS+1)*(ACROSS+1);
  for(let face=0;face<2;face++){
   const start=base+face*span;
   for(let row=0;row<SEGMENTS;row++){
    for(let c=0;c<ACROSS;c++){
     const a=start+row*(ACROSS+1)+c,b=a+1,
       d=a+ACROSS+1,e=d+1;
     if(face===0)indices.push(a,d,b,b,d,e);
     else indices.push(a,b,d,b,e,d);
    }
   }
  }
  // Join both shell edges and the broad base to avoid paper-thin contours.
  for(const c of [0,ACROSS]){
   for(let row=0;row<SEGMENTS;row++){
    const a=base+row*(ACROSS+1)+c,b=a+(ACROSS+1);
    const d=a+span,e=b+span;
    indices.push(a,b,d,b,e,d);
   }
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indices);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(weights,4));
 const normalWeights=[];
 for(let i=0;i<positions.length/3;i++)normalWeights.push(1,0,0,0);
 geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(normalWeights,4));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.computeVertexNormals();geo.computeBoundingSphere();
 const isHex=/^#[0-9a-f]{6}$/i.test(coatColor||'');
 const material=new THREE.MeshPhysicalMaterial({
  name:'BTC Harmony sculpted chestnut velvet ears',
  color:isHex?coatColor:'#946547',vertexColors:true,
  roughness:.84,metalness:0,sheen:.24,sheenRoughness:.75,
  side:THREE.DoubleSide
 });
 const mesh=new THREE.SkinnedMesh(geo,material);
 mesh.name='BTC two elegant equine ears, native Head rig';
 mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);
 mesh.scale.copy(source.scale);mesh.bindMode=source.bindMode;
 source.parent.add(mesh);mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
 return {count:2,triangles:indices.length/3,dispose(){
  mesh.removeFromParent();geo.dispose();material.dispose();
 }};
}
