import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1365,height:900},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const url='http://127.0.0.1:8799/stadiums/crypto/broadcast/index.html?track=muybridge&replayDay=0&replayMinute=0&horse-engine=procedural&finish-qa=alpha06&procedural-qa=alpha20';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__cryptodromoProceduralQA?.snapshot().ready,{timeout:120000});
 const shot=await page.evaluate(()=>window.__cryptodromoProceduralQA.snapshot());
 assert.equal(shot.renderer,'procedural');
 assert.equal(shot.horses,12);
 assert.equal(shot.generated,12,'All visible runners must be generated without GLB');
 assert.equal(new Set(shot.symbols).size,12);
 assert.equal(shot.officialRanking.length,12);
 assert.equal(await page.locator('#horse-engine').inputValue(),'procedural');
 await page.locator('#graphics-quality').selectOption('eco');
 assert.equal(await page.locator('#surface').inputValue(),'dirt','Muybridge keeps its assigned surface');
 await page.locator('#weather').selectOption('noon');
 // The default automatic camera can sit inside the starting gates at 00:00.
 // Advance the fixed manual fixture, then frame horses laterally for visual QA.
 await page.locator('#start').click();
 await page.waitForFunction(()=>window.__cryptodromoQA?.state().elapsed>3,{timeout:25000});
 await page.locator('#camera').evaluate(el=>{
  el.value='side';el.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForTimeout(1700);
 await mkdir('artifacts',{recursive:true});
 await page.locator('#stage').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
 await page.waitForTimeout(150);
 await page.screenshot({path:'artifacts/procedural-live-daylight.png',timeout:60000,animations:'disabled'});
 assert.deepEqual(errors,[],'Browser or shader errors: '+errors.slice(0,7).join('; '));
 console.log('PROCEDURAL_LIVE_OK',JSON.stringify(shot));
}finally{
 await browser.close();
}
