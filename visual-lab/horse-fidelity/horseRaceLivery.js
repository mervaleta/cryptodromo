/**
 * Procedural saddlecloth and seven-segment starting number.
 * No bitmap, canvas, font asset or texture lookup. Seven-segment numerals are
 * original plain 3D geometry, visible on both flanks and reconfigurable.
 */
export const DIGIT_SEGMENTS=Object.freeze({
 '0':'ab cdef'.replace(/ /g,''),'1':'bc','2':'abged','3':'abgcd',
 '4':'fgbc','5':'afgcd','6':'afgecd','7':'abc','8':'abcdefg','9':'abfgcd'
});
export function segmentsForNumber(value){
 const n=Number(value);
 if(!Number.isInteger(n)||n<1||n>99)throw RangeError('Runner number must be 1-99');
 return String(n).split('').map(ch=>DIGIT_SEGMENTS[ch].split(''));
}
export function makeDrapedClothGeometry(THREE,{width=.88,depth=.89,
 xCenter=-.10,topY=2.095,drop=.42}={}){
 if(!THREE?.BufferGeometry)throw Error('THREE required');
 const positions=[],normals=[],uvs=[],indices=[],rows=10,cols=15;
 for(let j=0;j<=rows;j++){
  const v=j/rows,z=(v-.5)*depth,abs=Math.abs(z)/(depth*.5);
  for(let i=0;i<=cols;i++){
   const u=i/cols,x=xCenter+(u-.5)*width;
   const edge=.06*(2*Math.abs(u-.5))**2;
   const y=topY-drop*Math.pow(abs,1.8)-edge;
   positions.push(x,y,z);uvs.push(u,v);
  }
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 g.setIndex(indices);g.computeVertexNormals();
 return g;
}
export function createGeometricRaceLivery({THREE,parent,number=1,accent='#ddbd70',
 quality='balanced'}={}){
 if(!THREE?.InstancedMesh||!parent)throw Error('THREE and parent required');
 const root=new THREE.Group();root.name='3D saddlecloth and race bib';
 const clothMat=new THREE.MeshPhysicalMaterial({color:new THREE.Color(accent),
  metalness:0,roughness:.76,clearcoat:.19,side:THREE.DoubleSide});
 const clothGeo=makeDrapedClothGeometry(THREE);
 const cloth=new THREE.Mesh(clothGeo,clothMat);cloth.name='Draped race cloth';
 cloth.castShadow=false;cloth.receiveShadow=true;root.add(cloth);
 const numberMat=new THREE.MeshStandardMaterial({color:'#fff4d5',
  metalness:.08,roughness:.55});
 const segmentGeo=new THREE.BoxGeometry(1,1,1);
 const numerals=new THREE.InstancedMesh(segmentGeo,numberMat,28);
 numerals.name='3D numbered racing mantilla';
 numerals.frustumCulled=false;numerals.castShadow=false;
 numerals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 root.add(numerals);
 const d=new THREE.Object3D();
 function setNumber(next){
  const glyphs=segmentsForNumber(next),positions={
   a:[0,.13,.17,.023],d:[0,-.13,.17,.023],g:[0,0,.17,.023],
   f:[-.083,.065,.023,.126],b:[.083,.065,.023,.126],
   e:[-.083,-.065,.023,.126],c:[.083,-.065,.023,.126]
  };
  let slot=0;
  for(const side of [-1,1])for(let digit=0;digit<glyphs.length;digit++){
   const shift=(digit-(glyphs.length-1)/2)*.23;
   for(const code of glyphs[digit]){
    const [px,py,w,h]=positions[code];
    d.position.set(-.10+shift+px,1.787+py,side*.385);
    d.scale.set(w,h,.016);d.rotation.set(-side*.47,0,0);d.updateMatrix();
    numerals.setMatrixAt(slot++,d.matrix);
   }
  }
  for(let i=slot;i<28;i++){
   d.position.set(0,-30,0);d.scale.setScalar(.0001);d.updateMatrix();
   numerals.setMatrixAt(i,d.matrix);
  }
  numerals.instanceMatrix.needsUpdate=true;
  return slot;
 }
 setNumber(number);
 parent.add(root);
 function setAccent(color){clothMat.color.set(color);}
 function setQuality(next){cloth.castShadow=next==='high';}
 function dispose(){
  root.removeFromParent();clothGeo.dispose();clothMat.dispose();
  segmentGeo.dispose();numberMat.dispose();
 }
 setQuality(quality);
 return {root,cloth,numerals,setNumber,setAccent,setQuality,dispose};
}
