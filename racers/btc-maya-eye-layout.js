/**
 * Measured directly from the user's Horse_VR_2017.ma quantized sculpt.
 * Both original eye sockets are REAL holes with 11 boundary vertices each.
 * Center x +/-.001421597, y -.028309381, z .042705430.
 * Original opening normal turns outward (+/- .86157), forward (-.48262)
 * and slightly down (-.1574): eye placement by X alone was wrong.
 */
export const BTC_EYE_LAYOUT=Object.freeze({
 x:.00142159703910512,y:-.02830938053158027,z:.042705430312275,
 radiusX:.000620,radiusY:.000600,radiusZ:.000620,
 recess:.000300,
 normalX:.86157014831662,normalY:-.48262013441776,normalZ:-.15739976297396,
 boundary:{
  left:[4773,4772,4775,4807,4805,4803,4789,4787,4784,4785,4791],
  right:[5073,5074,5093,5095,5097,5085,5083,5081,5079,5077,5076]
 }
});
function basis(side){
 const e=BTC_EYE_LAYOUT;
 const nx=side*e.normalX,ny=e.normalY,nz=e.normalZ;
 // Anatomical vertical plane: the eye looks out/forward.
 const projection=[-nx*ny,1-ny*ny,-nz*ny],size=Math.hypot(...projection);
 const vy=projection.map(x=>x/size);
 const cross=[ny*vy[2]-nz*vy[1],nz*vy[0]-nx*vy[2],nx*vy[1]-ny*vy[0]];
 const vz=cross.map(x=>x*side);
 return {n:[nx,ny,nz],v:vy,w:vz};
}
export function eyePoint(side,out,y,z){
 const e=BTC_EYE_LAYOUT,b=basis(side);
 return {
  x:side*e.x+b.n[0]*(out-e.recess)+b.v[0]*y+b.w[0]*z,
  y:e.y+b.n[1]*(out-e.recess)+b.v[1]*y+b.w[1]*z,
  z:e.z+b.n[2]*(out-e.recess)+b.v[2]*y+b.w[2]*z
 };
}
export function eyeFrame(side,angle,ring=1){
 const e=BTC_EYE_LAYOUT;
 const y=.76*e.radiusY*ring*Math.cos(angle);
 const z=.76*e.radiusZ*ring*Math.sin(angle);
 const outward=e.radiusX*Math.sqrt(Math.max(.01,1-y*y/e.radiusY**2-z*z/e.radiusZ**2));
 return eyePoint(side,outward+.000024,y,z);
}
export function eyeNormal(side){return basis(side).n;}
