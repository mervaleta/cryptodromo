/**
 * Rig-space bridge across the native Head -> Neck3 joint transition.
 * The original Gallop animation is untouched. This adjusts only rest-mesh
 * skin weights near the poll, and shares exactly the same influence law with
 * the scalp bed and hair roots so the two layers cannot separate.
 */
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export function pollMask(x,y,z){
 const longitudinal=smooth((y+.02775)/.0041)*(1-smooth((y+.013)/.005));
 const crest=smooth((z-.0395)/.0035);
 const width=1-smooth((Math.abs(x)-.0012)/.00255);
 return longitudinal*crest*width;
}
export function pollBlend(x,y,z,headIndex,neckIndex){
 if(headIndex<0||neckIndex<0)return {factor:0,head:0,neck:0};
 const factor=.91*pollMask(x,y,z);
 const neck=smooth((y+.027)/.0085);
 return {factor,head:1-neck,neck};
}
export function stabilizePollWeights(skin,x,y,z,headIndex,neckIndex){
 const {factor,head,neck}=pollBlend(x,y,z,headIndex,neckIndex);
 if(factor<=.00001)return skin;
 const table=new Map();
 for(let k=0;k<4;k++){
  const joint=skin.joints[k],weight=skin.weights[k];
  if(weight>0)table.set(joint,(table.get(joint)||0)+(1-factor)*weight);
 }
 table.set(headIndex,(table.get(headIndex)||0)+factor*head);
 table.set(neckIndex,(table.get(neckIndex)||0)+factor*neck);
 const top=[...table].sort((a,b)=>b[1]-a[1]).slice(0,4);
 const total=top.reduce((n,e)=>n+e[1],0)||1;
 return {joints:Array.from({length:4},(_,i)=>top[i]?.[0]||0),
  weights:Array.from({length:4},(_,i)=>(top[i]?.[1]||0)/total)};
}
export function pollCrestLift(x,y,z){
 // Gentle 0.36mm supported rounding, zero at every boundary.
 // No separate billboards, floating polygons or extra rig joint.
 return .00036*pollMask(x,y,z);
}
