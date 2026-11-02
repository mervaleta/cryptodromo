import * as THREE from 'three';
/**
 * AAA-style atmosphere on a modest browser GPU budget.
 * One procedural alpha texture + one instanced plane draw call.
 * Clouds are presentation-only, never modify timing or weather scoring.
 */
export function createCloudLayer(scene,{mobile=false,softwareGPU=false}={}){
 const canvas=document.createElement('canvas');const size=160;
 canvas.width=canvas.height=size;
 const context=canvas.getContext('2d');
 if(!context)throw new Error('Canvas 2D needed for cloud texture');
 const image=context.createImageData(size,size);
 // Several gaussian lobes give soft cumulus silhouettes, without PNG assets.
 const lobes=[
  [-.38,.10,.39,.33,1.1],[-.08,-.12,.47,.33,1.0],
  [.26,.02,.44,.36,1.15],[.52,.13,.25,.25,.9],
  [-.09,.27,.58,.25,.74]
 ];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=2*(x+.5)/size-1,ny=2*(y+.5)/size-1;
  let field=0;
  for(const [cx,cy,rx,ry,strength] of lobes){
   const dx=(nx-cx)/rx,dy=(ny-cy)/ry;
   field+=strength*Math.exp(-2.1*(dx*dx+dy*dy));
  }
  const edge=Math.max(0,1-Math.pow(Math.abs(nx),5))*Math.max(0,1-Math.pow(Math.abs(ny),5));
  const noise=(Math.sin(x*.35+y*.21)*.035+Math.sin(x*.17-y*.11)*.035);
  const alpha=Math.max(0,Math.min(1,(field+noise-.26)*.65*edge));
  const i=(y*size+x)*4;
  image.data[i]=248;image.data[i+1]=250;image.data[i+2]=255;
  image.data[i+3]=Math.floor(alpha*255);
 }
 context.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;
 const material=new THREE.MeshBasicMaterial({
  map:texture,color:'#f2f5e9',transparent:true,opacity:.35,
  depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending
 });
 const count=softwareGPU?18:mobile?32:58;
 const geometry=new THREE.PlaneGeometry(1,1);
 const clouds=new THREE.InstancedMesh(geometry,material,count);
 clouds.name='Meteorología · banco de nubes';
 clouds.frustumCulled=false;clouds.renderOrder=3;
 const matrix=new THREE.Object3D();
 let seed=28011;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<count;i++){
  const w=63+rand()*105,h=36+rand()*68;
  matrix.position.set((rand()-.5)*1250,100+rand()*95,(rand()-.5)*950);
  matrix.rotation.set(Math.PI/2,0,(rand()-.5)*.75);
  matrix.scale.set(w,h,1);matrix.updateMatrix();
  clouds.setMatrixAt(i,matrix.matrix);
 }
 clouds.instanceMatrix.needsUpdate=true;scene.add(clouds);
 let coverage=.52,windSpeed=.6,tint='#f2f5e9';
 function configure({cover=coverage,night=false,rain=false,sunset=false,wind=windSpeed}={}){
  coverage=Math.max(0,Math.min(1,Number(cover)||0));
  windSpeed=Math.max(0,Math.min(5,Number(wind)||0));
  clouds.visible=coverage>.005;
  clouds.count=Math.max(0,Math.floor(count*coverage));
  tint=rain?'#9cb0b9':night?'#778aab':sunset?'#f6b7a3':'#f2f5e9';
  material.color.set(tint);
  material.opacity=rain?.72:night?.32:sunset?.42:.51;
 }
 function update(seconds){
  const drift=(Math.max(0,Number(seconds)||0)*windSpeed)%1200;
  clouds.position.x=drift;
 }
 function dispose(){
  scene.remove(clouds);geometry.dispose();material.dispose();texture.dispose();
 }
 configure();
 return {root:clouds,configure,update,dispose,get coverage(){return coverage}};
}
