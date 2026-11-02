import * as THREE from 'three';

/**
 * Small, wind-responsive mane extension attached to the animated horse's neck.
 * Intentionally separate from the imported skeleton and native Gallop animation.
 * The caller supplies the anchor transform after inspecting the actual GLB.
 */
export function createWindMane({anchor,coat='#513c32',length=1,seed=0}={}){
 if(!anchor?.isObject3D)throw new Error('A neck anchor Object3D is required');
 const group=new THREE.Group();group.name='CRP Wind Mane';anchor.add(group);
 const strands=[];const material=new THREE.MeshStandardMaterial({color:coat,side:THREE.DoubleSide,roughness:1,transparent:false});
 const geometry=new THREE.PlaneGeometry(.12,.45,1,4);
 for(let i=0;i<9;i++){
  const strand=new THREE.Mesh(geometry,material);
  strand.position.set((i-4)*.075,.01,0);
  strand.rotation.y=(i-4)*.055;
  strand.scale.set(.65+(i%3)*.14,length*(.8+(i%4)*.09),1);
  strand.userData.base=strand.rotation.z;
  group.add(strand);strands.push(strand);
 }
 let clock=seed*.23;
 function update(delta,{wind=0.5,speed=1,reducedMotion=false}={}){
  const dt=Math.max(0,Math.min(.1,Number(delta)||0));
  clock+=dt;
  const amplitude=reducedMotion?0:Math.min(.16,.018+Math.max(0,wind)*.022+Math.max(0,speed)*.012);
  strands.forEach((strand,i)=>{
   strand.rotation.z=strand.userData.base+amplitude*Math.sin(clock*(5.1+speed*.65)+i*.58);
   strand.rotation.x=amplitude*.42*Math.cos(clock*4.1+i*.49);
  });
 }
 return {group,update,setColor(color){material.color.set(color);},dispose(){anchor.remove(group);geometry.dispose();material.dispose();}};
}
