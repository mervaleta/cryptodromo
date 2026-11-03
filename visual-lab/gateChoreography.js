/**
 * Alpha20 gate choreography.
 * Pure visual offsets; official distance, ranking and fixture are unchanged.
 * Runner root faces +X. The stall is 3.6 m behind visual start;
 * front gate is at startX - 1.43m.
 */
export const STAGING_OFFSET_X=-3.2;
export const VISUAL_RELEASE_SECONDS=1.20;
export const OPEN_DELAY_SECONDS=0;
export const clamp01=(value)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function smoothstep(x){const t=clamp01(x);return t*t*(3-2*t);}
export function horseStartOffset(secondsSinceOfficialStart){
 if(!Number.isFinite(secondsSinceOfficialStart)||secondsSinceOfficialStart<=0)return STAGING_OFFSET_X;
 if(secondsSinceOfficialStart>=VISUAL_RELEASE_SECONDS)return 0;
 // Ease slowly in the first .25s as the leaves swing away.
 return STAGING_OFFSET_X*(1-smoothstep(secondsSinceOfficialStart/VISUAL_RELEASE_SECONDS));
}
export function gateVisualState({phase,elapsed=0,running=true}={}){
 const racing=phase==='race'||phase==='runout'||phase==='results';
 const seconds=racing?Math.max(0,Number.isFinite(elapsed)?elapsed:0):-1;
 return {
  phase:racing?'race':'presentation',
  secondsSinceStart:seconds,
  doorsOpen:racing,
  // Pausing holds the current frame; the caller must supply frozen elapsed.
  horseOffsetX:racing?horseStartOffset(seconds):STAGING_OFFSET_X,
  advancing:!!running&&racing
 };
}
export function applyGateStaging({horses,gate,phase,elapsed,layoutMode,trackPoint,live=true}){
 if(!Array.isArray(horses)||typeof trackPoint!=='function'||!gate)throw new Error('Gate, horses, and trackPoint required');
 const state=gateVisualState({phase,elapsed,running:live});
 gate.update({phase:state.phase,secondsSinceStart:state.secondsSinceStart});
 // The choreography only offsets the rendered GLB in world X. Never alter
 // h.progress, official profiles, broadcasts, race duration or finish time.
 if(state.horseOffsetX!==0){
  horses.forEach((h,i)=>{
   if(!h?.model?.root)return;
   const target=trackPoint(layoutMode,phase==='presentation'?0:(h.progress||0),i);
   if(!Number.isFinite(target.x)||!Number.isFinite(target.z))return;
   h.model.root.position.x=target.x+state.horseOffsetX;
   h.model.root.position.z=target.z;
  });
 }
 return state;
}
