import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader',
 '--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1365,height:820},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Old backend and graphics options must be ignored on the canonical home.
 await page.goto('http://127.0.0.1:8799/?horse-engine=legacy&graphics-quality=eco&procedural-qa=alpha20&finish-qa=alpha06&home-qa=cinema',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.__cryptodromoCinematicReady,
  {timeout:150000});
 const state=await page.evaluate(()=>({
  ...window.__cryptodromoCinematicReady,
  selectedEngine:document.querySelector('#horse-engine')?.value,
  selectedQuality:document.querySelector('#graphics-quality')?.value,
  engineHidden:document.querySelector('#horse-engine')?.hidden,
  qualityHidden:document.querySelector('#graphics-quality')?.hidden,
  navLabCount:document.querySelectorAll('nav a[href="/visual-lab/"],nav a[href="/laboratorio/"]').length,
  stageWidth:document.querySelector('#stage')?.clientWidth,
  rankingCount:document.querySelectorAll('#standings li').length,
  currentState:document.querySelector('#status')?.textContent
 }));
 assert.equal(state.count,12,'Fidelity failed: '+state.error);
 assert.equal(state.engine,'fidelity');assert.equal(state.quality,'cinematic');
 assert.equal(state.selectedEngine,'fidelity');
 assert.equal(state.selectedQuality,'cinematic');
 assert.equal(state.usesPlaceholders,false);
 assert.equal(state.engineHidden,true);assert.equal(state.qualityHidden,true);
 assert.equal(state.navLabCount,0);
 assert.equal(state.rankingCount,12);
 assert.ok(state.stageWidth>500);
 assert.deepEqual(errors,[],errors.join('; '));
 // Explicit QA-only shot at 14s to ensure leg anatomy is genuinely visible,
 // regardless of a slow software GPU or live wall-clock scheduling.
 const frame=await page.evaluate(()=>window.__cryptodromoHomeQA.captureAt(14,'low'));
 assert.equal(frame.horseCount,12);
 assert.equal(frame.engine,'fidelity');assert.equal(frame.quality,'cinematic');
 assert.equal(frame.resultOverlayHidden,true);
 assert.ok(frame.drawCalls>0);
 assert.ok(frame.minProgress>0 && frame.maxProgress<1);
 mkdirSync('artifacts',{recursive:true});
 await page.locator('#stage').screenshot({path:'artifacts/home-fidelity-racing-stage.png',
  timeout:90000,animations:'disabled'});
 await page.screenshot({path:'artifacts/home-fidelity-cinematic.png',
  timeout:90000,animations:'disabled'});
 const second=await browser.newPage();
 await second.goto('http://127.0.0.1:8799/visual-lab/?source=old-lab',
  {waitUntil:'domcontentloaded',timeout:45000});
 await second.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('source')==='old-lab',
  {timeout:45000});
 assert.equal(new URL(second.url()).pathname,'/');
 writeFileSync('artifacts/home-cinematic-qa.json',JSON.stringify(state,null,2)+'\n');
 console.log('HOME_CINEMATIC_CANONICAL_OK',JSON.stringify(state));
}finally{await browser.close();}
