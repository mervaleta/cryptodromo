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
  const angle=TWO_PI*p,rx=325,rz=50;
  // Stadium's stand is on its north side; the complete oval lives south.
  const cx=-rx*Math.cos(angle),cz=35-rz*Math.sin(angle);
  const vx=rx*TWO_PI*Math.sin(angle),vz=-rz*TWO_PI*Math.cos(angle);
  const len=Math.hypot(vx,vz)||1,nx=-vz/len,nz=vx/len;
  x=cx+side*nx;z=cz+side*nz;dx=vx;dz=vz;
 }else{
  x=-390+780*p;z=side;dx=780;dz=0;
 }
 const length=Math.hypot(dx,dz)||1;
 return {x,z,heading:Math.atan2(-dz,dx),tangentX:dx/length,tangentZ:dz/length,
   sideX:-dz/length,sideZ:dx/length};
}
