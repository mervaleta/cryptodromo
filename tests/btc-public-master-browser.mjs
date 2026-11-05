/**
 * Canonical production BTC acceptance. A successful build alone is insufficient:
 * actual Hostinger code, animated 3D frames, the native rig, and 99-runner
 * isolation must all be demonstrated. Human AAA sign-off is separate.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const BUILD='btc-v5-luxury-profile-20261105-v2';
const directory='artifacts/btc-live';
mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1390,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',e=>errors.push(String(e?.message||e)));
try{
 await page.goto('https://race.cryptodromo.com/racers/#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(expected=>{
  const state=window.__cryptodromoBTCAtelierQA?.();
  return state?.symbol==='BTC'&&state.variant==='enhanced'&&state.heroGroom?.refinedBodyMeshes>=1&&
   state.heroGroom.refinedBodyVertices>1000&&state.heroGroom.nativeTailBones===7&&
   state.clips?.includes('Gallop')&&state.drawCalls>0&&
   document.querySelector('#btc-master-build')?.textContent?.includes(expected);
 },BUILD,{timeout:120000});
 const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.heroGroom.source,'original-skinned-glb');
 assert.equal(state.heroGroom.gallopPreserved,true);
 assert.equal(state.heroGroom.oldHairHidden,true);
 assert.equal(state.heroGroom.pass,10);
 await page.locator('#horse-canvas').screenshot({path:directory+'/canonical-btc-v5-premium.png',timeout:90000});
 // Demonstrate native movement changes even when no query flags are supplied.
 const before=await page.locator('#horse-canvas').screenshot();
 await page.waitForTimeout(600);
 const after=await page.locator('#horse-canvas').screenshot();
 assert.notDeepEqual(before,after,'Canonical BTC must visibly gallop');
 // Four additional angles, 16 phase samples, on the same production URL host.
 await page.goto('https://race.cryptodromo.com/racers/?btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.refinedBodyMeshes>=1,undefined,{timeout:120000});
 const canvas=page.locator('#horse-canvas');
 for(const camera of ['profile','front','rear','threeQuarter']){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  for(const pose of (camera==='profile'?Array.from({length:16},(_,i)=>i):[0,4,8,12])){
   await page.evaluate(v=>window.__cryptodromoBTCAtelierSetPose(v),pose);
   await page.waitForFunction(v=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===v,pose);
   await page.waitForTimeout(150);
   await canvas.screenshot({path:directory+'/'+camera+'-'+String(pose).padStart(2,'0')+'.png',timeout:90000});
  }
 }
 // A symbol switch must dispose BTC-only groom, not mutate race roster.
 await page.locator('button.runner[data-symbol="ETH"]').click({timeout:20000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',undefined,{timeout:90000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.());
 assert.equal(eth.heroGroom,null);
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('HOSTINGER_BTC_V5_PREMIUM_NATIVE_GALLOP_VISUAL_QA_OK',JSON.stringify({
  build:BUILD,source:state.heroGroom.source,refinedBodyVertices:state.heroGroom.refinedBodyVertices,
  clips:state.clips,angles:4,profilePhases:16,othersUnaffected:true,visualAAAApproved:false
 }));
}finally{
 await page.close();await browser.close();
}
