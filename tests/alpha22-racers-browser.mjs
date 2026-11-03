import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1350,height:940},deviceScaleFactor:1,
  reducedMotion:'no-preference'});
 const errors=[],modelDownloads=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{
  if(/\.(?:glb|gltf|fbx|obj)(?:[?#]|$)/i.test(r.url()))modelDownloads.push(r.url());
 });
 await page.goto('http://127.0.0.1:8799/racers/#BTC',
  {waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.__cryptodromoRacersQA?.()?.symbol==='BTC',
  null,{timeout:110000});
 let state=await page.evaluate(()=>window.__cryptodromoRacersQA());
 assert.equal(state.procedural,true);
 assert.equal(state.textureFree,true);
 assert.equal(state.quality,'high');
 assert.equal(state.jockey,false);
 assert.ok(state.drawCalls>0);
 assert.deepEqual(modelDownloads,[]);
 assert.equal((await page.locator('#horse-symbol').innerText()).trim(),'BTC');
 const p1=state.hoofPhase;
 await page.waitForTimeout(800);
 state=await page.evaluate(()=>window.__cryptodromoRacersQA());
 assert.notEqual(state.hoofPhase,p1,'Gait should advance while galloping');
 await page.locator('button.runner[data-symbol="ETH"]').click();
 await page.waitForFunction(()=>window.__cryptodromoRacersQA?.()?.symbol==='ETH',
  null,{timeout:60000});
 state=await page.evaluate(()=>window.__cryptodromoRacersQA());
 assert.equal(state.procedural,true);
 assert.equal(state.textureFree,true);
 assert.equal((await page.locator('#horse-symbol').innerText()).trim(),'ETH');
 await page.locator('#motion').click();
 assert.equal((await page.evaluate(()=>window.__cryptodromoRacersQA())).paused,true);
 mkdirSync('artifacts',{recursive:true});
 try{
  await page.locator('#horse-view').screenshot({
   path:'artifacts/alpha22-racer-eth-portrait.png',timeout:60000,
   animations:'disabled'});
 }catch(error){console.warn('Screenshot unavailable on software GPU:',error.message);}
 assert.deepEqual(errors,[],errors.join('; '));
 writeFileSync('artifacts/alpha22-racers-browser.json',JSON.stringify({
  tested:'Alpha22 Fidelity racer portrait',state,errors,modelDownloads
 },null,2)+'\n');
 console.log('ALPHA22_RACERS_PORTRAIT_OK',JSON.stringify(state));
}finally{await browser.close();}
