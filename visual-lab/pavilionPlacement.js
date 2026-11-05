/**
 * One authoritative placement for the Satoshi Nakamoto / Muybridge clubhouse.
 * The building must be BEHIND the spectator bank, never on the oval backstretch.
 *
 * TrackPoint('oval') uses a 72m-radius back straight centred at world z=-72.
 * The rail sits 21m outside that line, near z=-93. Clubhouse platform's
 * nearest edge is z=-131.5, leaving ~38.5m of physical clearance.
 *
 * These are visual-only metres. Race doses, winner and fixture stay unchanged.
 */
import {trackPoint} from './trackMath.js';
export const PAVILION_OFFSET_Z=-67;
// Broadcast camera must stand behind the backstretch rail, not on the dirt.
export const PAVILION_GRANDSTAND_CAMERA_Z=-119;
export const PAVILION_BASE_LOCAL=Object.freeze({
  centerX:0,centerZ:-78,width:93,depth:27
});
export const PAVILION_FORECOURT_LOCAL=Object.freeze({
  centerX:0,centerZ:-68,width:105,depth:11
});
export const PAVILION_BRAND_SIGN_LOCAL_Z=-72;
export const PAVILION_TRACK_SIGN_LOCAL_Z=-36;
export const PAVILION_UPPER_ROOF_Y=19.10; // Lower lip sits on first slab, no air gap
export const PAVILION_FOUNDATION_Y=.54;
export const PAVILION_OUTER_STAND_BACK_Z=-126.5;
function bounds(box){
 const centerZ=box.centerZ+PAVILION_OFFSET_Z;
 return Object.freeze({minX:box.centerX-box.width/2,maxX:box.centerX+box.width/2,
   minZ:centerZ-box.depth/2,maxZ:centerZ+box.depth/2});
}
export const PAVILION_BASE_BOUNDS=bounds(PAVILION_BASE_LOCAL);
export const PAVILION_FORECOURT_BOUNDS=bounds(PAVILION_FORECOURT_LOCAL);
function pointBoxDistance(p,b){
 return Math.hypot(Math.max(b.minX-p.x,0,p.x-b.maxX),
   Math.max(b.minZ-p.z,0,p.z-b.maxZ));
}
/**
 * Samples rails and the full racing ribbon over the actual broadcast layouts.
 * Detects clubhouse-footprint intersections that were missed by prior rail QA.
 */
export function clubhouseCourseClearance(layout='oval',samples=400){
 let minimum=Infinity;
 for(let i=0;i<=samples;i++){
  const progress=i/samples;
  for(const lateral of [-21,-20,-16,-8,0,8,16,20,21]){
   const p=trackPoint(layout,progress,5.5+lateral/2.55);
   minimum=Math.min(minimum,pointBoxDistance(p,PAVILION_BASE_BOUNDS),
     pointBoxDistance(p,PAVILION_FORECOURT_BOUNDS));
  }
 }
 return minimum;
}
export function pavilionPlacementAudit(){
 return Object.freeze({
   offsetZ:PAVILION_OFFSET_Z,
   foundationBounds:PAVILION_BASE_BOUNDS,
   forecourtBounds:PAVILION_FORECOURT_BOUNDS,
   rearStandClearance:PAVILION_BASE_BOUNDS.maxZ-PAVILION_OUTER_STAND_BACK_Z,
   // Positive result: a gap between the grandstand roof and the clubhouse.
   standGap:PAVILION_OUTER_STAND_BACK_Z-PAVILION_BASE_BOUNDS.maxZ,
   ovalClearance:clubhouseCourseClearance('oval'),
   straightClearance:clubhouseCourseClearance('straight'),
   sBendClearance:clubhouseCourseClearance('s-bend'),
   trackSignWorldZ:PAVILION_TRACK_SIGN_LOCAL_Z+PAVILION_OFFSET_Z
 });
}
