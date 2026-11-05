/**
 * Canonical WebGL inspection of actual Hostinger BTC, not GitHub source alone.
 * Screenshots are evidence for owner review, NEVER automatic AAA approval.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const BUILD='btc-v5-head-neck-seal-20261105-v5';
const folder='artifacts/btc-live';
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1360,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const root='https://race.cryptodromo.com/racers/';
async function waitForModel(expectPatch=true){
 await page.waitForFunction(({patch,version})=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s?.variant==='enhanced'&&s?.heroGroom?.neckClosureTriangles===(patch?72:0)
    &&s?.heroGroom?.nativeTailBones===7&&s?.drawCalls>0&&s?.clips?.includes('Gallop')
    &&document.querySelector('#btc-master-build')?.textContent?.includes(version);
 },{patch:expectPatch,version:BUILD},{timeout:120000});
 return await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
}
try{
 // No query flags: this is the exact URL the user will open.
 await page.goto(root+'#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 const real=await waitForModel();
 assert.equal(real.heroGroom.neckClosureBuild,'btc-head-neck-border-closure-20261105-v2');
 assert.equal(real.heroGroom.source,'original-skinned-glb');
 assert.equal(real.heroGroom.gallopPreserved,true);
 assert.equal(real.heroGroom.oldHairHidden,true);
 assert.equal(real.heroGroom.pass,10);
 await page.locator('[data-btc-camera="top"]').click();
 await page.waitForTimeout(400);
 const oldTime=await page.locator('#horse-canvas').screenshot({path:folder+'/canonical-top-neck.png',timeout:90000});
 await page.waitForTimeout(650);
 const newTime=await page.locator('#horse-canvas').screenshot();
 assert.notDeepEqual(oldTime,newTime,'Canonical BTC must visibly gallop');
 // Compare same actual source pose before/after ONLY the neck patch.
 await page.goto(root+'?btcFreeze=1&btcNeckRepair=off#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await waitForModel(false);
 await page.locator('[data-btc-camera="top"]').click();
 await page.waitForTimeout(350);
 const before=await page.locator('#horse-canvas').screenshot({path:folder+'/before-top-hole.png',timeout:90000});
 await page.goto(root+'?btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await waitForModel(true);
 await page.locator('[data-btc-camera="top"]').click();
 await page.waitForTimeout(350);
 const after=await page.locator('#horse-canvas').screenshot({path:folder+'/after-top-neck-closed.png',timeout:90000});
 assert.notDeepEqual(before,after,'Actual patch must change top-view pixels');
 const canvas=page.locator('#horse-canvas');
 for(const camera of ['profile','front','rear','threeQuarter','top']){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  const phases=camera==='profile'||camera==='top'?Array.from({length:16},(_,i)=>i):[0,4,8,12];
  for(const p of phases){
   await page.evaluate(p=>window.__cryptodromoBTCAtelierSetPose(p),p);
   await page.waitForFunction(p=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===p,p);
   await page.waitForTimeout(150);
   await canvas.screenshot({path:folder+'/'+camera+'-'+String(p).padStart(2,'0')+'.png',timeout:90000});
  }
 }
 await page.locator('button.runner[data-symbol="ETH"]').click({timeout:20000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:90000});
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).heroGroom,null);
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_V5_V4_PUBLIC_CANDIDATE_GALLOP_AND_NECK_CAPTURED',JSON.stringify({
  build:BUILD,neckClosureTriangles:real.heroGroom.neckClosureTriangles,
  nativeTailBones:real.heroGroom.nativeTailBones,angles:5,profilePhases:16,
  visualOwnerApproval:false,modelMaster:false
 }));
}finally{await page.close();await browser.close();}
