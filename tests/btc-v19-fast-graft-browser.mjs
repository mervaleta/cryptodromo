import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const dir='artifacts/btc-v19-graft-fast';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:690},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const url='http://127.0.0.1:8799/tests/fixtures/btc-maya-head-preview.html?graft=1';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__btcHeadQA?.snapshot()?.headRealMaya&&window.__btcHeadQA?.snapshot()?.drawCalls>0,null,{timeout:120000});
 const state=await page.evaluate(()=>window.__btcHeadQA.snapshot());
 assert.equal(state.head.build,'btc-v19b-native-neck-continuity-20261105');
 assert.ok(state.head.mayaHeadVertices>1500&&state.head.mayaHeadTriangles>3000);
 for(const view of ['profile','threeQuarter','detail']){
  await page.evaluate(view=>{window.__btcHeadQA.setCamera(view);window.__btcHeadQA.setPose(8);},view);
  await page.waitForTimeout(180);
  await page.locator('#view').screenshot({path:dir+'/'+view+'-native-body-maya-head-v19.png',timeout:90000});
  console.log('BTC_V19_REAL_WEBGL_CAPTURE',view);
 }
 writeFileSync(dir+'/report.json',JSON.stringify({...state,AAAApproval:false,published:false,requiresVisualReview:true},null,2));
}finally{await browser.close();}
