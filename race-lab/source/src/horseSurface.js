/**
 * Smoothed geometric normals without increasing triangle count or changing
 * skinning indices/weights, UVs or the existing GLB rig.
 * Shared-position seam normals are averaged on the ORIGINAL asset once,
 * so 12 horses do not recompute geometry.
 */
const processed=new WeakSet();
export function smoothHorseNormals(root,{strength=.91}={}){
 let meshes=0,vertices=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry||processed.has(mesh.geometry))return;
  const geometry=mesh.geometry,position=geometry.getAttribute('position');
  const normal=geometry.getAttribute('normal');
  if(!position||!normal||position.count!==normal.count)return;
  processed.add(geometry);
  const groups=new Map(),quantize=v=>Math.round(v*5000);
  for(let i=0;i<position.count;i++){
   const key=quantize(position.getX(i))+','+quantize(position.getY(i))+','+quantize(position.getZ(i));
   let g=groups.get(key);
   if(!g){g=[0,0,0,0];groups.set(key,g);}
   g[0]+=normal.getX(i);g[1]+=normal.getY(i);g[2]+=normal.getZ(i);g[3]++;
  }
  for(let i=0;i<position.count;i++){
   const key=quantize(position.getX(i))+','+quantize(position.getY(i))+','+quantize(position.getZ(i));
   const g=groups.get(key);
   const n=Math.hypot(g[0],g[1],g[2]);
   if(n<1e-6)continue;
   const nx=normal.getX(i)*(1-strength)+(g[0]/n)*strength;
   const ny=normal.getY(i)*(1-strength)+(g[1]/n)*strength;
   const nz=normal.getZ(i)*(1-strength)+(g[2]/n)*strength;
   const length=Math.hypot(nx,ny,nz)||1;
   normal.setXYZ(i,nx/length,ny/length,nz/length);
  }
  normal.needsUpdate=true;
  meshes++;vertices+=position.count;
 });
 return {meshes,vertices,triangleCountAdded:0};
}
