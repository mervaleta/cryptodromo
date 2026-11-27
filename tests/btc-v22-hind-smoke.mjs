/**
 * V22 visual triage, not an acceptance test. Preserve six actual WebGL
 * before/after candidates even if the strict 16-phase gate still rejects.
 * Absolutely no modification to the published V21.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {chromium} from 'playwright';
const dest='artifacts/btc-v22-hind-diagnostic';mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1100,height:750}});
// Keep this focused renderer on the same pinned Three.js bytes as npm install;
// Chromium still uses real WebGL/SwiftShader, without relying on CDN responses.
const threeRoot=resolve('node_modules/three');
await page.route('https://cdn.jsdelivr.net/npm/three@0.187.0/**',async route=>{
 const url=new URL(route.request().url());
 const marker='/npm/three@0.187.0/';
 const offset=url.pathname.indexOf(marker);
 if(offset<0)return route.abort();
 const relative=url.pathname.slice(offset+marker.length);
 const target=resolve(threeRoot,relative);
 if(!target.startsWith(threeRoot+sep))return route.abort();
 await route.fulfill({path:target,contentType:'text/javascript'});
});
const shots=[],errors=[],consoleMessages=[],requestFailures=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{
 if(!m.text().includes('favicon'))consoleMessages.push({type:m.type(),text:m.text()});
 if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());
});
page.on('requestfailed',r=>requestFailures.push({url:r.url(),error:r.failure()?.errorText||'unknown'}));
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1&btcDonorHindExperiment=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 try{
  await page.waitForFunction(()=>{
   const s=window.__cryptodromoBTCAtelierQA?.();
   return s?.heroGroom?.harmonyBuild==='btc-v23-native-hind-sculpt-20261127'
     && s?.clips?.includes('Gallop') && s.drawCalls>0;
  },null,{timeout:120000});
 }catch(error){
  const diagnostics=await page.evaluate(()=>({
   readyState:document.readyState,qa:window.__cryptodromoBTCAtelierQA?.()||null,
   bodyClasses:document.body?.className||'',hash:location.hash,search:location.search,
   previewState:document.querySelector('#preview-state')?.textContent||null,
   fallbackHidden:document.querySelector('#preview-fallback')?.hidden??null,
   canvasHidden:document.querySelector('#horse-canvas')?.hidden??null,
   atelierPanelHidden:document.querySelector('#btc-atelier-panel')?.hidden??null
  })).catch(e=>({evaluationError:String(e)}));
  writeFileSync(dest+'/startup-failure.json',JSON.stringify({diagnostics,errors,consoleMessages,requestFailures},null,2));
  console.error('BTC_V22_SMOKE_STARTUP_FAILURE',JSON.stringify({diagnostics,errors,consoleMessages,requestFailures}));
  throw error;
 }
 const qa=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(qa.heroGroom?.tailDockCapRimSkinnedCenters,0,'The single-loop cap must not use centroid-weighted fan centers');
 assert.equal(qa.heroGroom?.tailDockCapInteriorRingVertices,qa.heroGroom?.tailDockBorderEdges,'Every boundary vertex must have one skinned inset counterpart');
 assert.equal(qa.heroGroom?.tailDockCapCoreTriangles,qa.heroGroom?.tailDockBorderEdges-2,'The inset polygon must be fully ear-triangulated');
 assert.equal(qa.heroGroom?.tailDockCapProjectedSelfIntersections,0,'The cap polygon must be simple in its local tangent plane');
 assert.equal(qa.heroGroom?.tailDockCapDegenerateTriangles,0,'The cap must contain no degenerate faces');
 assert.equal(qa.heroGroom?.tailDockMidlineBridgeTriangles,0,'The shared endpoints must be closed by one continuous boundary loop');
 assert.equal(qa.heroGroom?.tailDockOpenCapEdges,0,'Tail dock must have no open/nonmanifold cap edges');
 console.log('BTC_V22_HIND_DIAGNOSTIC',JSON.stringify(qa.heroGroom?.hindRestoration));
 writeFileSync(dest+'/metadata.json',JSON.stringify({
  build:qa.heroGroom?.harmonyBuild,
  hind:qa.heroGroom?.hindRestoration,
  publicV21Unchanged:true,acceptance:false
 },null,2));
 for(const camera of ['rear','threeQuarter','profile'])for(const pose of [0,8]){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),pose);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,pose,{timeout:15000});
  await page.waitForTimeout(150);
  const data=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(data?.startsWith('data:image/png;base64,')&&data.length>20000);
  const name=camera+'-'+String(pose).padStart(2,'0')+'.png';
  writeFileSync(dest+'/'+name,Buffer.from(data.split(',')[1],'base64'));
  shots.push(name);
  console.log('BTC_V22_DIAGNOSTIC_SHOT',name);
 }
 // Isolate the same components at rest and under the failing Gallop pose.
 // These diagnostic URLs NEVER represent a publishable model.
 for(const [label,flag] of [['no-tail','btcHideTailQA'],['no-donor','btcHideDonorQA']]){
  await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1&btcDonorHindExperiment=1&'+flag+'=1#BTC',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.harmonyBuild===
   'btc-v23-native-hind-sculpt-20261127',null,{timeout:120000});
  await page.locator('[data-btc-camera="rear"]').click();
  for(const pose of [0,8]){
   await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),pose);
   await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,pose,{timeout:15000});
   await page.waitForTimeout(180);
   const data=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
   assert.ok(data?.startsWith('data:image/png;base64,')&&data.length>20000);
   const name='rear-'+String(pose).padStart(2,'0')+'-'+label+'.png';
   writeFileSync(dest+'/'+name,Buffer.from(data.split(',')[1],'base64'));
   shots.push(name);
   console.log('BTC_V22_COMPONENT_ISOLATION',name);
  }
 }
 // Inspect the actual sewn surface in a distinct diagnostic material. If the
 // green double-sided bridge still leaves a black cavity, the issue is its
 // position/coverage, not backface winding. This is internal QA only.
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1&btcDonorHindExperiment=1&btcHideTailQA=1&btcSeamDebugQA=1#BTC',
  {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.harmonyBuild===
  'btc-v23-native-hind-sculpt-20261127',null,{timeout:120000});
 await page.locator('[data-btc-camera="rear"]').click();
 await page.evaluate(()=>window.__cryptodromoBTCAtelierSetPose?.(0));
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===0,null,{timeout:15000});
 await page.waitForTimeout(180);
 const seamData=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
 assert.ok(seamData?.startsWith('data:image/png;base64,')&&seamData.length>20000);
 writeFileSync(dest+'/rear-00-seam-debug.png',Buffer.from(seamData.split(',')[1],'base64'));
 shots.push('rear-00-seam-debug.png');
 console.log('BTC_V22_SEAM_DEBUG_SHOT rear-00-seam-debug.png');
 assert.deepEqual(errors,[]);
 console.log('BTC_V22_DIAGNOSTIC_DONE',shots.length);
}finally{
 await page.close();
 await browser.close();
}
