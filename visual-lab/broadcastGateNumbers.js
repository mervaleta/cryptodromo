/**
 * Optional, independently disposable number decals for Alpha20 gates.
 * Keep the existing race entries order: stall n = entries[n-1].
 * These badges are scenery only and do not assign racing lanes.
 */
export function attachGateNumbers({THREE,root,entries,startX=-390}){
 if(!THREE?.CanvasTexture||typeof document==='undefined')throw new Error('Browser + THREE.CanvasTexture required');
 if(!root||!Array.isArray(entries)||entries.length!==12)throw new Error('12 entries and a gate root are required');
 const group=new THREE.Group();group.name='Alpha20 numbered stall signs';root.add(group);
 const mats=[],textures=[],geometries=[],planes=[];
 const paint=(material,number,color,symbol)=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0c1815';ctx.fillRect(0,0,512,256);
  ctx.fillStyle=color;ctx.fillRect(8,8,496,240);
  ctx.fillStyle='#111a16';ctx.fillRect(24,24,464,208);
  ctx.fillStyle=color;ctx.fillRect(33,33,446,190);
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 155px Arial,sans-serif';ctx.strokeStyle='#07110c';ctx.lineWidth=10;
  ctx.strokeText(String(number),256,120);ctx.fillText(String(number),256,120);
  ctx.font='bold 40px Arial,sans-serif';ctx.strokeText(symbol.slice(0,9),256,216);ctx.fillText(symbol.slice(0,9),256,216);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  textures.push(t);material.map=t;material.needsUpdate=true;
 };
 entries.forEach((entry,i)=>{
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});mats.push(material);
  const geometry=new THREE.PlaneGeometry(1.54,.65);geometries.push(geometry);
  const plane=new THREE.Mesh(geometry,material);
  plane.rotation.y=Math.PI/2;
  plane.position.set(startX-3.6+2.37,3.41,(i-5.5)*2.55);
  group.add(plane);planes.push(plane);
  paint(material,i+1,entry.color||'#2cd9a3',entry.symbol||'?');
 });
 function setEntries(next){
  if(!Array.isArray(next)||next.length!==12)throw new Error('12 entries required');
  textures.forEach(t=>t.dispose());textures.length=0;
  next.forEach((entry,i)=>paint(mats[i],i+1,entry.color||'#2cd9a3',entry.symbol||'?'));
 }
 function dispose(){
  group.parent?.remove(group);textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
 }
 return {root:group,setEntries,dispose};
}
