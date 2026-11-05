/**
 * Tests the actual Hostinger production URL, not just the GitHub branch.
 * Captures a still only for internal diagnostics, never records a video.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const errors=[];
try {
 const page=await browser.newPage({
  viewport:{width:1360,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://race.cryptodromo.com/racers/#BTC',{
  waitUntil:'domcontentloaded',timeout:90000
 });
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s?.variant==='maya'&&
    s?.heroGroom?.version==='btc-maya-2017-sculpt-gallop-20261104'&&
    s?.heroGroom?.heroHooves===4&&s?.heroGroom?.integratedEyeRims===2&&
    s?.clips?.includes('Gallop')&&s?.drawCalls>0;
 },null,{timeout:120000});
 const s=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.());
 // Verificación específica del nuevo terreno en la URL pública.
 // Que cargue el GLB no es suficiente: debe impactar el suelo y dejar huella.
 assert.ok(s.terrain?.visible,'BTC terrain FX must be active in the public card');
 assert.equal(s.terrain.surface,'dirt');
 assert.ok(['skeleton','master'].includes(s.terrain.contactSource),
  'Hoof contacts must use animated rig, not phase proxy');
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.terrain?.impacts>=2,
  undefined,{timeout:60000,polling:400});
 const dirt=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA().terrain);
 assert.ok(dirt.imprints>=2,'At least 2 planted hoof imprints expected');
 await page.selectOption('#btc-terrain-surface','sand');
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.terrain?.impacts>=1,
  undefined,{timeout:60000,polling:400});
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA().terrain)).surface,'sand');
 await page.selectOption('#btc-terrain-surface','grass');
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.terrain?.impacts>=1,
  undefined,{timeout:60000,polling:400});
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA().terrain)).surface,'grass');
 await page.selectOption('#btc-terrain-surface','dirt');
  // Production must serve the **new mesh**, not only the old v12 page.
 assert.equal(s.heroGroom.harmonyBuild,'btc-master-procedural-hind-groom-20261104-v12-fx2');
 assert.equal(s.heroGroom.eyeCenterX,.00185,'real cornea depth in canonical BTC fiche');
 assert.equal(s.heroGroom.facialSurfaces,0,'real eyelids must not be detached pieces');
 assert.ok(s.heroGroom.pollAnchoredVertices>10,'stable native skinning at skull-crest');
 assert.ok(s.heroGroom.fineLocks>=1000,'real fine hair density');
 await page.waitForFunction(()=>Math.abs(window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.tailInertia||0)>.005,
   null,{timeout:30000});
  assert.equal(s.heroGroom.gallopPreserved,true);
 assert.equal(s.heroGroom.originalRig,true);
 assert.equal(s.heroGroom.sculptedEyes,2);
 assert.equal(s.heroGroom.eyeGlobes,2,'two actual spherical eyes must be present');
 assert.equal(s.heroGroom.crownBridgeLocks,112,'hero mane must be connected across the poll');
 assert.equal(s.heroGroom.heroLocks,56,'the normal public BTC must use raised locks');
 assert.equal(s.heroGroom.solidRingSides,6,'live horse needs rounded 3D locks instead of hair ribbons');
 assert.equal(s.heroGroom.rootBedVertices,0,'no detached scalp strip; native Maya crest itself is sealed');
 assert.equal(s.heroGroom.looseNeckFibers,0,'no dangling throat-level mane strands');
  assert.equal(s.heroGroom.proceduralHairTexture,true);
  assert.equal(s.heroGroom.hindTextureGenerated,true);
  assert.equal(s.heroGroom.hindGaitCorrective,true);
  assert.ok(s.heroGroom.hindMaxExpansion>.10);
  assert.equal(s.heroGroom.neckOutliers,0,'no hair vertices outside dorsal neck envelope');
 assert.ok(s.heroGroom.eyeRadius<.0004,'eyes should not protrude out of socket');
 assert.equal(s.heroGroom.irisEditable,true,'the public iris must accept eyeColor');
 assert.equal(s.heroGroom.blackEquinePupils,true);
 assert.equal(s.heroGroom.sculptedEars,2,'stylized pinnae should appear on the public horse');
 assert.equal(s.heroGroom.integratedMayaHooves,true);
 assert.ok(s.heroGroom.nativeEarFacesRemoved>=150,'no extra horn geometry on public BTC');
 assert.equal(s.heroGroom.integratedEarRootCapTriangles,s.heroGroom.earCutBorderEdges,'no cut edge exposed behind the ears');
 assert.ok(s.heroGroom.extraTailFacesRemoved>=150,'no second native flesh tail on public BTC');
 assert.ok(s.heroGroom.extraTailFacesRemoved>250,'the old tail free end must be absent without opening the rump');
 assert.ok(s.heroGroom.poweredHindVertices>650,'hindquarters must be physically fuller in production');
 assert.ok(s.heroGroom.integratedDockCapTriangles>=20,'rump opening must be welded inside original Maya mesh');
 assert.ok(s.heroGroom.fineLocks>=650,'fewer true 3D hair locks replace hundreds of flat fibers');
 const before=s.hoofPhase;
 await page.waitForTimeout(1100);
 const after=(await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.())).hoofPhase;
 assert.ok(Math.abs(after-before)>.001,'The production horse must be actually galloping');
 mkdirSync('artifacts/btc-live', {recursive:true});
 await page.locator('#horse-view').screenshot({
  path:'artifacts/btc-live/public-btc-anatomical.png',timeout:90000
 });
 // Visual QA of the live Hostinger model, not a generated illustration.
 for(const angle of ['face','poll']){
  await page.locator('[data-btc-camera="'+angle+'"]').click();
  await page.waitForTimeout(260);
  await page.locator('#horse-canvas').screenshot({
   path:'artifacts/btc-live/btc-v12-fx2-'+angle+'.png',timeout:90000
  });
 }
 await page.locator('[data-btc-camera="profile"]').click();
 await page.locator('button.runner[data-symbol="ETH"]').click({timeout:20000});
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:90000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.());
 assert.equal(eth.heroGroom,null,'Other 99 token models must remain untouched');
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('PRODUCTION_BTC_SCULPT_AND_GALLOP_CONFIRMED',JSON.stringify({
  url:page.url(),version:s.heroGroom.version,hoofShells:s.heroGroom.heroHooves,
  groomLocks:s.heroGroom.fineLocks,faces:s.heroGroom.facialSurfaces
 }));
 await page.close();
} finally {await browser.close();}
