import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({
 headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
});
const page=await browser.newPage({viewport:{width:1280,height:850}});
const shaderErrors=[],pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',message=>{
 if(message.type()==='error'&&/WebGLProgram|shader|compile|THREE.WebGLRenderer/i.test(message.text()))
  shaderErrors.push(message.text());
});
try{
 await page.goto('http://127.0.0.1:8799/parade/?qa=mane-alpha16',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__cryptodromoParadeQA?.snapshot().ready,{timeout:80000});
 await page.waitForTimeout(1400);
 const initial=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.equal(initial.models,12,'12 GLB horses in Parade');
 assert.equal(initial.maneEnabled,12,'every Parade horse has the animated GLB mane');
 assert.ok(initial.maneWind>0);
 assert.ok(initial.maneMotion.every(x=>x<.01),'walking horses must have still manes in calm weather');
 await page.locator('#weather').selectOption('wet');
 await page.waitForTimeout(350);
 const wet=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.ok(wet.maneWind>initial.maneWind,'rain increases the breeze on mane');
 assert.ok(wet.maneMotion.every(x=>x<.01),'rain alone must not make walking manes flutter');
 await page.locator('#weather').selectOption('clear');
 await page.waitForTimeout(350);
 const dry=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.equal(dry.maneEnabled,12);
 assert.equal(dry.maneWind,initial.maneWind);
 assert.ok(dry.maneMotion.every(x=>x<.01));
 assert.deepEqual(pageErrors,[],'no JavaScript exceptions');
 assert.deepEqual(shaderErrors,[],'no shader compilation errors');
 console.log('PASS: 12 animated manes, Walk animation, dry/wet breeze and GPU shader compilation');
}finally{await browser.close();}
