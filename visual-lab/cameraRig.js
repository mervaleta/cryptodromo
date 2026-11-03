/** Shared CRP camera mathematics, independent of Three.js and race/scoring.
 * Angles use DEGREES in camera UI and radians in the internal 3D rig.
 * Camera adjustments are additive to authored broadcast shots. */
const clamp=(x,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(x))?Number(x):min));
export const CAMERA_PARAMETERS=Object.freeze({
 yaw:Object.freeze({min:-180,max:180,step:1,unit:'°'}),
 pitch:Object.freeze({min:-75,max:75,step:1,unit:'°'}),
 height:Object.freeze({min:-20,max:140,step:1,unit:' m'}),
 distance:Object.freeze({min:30,max:340,step:5,unit:'%'}),
 fov:Object.freeze({min:18,max:90,step:1,unit:'°'}),
 lateral:Object.freeze({min:-90,max:90,step:1,unit:' m'})
});
export function clampCameraSetting(key,value){
 const spec=CAMERA_PARAMETERS[key];
 if(!spec)throw RangeError('Unknown camera parameter: '+key);
 return clamp(value,spec.min,spec.max);
}
export const degreesToRadians=n=>Number(n)*Math.PI/180;
export const radiansToDegrees=n=>Number(n)*180/Math.PI;
/** Convert an authored TV goal and focus into an adjustable 3D viewpoint.
 * Position and focus remain finite even for a top-down camera. */
export function reframeCamera(eye,focus,{
 yaw=0,pitch=0,height=0,distance=100,lateral=0
}={}){
 const y=clampCameraSetting('yaw',yaw),p=clampCameraSetting('pitch',pitch);
 const h=clampCameraSetting('height',height),d=clampCameraSetting('distance',distance)/100;
 const sideways=clampCameraSetting('lateral',lateral);
 const vx=eye.x-focus.x,vy=eye.y-focus.y,vz=eye.z-focus.z;
 const radius=Math.max(1,Math.hypot(vx,vy,vz));
 const baseYaw=Math.atan2(vx,vz);
 const basePitch=Math.asin(clamp(vy/radius,-1,1));
 const nextYaw=baseYaw+degreesToRadians(y);
 const nextPitch=clamp(basePitch+degreesToRadians(p),-.49*Math.PI,.49*Math.PI);
 const r=Math.max(2,radius*d),cos=Math.cos(nextPitch);
 const radialX=Math.sin(nextYaw)*cos,radialZ=Math.cos(nextYaw)*cos;
 const shiftX=Math.cos(nextYaw)*sideways,shiftZ=-Math.sin(nextYaw)*sideways;
 const center={x:focus.x+shiftX,y:focus.y,z:focus.z+shiftZ};
 return {
  position:{
   x:center.x+radialX*r,
   y:Math.max(1.3,center.y+Math.sin(nextPitch)*r+h),
   z:center.z+radialZ*r
  },
  focus:center,
  actualDistance:r
 };
}
/** A camera pitch and heading really move the orbit camera, while altitude
 * is a separate ADDITIVE vertical offset (also used in FOLLOW mode). */
export function droneOrbitView(target,{yaw=0,pitch=-.42,height=95,distance=95}={}){
 const t={x:Number(target.x)||0,y:Number(target.y)||0,z:Number(target.z)||0};
 const radius=clamp(distance,14,390),vPitch=clamp(pitch,-1.48,.42);
 const orientation=Number(yaw)||0;
 const horizontal=radius*Math.cos(vPitch);
 return {
  position:{
   x:clamp(t.x-horizontal*Math.sin(orientation),-690,690),
   y:clamp(t.y-radius*Math.sin(vPitch)+clamp(height,4,190)-95,3.5,250),
   z:clamp(t.z+horizontal*Math.cos(orientation),-420,420)
  },
  lookAt:t
 };
}
/** Only one clock is visible on top of the race canvas per broadcast phase. */
export function countdownVisibility(phase,manual=false){
 if(manual)return Object.freeze({dial:true,presentation:false});
 if(phase==='presentation')return Object.freeze({dial:false,presentation:true});
 return Object.freeze({dial:true,presentation:false});
}
