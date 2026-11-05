/**
 * Actual native Gallop WebGL visual rejection gate for isolated BTC V20.
 * Screenshots MUST be inspected by a human: green tests are not AAA signoff.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const BUILD='btc-v20b-native-hind-gallop-20261105';
const DIR='artifacts/btc-v20-hind-real-webgl';mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1100,height:750},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1#BTC',
  {waitUntil:'domcontentloaded',timeout:90000});
 try{
  await page.waitForFunction(build=>{
   const s=window.__cryptodromoBTCAtelierQA?.();
   return s?.symbol==='BTC'&&s.variant==='maya'&&
    s.heroGroom?.harmonyBuild===build&&s.drawCalls>0&&s.clips?.includes('Gallop');
  },BUILD,{timeout:25000});
 }catch(error){
  console.log('BTC_V20_INIT_FAILURE',error.message,'JS_ERRORS',JSON.stringify(errors));
  console.log('BTC_V20_DEBUG_STATE',JSON.stringify(await page.evaluate(()=>({
   qa:window.__cryptodromoBTCAtelierQA?.(),body:document.body.innerText.slice(0,1500),
   fallback:document.querySelector('#preview-fallback')?.textContent
  }))));
  throw error;
 }
 const qa=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 const hind=qa.heroGroom.hindRestoration;
 assert.ok(hind?.sameOriginalSkeleton,'Donor hind limbs must share true native Gallop skeleton');
 assert.ok(hind.donorHindTriangles>280,'Source GLB must include real hind leg polygon surfaces');
 assert.ok(hind.donorHoofTriangles>20,'Source GLB must include both genuine hind hooves');
 assert.ok(hind.removedMayaTriangles>150,'Deformed Maya hind legs must actually be absent');
 console.log('BTC_V20_NATIVE_DONOR_REPORT',JSON.stringify(hind));
 const filenames=[];
 for(const camera of ['profile','threeQuarter','rear']){
  await page.evaluate(camera=>document.querySelector('[data-btc-camera="'+camera+'"]')?.click(),camera);
  const phases=camera==='profile'?[0,4,8,12]:[8];
  for(const phase of phases){
   await page.evaluate(phase=>window.__cryptodromoBTCAtelierSetPose?.(phase),phase);
   await page.waitForFunction(phase=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===phase,phase,{timeout:10000});
   await page.waitForTimeout(160);
   const file=camera+'-'+String(phase).padStart(2,'0')+'.png';
   const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
   assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>20000,'No actual GL WebGL pixels at '+camera+phase);
   writeFileSync(DIR+'/'+file,Buffer.from(png.split(',')[1],'base64'));filenames.push(file);
   console.log('BTC_V20_GALLOP_CAPTURED',file);
  }
 }
 // A BTC-only hotfix must not leak to the 99 other token horses.
 await page.locator('button.runner[data-symbol="ETH"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',{},{timeout:30000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(eth.variant,'original','ETH must keep original model');
 assert.equal(eth.heroGroom,null,'No BTC Maya donor should be visible for ETH');
 writeFileSync(DIR+'/qa.json',JSON.stringify({
  build:BUILD,hind,clips:qa.clips,screenshots:filenames,
  source:'original GLB / authored skinning + authored Gallop, Maya upper torso',
  actualWebGL:true,hostingerDeployed:false,visualAAAApproved:false,
  compareTo:'user V16 screenshot of hind hock collapse'
 },null,2));
 assert.deepEqual(errors,[],errors.join('\n'));
}finally{await page.close();await browser.close();}
