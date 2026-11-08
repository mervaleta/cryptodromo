/**
 * V22 visual triage, not an acceptance test. Preserve six actual WebGL
 * before/after candidates even if the strict 16-phase gate still rejects.
 * Absolutely no modification to the published V21.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const dest='artifacts/btc-v22-hind-diagnostic';mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1100,height:750}});
const shots=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.harmonyBuild==='btc-v22-continuous-hind-seam-20261107'
    && s?.clips?.includes('Gallop') && s.drawCalls>0;
 },null,{timeout:120000});
 const qa=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(qa.heroGroom?.tailDockCapRimSkinnedCenters,2,'Both rump cap centers must follow their original rim skin weights');
 assert.equal(qa.heroGroom?.tailDockMidlineBridgeTriangles,6,'Six triangles must close the sagittal tail-dock slit');
 assert.equal(qa.heroGroom?.tailDockOpenCapEdges,0,'Tail dock must have no open/nonmanifold cap edges');
 console.log('BTC_V22_HIND_DIAGNOSTIC',JSON.stringify(qa.heroGroom?.hindRestoration));
 writeFileSync(dest+'/metadata.json',JSON.stringify({
  build:qa.heroGroom?.harmonyBuild,
  hind:qa.heroGroom?.hindRestoration,
  publicV21Unchanged:true,acceptance:false
 },null,2));
 for(const camera of ['rear','threeQuarter','profile'])for(const pose of [0,8]){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),pose);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,pose,{timeout:15000});
  await page.waitForTimeout(150);
  const data=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(data?.startsWith('data:image/png;base64,')&&data.length>20000);
  const name=camera+'-'+String(pose).padStart(2,'0')+'.png';
  writeFileSync(dest+'/'+name,Buffer.from(data.split(',')[1],'base64'));
  shots.push(name);
  console.log('BTC_V22_DIAGNOSTIC_SHOT',name);
 }
 // Compare the exact same rear pose with the two candidate components
 // isolated. These are diagnostic URLs, NEVER images of a publishable model.
 for(const [label,flag] of [['no-tail','btcHideTailQA'],['no-donor','btcHideDonorQA']]){
  await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1&'+flag+'=1#BTC',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.harmonyBuild===
   'btc-v22-continuous-hind-seam-20261107',null,{timeout:120000});
  await page.locator('[data-btc-camera="rear"]').click();
  await page.evaluate(()=>window.__cryptodromoBTCAtelierSetPose?.(0));
  await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===0,null,{timeout:15000});
  await page.waitForTimeout(180);
  const data=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(data?.startsWith('data:image/png;base64,')&&data.length>20000);
  writeFileSync(dest+'/rear-00-'+label+'.png',Buffer.from(data.split(',')[1],'base64'));
  shots.push('rear-00-'+label+'.png');
  console.log('BTC_V22_COMPONENT_ISOLATION',label);
 }
 assert.deepEqual(errors,[]);
 console.log('BTC_V22_DIAGNOSTIC_DONE',shots.length);
}finally{
 await page.close();
 await browser.close();
}
