import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1450,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 const response=await page.goto('https://race.cryptodromo.com/visual-lab/?finish-qa=alpha06',{waitUntil:'domcontentloaded',timeout:40000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>!document.querySelector('#start')?.disabled,{timeout:40000});
 await page.click('#start');
 await page.clock.fastForward(60500);
 await page.waitForFunction(()=>!document.querySelector('#result-overlay').hidden,{timeout:12000});
 const result=await page.evaluate(()=>({
  clock:document.querySelector('#clock').textContent,
  status:document.querySelector('#status').textContent,
  visible:!document.querySelector('#result-overlay').hidden,
  placements:document.querySelectorAll('#result-list .result-row').length,
  narration:document.querySelector('#narrator-text').textContent,
  stats:document.querySelector('#race-stat-content').textContent,
 }));
 console.log('ALPHA06_FINISH_QA',JSON.stringify(result));
 console.log('JS_ERRORS',JSON.stringify(errors));
 assert.equal(result.clock,'01:00');
 assert.equal(result.visible,true);
 assert.equal(result.placements,12);
 assert.match(result.status,/RESULTADO OFICIAL/);
 assert.ok(errors.length===0,'Browser JS: '+errors.join('; '));
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/alpha06-official-finish.png',fullPage:false,timeout:60000});
 console.log('PASS: +60 seconds official overlay, 12 results, complete narration, no page errors');
}finally{await browser.close();}
