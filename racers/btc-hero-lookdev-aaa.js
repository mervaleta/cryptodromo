/**
 * BTC AAA lookdev. Geometry-only companion to the existing original-GLB v3 groom.
 * No game logic, token roster or animations are modified.
 * Every stage is deterministic and independently comparable via ?lookdev=1..10.
 */
import * as THREE from 'three';
import {createBTC3DHeroGroom} from './btc-hero-groom-v3.js';
export const BTC_AAA_LOOKDEV_VERSION='btc-aaa-lookdev-stage-04';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
export function createBTCAAAHeroGroom(root,options={}){
 const stage=Math.floor(clamp(options.lookdevStage??10,1,10));
 const hero=createBTC3DHeroGroom(root,options);
 let mesh;
 root.traverse(object=>{
  if(object.isSkinnedMesh&&object.name==='BTC · continuous mane and tail volume')mesh=object;
 });
 if(!mesh){
  hero.dispose();
  throw new Error('BTC AAA: original skinned groom not found');
 }
 if(!hero.snapshot?.oldHairHidden || !hero.snapshot?.modelPreserved){
  hero.dispose();
  throw new Error('BTC AAA: original hair and skeleton safety contract broken');
 }
 const geometry=mesh.geometry;
 const position=geometry.getAttribute('position');
 const section=geometry.getAttribute('hairU');
 const region=geometry.getAttribute('hairRegion');
 const stripe=geometry.getAttribute('hairStripe');
 if(!position||!section||!region||!stripe){
  hero.dispose();
  throw new Error('BTC AAA: groom vertex metadata unavailable');
 }
 // Iteration 01: auditable, reversible integration of the proven v3 groom.
 const passNotes=['01 · Original GLB, Gallop, old Hair visibility and safety contract'];
 // Iteration 02: wider, continuously rolled neck silhouette without rigid cards.
 if(stage>=2){
  for(let i=0;i<position.count;i++){
   if(region.getX(i)>.5)continue;
   const u=clamp(section.getX(i),0,1),s=stripe.getX(i);
   const body=Math.pow(Math.sin(Math.PI*u),.78);
   position.setX(i,position.getX(i)*(1+.135*body));
   position.setZ(i,position.getZ(i)+.00014*body*body*Math.sin(s*15.4+u*3.2));
  }
  passNotes.push('02 · Neck crest: integrated organic volume and silhouette');
 }
 if(stage>=2){position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();}
 // Iteration 03: full tail volume and softened asymmetrical taper.
 if(stage>=3){
  for(let i=0;i<position.count;i++){
   if(region.getX(i)<.5)continue;
   const u=clamp(section.getX(i),0,1),s=stripe.getX(i);
   const fullness=Math.sin(Math.PI*u);
   position.setX(i,position.getX(i)*(1+.08+.095*fullness));
   position.setZ(i,position.getZ(i)+.00017*fullness*Math.sin(s*16.0+u*5.7));
   position.setY(i,position.getY(i)+.00017*fullness*Math.sin(s*10.2+u*2.3));
  }
  passNotes.push('03 · Tail: rounded cross-section, sweep and tapered breakup');
 }
 if(stage>=2){position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();}
 // Iteration 04: tiny strand variations keep a soft silhouette, not cable coils.
 if(stage>=4){
  for(let i=0;i<position.count;i++){
   const u=clamp(section.getX(i),0,1),s=stripe.getX(i);
   const distal=Math.pow(u,2.5);
   const wave=Math.sin(s*37.3+u*7.7)*Math.sin(s*13.7-u*3.8);
   const amp=region.getX(i)>.5?.000085:.000055;
   position.setX(i,position.getX(i)+amp*distal*wave);
   position.setZ(i,position.getZ(i)+amp*.58*distal*Math.sin(s*29.8-u*4.6));
  }
  passNotes.push('04 · Distributed fibers: fine asymmetric separation toward tips');
 }
 if(stage>=2){position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();}
 const baseline={vertices:position.count,drawCallsAdded:1};
 return {
  ...hero,
  get snapshot(){
   return {...hero.snapshot,lookdevStage:stage,lookdevVersion:BTC_AAA_LOOKDEV_VERSION,
    lookdevNotes:passNotes,baseline};
  }
 };
}
