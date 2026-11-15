/**
 * Regression: supplied Horse_VR_2017.ma "Horse_BaseShapeOrig" vertex order
 * matches the 5406-vertex quantized browser sculpture EXACTLY (first 15
 * ordered Maya vertices, with the original axis conversion). This is a
 * strong source-identity guard, NOT a claim that Maya skinning is integrated.
 * For full QA run scripts/extract-btc-maya-skin.py on the local original.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {BTC_EQUINE_MESH} from '../racers/btc-maya-body-data.js';
const original=[
 [-6.48234749,103.7620163,-78.36000824],
 [-7.33268404,102.36403656,-79.22157288],
 [-6.76263428,102.75079346,-82.43136597],
 [-4.60049438,105.06817627,-80.55553436],
 [-9.00084209442,103.29775238,-75.67214966],
 [-7.095973015,104.78109741,-76.017250061],
 [-9.2227459,100.78891754,-77.77332306],
 [-8.13896275,100.83244324,-80.5868988],
 [-9.49974442,98.57711029,-80.28230286],
 [-8.84173489,99.63930511,-81.69537354],
 [-10.63196468,92.40511322,-82.20883179],
 [-9.85533428,96.66563416,-83.79444885],
 [-11.1979866,97.4863205,-77.79792786],
 [-13.71909809,91.91226959,-76.75115204],
 [-13.17242813,85.59628296,-78.65917206],
];
function regression(x,y){
 const mx=x.reduce((a,b)=>a+b,0)/x.length;
 const my=y.reduce((a,b)=>a+b,0)/y.length;
 const m=x.reduce((a,b,i)=>a+(b-mx)*(y[i]-my),0)/
   x.reduce((a,b)=>a+(b-mx)*(b-mx),0);
 const k=my-m*mx;
 return {scale:m,origin:k,error:Math.max(...x.map((v,i)=>Math.abs(m*v+k-y[i])))};
}
test('Original Maya Horse_BaseShapeOrig and quantized BTC_EQUINE_MESH retain the same vertex ordering',()=>{
 assert.equal(BTC_EQUINE_MESH.count,5406);
 const data=Buffer.from(BTC_EQUINE_MESH.position16,'base64');
 const points=original.map((_,i)=>[0,1,2].map(axis=>
  BTC_EQUINE_MESH.min[axis]+data.readUInt16LE(2*(i*3+axis))/65535*
  (BTC_EQUINE_MESH.max[axis]-BTC_EQUINE_MESH.min[axis])));
 const x=regression(original.map(p=>p[0]),points.map(p=>p[0]));
 const y=regression(original.map(p=>p[2]),points.map(p=>p[1]));
 const z=regression(original.map(p=>p[1]),points.map(p=>p[2]));
 assert.ok(Math.abs(x.scale-.00022)<1e-7,x.scale);
 assert.ok(Math.abs(y.scale+.000205)<1e-7,y.scale);
 assert.ok(Math.abs(z.scale-.000205)<1e-7,z.scale);
 for(const [axis,f] of [['x',x],['y',y],['z',z]])
  assert.ok(f.error<.00000055,axis+' source index mismatch '+f.error);
});
