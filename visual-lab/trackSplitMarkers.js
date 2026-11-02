/**
 * Scenic checkpoint markers. Purely visual and independent of market-derived
 * finish results. Repositions on track geometry and split preset changes.
 */
export function createSplitTrackMarkers({THREE,scene,trackPoint,initialLayout='straight'}){
 if(!THREE||!scene||typeof trackPoint!=='function')throw Error('Track markers need a Three.js scene and trackPoint');
 const group=new THREE.Group();group.name='CRP split checkpoint scenery';scene.add(group);
 const posts=[],textures=new Map();
 const postMaterial=new THREE.MeshStandardMaterial({color:0xdac18f,metalness:.38,roughness:.43});
 const bandMaterial=new THREE.MeshBasicMaterial({color:0xe2c17a,transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide});
 function textureFor(meters){
  if(textures.has(meters))return textures.get(meters);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#071e16';ctx.fillRect(0,0,256,96);
  ctx.fillStyle='#34e2ac';ctx.fillRect(0,0,7,96);ctx.fillRect(249,0,7,96);
  ctx.lineWidth=3;ctx.strokeStyle='#e9ce99';ctx.strokeRect(6,5,244,86);
  ctx.fillStyle='#fff3d6';ctx.font='900 43px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(meters+' M',127,50);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  textures.set(meters,texture);return texture;
 }
 for(let i=0;i<4;i++){
  const holder=new THREE.Group();group.add(holder);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.17,4.6,7),postMaterial);
  post.position.y=2.3;post.castShadow=false;holder.add(post);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:true}));
  sprite.position.y=6.1;sprite.scale.set(9.2,3.45,1);holder.add(sprite);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(1,.02,.36),bandMaterial);
  stripe.position.y=.065;group.add(stripe);
  posts.push({holder,sprite,stripe});
 }
 function update({layout=initialLayout,splitMode='quarters'}={}){
  const marks=splitMode==='legacy'?[200,400,600,800]:[250,500,750];
  for(let i=0;i<posts.length;i++){
   const item=posts[i],meters=marks[i];
   item.holder.visible=item.stripe.visible=meters!==undefined;
   if(meters===undefined)continue;
   const p=meters/1000;
   const edge=trackPoint(layout,p,12.6);
   item.holder.position.set(edge.x,0,edge.z);
   item.sprite.material.map=textureFor(meters);item.sprite.material.needsUpdate=true;
   const a=trackPoint(layout,p,-.6),b=trackPoint(layout,p,11.6);
   const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   item.stripe.position.set((a.x+b.x)/2,.07,(a.z+b.z)/2);
   item.stripe.scale.x=length;
   item.stripe.rotation.y=Math.atan2(-dz,dx);
  }
 }
 update();
 return {update,dispose(){
  scene.remove(group);
  for(const item of posts){item.sprite.material.dispose();item.holder.clear();}
  for(const t of textures.values())t.dispose();
  postMaterial.dispose();bandMaterial.dispose();
  group.clear();
 }};
}
