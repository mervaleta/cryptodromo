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
 await page.goto('http://127.0.0.1:8799/racers/?atelier=off#BTC',{waitUntil:'domcontentloaded',timeout:50000});
 assert.equal(await page.locator('#btc-atelier-entry').isVisible(),true);
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),false);
 assert.equal(await page.evaluate(()=>Boolean(window.__cryptodromoBTCAtelierQA)),false);
 await page.goto('http://127.0.0.1:8799/racers/#BTC',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='BTC',null,{timeout:120000});
 let state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.originalAsset,true);
 assert.equal(state.jockey,false);
 assert.equal(state.variant,'enhanced');
 assert.ok(state.clips.includes('Gallop'));
 assert.equal(state.hairSystem,null);
 assert.equal(state.heroGroom?.oldHairHidden,true,'Must hide original Hair and exposed tail');
 assert.equal(state.heroGroom?.version,'btc-groom-v3-shell-2');
 assert.equal(state.heroGroom?.maneBodies,1);
 assert.equal(state.heroGroom?.tailBodies,1);
 assert.equal(state.heroGroom?.mode,'continuous-volume');
 assert.equal(state.heroGroom?.modelPreserved,true);
 assert.equal(new URL(page.url()).searchParams.has('atelier'),false,'BTC hero groom must run on the normal profile');
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
  return s?.heroGroom?.oldHairHidden===true&&s?.drawCalls>0;
 },null,{timeout:20000});
 await page.locator('[data-btc-variant="original"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='original');
 await page.locator('[data-btc-camera="profile"]').click();
 mkdirSync('artifacts',{recursive:true});
 await page.locator('#horse-view').screenshot({path:'artifacts/btc-original-before.png',timeout:60000});
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
 await page.locator('[data-btc-camera="profile"]').click();
 await page.locator('#horse-view').screenshot({path:'artifacts/btc-hero-after-profile.png',timeout:60000});
 await page.locator('[data-btc-camera="rear"]').click();
 await page.locator('#horse-view').screenshot({path:'artifacts/btc-hero-after-rear.png',timeout:60000});
 mkdirSync('artifacts',{recursive:true});
 try{
  await page.locator('.feature').screenshot({path:'artifacts/btc-groom-v3-iteration1.png',timeout:60000,animations:'disabled'});
 }catch(error){console.warn('Screenshot skipped due to software GPU:',error.message);}
 assert.deepEqual(pageErrors,[],pageErrors.join('; '));
 console.log('BTC_ATELIER_OK',JSON.stringify(await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())));
}finally{await browser.close();}
