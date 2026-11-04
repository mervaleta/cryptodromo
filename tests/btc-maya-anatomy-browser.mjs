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
 assert.equal(start.heroGroom.vertices,5406);
 assert.ok(start.heroGroom.triangles>9500&&start.heroGroom.triangles<10500,
  'Maya horse must retain full body topology but remove duplicate appendages');
 assert.ok(start.heroGroom.nativeEarFacesRemoved>=150,'legacy horns must be culled');
 assert.ok(start.heroGroom.extraTailFacesRemoved>=150,'second flesh-colored tail must be culled');
 assert.ok(start.heroGroom.extraTailFacesRemoved>350,'remove the entire flesh-tail root, not only its tip');
 assert.ok(start.heroGroom.poweredHindVertices>1000,'croup and hind thighs must be resculpted, not repainted');
 assert.ok(start.heroGroom.fineLocks>=500);
 assert.equal(start.heroGroom.originalRig,true);
 assert.ok(start.heroGroom.beveledHoofVertices>=300,'real four-hoof Maya geometry sculpt required');
 assert.equal(start.heroGroom.heroHooves,4,'four visible, articulated hoof shells required');
 assert.ok(start.heroGroom.hoofMeshVertices>=600,'actual hoof wall geometry required');
 assert.ok(start.heroGroom.elevatedEarVertices>=20,'natural ear silhouette geometry required');
 assert.equal(start.heroGroom.sculptedEars,2,'two fully modeled upright ears required');
 assert.ok(start.heroGroom.earTriangles>=800,'ears must be real skinned 3D leaves, not image sprites');
 assert.ok(start.heroGroom.facialSurfaces>=2,'rigged eyelids, nostril contours and tear ducts required');
 assert.ok(start.heroGroom.facialTriangles>140,'facial detail is actual 3D geometry');
 assert.ok(start.heroGroom.fineLocks>=900,'full layered mane and tail required');
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
