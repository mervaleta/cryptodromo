import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader',
 '--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Reproduce the exact class of failure behind the four-stick horses.
 await page.route('**/horse.glb.gz',route=>route.fulfill({
  status:404,contentType:'text/plain',body:'GLB unavailable during deployment'
 }));
 await page.goto('http://127.0.0.1:8799/?horse-engine=legacy&finish-qa=alpha06',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.__cryptodromoHorseLoadStatus ||
  document.getElementById('status')?.textContent==='ERROR DE CARGA 3D',
  {timeout:115000});
 const snap=await page.evaluate(()=>({
  ...window.__cryptodromoHorseLoadStatus,
  status:document.querySelector('#status')?.textContent,
  warning:document.querySelector('#horse-engine-recovery-warning')?.textContent,
  fallback:document.querySelector('#stage')?.dataset.horseVisualFallback
 }));
 assert.equal(snap.renderedCount,12);
 assert.equal(snap.recoveredLanes.length,12);
 assert.equal(snap.unapprovedBoxHorses,0);
 assert.equal(snap.fallback,'procedural');
 assert.match(snap.warning,/modelo solicitado no cargó/);
 assert.match(snap.status,/MODO DE RESPALDO/);
 assert.deepEqual(errors,[]);
 mkdirSync('artifacts',{recursive:true});
 // This is a screenshot of the 3D backup, NOT proof of AAA final quality.
 await page.locator('#stage').screenshot({
  path:'artifacts/alpha23-real-procedural-fallback.png',timeout:60000
 });
 writeFileSync('artifacts/alpha23-recovery-qa.json',JSON.stringify(snap,null,2));
 console.log('ALPHA23_NO_BLOCK_HORSES_OK',JSON.stringify(snap));
}finally{await browser.close();}
