import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1390,height:920},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const pageErrors=[];
 page.on('pageerror',err=>pageErrors.push(err.message));
 await page.goto('http://127.0.0.1:8799/racers/#BTC',{waitUntil:'domcontentloaded',timeout:50000});
 assert.equal(await page.locator('#btc-atelier-entry').isVisible(),true);
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),false);
 assert.equal(await page.evaluate(()=>Boolean(window.__cryptodromoBTCAtelierQA)),false);
 await page.goto('http://127.0.0.1:8799/racers/?atelier=btc#BTC',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='BTC',null,{timeout:120000});
 let state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.originalAsset,true);
 assert.equal(state.jockey,false);
 assert.equal(state.variant,'enhanced');
 assert.ok(state.clips.includes('Gallop'));
 assert.equal(state.hairSystem?.version,'btc-mane-tail-v15');
 assert.equal(state.hairSystem?.channels,1,'Mane and tail must be driven by the original skinned Hair primitive');
 assert.equal(state.heroGroom?.version,'btc-3d-groom-v2');
 assert.equal(state.heroGroom?.maneLocks,38);
 assert.equal(state.heroGroom?.tailLocks,27);
 assert.equal(state.heroGroom?.modelPreserved,true);
 assert.equal(state.heroGroom?.jockey,false);
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),true);
 await page.locator('#btc-wind').evaluate(el=>{el.value='1.7';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#btc-speed').evaluate(el=>{el.value='.8';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('[data-btc-camera="detail"]').click();
 state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.wind,1.7);
 assert.equal(state.speed,.8);
 assert.equal(state.camera,'detail');
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.hairSystem?.air>0&&Math.abs(s?.tailMotion)>0.0001&&Math.abs(s?.maneMotion)>0.0001;
 },null,{timeout:20000});
 await page.locator('[data-btc-variant="original"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='original');
 await page.locator('[data-btc-variant="enhanced"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='enhanced');
 await page.locator('button.runner[data-symbol="ETH"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:60000});
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).variant,'original');
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).hairSystem,null);
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).heroGroom,null);
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),false);
 await page.locator('button.runner[data-symbol="BTC"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='BTC',null,{timeout:60000});
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),true);
 mkdirSync('artifacts',{recursive:true});
 try{
  await page.locator('.feature').screenshot({path:'artifacts/btc-3d-groom-v2-preview.png',timeout:60000,animations:'disabled'});
 }catch(error){console.warn('Screenshot skipped due to software GPU:',error.message);}
 assert.deepEqual(pageErrors,[],pageErrors.join('; '));
 console.log('BTC_ATELIER_OK',JSON.stringify(await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())));
}finally{await browser.close();}
