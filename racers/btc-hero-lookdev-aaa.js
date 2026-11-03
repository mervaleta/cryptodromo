/**
 * BTC AAA lookdev. Geometry-only companion to the existing original-GLB v3 groom.
 * No game logic, token roster or animations are modified.
 * Every stage is deterministic and independently comparable via ?lookdev=1..10.
 */
import * as THREE from 'three';
import {createBTC3DHeroGroom} from './btc-hero-groom-v3.js';
export const BTC_AAA_LOOKDEV_VERSION='btc-aaa-lookdev-stage-01';
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
 const baseline={vertices:position.count,drawCallsAdded:1};
 return {
  ...hero,
  get snapshot(){
   return {...hero.snapshot,lookdevStage:stage,lookdevVersion:BTC_AAA_LOOKDEV_VERSION,
    lookdevNotes:passNotes,baseline};
  }
 };
}
