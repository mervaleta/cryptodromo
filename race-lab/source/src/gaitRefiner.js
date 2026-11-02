import * as THREE from 'three';

/**
 * 8 key poses from the simplified gallop reference, using the 15-pose sheet
 * as the reference for inbetweens (collected -> hind push -> suspension ->
 * fore impact -> regroup). Each number is a LOCAL joint correction in degrees
 * relative to the existing authored GLB Gallop clip, not a complete override.
 *
 * Order of foot contacts for a horse transverse gallop:
 * trailing hind, leading hind, trailing fore, leading fore, then flight.
 */
export const GAIT_POSE_COUNT=8;
const deg=values=>values.map(v=>v*Math.PI/180);
export const POSES=Object.freeze({
 'FrontShoulder.L':deg([-11,-24,-15, 12, 26, 10, -8,-11]),
 'FrontShoulder.R':deg([-21,-10, 16, 25, 11,-17,-26,-21]),
 'FrontUpperLeg.L':deg([-24,-30,-15, 20, 28, 10,-18,-24]),
 'FrontUpperLeg.R':deg([-17,  9, 29, 17,-13,-28,-24,-17]),
 'FrontLowerLeg.L':deg([ 23, 28, 16,-12,-25,  3, 24, 23]),
 'FrontLowerLeg.R':deg([ 18, -5,-23,  6, 26, 20, 14, 18]),
 'BackShoulder.L':deg([ 16,  6,-18,-24, -7, 17, 26, 16]),
 'BackShoulder.R':deg([-17,-25,-10, 14, 25, 12, -8,-17]),
 'BackLeg.L':deg([ 24, 16, -8,-24,-14, 10, 26, 24]),
 'BackLeg.R':deg([-21,-11, 14, 25, 10,-13,-28,-21]),
 'BackUpperLeg.L':deg([-13, -3, 20, 26,  7,-18,-22,-13]),
 'BackUpperLeg.R':deg([ 13, 26,  9,-19,-25, -6, 16, 13]),
 'BackLowerLeg.L':deg([ 22, 10,-15,-25, -4, 19, 25, 22]),
 'BackLowerLeg.R':deg([-18,-25, -5, 19, 23,  4,-13,-18]),
 'Neck1':deg([-3,0,3,6,3,-2,-4,-3]),
 'Head':deg([3,1,-3,-5,-2,1,4,3]),
 'Back':deg([0,2,4,1,-3,-2,1,0]),
 'Tail2':deg([-4,-1,3,5,2,-3,-5,-4])
});
// Relative body lift for suspension. Root motion comes from the existing
// Gallop animation and the scene; this table only adds subtle secondary lift.
export const FLIGHT_HEIGHT=Object.freeze([.03,.10,.22,.16,.02,.04,.19,.03]);
export function cyclicSpline(values,phase){
 const n=values.length,x=((phase%1+1)%1)*n,i=Math.floor(x),t=x-i;
 const a=values[(i+n-1)%n],b=values[i],c=values[(i+1)%n],d=values[(i+2)%n];
 return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
}
const axis=new THREE.Vector3(1,0,0);
export function createGaitRefiner(model,{strength=.36}={}){
 const joints=Object.entries(POSES).map(([name,angles])=>({
   name,angles,bone:model.getObjectByName(name),correction:new THREE.Quaternion()
 })).filter(x=>x.bone?.isBone);
 let phase=0;
 const turn=new THREE.Quaternion(),inverse=new THREE.Quaternion();
 function reset(){
  // Remove the previous additive correction before the Three.js animation
  // mixer applies its own next frame, including bones with no clip track.
  for(const item of joints){
   inverse.copy(item.correction).invert();
   item.bone.quaternion.multiply(inverse).normalize();
   item.correction.identity();
  }
 }
 function refine(delta=0,relativeSpeed=1){
  const stride=Math.max(.25,Math.min(2.7,relativeSpeed));
  phase=(phase+Math.max(0,delta)*(1.72*stride))%1;
  for(const item of joints){
   const angle=cyclicSpline(item.angles,phase)*strength;
   turn.setFromAxisAngle(axis,angle);
   item.bone.quaternion.multiply(turn).normalize();
   item.correction.copy(turn);
  }
  return {phase,lift:cyclicSpline(FLIGHT_HEIGHT,phase)*strength};
 }
 return {jointNames:joints.map(x=>x.name),reset,refine,get phase(){return phase}};
}
