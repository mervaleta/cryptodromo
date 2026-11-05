import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

// This probes the real LIVE DOM and Three.js renderer during horse presentation,
// not a static image mock. The synthetic fixture and official ranking are untouched.
const origin=process.env.CRP_BASE_URL||'http://127.0.0.1:4173';
await mkdir('artifacts/stadium-aaa-audience/presentation',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1512,height:925}});
 const problems=[];page.on('pageerror',e=>problems.push(e.message));
 const response=await page.goto(origin+'/visual-lab/?track=genesis&camera-qa=alpha17',{
  waitUntil:'domcontentloaded',timeout:45000
 });
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false&&
   typeof window.__cryptodromoCameraQA?.previewPresentation==='function',null,{timeout:120000});
 await page.evaluate(()=>{
  const quality=document.getElementById('graphics-quality');
  quality.value='balanced';quality.dispatchEvent(new Event('change',{bubbles:true}));
  const weather=document.getElementById('weather');
  weather.value='noon';weather.dispatchEvent(new Event('change',{bubbles:true}));
  const camera=document.getElementById('camera');
  camera.value='overview';camera.dispatchEvent(new Event('change',{bubbles:true}));
  window.__cryptodromoCameraQA.previewPresentation(28);
 });
 await page.waitForFunction(()=>window.__cryptodromoCameraQA.state().presentationVisible===true);
 const frame=await page.locator('#presentation-overlay').evaluate(el=>({
  background:getComputedStyle(el).backgroundImage,
  pointerEvents:getComputedStyle(el).pointerEvents,
  canvasWidth:document.getElementById('raceCanvas').width,
  symbol:document.getElementById('present-symbol').textContent,
  timer:document.getElementById('present-countdown').textContent
 }));
 assert.ok(frame.background.includes('linear-gradient'));
 assert.ok(frame.background.includes('90deg'),'the scrim must fade across to the right, not black out the whole venue');
 assert.equal(frame.pointerEvents,'none');
 assert.ok(frame.canvasWidth>300);
 assert.ok(frame.symbol.length>=2);
 assert.ok(frame.timer.length>0);
 await page.waitForTimeout(1400);
 await page.locator('#stage').screenshot({
  path:'artifacts/stadium-aaa-audience/presentation/01-presentation-day.png'
 });
 await page.evaluate(()=>{
  const weather=document.getElementById('weather');
  weather.value='night';weather.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForTimeout(1200);
 await page.locator('#stage').screenshot({
  path:'artifacts/stadium-aaa-audience/presentation/02-presentation-night.png'
 });
 assert.deepEqual(problems,[],'no WebGL or DOM error during synthetic runner presentation');
 console.log('PASS real 3D stadium remains visible during presentation, day/night');
}finally{await browser.close();}
