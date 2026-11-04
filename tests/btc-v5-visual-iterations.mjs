/**
 * Actual Chromium/WebGL QA. Each still uses the same 0.3s Gallop pose, so
 * only the authored BTC hair/anatomy pass changes between images.
 * Also proves movement of hair with horse pose frozen, not just moving legs.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const root='artifacts/btc-v5';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const context=await browser.newContext({
 viewport:{width:1160,height:780},deviceScaleFactor:1,reducedMotion:'no-preference'
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcPass=1&btcFreeze=1#BTC',{
  waitUntil:'domcontentloaded',timeout:90000
 });
 for(let n=1;n<=10;n++){
  const stage=String(n).padStart(2,'0'),dir=root+'/pass-'+stage;
  mkdirSync(dir,{recursive:true});
  if(n>1)await page.evaluate(n=>window.__cryptodromoBTCAtelierSetStage(n),n);
  await page.waitForFunction(expected=>{
   const s=window.__cryptodromoBTCAtelierQA?.();
   return s?.heroGroom?.version==='btc-v5-motion-study-20261103'&&
    s?.heroGroom?.pass===expected&&s?.drawCalls>0&&s?.clips.includes('Gallop');
  },n,{timeout:100000});
  let s=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
  assert.equal(s.heroGroom.modelPreserved,true);
  assert.equal(s.heroGroom.gallopPreserved,true);
  assert.equal(s.heroGroom.oldHairHidden,true);
  assert.ok(s.heroGroom.vertexCount>40000);
  await page.locator('[data-btc-camera="profile"]').click();
  await page.waitForTimeout(420);
  await page.screenshot({path:dir+'/profile.png',timeout:60000});
  await page.locator('[data-btc-camera="rear"]').click();
  await page.waitForTimeout(260);
  await page.screenshot({path:dir+'/rear.png',timeout:60000});
  writeFileSync(dir+'/notes.json',JSON.stringify(s.heroGroom,null,2));
  console.log('BTC_V5_PASS_OK',stage,s.heroGroom.passes.length,s.heroGroom.vertexCount);
 }
 await page.goto('http://127.0.0.1:8799/racers/?btcPass=10&btcFreeze=1#BTC',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.pass===10,null,{timeout:100000});
 await page.locator('[data-btc-camera="profile"]').click();
 await page.locator('#btc-wind').evaluate(el=>{
  el.value='1.85';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.waitForTimeout(300);
 const before=await page.screenshot({path:root+'/frozen-hair-t0.png'});
 const a=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 await page.waitForTimeout(1200);
 const after=await page.screenshot({path:root+'/frozen-hair-t1.png'});
 const b=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.notDeepEqual(before,after,'Hair must visibly move while original Gallop pose remains frozen');
 assert.ok(Math.abs(b.heroGroom.hairMotion.mane-a.heroGroom.hairMotion.mane)>0.000001 ||
           Math.abs(b.heroGroom.hairMotion.tail-a.heroGroom.hairMotion.tail)>0.000001,
           'Spring uniforms must evolve in time');
 assert.ok(b.heroGroom.hairMotion.energy>0.000001,'Damped hair must receive energy');
 // Verify rollback and that non-BTC profiles never keep the custom groom.
 await page.locator('[data-btc-variant="original"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='original');
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).heroGroom,null);
 await page.goto('http://127.0.0.1:8799/racers/?atelier=off#BTC',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),false);
 assert.equal(await page.evaluate(()=>Boolean(window.__cryptodromoBTCAtelierQA)),false);
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_V5_MOTION_PIXELS_AND_ROLLBACK_OK');
 // A separate public browser workflow records the final moving video.
}finally{await page.close();await context.close();await browser.close();}
