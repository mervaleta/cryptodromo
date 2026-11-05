/**
 * BTC V18: actual renderer/GLB/Gallop screenshots from branch-local Chromium.
 * A successful run IS NOT an AAA approval. Human review must reject any
 * bad joint movement, nape collapse, dead forelock or eye artifacts.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const BUILD='btc-maya-v18-hind-neck-eye-20261105';
const DIR='artifacts/btc-v18-16phase-webgl';mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[],snapshots=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{
 if(message.type()==='error'&&!message.text().includes('favicon'))errors.push(message.text());
});
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1#BTC',
  {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(build=>{
  const state=window.__cryptodromoBTCAtelierQA?.();
  return state?.symbol==='BTC'&&state?.variant==='maya'&&
   state?.heroGroom?.harmonyBuild===build&&
   state?.drawCalls>0&&state?.clips?.includes('Gallop');
 },BUILD,{timeout:120000});
 const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.heroGroom.originalRig,true);
 assert.equal(state.heroGroom.gallopPreserved,true);
 assert.ok(state.heroGroom.hindNativeProjection?.adjusted>100,
  'Hind skin projection should adjust genuine Maya leg vertices');
 assert.ok(state.heroGroom.hindNativeProjection?.nativeHindTriangles>100,
  'Source Quaternius hind triangles must be used, not generated fake geometry');
 assert.ok(state.heroGroom.hindNativeProjection?.maxProjectionError<.0055,
  'Reject bad body-to-original-rig spatial mapping');
 async function capture(camera,phase){
  await page.evaluate(name=>document.querySelector('[data-btc-camera="'+name+'"]')?.click(),camera);
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),phase);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,
   phase,{timeout:10000});
  await page.waitForTimeout(150);
  const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>30000,
   'No real WebGL frame rendered '+camera+'/'+phase);
  const name=camera+'-phase-'+String(phase).padStart(2,'0')+'.png';
  writeFileSync(DIR+'/'+name,Buffer.from(png.split(',')[1],'base64'));
  snapshots.push(name);
 }
 for(const camera of ['profile','threeQuarter','front','rear','detail','top']){
  const poses=camera==='profile'||camera==='threeQuarter'?
   Array.from({length:16},(_,i)=>i):[0,4,8,12];
  for(const p of poses)await capture(camera,p);
 }
 // Use multiple views of the moving model, not a painted preview image.
 const final=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.deepEqual(errors,[],errors.join('; '));
 writeFileSync(DIR+'/report.json',JSON.stringify({
  build:BUILD,source:'local checkout genuine GLB + Maya 2017 anatomical mesh',
  runtime:'Chromium / software WebGL',clips:final.clips,
  projection:final.heroGroom.hindNativeProjection,
  screenshots:snapshots,visualAAAApproved:false,hostingerVerified:false,
  reference:'212734.mp4 in original project sources: compare separately',
  next:'Human visual review of hocks, poll, mane, eyes at all sixteen phases'
 },null,2));
 console.log('BTC_V18_REAL_WEBGL_CAPTURE_COMPLETE',snapshots.length);
}finally{
 await page.close();await browser.close();
}
