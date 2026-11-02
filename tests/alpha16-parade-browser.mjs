import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1450,height:940},deviceScaleFactor:1});
 const errors=[],badRequests=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)badRequests.push(response.status()+' '+response.url());});
 await page.goto('http://127.0.0.1:8799/parade/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__cryptodromoParadeQA?.snapshot().ready,{timeout:80000});
 const initial=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 console.log('PARADE_START',JSON.stringify({
  wave:initial.parade.waveIndex,runners:initial.parade.horses.length,
  models:initial.models,village:initial.village,
  walkClips:initial.walkClips
 }));
 assert.equal(initial.models,12);
 assert.ok(initial.walkClips.every(Boolean),'All models must have an animation clip');
 assert.equal(initial.parade.totalParaders,100);
 assert.equal(initial.village.stands,3);
 assert.equal(initial.village.foodStalls,6);
 assert.equal(initial.village.maintenanceVehicles,3);
 assert.equal(initial.village.bulbs,48);
 assert.equal(initial.village.realPointLights,4);
 await page.waitForTimeout(1300);
 const a=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.ok(a.parade.elapsed>initial.parade.elapsed);
 const oldWave=a.parade.waveIndex;
 await page.click('#next-wave');
 const next=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.equal(next.parade.waveIndex,(oldWave+1)%9);
 assert.equal(await page.locator('#runner-list .pill-runner').count(),next.parade.horses.length);
 await page.selectOption('#camera-mode','free');
 await page.locator('body').click({position:{x:14,y:200}});
 const poseBefore=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone);
 await page.keyboard.down('ArrowUp');
 await page.waitForTimeout(900);
 await page.keyboard.up('ArrowUp');
 const poseAfter=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone);
 assert.ok(Math.hypot(poseAfter.x-poseBefore.x,poseAfter.z-poseBefore.z)>2,'Drone did not advance with arrows');
 await page.locator('#height').evaluate(el=>{el.value='130';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await page.locator('#height-label').textContent()).trim(),'130 m');
 await page.locator('#fov').evaluate(el=>{el.value='34';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await page.locator('#fov-label').innerText()).trim(),'34°');
 await page.locator('#yaw').evaluate(el=>{el.value='90';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await page.locator('#yaw-label').innerText()).trim(),'90°');
 await page.selectOption('#camera-mode','orbit');
 await page.selectOption('#sight','comida');
 assert.equal(await page.locator('#camera-mode').inputValue(),'orbit');
 await page.selectOption('#camera-mode','follow');
 await page.waitForTimeout(200);
 assert.equal((await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone.mode)),'follow');
 await page.selectOption('#quality','eco');
 await page.locator('#weather').selectOption('night');
 await page.locator('#lights').evaluate(el=>{el.value='145';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await page.locator('#light-label').innerText()).trim(),'145%');
 await page.selectOption('#camera-mode','orbit');
 await page.selectOption('#sight','tribunas');
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/parade-alpha16-stadium.png',timeout:40000});
 await page.selectOption('#sight','comida');
 await page.screenshot({path:'artifacts/parade-alpha16-foodcourt.png',timeout:40000});
 await page.click('#pause');
 const paused=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().parade.elapsed);
 await page.waitForTimeout(550);
 const pausedAfter=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().parade.elapsed);
 assert.equal(pausedAfter,paused,'Parade should pause, independent of drone');
 console.log('PARADE_BROWSER_ERRORS',JSON.stringify(errors.slice(0,8)));
 assert.equal(errors.length,0,errors.join('; ').slice(0,1200));
 assert.equal(badRequests.length,0,badRequests.join('; ').slice(0,900));
 console.log('PASS: parade has 100 identities, walking model, manual drone, night village and screenshots');
}finally{await browser.close();}
