/**
 * Single authoritative rest-space coordinate system for eye globes AND lids.
 * Coordinates come from the original 2017 Maya sculpt in GLB local space.
 * Do not independently re-project every eyelid vertex onto nearby body
 * triangles: that was creating clipped eye rims and stray dark polygons.
 */
export const BTC_EYE_LAYOUT=Object.freeze({
 x:.002265,y:-.02814,z:.04257,
 radiusX:.000385,radiusY:.000505,radiusZ:.000405,
 lidY:.00049,lidZ:.000394
});
export function eyeFrame(side,angle,ring=1){
 const e=BTC_EYE_LAYOUT,cy=Math.cos(angle),cz=Math.sin(angle);
 const radial=Math.min(.995,Math.abs(ring)*.88);
 const outward=e.radiusX*Math.sqrt(Math.max(0,1-radial*radial));
 const lipX=e.x+outward+(ring<1?.000028:-.000032);
 return {x:side*lipX,y:e.y+cy*e.lidY*ring,z:e.z+cz*e.lidZ*ring};
}
