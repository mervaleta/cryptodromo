import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1480,height:950},deviceScaleFactor:1});
 const errors=[],shaderErrors=[],horseAssets=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')shaderErrors.push(m.text());});
 page.on('request',r=>{if(/\.(?:glb|gltf|png|jpe?g|webp|svg)(?:\?|$)/i.test(r.url()))horseAssets.push(r.url());});
 await page.goto('http://127.0.0.1:8799/visual-lab/horse-fidelity-preview/',{
  waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__cryptodromoAlpha22QA?.snapshot().count===12||
  !!document.getElementById('error')?.textContent,{timeout:60000});
 let s=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot());
 assert.equal(s.ready,true);assert.equal(s.procedural,12);
 assert.equal(s.textures,0);assert.equal(s.allTextureFree,true);
 assert.equal(horseAssets.length,0,'No textures or animal models fetched');
 assert.ok(s.heroStats.vertices>500,'Procedural vertices should have volume');
 assert.ok(s.heroStats.hairStrands>25,'Geometric hair must exist');
 mkdirSync('artifacts',{recursive:true});
 await page.locator('#stage').screenshot({path:'artifacts/alpha22-procedural-portrait.png',animations:'disabled'});
 await page.locator('[data-view=grid]').click();
 await page.waitForTimeout(180);
 s=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot());
 assert.equal(s.mode,'grid');
 await page.locator('#stage').screenshot({path:'artifacts/alpha22-all12-lineup.png',animations:'disabled'});
 await page.locator('[data-view=portrait]').click();
 await page.locator('#archetype').selectOption('sprinter');
 await page.locator('#coat').selectOption('palomino');
 await page.locator('#mane').selectOption('flowing');
 await page.locator('#marking').selectOption('blaze');
 await page.locator('#quality').selectOption('high');
 await page.locator('#weather').selectOption('rain');
 await page.locator('#wet').evaluate(el=>{el.value='83';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForTimeout(250);
 s=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot());
 assert.equal(s.selectedProfile.archetype,'sprinter');
 assert.equal(s.selectedProfile.coat,'palomino');
 assert.equal(s.selectedProfile.marking,'blaze');
 assert.equal(s.selectedProfile.quality,'high');
 assert.equal(s.allTextureFree,true);
 assert.ok(s.heroStats.vertices>1000);
 await page.locator('#stage').screenshot({path:'artifacts/alpha22-hi-fidelity-wet-palomino.png',animations:'disabled'});
 await page.locator('[data-view=gallop]').click();
 await page.waitForFunction(()=>window.__cryptodromoAlpha22QA.snapshot().mode==='gallop');
 const before=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot().hoofPhases[0]);
 await page.waitForTimeout(430);
 const after=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot().hoofPhases[0]);
 assert.notEqual(after,before,'Procedural 4-beat motion must advance');
 await page.locator('#stage').screenshot({path:'artifacts/alpha22-gallop-in-motion.png',animations:'disabled'});
 s=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot());
 assert.equal(s.procedural,12);assert.equal(s.textures,0);
 assert.ok(s.drawCalls>0&&s.triangles>500);
 await page.locator('#reset').click();
 s=await page.evaluate(()=>window.__cryptodromoAlpha22QA.snapshot());
 assert.equal(s.mode,'portrait');assert.equal(s.selectedProfile.coat,'bay');
 assert.deepEqual(errors,[],'No JS exceptions: '+errors.join('; '));
 const severe=shaderErrors.filter(e=>/shader|webgl|compile|ERROR:/i.test(e));
 assert.deepEqual(severe,[],'No GLSL errors: '+severe.join('; '));
 writeFileSync('artifacts/alpha22-browser-qa.json',JSON.stringify({
  createdAt:new Date().toISOString(),tested:'Chromium SwiftShader',snapshot:s,
  pageErrors:errors,shaderErrors:severe,networkImageAndModelRequests:horseAssets
 },null,2)+'\n');
 console.log('ALPHA22_PROCEDURAL_HORSES_OK',JSON.stringify({
  count:s.count,textureMaps:s.textures,geometry:s.heroStats,
  drawCalls:s.drawCalls,triangles:s.triangles,shaderErrors:severe.length
 }));
}finally{await browser.close();}
