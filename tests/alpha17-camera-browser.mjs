import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1450,height:950},deviceScaleFactor:1});
 const errors=[],networkErrors=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('response',res=>{
  if(res.status()>=400)networkErrors.push(res.status()+' '+res.url());
 });
 const base='http://127.0.0.1:8799';
 const change=async(id,value)=>page.locator(id).evaluate((el,v)=>{
  el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));
 },String(value));
 await mkdir('artifacts',{recursive:true});
 const r=await page.goto(base+'/visual-lab/?camera-qa=alpha17',
  {waitUntil:'domcontentloaded',timeout:35000});
 assert.equal(r?.status(),200);
 await page.waitForFunction(()=>!document.querySelector('#start')?.disabled,{timeout:80000});
 await page.waitForFunction(()=>Boolean(window.__cryptodromoCameraQA),{timeout:8000});
 await page.click('#tab-camera');
 assert.equal(await page.locator('#panel-camera').isVisible(),true);
 assert.equal(await page.locator('#panel-race').isVisible(),false);
 await page.selectOption('#camera','low');
 await change('#camera-angle',47);
 await change('#camera-pitch',27);
 await change('#camera-height',24);
 await change('#camera-distance',60);
 await change('#camera-zoom',38);
 await change('#camera-lateral',15);
 assert.equal(await page.locator('#camera-pitch-label').innerText(),'27°');
 assert.equal(await page.locator('#camera-distance-label').innerText(),'60%');
 assert.equal(await page.locator('#camera-height-label').textContent(),'24 m');
 await page.waitForTimeout(650);
 const initial=await page.evaluate(()=>window.__cryptodromoCameraQA.state());
 assert.ok(initial.position.every(Number.isFinite));
 assert.equal(initial.view,'low');
 await page.screenshot({path:'artifacts/alpha17-live-low-shot.png',timeout:40000});
 await page.selectOption('#camera','overview');
 await page.click('#camera-reset');
 assert.equal(await page.locator('#camera-pitch').inputValue(),'0');
 assert.equal(await page.locator('#camera-distance').inputValue(),'100');
 await page.waitForTimeout(600);
 const overview=await page.evaluate(()=>window.__cryptodromoCameraQA.state());
 assert.ok(Math.hypot(...initial.position.map((v,i)=>v-overview.position[i]))>5,
  'New views must have different actual eye positions');
 // Reproduce the waiting phase without changing a single financial price.
 const overlay=await page.evaluate(()=>{
  window.__cryptodromoCameraQA.previewPresentation(30);
  const stage=document.querySelector('#stage'),dial=stage.querySelector('.dial'),
   present=stage.querySelector('#presentation-overlay'),
   label=stage.querySelector('#present-countdown');
  return {isPresenting:stage.classList.contains('is-presenting'),
   dialDisplay:getComputedStyle(dial).display,
   presentationVisible:!present.hidden,
   countdown:label.textContent,overlayDisplay:getComputedStyle(present).display};
 });
 console.log('ALPHA17_CLOCK',overlay);
 assert.equal(overlay.isPresenting,true);
 assert.equal(overlay.dialDisplay,'none','Race dial must be invisible behind the next-start clock');
 assert.equal(overlay.presentationVisible,true);
 assert.equal(overlay.countdown,'00:30');
 await page.evaluate(()=>window.__cryptodromoCameraQA.resume());
 assert.notEqual(await page.locator('.dial').evaluate(el=>getComputedStyle(el).display),'none');
 assert.equal(errors.length,0,'LIVE JS: '+errors.join('; ').slice(0,1500));
 console.log('ALPHA17_LIVE_CAMERA',JSON.stringify({initial,overview,errors}));
 await page.goto(base+'/parade/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__cryptodromoParadeQA?.snapshot().ready,{timeout:80000});
 assert.equal(await page.locator('#parade-camera-deck').isVisible(),true);
 assert.equal(await page.locator('#drone-pad').isVisible(),false,'Desktop stage should stay free of a floating touch keypad');
 await page.click('#toggle-camera-pad');
 assert.equal(await page.locator('#drone-pad').isVisible(),true);
 await page.click('#toggle-camera-pad');
 assert.equal(await page.locator('#drone-pad').isVisible(),false);
 await page.selectOption('#camera-mode','orbit');
 await page.selectOption('#sight','tribunas');
 await page.waitForTimeout(1200);
 const orbitA=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 await change('#height',165);
 await page.waitForTimeout(1100);
 const orbitB=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.ok(orbitB.cameraPosition[1]>orbitA.cameraPosition[1]+15,
  'Parade orbit height must change actual eye altitude');
 await change('#pitch',-13);
 await page.waitForTimeout(1000);
 const orbitC=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 console.log('PARADE_CAMERA_AXES',JSON.stringify({
  before:orbitB.cameraPosition,after:orbitC.cameraPosition,
  idealBefore:orbitB.targetCameraPosition,idealAfter:orbitC.targetCameraPosition,
  poseBefore:orbitB.drone,poseAfter:orbitC.drone
 }));
 assert.ok(orbitC.targetCameraPosition.y<orbitB.targetCameraPosition.y-15,
  'Parade vertical angle must independently change actual requested camera position');
 assert.ok(orbitC.cameraPosition[1]<orbitB.cameraPosition[1]-2,
  'Rendered camera must move vertically after operator changes pitch');
 await change('#distance',170);
 await change('#fov',34);
 assert.equal(await page.locator('#distance-label').textContent(),'170 m');
 assert.equal(await page.locator('#fov-label').innerText(),'34°');
 // The stage is animated continuously; a locator screenshot waits for layout stability.
  // Capture the viewport directly so camera QA cannot stall on live WebGL motion.
  await page.screenshot({path:'artifacts/alpha17-parade-orbit.png',timeout:40000});
 await page.selectOption('#camera-mode','follow');
 await page.waitForTimeout(300);
 assert.equal((await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone.mode)),'follow');
 await page.selectOption('#camera-mode','crane');
 await page.waitForTimeout(300);
 assert.equal((await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone.mode)),'crane');
 await page.locator('#reset-drone').click();
 assert.equal((await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone.mode)),'free');
 assert.equal(errors.length,0,'Camera JS: '+errors.join('; ').slice(0,1500));
 assert.equal(networkErrors.length,0,'Network: '+networkErrors.join('; ').slice(0,900));
 console.log('PASS Alpha17: shared LIVE/Parade camera controls and single presentation timer');
}finally{await browser.close();}
