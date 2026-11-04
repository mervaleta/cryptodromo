/** Real Chromium/WebGL acceptance of the user-supplied Maya anatomical sculpt.
 * No marketing video. Only visual test stills inside GitHub Actions for review.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const errors=[];
const dir='artifacts/btc-maya-internal-qa';
mkdirSync(dir,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1320,height:840},deviceScaleFactor:1,reducedMotion:'no-preference'});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 await page.goto('http://127.0.0.1:8799/racers/#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.version==='btc-maya-2017-sculpt-gallop-20261104'&&
   s?.drawCalls>0&&s?.clips?.includes('Gallop');
 },null,{timeout:120000});
 const start=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(start.variant,'enhanced');
 assert.equal(start.heroGroom.vertices,5406);
 assert.equal(start.heroGroom.triangles,10790);
 assert.ok(start.heroGroom.fineLocks>=500);
 assert.equal(start.heroGroom.originalRig,true);
 assert.equal(start.heroGroom.modelPreserved,true);
 assert.equal(start.heroGroom.gallopPreserved,true);
 const before=start.hoofPhase;
 await page.waitForTimeout(600);
 const after=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(Math.abs(after.hoofPhase-before)>.001,'Original Gallop must animate sculpted model');
 for(const angle of ['profile','front','rear']){
  await page.evaluate(angle=>document.querySelector('[data-btc-camera="'+angle+'"]').click(),angle);
  await page.waitForTimeout(350);
  await page.locator('#horse-view').screenshot({path:dir+'/'+angle+'.png',timeout:70000});
  console.log('BTC_MAYA_GEOMETRY_RENDER_OK',angle);
 }
 await page.evaluate(()=>document.querySelector('[data-btc-variant="baseline"]').click());
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.version==='btc-real-hero-v4-20261103',null,{timeout:120000});
 await page.evaluate(()=>document.querySelector('[data-btc-variant="enhanced"]').click());
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.version==='btc-maya-2017-sculpt-gallop-20261104',null,{timeout:120000});
 await page.locator('button.runner[data-symbol="ETH"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:120000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(eth.heroGroom,null,'No BTC anatomical mesh leaks to other tokens');
 assert.equal(eth.variant,'original');
 await page.goto('http://127.0.0.1:8799/racers/?atelier=off#BTC',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),false);
 assert.equal(await page.evaluate(()=>Boolean(window.__cryptodromoBTCAtelierQA)),false);
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_MAYA_ANATOMY_EDITOR_ROSTER_AND_ROLLBACK_OK');
}finally{await browser.close();}
