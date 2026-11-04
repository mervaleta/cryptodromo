/**
 * Tests the actual Hostinger production URL, not just the GitHub branch.
 * Captures a still only for internal diagnostics, never records a video.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const errors=[];
try {
 const page=await browser.newPage({
  viewport:{width:1360,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://race.cryptodromo.com/racers/#BTC',{
  waitUntil:'domcontentloaded',timeout:90000
 });
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s?.variant==='maya'&&
    s?.heroGroom?.version==='btc-maya-2017-sculpt-gallop-20261104'&&
    s?.heroGroom?.heroHooves===4&&s?.heroGroom?.facialSurfaces>=4&&
    s?.clips?.includes('Gallop')&&s?.drawCalls>0;
 },null,{timeout:120000});
 const s=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.());
 assert.equal(s.heroGroom.gallopPreserved,true);
 assert.equal(s.heroGroom.originalRig,true);
 assert.equal(s.heroGroom.sculptedEyes,2);
 assert.ok(s.heroGroom.fineLocks>1100);
 const before=s.hoofPhase;
 await page.waitForTimeout(1100);
 const after=(await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.())).hoofPhase;
 assert.ok(Math.abs(after-before)>.001,'The production horse must be actually galloping');
 mkdirSync('artifacts/btc-live', {recursive:true});
 await page.locator('#horse-view').screenshot({
  path:'artifacts/btc-live/public-btc-anatomical.png',timeout:90000
 });
 await page.locator('button.runner[data-symbol="ETH"]').click({timeout:20000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:90000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.());
 assert.equal(eth.heroGroom,null,'Other 99 token models must remain untouched');
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('PRODUCTION_BTC_SCULPT_AND_GALLOP_CONFIRMED',JSON.stringify({
  url:page.url(),version:s.heroGroom.version,hoofShells:s.heroGroom.heroHooves,
  groomLocks:s.heroGroom.fineLocks,faces:s.heroGroom.facialSurfaces
 }));
 await page.close();
} finally {await browser.close();}
