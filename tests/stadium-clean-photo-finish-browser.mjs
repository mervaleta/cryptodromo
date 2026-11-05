import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {captureOptional} from './helpers/optionalScreenshot.mjs';
const origin=process.env.CRP_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
await mkdir('artifacts/stadium-clean-photo-finish',{recursive:true});
const problems=[];
async function waitReady(page){
 await page.waitForFunction(()=>{
  const f=document.querySelector('#stadium-broadcast');
  return !!f&&!f.hidden&&f.style.visibility==='visible'&&
   document.querySelector('#tv-loading')?.hidden===true&&
   !document.querySelector('#tv-player')?.classList.contains('is-switching')&&
   f.contentDocument?.querySelector('#start')?.disabled===false&&
   f.contentDocument?.querySelector('#raceCanvas')?.width>300;
 },null,{timeout:130000});
}
const value=(page,id)=>page.evaluate(id=>{
 const el=document.querySelector('#stadium-broadcast')?.contentDocument?.getElementById(id);
 return el?.type==='checkbox'?el.checked:el?.value;
},id);
try{
 const page=await browser.newPage({viewport:{width:1512,height:925},deviceScaleFactor:1});
 page.on('pageerror',err=>problems.push('TV '+err.message));
 const r=await page.goto(new URL('/stadiums/crypto/live/?track=muybridge&tv-qa=1',origin).toString(),
  {waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(r?.status(),200);
 await waitReady(page);
 await page.locator('[data-tv-weather="rain"]').click();
 assert.equal(await page.locator('#tv-control-detail').isVisible(),true);
 assert.equal(await page.locator('#director-rain-intensity').count(),1);
 await page.locator('#director-rain-intensity').fill('35');
 await page.waitForFunction(()=>{
  const d=document.querySelector('#stadium-broadcast')?.contentDocument;
  return d?.getElementById('rain-intensity')?.value==='35';
 });
 await page.locator('[data-tv-light="power"]').click();
 await page.locator('#director-light-dimmer').fill('40');
 assert.equal(await value(page,'light-dimmer'),'40');
 await page.locator('[data-tv-shot="aerial"]').click();
 await page.locator('#director-camera-zoom').fill('35');
 assert.equal(await value(page,'camera-zoom'),'35');
 await page.locator('[data-tv-stage="grandstand"]').click();
 await page.locator('#director-tv-scenery-trees').uncheck();
 await page.waitForFunction(()=>window.__satoshiTvQA.snapshot().parameters.parameters['tv-scenery-trees']===false);
 await page.locator('[data-tv-replay-panel]').click();
 await page.locator('#director-tv-replay-speed').selectOption('0.25');
 await page.locator('#director-tv-replay-hold').fill('3');
 await captureOptional(page,'artifacts/stadium-clean-photo-finish/parameter-submenus.png');
 await page.locator('[data-tv-switch="genesis"]').click();
 await waitReady(page);
 await page.waitForFunction(()=>!window.__satoshiTvQA.snapshot().transition,null,{timeout:15000});
 await page.waitForFunction(()=>{
  const doc=document.querySelector('#stadium-broadcast')?.contentDocument;
  return doc?.getElementById('light-dimmer')?.value==='40'&&
   doc?.getElementById('rain-intensity')?.value==='35'&&
   doc?.getElementById('camera-zoom')?.value==='35';
 },null,{timeout:18000});
 assert.equal(page.frames().length,2,'Single 3D iframe retained');
 console.log('PASS director: real parameter submenus with persistent environment and camera settings');
 const race=await browser.newPage({viewport:{width:1350,height:825}});
 race.on('pageerror',err=>problems.push('Race '+err.message));
 await race.goto(new URL('/stadiums/crypto/broadcast/index.html?track=muybridge&finish-qa=alpha06&winner-replay-qa=1&embed=tv',origin).toString(),
 {waitUntil:'domcontentloaded',timeout:45000});
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.runnerCount===12&&
   document.querySelector('#start')?.disabled===false,null,{timeout:120000});
 assert.equal(await race.evaluate(()=>window.__winnerReplayQA.seekLastCross()),true);
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.replay.phase==='playing',
 null,{timeout:13000});
 assert.equal(await race.locator('#result-overlay').isVisible(),false);
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.replay.phase==='holding',
 null,{timeout:22000});
 const holding=await race.evaluate(()=>window.__winnerReplayQA.snapshot());
 assert.equal(holding.officialVisible,false,'Official result must not cover the held photo-finish frame');
 assert.equal(await race.locator('#winner-replay').isVisible(),true);
 await captureOptional(race,'artifacts/stadium-clean-photo-finish/photo-finish-hold.png');
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.replay.complete&&
   window.__winnerReplayQA.snapshot().officialVisible,
 null,{timeout:15000});
 assert.equal(await race.locator('#result-list .result-row').count(),12);
 console.log('PASS finish: side-on winner replay and held frame before official scoreboard');
 assert.deepEqual(problems,[],problems.join('; '));
}finally{await browser.close();}
