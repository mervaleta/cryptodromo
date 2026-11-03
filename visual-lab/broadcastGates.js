/**
 * Alpha20 opt-in starting-gate kit for the existing Alpha18 stadium.
 * IMPORTANT: replace the static "gateFrames" block, never add beside it.
 * Visual-only: no pricing, fixture mutation, race movement or winner selection.
 */
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const easeOut=(t)=>1-Math.pow(1-clamp(t),3);
const colorString=(color,fallback='#d9e1d6')=>typeof color==='string'&&/^(#[\da-f]{3,8}|[a-z]+)$/i.test(color)?color:fallback;
export const GATE_COUNT=12;
export const GATE_PITCH=2.55;
export const GATE_START_OFFSET=-3.6;
export function validateGateEntries(entries){
 if(!Array.isArray(entries)||entries.length!==GATE_COUNT)throw new Error('Exactly 12 fixture entries are required');
 const symbols=new Set();
 for(const [i,e] of entries.entries()){
  if(!e||typeof e.symbol!=='string'||!e.symbol.trim())throw new Error('Missing symbol in slot '+(i+1));
  if(symbols.has(e.symbol))throw new Error('Repeated runner '+e.symbol);
  symbols.add(e.symbol);
 }
 return true;
}
export function gateOpenFraction(secondsSinceStart,duration=.72){
 if(!Number.isFinite(secondsSinceStart))return 0;
 return easeOut(secondsSinceStart/duration);
}
export function gatePositions(startX=-390){
 return Array.from({length:GATE_COUNT},(_,lane)=>({number:lane+1,x:startX+GATE_START_OFFSET,z:(lane-5.5)*GATE_PITCH}));
}
export function createBroadcastGates({THREE,entries,startX=-390,quality='balanced'}){
 if(!THREE?.Group||!THREE?.Mesh)throw new Error('THREE is required');
 validateGateEntries(entries);
 const root=new THREE.Group();root.name='Alpha20 broadcast start gates';
 const metal=new THREE.MeshStandardMaterial({color:0x536c64,metalness:.78,roughness:.34});
 const highlights=new THREE.MeshStandardMaterial({color:0xc1cec8,metalness:.62,roughness:.31});
 const dark=new THREE.MeshStandardMaterial({color:0x152a24,metalness:.56,roughness:.55});
 const amber=new THREE.MeshStandardMaterial({color:0xc8a458,metalness:.62,roughness:.4});
 const materials=[metal,highlights,dark,amber],geometries=[],doors=[],lamps=[];
 const cube=(w,h,d,x,y,z,mat,parent=root)=>{
  const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);
  const mesh=new THREE.Mesh(g,mat);mesh.position.set(x,y,z);mesh.castShadow=quality!=='eco';mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const positions=gatePositions(startX);
 const gateX=startX+GATE_START_OFFSET;
 const labelMeshes=[];
 for(let lane=0;lane<GATE_COUNT;lane++){
  const z=positions[lane].z,entry=entries[lane];
  // This 3.02m roof height preserves current horse clearance; future
  // height changes must first be validated with idle and gallop animations.
  for(const off of [-1.18,1.18])cube(3.9,2.94,.11,gateX,1.48,z+off,metal);
  cube(4.25,.15,2.4,gateX,3.02,z,highlights);
  cube(.16,2.75,2.38,gateX-2.08,1.42,z,metal);
  cube(.11,.28,2.25,gateX+2.1,2.82,z,amber);
  const localColor=new THREE.MeshStandardMaterial({color:colorString(entry.color),metalness:.27,roughness:.52});
  materials.push(localColor);
  // Number is embossed on a 3D placard without canvas or font downloads.
  cube(.09,.62,1.76,gateX+2.2,3.41,z,dark);
  const badge=cube(.11,.52,1.62,gateX+2.28,3.41,z,localColor);
  badge.userData={lane:lane+1,symbol:entry.symbol};
  labelMeshes.push(badge);
  // The doors face +X, opening toward either stall side.
  const left=new THREE.Group(),right=new THREE.Group();
  left.position.set(gateX+2.17,1.38,z-.98);
  right.position.set(gateX+2.17,1.38,z+.98);
  root.add(left,right);
  cube(.1,2.52,.94,0,0,.47,metal,left);
  cube(.1,2.52,.94,0,0,-.47,metal,right);
  for(const k of [-.72,.08,.88]){
   cube(.13,.055,.87,.08,k,.47,highlights,left);
   cube(.13,.055,.87,.08,k,-.47,highlights,right);
  }
  doors.push({left,right});
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.095,8,6),new THREE.MeshStandardMaterial({color:0xffb343,emissive:0xff8c12,emissiveIntensity:.1}));
  lamp.position.set(gateX+2.26,3.85,z);root.add(lamp);lamps.push(lamp);
  geometries.push(lamp.geometry);materials.push(lamp.material);
 }
 // A low-poly metal truss across all stalls, built once.
 cube(4.32,.19,32,gateX,4.03,0,metal);
 cube(.15,.26,32,gateX-1.8,3.96,0,highlights);
 let open=0;
 function update({secondsSinceStart=-Infinity,phase='ready'}={}){
  open=gateOpenFraction(secondsSinceStart);
  for(const d of doors){d.left.rotation.y=-1.34*open;d.right.rotation.y=1.34*open;}
  const isReady=phase==='ready'||phase==='presentation';
  for(const lamp of lamps){lamp.material.emissiveIntensity=isReady?1.6:(open<1?2.4:.16);}
  return open;
 }
 function reset(){update({secondsSinceStart:-Infinity,phase:'ready'});}
 function setEntries(nextEntries){
  validateGateEntries(nextEntries);
  for(let i=0;i<GATE_COUNT;i++){
   const col=colorString(nextEntries[i].color);
   labelMeshes[i].material.color.set(col);labelMeshes[i].userData={lane:i+1,symbol:nextEntries[i].symbol};
  }
  reset();
 }
 function dispose(){
  root.parent?.remove(root);
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
 }
 reset();
 return {root,update,reset,setEntries,dispose,positions,get openness(){return open;}};
}
