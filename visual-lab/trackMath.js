/**
 * Visual layouts only. Financial dose positions stay independent of course shape.
 * p=0 start, p=1 finish. p>1 gives a continuous coasting runout.
 */
const TWO_PI=Math.PI*2;
export const COURSE_LENGTH=780;
export const COURSE_MODES=['straight','s-bend','oval'];
export function trackPoint(mode,progress,lane=5.5){
 const p=Math.max(0,progress);
 const side=(lane-5.5)*2.55;
 let x,z,dx,dz;
 if(mode==='s-bend'){
  x=-390+780*p;z=24*Math.sin(TWO_PI*p)+side;
  dx=780;dz=24*TWO_PI*Math.cos(TWO_PI*p);
 }else if(mode==='oval'){
  // Rounded stadium oval: two tangential straights + two semicircles.
  // The previous 325x50 ellipse had a curvature radius of only ~7.7
  // at its tips, smaller than the lane offsets, folding its ribbons over
  // themselves into the black triangle artifacts seen from above.
  const halfStraight=250,radius=72;
  const straightLength=2*halfStraight,arcLength=Math.PI*radius;
  const loopLength=2*(straightLength+arcLength);
  const distance=Math.min(p,1)*loopLength;
  let cx,cz,vx,vz;
  if(distance<straightLength){
   cx=-halfStraight+distance;cz=radius;vx=1;vz=0;
  }else if(distance<straightLength+arcLength){
   const a=Math.PI/2-(distance-straightLength)/radius;
   cx=halfStraight+radius*Math.cos(a);cz=radius*Math.sin(a);
   vx=Math.sin(a);vz=-Math.cos(a);
  }else if(distance<2*straightLength+arcLength){
   cx=halfStraight-(distance-straightLength-arcLength);cz=-radius;vx=-1;vz=0;
  }else{
   const a=-Math.PI/2-(distance-2*straightLength-arcLength)/radius;
   cx=-halfStraight+radius*Math.cos(a);cz=radius*Math.sin(a);
   vx=Math.sin(a);vz=-Math.cos(a);
  }
  const len=Math.hypot(vx,vz)||1,nx=-vz/len,nz=vx/len;
  x=cx+side*nx;z=cz+side*nz;dx=vx;dz=vz;
  // A race ends after one lap. Its visual runout must leave the scoring
  // loop on the EXIT TANGENT instead of wrapping back across the start.
  // Distance is scaled to the visual course, not the finance engine.
  if(p>1){
   const tangentLength=Math.hypot(dx,dz)||1;
   const overrun=Math.min(1000,(p-1)*loopLength);
   x+=overrun*dx/tangentLength;
   z+=overrun*dz/tangentLength;
  }
 }else{
  x=-390+780*p;z=side;dx=780;dz=0;
 }
 const length=Math.hypot(dx,dz)||1;
 return {x,z,heading:Math.atan2(-dz,dx),tangentX:dx/length,tangentZ:dz/length,
   sideX:-dz/length,sideZ:dx/length};
}
