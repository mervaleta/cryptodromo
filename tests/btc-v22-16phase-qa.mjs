/**
 * BTC V22 visual rejection gate: every one of the native Gallop's 16 phases
 * must render in Chromium/WebGL. A passing run is NOT an AAA approval.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {chromium} from 'playwright';
const DIR='artifacts/btc-v22-full-cycle';mkdirSync(DIR,{recursive:true});
const BUILD='btc-v22-continuous-hind-seam-20261107';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:750},deviceScaleFactor:1});
const errors=[],consoleMessages=[],requestFailures=[],frames=[],all=new Set();
// Pin the browser's Three.js module graph to the exact npm package installed by
// this workflow. Chromium still renders real WebGL/SwiftShader; only CDN variance
// is removed from the test environment.
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
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{
 if(!m.text().includes('favicon'))consoleMessages.push({type:m.type(),text:m.text()});
 if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());
});
page.on('requestfailed',r=>requestFailures.push({url:r.url(),error:r.failure()?.errorText||'unknown'}));
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 try{
 await page.waitForFunction(build=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.harmonyBuild===build&&s.drawCalls>0&&s.clips?.includes('Gallop');
 },BUILD,{timeout:120000});
 }catch(e){
  const diagnostics=await page.evaluate(()=>({
   readyState:document.readyState,
   qa:window.__cryptodromoBTCAtelierQA?.()||null,
   text:document.body?.innerText?.slice(-1600)||'',
   canvas:!!document.querySelector('#horse-canvas'),
   bodyClasses:document.body?.className||'',
   hash:location.hash,search:location.search,
   previewState:document.querySelector('#preview-state')?.textContent||null,
   fallbackHidden:document.querySelector('#preview-fallback')?.hidden??null,
   canvasHidden:document.querySelector('#horse-canvas')?.hidden??null,
   atelierPanelHidden:document.querySelector('#btc-atelier-panel')?.hidden??null
  })).catch(x=>({evaluationError:String(x)}));
  const moduleDiagnostics=await page.evaluate(async()=>{
   const modules=[
    'three',
    'three/addons/controls/OrbitControls.js',
    './btc-atelier-preview.js?v=btc-v22-continuous-hind-seam-20261107',
    './btc-maya-master.js?v=btc-v22-continuous-hind-seam-20261107',
    './btc-native-hind-limb-repair.js?v=btc-v22-continuous-hind-seam-20261107',
    './btc-maya-groom.js?v=btc-v22-continuous-hind-seam-20261107',
    './btc-maya-hindquarters.js?v=btc-master-procedural-hind-groom-20261104-v12',
    './btc-maya-face-details.js?v=btc-maya-face-native-gallop-20261105-v16',
    './btc-maya-ears.js?v=btc-master-procedural-hind-groom-20261104-v12',
    './btc-maya-pose-volume.js?v=btc-hind-skin-continuity-20261104-v13b',
    './btc-maya-body-data.js',
    '../race-lab/source/src/horse.js?v=btc-native-lookdev-20261105-v1',
    './btc-terrain-stage.js?v=btc-restore-v5-hair-gallop-20261105-v1',
    './btc-hero-v5.js?v=btc-v5-neck-tail-premium-20261105-v4',
    './btc-hero-v4.js?v=btc-real-hero-v4-20261103'
   ];
   return await Promise.all(modules.map(async url=>{
    try{await import(url);return {url,ok:true};}
    catch(error){return {url,ok:false,name:error?.name||'Error',message:error?.message||String(error),stack:error?.stack||''};}
   }));
  }).catch(error=>[{url:'module-diagnostics',ok:false,message:String(error)}]);
  writeFileSync(DIR+'/startup-failure.json',JSON.stringify({diagnostics,moduleDiagnostics,errors,consoleMessages,requestFailures},null,2));
  console.error('BTC_V22_STARTUP_FAILURE',JSON.stringify({diagnostics,errors,consoleMessages,requestFailures}));
  throw e;
 }
 const baseline=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 const posterior=baseline.heroGroom?.hindRestoration;
 assert.equal(posterior?.nativeMayaHindExperiment,true,'The isolated BTC candidate must use the complete Maya posterior sculpt');
 assert.equal(posterior?.originalGallopPreserved,true,'Keep the authored Gallop cycle');
 assert.equal(posterior?.originalGallopSkeletonPreserved,true,'Keep the original Quaternius Gallop skeleton intact');
 assert.equal(posterior?.originalNativeSkeleton,false,'Do not claim the original Maya skeleton is active');
 assert.equal(posterior?.originalMayaSkeletonRestored,false,'The Maya 2017 skeleton has not yet been restored');
 assert.equal(posterior?.originalMayaSkinClusterRestored,false,'The original 70-influence Maya skinCluster has not yet been restored');
 assert.equal(posterior?.activeSkinMethod,'nearest-neighbour transfer from original Quaternius 50-joint Gallop');
 assert.equal(posterior?.donorHindTriangles,0,'Do not transplant Quaternius hind-limb geometry into the complete Maya sculpt');
 assert.equal(posterior?.donorHoofTriangles,0,'Do not duplicate donor hoof geometry');
 assert.equal(posterior?.removedMayaTriangles,0,'Preserve the complete Maya hind sculpt');
 assert.equal(posterior?.cutTriangles,0,'The native Maya hind candidate must not contain a donor cut');
 assert.equal(posterior?.seamBridgeTriangles,0,'The native Maya hind candidate must not depend on a floating seam bridge');
 assert.ok(posterior?.mayaSculptTriangles>10000,'The complete Maya sculpt must remain indexed');
 console.log('BTC_NATIVE_MAYA_POSTERIOR_AUDIT',JSON.stringify(posterior));
 assert.equal(baseline.heroGroom?.tailDockCapHalves,1,'the transverse tail-stem cut must close as one simple cap loop');
 assert.equal(baseline.heroGroom?.tailDockCutPlaneY,.016,'tail dock must use the measured transverse cut plane');
 assert.equal(baseline.heroGroom?.tailDockBorderEdges,24,'tail dock must have one 24-edge loop without midline branches');
 assert.equal(baseline.heroGroom?.tailRootPatchTriangles,0,'forbid second floating rump patch');
 async function capture(camera,index){
  await page.evaluate(name=>document.querySelector('[data-btc-camera="'+name+'"]')?.click(),camera);
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),index);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,index,{timeout:15000});
  await page.waitForTimeout(160);
  const sample=await page.evaluate(()=>{
   const canvas=document.querySelector('#horse-canvas');
   if(!canvas)return null;
   const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
   if(!gl)return {webgl:false};
   const pixels=new Uint8Array(4*4*4);
   gl.readPixels(Math.max(0,Math.floor(gl.drawingBufferWidth/2)-2),Math.max(0,Math.floor(gl.drawingBufferHeight/2)-2),4,4,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   return {webgl:true,error:gl.getError(),nonzero:pixels.some(v=>v!==0),width:gl.drawingBufferWidth,height:gl.drawingBufferHeight};
  });
  assert.ok(sample?.webgl&&sample.width>0&&sample.height>0,'WebGL context unavailable '+camera+index);
  assert.equal(sample.error,0,'WebGL readback error '+camera+index);
  const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>20000,'Empty WebGL frame '+camera+index);
  const bytes=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
  const sha=await import('node:crypto').then(c=>c.createHash('sha256').update(bytes).digest('hex'));
  const name=camera+'-'+String(index).padStart(2,'0')+'.png';
  writeFileSync(DIR+'/'+name,bytes);
  frames.push({name,camera,index,sha,bytes:bytes.length});
  if(camera==='profile')all.add(sha);
  console.log('BTC_V22_FRAME',camera,index,bytes.length);
 }
 for(let i=0;i<16;i++)await capture('profile',i);
 for(const i of [0,4,8,12])await capture('threeQuarter',i);
 for(const i of [0,4,8,12])await capture('rear',i);
 for(const i of [0,4,8,12])await capture('front',i);
 for(const i of [0,4,8,12])await capture('top',i);
 for(const i of [0,8])await capture('detail',i);
 // Actual WebGL attribution captures: isolate the tail groom and donor limbs
 // without changing geometry or suppressing any acceptance assertion.
 const diagnosticFrames=[];
 async function captureDiagnostic(flags,name){
  const suffix=flags?'&'+flags:'';
  await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1'+suffix+'#BTC',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(build=>{
   const s=window.__cryptodromoBTCAtelierQA?.();
   return s?.heroGroom?.harmonyBuild===build&&s.drawCalls>0&&s.clips?.includes('Gallop');
  },BUILD,{timeout:120000});
  await page.evaluate(()=>document.querySelector('[data-btc-camera="rear"]')?.click());
  await page.evaluate(()=>window.__cryptodromoBTCAtelierSetPose?.(0));
  await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===0,
   {timeout:15000});
  await page.waitForTimeout(180);
  const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>20000,
   'Empty BTC diagnostic WebGL frame '+name);
  const bytes=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
  const sha=await import('node:crypto').then(c=>c.createHash('sha256').update(bytes).digest('hex'));
  writeFileSync(DIR+'/'+name+'.png',bytes);
  diagnosticFrames.push({name:name+'.png',sha,bytes:bytes.length,flags});
  console.log('BTC_V22_DIAGNOSTIC_FRAME',name,bytes.length,sha);
 }
 await captureDiagnostic('btcDonorHindExperiment=1','rear-00-donor-baseline');
 await captureDiagnostic('btcDonorHindExperiment=1&btcHideDonorQA=1','rear-00-donor-hidden');
 await captureDiagnostic('btcHideTailQA=1','rear-00-native-no-tail');
 assert.equal(all.size,16,'Original native Gallop must produce 16 distinct actual WebGL poses');
 assert.deepEqual(errors,[],errors.join('\n'));
 writeFileSync(DIR+'/qa.json',JSON.stringify({
  build:BUILD,source:'complete original Maya 2017 body sculpt including hind limbs; Quaternius 50-joint Gallop weight transfer remains temporary',
  liveHostingerVerified:false,AAAApproved:false,photographs:frames,
  rigStatus:{originalMayaSkeletonRestored:false,originalMayaSkinClusterRestored:false,
   activeSkinMethod:posterior?.activeSkinMethod,originalMayaInfluenceCount:70},
  hind:baseline.heroGroom.hindRestoration,
  diagnosticFrames,
  tailDock:{
   borderEdges:baseline.heroGroom.tailDockBorderEdges,
   capTriangles:baseline.heroGroom.integratedDockCapTriangles,
   midlineBridgeTriangles:baseline.heroGroom.tailDockMidlineBridgeTriangles,
   interiorRingVertices:baseline.heroGroom.tailDockCapInteriorRingVertices,
   coreTriangles:baseline.heroGroom.tailDockCapCoreTriangles,
   projectedSelfIntersections:baseline.heroGroom.tailDockCapProjectedSelfIntersections,
   degenerateTriangles:baseline.heroGroom.tailDockCapDegenerateTriangles,
   boundaryWindingErrors:baseline.heroGroom.tailDockBoundaryWindingErrors,
   openCapEdges:baseline.heroGroom.tailDockOpenCapEdges,
   normalAlignmentBefore:baseline.heroGroom.tailDockCapNormalAlignmentBefore,
   orientationFlipped:baseline.heroGroom.tailDockCapOrientationFlipped
  },
  visualGate:'Compare the full Maya hind candidate against V21 and the rejected donor candidate. Require continuous rump-to-hock silhouettes in all 16 phases and six cameras. Original Maya 70-weight skin and skeleton are still not restored; this is not a release or AAA approval.'
 },null,2));
 console.log('BTC_V22_16_POSES_REAL_WEBGL_COMPLETE',frames.length);
 assert.equal(baseline.heroGroom?.tailDockCapInteriorRingVertices,baseline.heroGroom?.tailDockBorderEdges,
   'Tail dock cap must use one skinned inset vertex per retained boundary vertex');
 assert.equal(baseline.heroGroom?.tailDockCapCoreTriangles,baseline.heroGroom?.tailDockBorderEdges-2,
   'Tail dock cap core must triangulate the entire inset boundary');
 assert.equal(baseline.heroGroom?.tailDockCapProjectedSelfIntersections,0,
   'Tail dock cap boundary must not self-intersect');
 assert.equal(baseline.heroGroom?.tailDockCapDegenerateTriangles,0,
   'Tail dock cap must not contain degenerate triangles');
 assert.equal(baseline.heroGroom?.tailDockOpenCapEdges,0,
   'Tail dock cap must be closed and manifold');
}finally{await page.close();await browser.close();}
