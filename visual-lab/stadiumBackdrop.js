import * as THREE from 'three';
/**
 * Alpha13 low-draw-call world backdrop. Decorative only.
 * All scenery is outside the 12-lane racing envelope and has no shadows.
 */
export function createStadiumBackdrop(scene,{softwareGPU=false,mobile=false}={}){
 const root=new THREE.Group();root.name='Cryptodromo · parklands and city horizon';scene.add(root);
 let state=619707;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const buildingN=softwareGPU?24:mobile?45:95;
 const geo=new THREE.BoxGeometry(1,1,1);
 const facade=new THREE.MeshStandardMaterial({color:'#657776',roughness:.9,metalness:.03});
 const skyline=new THREE.InstancedMesh(geo,facade,buildingN);
 skyline.castShadow=false;skyline.receiveShadow=false;skyline.frustumCulled=false;
 const colors=['#536864','#75867f','#6e7a79','#8c8b7c','#4e686b','#617a70','#687676'];
 const dummy=new THREE.Object3D();
 for(let i=0;i<buildingN;i++){
  const back=i%2===0;
  const x=(rand()-.5)*1100,z=back?-315-rand()*95:315+rand()*105;
  const w=7+rand()*20,h=9+rand()*49,d=8+rand()*14;
  dummy.position.set(x,h/2-.25,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
  skyline.setMatrixAt(i,dummy.matrix);skyline.setColorAt(i,new THREE.Color(colors[Math.floor(rand()*colors.length)]));
 }
 skyline.instanceMatrix.needsUpdate=true;
 if(skyline.instanceColor)skyline.instanceColor.needsUpdate=true;
 root.add(skyline);
 // Forest edge uses instancing, two draw calls for the entire woodland.
 const forestN=softwareGPU?75:mobile?140:280;
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.5,.7,1,5),new THREE.MeshStandardMaterial({color:'#4d4b39',roughness:1}),forestN);
 const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,6),new THREE.MeshStandardMaterial({color:'#376047',roughness:1}),forestN);
 const greens=['#34563b','#496d42','#375f4b','#567149','#2e5142'];
 for(let i=0;i<forestN;i++){
  const back=i%2===0;
  const x=(rand()-.5)*1100,z=back?-290-rand()*35:245+rand()*34;
  const h=8+rand()*16,r=3+rand()*4.5;
  dummy.position.set(x,h*.24,z);dummy.scale.set(1,h*.48,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,h*.69,z);dummy.scale.set(r,h*.73,r);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
  crowns.setColorAt(i,new THREE.Color(greens[Math.floor(rand()*greens.length)]));
 }
 for(const mesh of [trunks,crowns]){
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;root.add(mesh);
 }
 // Service road, maintenance buildings and race-day equipment beyond the outer fence.
 const roadMaterial=new THREE.MeshStandardMaterial({color:'#56625b',roughness:1});
 const road=new THREE.Mesh(new THREE.BoxGeometry(1060,.07,9),roadMaterial);
 road.position.set(0,-.08,268);road.receiveShadow=false;root.add(road);
 const barnMat=new THREE.MeshStandardMaterial({color:'#a2a296',roughness:.88});
 const roofMat=new THREE.MeshStandardMaterial({color:'#374e48',roughness:.83});
 for(let i=0;i<7;i++){
  const x=-430+i*133,y=4.5,z=285+(i%2)*17;
  const barn=new THREE.Mesh(new THREE.BoxGeometry(26,9,13),barnMat);
  barn.position.set(x,y,z);root.add(barn);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(18,5.5,4),roofMat);
  roof.position.set(x,11.3,z);roof.rotation.y=Math.PI/4;root.add(roof);
 }
 const bannerMaterial=new THREE.MeshBasicMaterial({color:'#d2b779',side:THREE.DoubleSide});
 for(let i=0;i<16;i++){
  const banner=new THREE.Mesh(new THREE.PlaneGeometry(2.8,5.2),bannerMaterial);
  banner.position.set(-405+i*54,5,234);root.add(banner);
 }
 return {root};
}
