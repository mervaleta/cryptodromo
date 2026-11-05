/**
 * Visual regression of real Cryptodromo BTC V5 horse, not an image mock.
 * Run against local checkout with Playwright Chromium and real WebGL.
 * Approving the model remains a separate human judgment.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const DIR='artifacts/btc-neck-closure';
mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function load(url,closed){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(expected=>{
  const v=window.__cryptodromoBTCAtelierQA?.();
  return v?.symbol==='BTC'&&v.variant==='enhanced'&&v.drawCalls>0&&
   v.clips.includes('Gallop')&&v.heroGroom?.neckClosureTriangles===expected;
 },closed?30:0,{timeout:120000});
 const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.heroGroom.gallopPreserved,true);
 assert.equal(state.heroGroom.source,'original-skinned-glb');
 return state;
}
try{
 const baseline=await load('http://127.0.0.1:8799/racers/?btcNeckRepair=off&btcFreeze=1#BTC',false);
 await page.locator('[data-btc-camera="top"]').click();
 await page.waitForTimeout(350);
 const before=await page.locator('#horse-canvas').screenshot({path:DIR+'/01-original-v5-neck-hole-top.png',timeout:90000});
 await page.locator('[data-btc-camera="profile"]').click();
 await page.waitForTimeout(220);
 await page.locator('#horse-canvas').screenshot({path:DIR+'/01-original-v5-profile.png',timeout:90000});
 const candidate=await load('http://127.0.0.1:8799/racers/?btcFreeze=1#BTC',true);
 assert.equal(candidate.heroGroom.neckClosureBuild,'btc-crest-closure-20261105-v1');
 assert.equal(candidate.heroGroom.neckClosureTriangles,30);
 await page.locator('[data-btc-camera="top"]').click();
 await page.waitForTimeout(350);
 const after=await page.locator('#horse-canvas').screenshot({path:DIR+'/02-repaired-v5-neck-top.png',timeout:90000});
 assert.notDeepEqual(before,after,'Original exposed neck and repaired neck must differ in actual WebGL pixels');
 for(const camera of ['profile','front','rear','threeQuarter','top']){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  const poses=camera==='profile'||camera==='top'?
   Array.from({length:16},(_,i)=>i):[0,4,8,12];
  for(const phase of poses){
   await page.evaluate(p=>window.__cryptodromoBTCAtelierSetPose(p),phase);
   await page.waitForFunction(p=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===p,phase);
   await page.waitForTimeout(160);
   await page.locator('#horse-canvas').screenshot({
    path:DIR+'/'+camera+'-'+String(phase).padStart(2,'0')+'.png',timeout:90000
   });
  }
  console.log('BTC_CREST_CAMERA_OK',camera,poses.length);
 }
 await page.locator('[data-btc-variant="original"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='original',null,{timeout:90000});
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).heroGroom,null);
 assert.deepEqual(errors,[],errors.join('\n'));
 writeFileSync(DIR+'/qa.json',JSON.stringify({
  source:'actual Three.js GLB and original native Gallop',
  build:'btc-v5-neck-tail-premium-20261105-v4',
  before:baseline.heroGroom.neckClosureTriangles,
  after:candidate.heroGroom.neckClosureTriangles,
  cameras:['profile','front','rear','threeQuarter','top'],
  nativeGallopPhases:16,approvedAAA:false
 },null,2));
 console.log('BTC_NATIVE_NECK_CLOSURE_16_PHASE_WEBGL_QA_COMPLETE');
}finally{await page.close();await browser.close();}
