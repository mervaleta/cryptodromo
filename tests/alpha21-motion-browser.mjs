import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8799/visual-lab/polish-preview/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__cryptodromoAlpha21QA?.snapshot().ready||
  !!document.getElementById('error')?.textContent,{timeout:110000});
 let state=await page.evaluate(()=>window.__cryptodromoAlpha21QA.snapshot());
 assert.equal(state.ready,true,'Twelve animation rigs should load in WebGL');
 assert.equal(state.horseCount,12);
 assert.equal(state.stadiumTheme,'SATOSHI NAKAMOTO');
 assert.ok(state.followThroughBones>=36,'Neck/head/back/tail add-on should attach to the GLB rig');
 mkdirSync('artifacts',{recursive:true});
 await page.locator('#stage').screenshot({path:'artifacts/alpha21-ready-gates.png',animations:'disabled',timeout:30000});
 await page.locator('#start').click();
 await page.waitForFunction(()=>window.__cryptodromoAlpha21QA.snapshot().elapsed>.45,{timeout:10000});
 state=await page.evaluate(()=>window.__cryptodromoAlpha21QA.snapshot());
 assert.ok(state.gateOpen>.5,'Gates must open when preview clock advances');
 assert.ok(state.averageCadence>.90&&state.averageCadence<1.74,'Gallop rate should be bounded');
 await page.locator('#camera').selectOption('low');
 await page.locator('#weather').selectOption('rain');
 await page.locator('#surface').selectOption('grass');
 await page.locator('#quality').selectOption('eco');
 await page.waitForTimeout(600);
 state=await page.evaluate(()=>window.__cryptodromoAlpha21QA.snapshot());
 assert.equal(state.camera,'low');assert.equal(state.weather,'rain');
 assert.equal(state.surface,'grass');assert.equal(state.footDustInstances,64);
 await page.locator('#stage').screenshot({path:'artifacts/alpha21-rain-low-camera.png',animations:'disabled',timeout:30000});
 await page.locator('#reset').click();
 state=await page.evaluate(()=>window.__cryptodromoAlpha21QA.snapshot());
 assert.equal(state.elapsed,0);assert.equal(state.gateOpen,0);
 await page.evaluate(()=>window.__cryptodromoAlpha21QA.seek(12));
 await page.waitForTimeout(200);
 state=await page.evaluate(()=>window.__cryptodromoAlpha21QA.snapshot());
 assert.ok(state.elapsed>12);assert.equal(state.gateOpen,1);
 assert.deepEqual(errors,[],'No page exceptions: '+errors.join('; '));
 console.log('ALPHA21_MOTION_STUDIO_BROWSER_OK',JSON.stringify(state));
}finally{await browser.close();}
