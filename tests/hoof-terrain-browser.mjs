import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.HOOF_FX_TEST_ORIGIN||'http://127.0.0.1:8799';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
try{
 const page=await browser.newPage({viewport:{width:1420,height:910},deviceScaleFactor:1});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('response',res=>{if(res.status()>=400)missing.push(res.status()+' '+res.url());});
 await mkdir('artifacts',{recursive:true});
 const response=await page.goto(base+'/visual-lab/hoof-fx-lab/?qa=1',{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>window.__cryptodromoHoofLabQA?.snapshot().ready,
  undefined,{timeout:90000,polling:500});
 let state=await page.evaluate(()=>window.__cryptodromoHoofLabQA.snapshot());
 assert.equal(state.failed,false);
 assert.equal(state.surface,'dirt');
 assert.ok(['skeleton','master'].includes(state.stats.contactSource),
  'Expected animated hoof bones/sole markers, not phase proxy: '+state.stats.contactSource+' | '+JSON.stringify(state.nodes));
 await page.waitForFunction(()=>window.__cryptodromoHoofLabQA.snapshot().stats.impacts>=3,
  undefined,{timeout:55000,polling:350});
 for(const [type,name] of [['dirt','01-earth'],['sand','02-sand'],['grass','03-grass']]){
  await page.selectOption('#surface',type);
  await page.waitForFunction(t=>{
   const s=window.__cryptodromoHoofLabQA?.snapshot();
   return s?.surface===t&&s.stats.impacts>=2;
  },type,{timeout:50000,polling:350});
  const data=await page.evaluate(()=>window.__cryptodromoHoofLabQA.snapshot());
  assert.ok(data.stats.imprints>=2&&data.stats.particles>=0);
  assert.ok(data.drawCalls>0);
  await page.screenshot({path:'artifacts/hoof-'+name+'.png',timeout:50000});
  console.log('HOOF_SURFACE',type,JSON.stringify(data));
 }
 await page.locator('#wet').evaluate(el=>{
  el.value='80';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 state=await page.evaluate(()=>window.__cryptodromoHoofLabQA.snapshot());
 assert.equal(state.wetness,.8);
 await page.click('#pause');
 await page.waitForTimeout(400);
 const paused=await page.evaluate(()=>window.__cryptodromoHoofLabQA.snapshot());
 await page.waitForTimeout(1000);
 const still=await page.evaluate(()=>window.__cryptodromoHoofLabQA.snapshot());
 assert.equal(still.running,false);
 assert.equal(still.stats.impacts,paused.stats.impacts,'paused horse must not stamp impacts');
 await page.click('#pause');
 await page.selectOption('#horse-model','legacy');
 await page.waitForTimeout(350);
 await page.selectOption('#horse-model','maya');
 await page.waitForTimeout(750);
 const latest=await page.evaluate(()=>window.__cryptodromoHoofLabQA.snapshot());
 assert.equal(latest.failed,false);
 assert.ok(latest.ready);
 assert.equal(errors.length,0,'WebGL errors: '+errors.join('\n').slice(0,1400));
 assert.equal(missing.length,0,'Missing assets: '+missing.join('; ').slice(0,1000));
 console.log('PASS: BTC master/GLB, three terrains, wet particles, pause and screenshot capture');
} finally {
 await browser.close();
}
