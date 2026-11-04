/**
 * Same keyframe, same camera, five variants. A/B isolates whether the proposed
 * DQS correction causes the stretched thigh membranes. No edits to main/LIVE.
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.BTC_BASE_URL||'http://127.0.0.1:8799';
const dir='artifacts/btc-hind-volume-ab';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--enable-unsafe-swiftshader'
]});
const errors=[];
const report=[];
try {
 const page=await browser.newPage({viewport:{width:1060,height:720},deviceScaleFactor:1,reducedMotion:'no-preference'});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error'&&!msg.text().includes('favicon'))errors.push(msg.text())});
 await page.goto(base+'/racers/?btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.poseBuild==='btc-hind-pose-volume-dq-20261104-v13'&&
   typeof window.__cryptodromoBTCAtelierSetHindVolumeForQA==='function',null,{timeout:120000});
 await page.locator('[data-btc-camera="profile"]').click();
 // Identical problematic pose. The tester advances the ORIGINAL mixer only.
 for(let i=0;i<5;i++)await page.evaluate(()=>window.__cryptodromoBTCAtelierAdvanceFrame(.583/16));
 for(const strength of [0,.25,.50,.75,.96]){
   const value=await page.evaluate(v=>window.__cryptodromoBTCAtelierSetHindVolumeForQA(v),strength);
   assert.ok(Math.abs(value-strength)<1e-6);
   const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
   const name='thigh-pose-'+String(Math.round(strength*100)).padStart(3,'0');
   await page.locator('#horse-view').screenshot({path:dir+'/'+name+'.png',timeout:90000});
   report.push({name,phase:state.hoofPhase,strength,drawCalls:state.drawCalls});
 }
 for(let i=0;i<8;i++)await page.evaluate(()=>window.__cryptodromoBTCAtelierAdvanceFrame(.583/16));
 for(const strength of [0,.96]){
   await page.evaluate(v=>window.__cryptodromoBTCAtelierSetHindVolumeForQA(v),strength);
   const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
   const name='thigh-second-'+String(Math.round(strength*100)).padStart(3,'0');
   await page.locator('#horse-view').screenshot({path:dir+'/'+name+'.png',timeout:90000});
   report.push({name,phase:state.hoofPhase,strength,drawCalls:state.drawCalls});
 }
 writeFileSync(dir+'/comparisons.json',JSON.stringify({model:'native Gallop',dqs:'same-pose A/B',tests:report},null,2));
 assert.equal(report.length,7);
 assert.ok(report.every(x=>x.drawCalls>0));
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_HIND_SAME_POSE_AB_RENDERED',JSON.stringify(report));
 await page.close();
}finally{await browser.close()}
