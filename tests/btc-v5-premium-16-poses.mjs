import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
// Human-readable 16-phase evidence; automated checks are not AAA approval.
const folder='artifacts/btc-v5-premium-16';
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1270,height:800},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
try {
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s?.variant==='enhanced'&&
   s?.heroGroom?.refinedBodyMeshes>=1&&s?.heroGroom?.refinedBodyVertices>1000&&
   s?.heroGroom?.nativeTailBones===7&&s?.drawCalls>0&&s?.clips.includes('Gallop');
 },undefined,{timeout:120000});
 const first=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(first.heroGroom.oldHairHidden,true);
 assert.equal(first.heroGroom.gallopPreserved,true);
 assert.equal(first.heroGroom.source,'original-skinned-glb');
 assert.equal(first.heroGroom.pass,10);
 const canvas=page.locator('#horse-canvas');
 const phases=[];
 await page.locator('[data-btc-camera="profile"]').click();
 for(let pose=0;pose<16;pose++){
  await page.evaluate(p=>window.__cryptodromoBTCAtelierSetPose(p),pose);
  await page.waitForFunction(p=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===p,pose);
  await page.waitForTimeout(130);
  const pixels=await canvas.screenshot({path:folder+'/profile-'+String(pose).padStart(2,'0')+'.png',timeout:90000});
  phases.push(pixels);
  console.log('BTC_PREMIUM_GALLOP_PHASE_OK',pose);
 }
 assert.notDeepEqual(phases[0],phases[8]);
 for(const camera of ['front','rear','threeQuarter','detail']){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  for(const pose of [0,4,8,12]){
   await page.evaluate(p=>window.__cryptodromoBTCAtelierSetPose(p),pose);
   await page.waitForTimeout(175);
   await canvas.screenshot({path:folder+'/'+camera+'-'+String(pose).padStart(2,'0')+'.png',timeout:90000});
  }
  console.log('BTC_PREMIUM_CAMERA_PHASES_OK',camera);
 }
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_PREMIUM_NATIVE_RIG_16_PHASES_CAPTURED',JSON.stringify({
  build:'btc-v5-luxury-profile-20261105-v2',refinedBodyMeshes:first.heroGroom.refinedBodyMeshes,
  refinedBodyVertices:first.heroGroom.refinedBodyVertices,silkLocks:first.heroGroom.silkLocks,
  profilePhases:16,otherAngles:4,approvedAAA:false
 }));
} finally {await page.close();await browser.close();}
