import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.CRP_PREVIEW_ORIGIN||'http://127.0.0.1:8799';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
await mkdir('artifacts',{recursive:true});
try {
  const page=await browser.newPage({viewport:{width:1360,height:920},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text().slice(0,260));});
  const responses=[];
  page.on('response',r=>{if(/stadium-network-(?:ui|engine)\.js/.test(r.url()))
    responses.push({url:r.url(),status:r.status(),mime:r.headers()['content-type']||''})});
  await page.goto(base+'/stadiums/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.getElementById('world-app')?.dataset.worldReady==='1',null,{timeout:30000});
  assert.equal(await page.locator('.world-card').count(),8,'eight world stadium cards are expected');
  assert.ok((await page.locator('#world-app').innerText()).includes('Ocho estadios'));
  assert.equal(await page.locator('a[href="/estadio/?venue=crypto"]').count(),1);
  await page.screenshot({path:'artifacts/world-stadium-network.png',timeout:30000});
  await page.goto(base+'/stadiums/fixture/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.getElementById('world-app')?.dataset.worldReady==='1',null,{timeout:30000});
  assert.ok(await page.locator('#world-date option').count()>=28);
  assert.ok(await page.locator('#world-results tbody tr').count()>1,'fixture must show races');
  await page.locator('#world-venue').selectOption('merval');
  assert.ok((await page.locator('#world-results').innerText()).includes('Estadio MERVAL'));
  await page.screenshot({path:'artifacts/world-fixture-mundial.png',timeout:30000});
  assert.ok(responses.length>=3,'browser must fetch MIME-safe entrypoint + engine');
  for(const r of responses){assert.equal(r.status,200,JSON.stringify(r));
    assert.match(r.mime,/javascript|ecmascript/,JSON.stringify(r));}
  assert.deepEqual(errors,[],'world-browser-errors: '+errors.join('; '));
  console.log('WORLD_MODULES_OK',JSON.stringify(responses));
  await page.close();

  // One WebGL renderer, reused while changing every world venue.
  const venuePage=await browser.newPage({viewport:{width:1360,height:920},deviceScaleFactor:1});
  const venueErrors=[];
  venuePage.on('pageerror',e=>venueErrors.push(e.message));
  venuePage.on('console',m=>{if(m.type()==='error')venueErrors.push(m.text().slice(0,260));});
  await venuePage.goto(base+'/estadio/?venue=crypto&stadium-qa=1',{waitUntil:'domcontentloaded',timeout:45000});
  await venuePage.waitForFunction(()=>window.__crpStadiumQA?.snapshot().canvas[0]>0,null,{timeout:90000});
  const ids=await venuePage.evaluate(()=>window.__crpStadiumQA.ids);
  assert.deepEqual(ids,['crypto','merval','wall-street','tokyo','london','commodities','forex','champions']);
  await venuePage.locator('#quality-select').selectOption('low');
  const reports=[];
  for(const id of ids){
    await venuePage.locator('#venue-select').selectOption(id);
    await venuePage.waitForFunction(id=>window.__crpStadiumQA?.snapshot().venue===id,id,{timeout:15000});
    const snap=await venuePage.evaluate(()=>window.__crpStadiumQA.snapshot());
    assert.ok(snap.canvas[0]>500&&snap.canvas[1]>250,'canvas is not large enough for '+id);
    assert.ok(snap.meshes?.crowdCount>100,'no generated stadium for '+id);
    assert.ok(snap.meshes?.treeCount>40,'no park for '+id);
    assert.ok(snap.fog[0]>=80,'fog should not hide world venue');
    reports.push({id,...snap});
  }
  await venuePage.locator('#venue-select').selectOption('tokyo');
  await venuePage.locator('#lighting').selectOption('12');
  await venuePage.locator('#climate').selectOption('clear');
  await venuePage.locator('#camera-select').selectOption('aerial');
  await venuePage.locator('#stadiumView').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await venuePage.waitForTimeout(1400);
  await venuePage.screenshot({path:'artifacts/world-tokyo-procedural-3d.png',timeout:35000});
  assert.deepEqual(venueErrors,[],'stadium-browser-errors: '+venueErrors.join('; '));
  console.log('WORLD_3D_OK',JSON.stringify(reports.map(x=>({id:x.id,drawCalls:x.renderCalls,stats:x.meshes}))));
  await venuePage.close();

  // Explicit failure mode: previously displayed an eternal "Preparando...".
  const fallback=await browser.newPage({viewport:{width:1200,height:700}});
  await fallback.route('**/assets/stadium-network-ui.js*',route=>route.abort());
  await fallback.goto(base+'/stadiums/fixture/',{waitUntil:'domcontentloaded',timeout:30000});
  await fallback.getByText('No se pudo cargar esta sección.').waitFor({timeout:12500});
  assert.equal(await fallback.locator('#world-app a[href="/fixture/"]').count(),1);
  console.log('WORLD_FALLBACK_OK');
  await fallback.close();
}finally{
 await browser.close();
}
