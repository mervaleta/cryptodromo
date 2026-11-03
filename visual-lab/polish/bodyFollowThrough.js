/**
 * Alpha21 optional additive horse follow-through, after the existing mixer +
 * gaitRefiner pass. It adds small inertial cues only to existing neck, head,
 * back and tail bones, without recreating a rig or applying root translation.
 *
 * IMPORTANT call order per frame: beforeUpdate -> existing horse.update ->
 * afterUpdate. beforeUpdate removes last frame's local quaternion corrections
 * BEFORE horse.js calls gait.reset() and AnimationMixer.update().
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const TAU=Math.PI*2;
export const FOLLOW_BONES=Object.freeze(['Neck1','Head','Back','Tail2']);
export const FOLLOW_PRESETS=Object.freeze({eco:0,balanced:.65,high:1});
export function followAngles({phase=0,rate=1,burst=0,quality='balanced'}={}){
 const p=((phase%1)+1)%1,strength=FOLLOW_PRESETS[quality]??.65;
 const energy=clamp((rate-.75)/1.0,0,1.25);
 const kick=clamp(burst,0,1);
 const elastic=Math.sin(TAU*(p-.12)),rebound=Math.sin(TAU*(p-.31));
 return {
  Neck1:clamp((.011*elastic+.005*kick)*energy*strength,-.035,.035),
  Head:clamp((-.019*rebound+.008*kick)*energy*strength,-.038,.038),
  Back:clamp((.009*Math.sin(TAU*(p+.18)))*energy*strength,-.022,.022),
  Tail2:clamp((.021*Math.sin(TAU*(p-.29)))*energy*strength,-.034,.034)
 };
}
export function createBodyFollowThrough({THREE,count=12,quality='balanced'}={}){
 if(!THREE?.Quaternion||!THREE?.Vector3)throw Error('THREE required');
 if(!Number.isInteger(count)||count<1||count>24)throw RangeError('Invalid runner count');
 const axes={Neck1:new THREE.Vector3(1,0,0),Head:new THREE.Vector3(1,0,0),
  Back:new THREE.Vector3(1,0,0),Tail2:new THREE.Vector3(0,0,1)};
 const slots=new Array(count).fill(null);
 const temp=new THREE.Quaternion(),inverse=new THREE.Quaternion();
 let mode=quality,enabled=true;
 function attach(index,horse){
  const root=horse?.root;if(!root?.getObjectByName)return null;
  const bones=FOLLOW_BONES.map(name=>({
   name,bone:root.getObjectByName(name),correction:new THREE.Quaternion()
  })).filter(item=>item.bone?.isBone);
  const slot={horse,bones};slots[index]=slot;return slot;
 }
 function beforeUpdate(index,horse){
  if(index<0||index>=count)throw RangeError('Invalid runner');
  let slot=slots[index];
  if(slot&&slot.horse!==horse){undo(slot);slot=null;slots[index]=null;}
  if(!slot)slot=attach(index,horse);
  if(slot)undo(slot);
 }
 function undo(slot){
  for(const item of slot.bones){
   inverse.copy(item.correction).invert();
   item.bone.quaternion.multiply(inverse).normalize();
   item.correction.identity();
  }
 }
 function afterUpdate(index,horse,{phase=0,rate=1,burst=0,active=true}={}){
  if(!active||!enabled||mode==='eco')return;
  let slot=slots[index];
  if(!slot||slot.horse!==horse)slot=attach(index,horse);
  if(!slot)return;
  const angles=followAngles({phase,rate,burst,quality:mode});
  for(const item of slot.bones){
   temp.setFromAxisAngle(axes[item.name],angles[item.name]||0);
   item.bone.quaternion.multiply(temp).normalize();
   item.correction.copy(temp);
  }
 }
 function setQuality(next='balanced'){
  if(!(next in FOLLOW_PRESETS))throw RangeError('Unknown quality');
  for(const slot of slots)if(slot)undo(slot);
  mode=next;
 }
 function setEnabled(next){if(!next)reset();enabled=!!next;}
 function reset(){for(const slot of slots)if(slot)undo(slot);}
 function dispose(){reset();slots.fill(null);}
 return {beforeUpdate,afterUpdate,setQuality,setEnabled,reset,dispose,
  get channels(){return slots.reduce((sum,x)=>sum+(x?.bones.length||0),0);},
  get enabled(){return enabled}};
}
