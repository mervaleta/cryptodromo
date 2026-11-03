/**
 * Alpha22 original organic loft mesh generator.
 * All anatomy surfaces are computed from mathematical sections. No GLB, OBJ,
 * skin image, sprite, baked UV map or foreign purchased geometry is read.
 */
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
export const HORSE_GEOMETRY_QUALITY=Object.freeze({
 eco:Object.freeze({rings:9,sides:9,hair:26}),
 balanced:Object.freeze({rings:16,sides:14,hair:54}),
 high:Object.freeze({rings:26,sides:22,hair:94})
});
export function geometryBudget(quality='balanced'){
 return HORSE_GEOMETRY_QUALITY[quality]||HORSE_GEOMETRY_QUALITY.balanced;
}
export function interpolateSection(sections,t){
 if(!Array.isArray(sections)||sections.length<2)throw Error('At least two loft sections required');
 const progress=Math.max(0,Math.min(1,Number(t)||0))*(sections.length-1);
 const i=Math.min(sections.length-2,Math.floor(progress)),f=smooth(progress-i);
 const a=sections[i],b=sections[i+1];
 return {center:[lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)],
   rA:Math.max(.001,lerp(a[3],b[3],f)),rB:Math.max(.001,lerp(a[4],b[4],f))};
}
export function makeOrganicLoft(THREE,sections,{rings=16,sides=14,bulge=0}={}){
 if(!THREE?.BufferGeometry)throw Error('THREE.BufferGeometry is required');
 if(!Array.isArray(sections)||sections.length<2)throw Error('Insufficient anatomy sections');
 const R=Math.max(3,Math.floor(rings)),S=Math.max(6,Math.floor(sides));
 const vertices=[],indices=[],uv=[];
 for(let i=0;i<=R;i++){
  const t=i/R,section=interpolateSection(sections,t);
  const before=interpolateSection(sections,Math.max(0,t-1/R));
  const after=interpolateSection(sections,Math.min(1,t+1/R));
  let dx=after.center[0]-before.center[0],dy=after.center[1]-before.center[1];
  const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
  // Horses are drawn mainly in the XY plane; Z is the out-of-plane axis.
  const nx=-dy,ny=dx;
  for(let j=0;j<=S;j++){
   const angle=2*Math.PI*j/S,ca=Math.cos(angle),sa=Math.sin(angle);
   const tension=1+bulge*Math.sin(t*Math.PI)*(.4+.6*ca*ca);
   vertices.push(section.center[0]+nx*section.rA*ca*tension,
    section.center[1]+ny*section.rA*ca*tension,
    section.center[2]+section.rB*sa*tension);
   uv.push(t,j/S);
  }
 }
 for(let i=0;i<R;i++)for(let j=0;j<S;j++){
  const a=i*(S+1)+j,b=(i+1)*(S+1)+j;
  indices.push(a,a+1,b,b,a+1,b+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);geo.computeVertexNormals();
 geo.computeBoundingBox();geo.computeBoundingSphere();
 return geo;
}
export function addLoft({THREE,parent,sections,material,quality='balanced',name,bulge=0}){
 const spec=geometryBudget(quality);
 const geometry=makeOrganicLoft(THREE,sections,{rings:spec.rings,sides:spec.sides,bulge});
 const mesh=new THREE.Mesh(geometry,material);
 mesh.name=name||'Procedural anatomy';mesh.castShadow=true;mesh.receiveShadow=true;
 parent.add(mesh);return mesh;
}
export function anatomicalSections(archetype){
 const a=archetype||{barrel:1,shoulder:1,haunch:1,neck:1,head:1};
 const barrel=a.barrel||1,shoulder=a.shoulder||1,haunch=a.haunch||1;
 // Nose faces +X, hindquarters at -X, body must remain fully volumetric.
 return {
  torso:[
   [-1.00,1.64,0,.016,.016],
   [-.95,1.65,0,.34*haunch,.35*haunch],
   [-.68,1.65,0,.48*haunch,.43*haunch],
   [-.30,1.63,0,.43*barrel,.40*barrel],
   [.16,1.65,0,.43*barrel,.42*barrel],
   [.51,1.68,0,.46*shoulder,.43*shoulder],
   [.82,1.72,0,.30*shoulder,.34*shoulder],
   [.93,1.75,0,.012,.018]
  ],
  neck:[
   [.49,1.75,0,.28*shoulder,.30],
   [.64,1.98,0,.32*a.neck,.28],
   [.83,2.20,0,.24*a.neck,.235],
   [1.02,2.41,0,.16*a.neck,.18],
   [1.15,2.44,0,.075,.12]
  ],
  head:[
   [1.02,2.40,0,.105*a.head,.15*a.head],
   [1.17,2.39,0,.19*a.head,.18*a.head],
   [1.35,2.31,0,.205*a.head,.178*a.head],
   [1.52,2.24,0,.17*a.head,.146*a.head],
   [1.74,2.19,0,.17*a.head,.16*a.head],
   [1.83,2.18,0,.095*a.head,.135*a.head],
   [1.88,2.18,0,.009,.012]
  ],
  shoulders:[
   [.48,1.75,-.31,.012,.01],
   [.59,1.53,-.32,.235*shoulder,.23*shoulder],
   [.63,1.28,-.31,.21*shoulder,.18*shoulder],
   [.68,1.13,-.31,.08,.09]
  ],
  haunches:[
   [-.76,1.72,-.31,.013,.01],
   [-.78,1.43,-.32,.25*haunch,.235*haunch],
   [-.82,1.18,-.32,.19*haunch,.18*haunch],
   [-.79,1.02,-.32,.075,.08]
  ]
 };
}
export function geometryStats(root){
 let meshes=0,vertices=0,triangles=0,images=0;
 root.traverse(o=>{
  if(o.isMesh){
   meshes++;
   if(o.geometry){
    vertices+=o.geometry.getAttribute('position')?.count||0;
    triangles+=(o.geometry.index?.count||o.geometry.getAttribute('position')?.count||0)/3;
   }
   if(o.material){
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats)if(m.map||m.normalMap||m.roughnessMap||m.bumpMap||m.alphaMap)images++;
   }
  }
 });
 return {meshes,vertices,triangles:Math.round(triangles),imageTextures:images};
}
