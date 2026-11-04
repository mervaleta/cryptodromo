import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8799/autodromo/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.__cryptodromoAutodromoQA?.snapshot().carCount===12||
    document.querySelector('#canvas-fallback')?.hidden===false,{timeout:110000});
  let state=await page.evaluate(()=>window.__cryptodromoAutodromoQA.snapshot());
  assert.equal(state.frameReady,true,'Procedural scene must mount with WebGL');
  assert.equal(state.carCount,12);assert.equal(state.rosterCount,100);
  assert.equal(state.synthetic,true);
  assert.equal(await page.locator('#garage-grid .car-card').count(),100);
  assert.equal(await page.locator('#standings li').count(),12);
  await page.screenshot({path:'/tmp/autodromo-vector-desktop.png'});
  for(const trackId of ['genesis','vint-cerf','muybridge']){
    await page.locator('[data-track="'+trackId+'"]').click();
    await page.waitForFunction(id=>window.__cryptodromoAutodromoQA.snapshot().trackId===id,trackId);
    state=await page.evaluate(()=>window.__cryptodromoAutodromoQA.snapshot());
    assert.equal(state.carCount,12);
    await page.screenshot({path:'/tmp/autodromo-'+trackId+'-desktop.png'});
  }
  await page.locator('#camera-mode').selectOption('follow');
  await page.locator('#replay-speed').selectOption('4');
  await page.locator('#test-race').click();
  await page.waitForTimeout(900);
  state=await page.evaluate(()=>window.__cryptodromoAutodromoQA.snapshot());
  assert.equal(state.mode,'test');
  assert.ok(state.elapsed>0,'Manual replay must advance');
  await page.locator('#return-live').click();
  state=await page.evaluate(()=>window.__cryptodromoAutodromoQA.snapshot());
  assert.equal(state.mode,'program');
  assert.equal(state.grid.length,12);
  assert.equal(state.grid[0].position,1);
  assert.equal(state.grid[0].row,1);
  assert.equal(state.grid[0].column,0);
  assert.equal(state.grid[1].row,1);
  assert.equal(state.grid[1].column,1);
  assert.match(await page.locator('#pole-label').innerText(),/POLE/);
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#standings li').count(),12);
  await page.screenshot({path:'/tmp/autodromo-mobile.png'});
  await page.setViewportSize({width:1440,height:900});
  // At XX:03:20 America/Argentina/Buenos_Aires, Muybridge is 10s from the next start.
  await page.clock.setFixedTime(new Date('2026-11-04T18:03:20.000Z'));
  await page.waitForFunction(()=>window.__cryptodromoAutodromoQA.snapshot().stagingGrid===true,null,{timeout:15000});
  state=await page.evaluate(()=>window.__cryptodromoAutodromoQA.snapshot());
  assert.equal(state.carCount,12);
  await page.screenshot({path:'/tmp/autodromo-grid-pole.png',animations:'disabled'});
  assert.deepEqual(errors,[],'No uncaught browser errors');
  console.log('AUTODROMO_BROWSER_OK',JSON.stringify({
    cars:state.carCount,garage:100,circuits:3,program:'180s',test:'60s'
  }));
}finally{await browser.close();}
