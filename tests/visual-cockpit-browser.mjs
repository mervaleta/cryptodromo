import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8799/parade/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__cryptodromoParadeQA?.snapshot().ready,{timeout:80000});
 const tabs=page.locator('.crp-cockpit__tab');
 assert.equal(await tabs.count(),4);
 await tabs.filter({hasText:'Cámara'}).click();
 const look=page.locator('.crp-cockpit select').first();
 assert.equal(await look.inputValue(),'2','Right button should look by default');
 const before=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone);
 await page.locator('#parade-canvas').dispatchEvent('pointerdown',{button:2,pointerType:'mouse',pointerId:31,clientX:340,clientY:280});
 await page.locator('#parade-canvas').dispatchEvent('pointermove',{button:2,pointerType:'mouse',pointerId:31,clientX:390,clientY:310});
 await page.locator('#parade-canvas').dispatchEvent('pointerup',{button:2,pointerType:'mouse',pointerId:31,clientX:390,clientY:310});
 const after=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot().drone);
 assert.ok(Math.abs(after.yaw-before.yaw)>.1,'Right-button drag should change yaw');
 await tabs.filter({hasText:'Luces'}).click();
 const lightInput=page.locator('.crp-cockpit input[type=range]').first();
 await lightInput.evaluate(el=>{el.value='1.1';el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await lightInput.inputValue(),'1.1');
 await tabs.filter({hasText:'Caballos'}).click();
 assert.ok(await page.locator('.crp-cockpit select').count());
 assert.deepEqual(errors,[],'No uncaught page errors: '+errors.join('; '));
 console.log('VISUAL_COCKPIT_OK',JSON.stringify({tabs:4,mouse:'right-look left-pan',yawDelta:after.yaw-before.y}));
}finally{await browser.close()}
