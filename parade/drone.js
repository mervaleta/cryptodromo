/**
 * Free-flight drone rig for parade and architectural sightseeing.
 * Control inputs are detached from DOM and Three.js for deterministic tests.
 * Keyboard: arrows or WASD translate, Q/E yaw, R/F altitude, +/- zoom.
 * Pointer drag changes yaw/pitch; wheel changes FOV, independently from altitude.
 */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const DRONE_BOUNDS=Object.freeze({x:[-690,690],y:[4,190],z:[-420,420]});
export const DRONE_MODES=Object.freeze(['free','orbit','follow']);
export function createDroneRig({x=-25,y=58,z=185,yaw=0,pitch=-.42,fov=48,
 speed=32,distance=95,mode='free'}={}){
 let state={x,y,z,yaw,pitch,fov,speed,distance,mode};
 const sanitize=()=>{
  state.x=clamp(finite(state.x,0),...DRONE_BOUNDS.x);
  state.y=clamp(finite(state.y,55),...DRONE_BOUNDS.y);
  state.z=clamp(finite(state.z,135),...DRONE_BOUNDS.z);
  state.yaw=wrapAngle(finite(state.yaw,0));
  state.pitch=clamp(finite(state.pitch,-.42),-1.48,.42);
  state.fov=clamp(finite(state.fov,48),19,89);
  state.speed=clamp(finite(state.speed,30),4,130);
  state.distance=clamp(finite(state.distance,95),14,390);
  if(!DRONE_MODES.includes(state.mode))state.mode='free';
 };
 sanitize();
 const lookVector=()=>({
  x:Math.cos(state.pitch)*Math.sin(state.yaw),
  y:Math.sin(state.pitch),
  z:-Math.cos(state.pitch)*Math.cos(state.yaw)
 });
 function view(target={x:0,y:2,z:0}){
  if(state.mode==='orbit'){
   const c=Math.cos(state.pitch),v=lookVector();
   const pos={
    x:clamp(target.x-v.x*state.distance,...DRONE_BOUNDS.x),
    y:clamp(target.y-v.y*state.distance,...DRONE_BOUNDS.y),
    z:clamp(target.z-v.z*state.distance,...DRONE_BOUNDS.z)
   };
   return {position:pos,lookAt:{...target},fov:state.fov,mode:state.mode};
  }
  const v=lookVector();
  return {
   position:{x:state.x,y:state.y,z:state.z},
   lookAt:state.mode==='follow'?{x:finite(target.x,0),y:finite(target.y,2),z:finite(target.z,0)}:
    {x:state.x+v.x*100,y:state.y+v.y*100,z:state.z+v.z*100},
   fov:state.fov,mode:state.mode
  };
 }
 return {
  snapshot(){return Object.freeze({...state});},
  view,
  setMode(mode){if(!DRONE_MODES.includes(mode))throw RangeError('Unknown drone mode');state.mode=mode;},
  setPose(patch){state={...state,...patch};sanitize();return this.snapshot();},
  nudgeAim(deltaYaw=0,deltaPitch=0){
   state.yaw+=finite(deltaYaw,0);state.pitch+=finite(deltaPitch,0);
   sanitize();return this.snapshot();
  },
  zoom(delta){state.fov=clamp(state.fov+finite(delta,0),19,89);return state.fov;},
  update(delta,inputs={},target=null){
   const dt=clamp(finite(delta,0),0,.2);
   const rotate=.9*dt;
   state.yaw+=finite(inputs.turn,0)*rotate;
   state.pitch+=finite(inputs.tilt,0)*rotate;
   const horizontal=Math.hypot(finite(inputs.forward,0),finite(inputs.strafe,0));
   const divisor=Math.max(1,horizontal);
   const pace=state.speed*(inputs.boost?2.25:1)*dt;
   const forward=finite(inputs.forward,0)/divisor;
   const strafe=finite(inputs.strafe,0)/divisor;
   if(state.mode==='free'){
    const sy=Math.sin(state.yaw),cy=Math.cos(state.yaw);
    state.x+=pace*(forward*sy+strafe*cy);
    state.z+=pace*(-forward*cy+strafe*sy);
    state.y+=pace*finite(inputs.rise,0);
   }else if(state.mode==='orbit'){
    state.distance=clamp(state.distance-pace*forward,14,390);
    if(target){
     state.x=finite(target.x,0);state.z=finite(target.z,0);
    }
   }else if(state.mode==='follow'&&target){
    const alpha=1-Math.exp(-dt*2.6);
    // Follow without taking away manual pan/height controls.
    state.x+=(finite(target.x,state.x)-state.x)*alpha;
    state.z+=(finite(target.z,state.z)+32-state.z)*alpha;
    state.y+=(finite(target.y,0)+24-state.y)*alpha;
    state.y+=pace*finite(inputs.rise,0);
   }
   sanitize();return this.snapshot();
  }
 };
}
export function droneInputs(keys=new Set()){
 const pressed=(...names)=>names.some(key=>keys.has(key));
 return {
  forward:Number(pressed('ArrowUp','KeyW'))-Number(pressed('ArrowDown','KeyS')),
  strafe:Number(pressed('ArrowRight','KeyD'))-Number(pressed('ArrowLeft','KeyA')),
  rise:Number(pressed('KeyR','PageUp'))-Number(pressed('KeyF','PageDown')),
  turn:Number(pressed('KeyE'))-Number(pressed('KeyQ')),
  tilt:Number(pressed('KeyT'))-Number(pressed('KeyG')),
  boost:pressed('ShiftLeft','ShiftRight')
 };
}
