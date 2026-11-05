import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const dir='artifacts/btc-v18-fast-screenshot';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1024,height:680},deviceScaleFactor:1,reducedMotion:'no-preference'});
 await page.goto('http://127.0.0.1:8799/racers/?btcCapture=1&btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{const s=window.__cryptodromoBTCAtelierQA?.();return s?.symbol==='BTC'&&s.variant==='maya'&&s.drawCalls>0&&s.heroGroom?.harmonyBuild==='btc-maya-v18-hind-neck-eye-20261105';},null,{timeout:120000});
 const report=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(report.heroGroom?.hindNativeProjection?.adjusted>0,'Native hind projection must process actual Maya verts');
 assert.ok(report.heroGroom?.hindNativeProjection?.nativeHindTriangles>0,'Native GLB hind triangles missing');
 writeFileSync(dir+'/report.json',JSON.stringify({build:report.heroGroom.harmonyBuild,projection:report.heroGroom.hindNativeProjection,
  source:'local checkout Three.js GLB original Gallop + Maya 2017 mesh',approvedAAA:false,publishedOnHostinger:false},null,2));
 for(const view of ['profile','threeQuarter','detail']){
  await page.evaluate(name=>document.querySelector('[data-btc-camera="'+name+'"]')?.click(),view);
  await page.evaluate(()=>window.__cryptodromoBTCAtelierSetPose?.(8));
  await page.waitForTimeout(200);
  await page.locator('#horse-canvas').screenshot({path:dir+'/'+view+'-gallop-pose-08.png',timeout:60000});
  console.log('BTC_V18_CAPTURED_REAL',view);
 }
}finally{await browser.close();}
