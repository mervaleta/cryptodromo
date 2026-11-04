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
 assert.equal(start.variant,'maya');
 assert.equal(start.heroGroom.vertices,5409,'original anatomical surface with tail and both ear-root caps');
 assert.ok(start.heroGroom.triangles>9500&&start.heroGroom.triangles<10500,
  'Maya horse must retain full body topology but remove duplicate appendages');
 assert.ok(start.heroGroom.nativeEarFacesRemoved>=150,'legacy horns must be culled');
 assert.ok(start.heroGroom.earCutBorderEdges>=40,'count genuine poll cut boundaries');
 assert.equal(start.heroGroom.integratedEarRootCapTriangles,start.heroGroom.earCutBorderEdges,'all ear-root cut edges must share new cap triangles');
 assert.equal(start.heroGroom.earRootCapCenters,2,'close both ear-root openings in the actual skin mesh');
 assert.ok(start.heroGroom.extraTailFacesRemoved>=150,'second flesh-colored tail must be culled');
 assert.ok(start.heroGroom.extraTailFacesRemoved>250,'retire the old skin-tail free end while preserving croup skin');
 assert.ok(start.heroGroom.poweredHindVertices>650,'croup and hind thighs must be resculpted, not repainted');
 assert.ok(start.heroGroom.tailDockBorderEdges>=20,'identify tail-root cut boundary');
 assert.equal(start.heroGroom.integratedDockCapTriangles,start.heroGroom.tailDockBorderEdges,'close every exposed dock edge with skinned Maya triangles');
 assert.ok(start.heroGroom.fineLocks>=1000,'finer strand density must actually reach the WebGL horse');
 assert.equal(start.heroGroom.looseNeckFibers,0,'no dangling throat-level mane strands');
  assert.equal(start.heroGroom.proceduralHairTexture,true);
  assert.equal(start.heroGroom.hindTextureGenerated,true);
  assert.equal(start.heroGroom.hindGaitCorrective,true);
  assert.ok(start.heroGroom.hindMaxExpansion>.10);
  assert.equal(start.heroGroom.neckOutliers,0,'Mane must remain within dorsal neck envelope');
 assert.equal(start.heroGroom.crownBridgeLocks,112,'forelock and dorsal mane must be joined across the poll');
 assert.equal(start.heroGroom.heroLocks,56,'sculpted swept hero locks must actually render');
 assert.equal(start.heroGroom.solidRingSides,6,'hair should use true volumetric loft rings, not crossed cards');
 assert.equal(start.heroGroom.rootBedVertices,495,'smooth skinned crest must cover the gap between ears and mane');
 assert.ok(start.heroGroom.eyeRadius<.0004,'3D eye globe must remain anatomically sized');
  assert.equal(start.heroGroom.eyeCenterX,.002235,'cornea must be visible beyond the Maya socket');
  assert.ok(start.heroGroom.pollAnchoredVertices>10,'poll must inherit smooth Head weighting');
 assert.equal(start.heroGroom.originalRig,true);
 assert.ok(start.heroGroom.beveledHoofVertices>=300,'real four-hoof Maya geometry sculpt required');
 assert.equal(start.heroGroom.heroHooves,4,'four visible, articulated hoof shells required');
 assert.ok(start.heroGroom.hoofMeshVertices>=600,'actual hoof wall geometry required');
 assert.ok(start.heroGroom.elevatedEarVertices>=20,'natural ear silhouette geometry required');
 assert.equal(start.heroGroom.sculptedEars,2,'two fully modeled upright ears required');
 assert.equal(start.heroGroom.eyeGlobes,2,'both eye sockets require actual 3D spheres');
 assert.equal(start.heroGroom.irisEditable,true,'published eyeColor drives iris shader');
 assert.equal(start.heroGroom.blackEquinePupils,true,'pupils must stay black and horizontally elongated');
 assert.ok(start.heroGroom.earTriangles>=800,'ears must be real skinned 3D leaves, not image sprites');
 assert.ok(start.heroGroom.facialSurfaces>=2,'rigged eyelids, nostril contours and tear ducts required');
 assert.ok(start.heroGroom.facialTriangles>=280,'symmetrical skinned upper/lower eyelids must exist');
 assert.ok(start.heroGroom.fineLocks>=650,'full layered mane and tail required');
 assert.equal(start.heroGroom.modelPreserved,true);
 assert.equal(start.heroGroom.gallopPreserved,true);
 const before=start.hoofPhase;
 await page.waitForTimeout(600);
 const after=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(Math.abs(after.hoofPhase-before)>.001,'Original Gallop must animate sculpted model');
 for(const angle of ['profile','front','rear','detail','threeQuarter','top','face','poll']){
  await page.evaluate(angle=>document.querySelector('[data-btc-camera="'+angle+'"]').click(),angle);
  await page.waitForTimeout(350);
  await page.locator('#horse-view').screenshot({path:dir+'/'+angle+'.png',timeout:70000});
  console.log('BTC_MAYA_GEOMETRY_RENDER_OK',angle);
 }
 await page.waitForFunction(()=>Math.abs(window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.tailInertia||0)>.005,
   null,{timeout:30000});
  // Native Gallop phases expose eyelid fragmentation and crest sinking.
  await page.evaluate(()=>document.querySelector('[data-btc-camera="poll"]').click());
  for(let i=0;i<4;i++){
   await page.waitForTimeout(175);
   await page.locator('#horse-canvas').screenshot({path:dir+'/poll-gallop-'+i+'.png',timeout:70000});
  }
  await page.evaluate(()=>document.querySelector('[data-btc-camera="face"]').click());
  for(let i=0;i<3;i++){
   await page.waitForTimeout(190);
   await page.locator('#horse-canvas').screenshot({path:dir+'/eyes-gallop-'+i+'.png',timeout:70000});
  }
  await page.evaluate(()=>document.querySelector('[data-btc-variant="baseline"]').click());
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.version==='btc-real-hero-v4-20261103',null,{timeout:120000});
 await page.evaluate(()=>document.querySelector('[data-btc-variant="maya"]').click());
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.heroGroom?.version==='btc-maya-2017-sculpt-gallop-20261104',null,{timeout:120000});
 await page.locator('button.runner[data-symbol="ETH"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:120000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(eth.heroGroom,null,'No BTC anatomical mesh leaks to other tokens');
 assert.equal(eth.variant,'original');
 // Fresh page avoids SW-renderer stalling during an in-page second GLB load.
 const rollback=await browser.newPage({viewport:{width:900,height:650}});
 await rollback.goto('http://127.0.0.1:8799/racers/?atelier=off#BTC',{waitUntil:'commit',timeout:90000});
 assert.equal(await rollback.locator('#btc-atelier-panel').isVisible(),false);
 assert.equal(await rollback.evaluate(()=>Boolean(window.__cryptodromoBTCAtelierQA)),false);
 await rollback.close();
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_MAYA_ANATOMY_EDITOR_ROSTER_AND_ROLLBACK_OK');
}finally{await browser.close();}
