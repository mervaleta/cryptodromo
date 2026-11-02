import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('PAGE '+e.message));
 page.on('requestfailed',r=>errors.push('REQUEST '+r.url()+' '+r.failure()?.errorText));
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text());});
 const res=await page.goto('https://race.cryptodromo.com/visual-lab/?ci=20261102',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(res?.status(),200,'Live visual lab must exist on Hostinger');
 await page.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,{timeout:30000});
 const initial=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],horses:document.querySelectorAll('#standings li').length}));
 console.log('SCENE_INIT',JSON.stringify(initial));
 assert.ok(initial.canvas[0]>=1000);
 assert.equal(initial.horses,12);
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/alpha3-stadium.png',fullPage:false});
 // The full-length aerial camera must be stationary so forward movement is obvious.
 await page.selectOption('#camera','aerial');
 await page.click('#tab-light');
 assert.equal(await page.locator('#panel-light').isVisible(),true);
 await page.click('#light-preview');
 assert.equal(await page.locator('#weather').inputValue(),'night');
 await page.locator('#light-dimmer').fill('58');
 await page.locator('#light-color').fill('#55bbff');
 await page.selectOption('#light-pattern','wave');
 assert.match(await page.locator('#light-status').innerText(),/58%/);
 await page.waitForTimeout(700);
 await page.screenshot({path:'artifacts/alpha05-night-lights.png',fullPage:false});
 // Test controls without affecting official race results.
 await page.locator('#light-power').uncheck();
 assert.match(await page.locator('#light-status').innerText(),/apagados/);
 await page.locator('#light-power').check();
 await page.selectOption('#light-pattern','steady');
 await page.click('#tab-race');
 await page.selectOption('#weather','golden');
 await page.click('#start');
 await page.waitForTimeout(6500);
 const clock=await page.locator('#clock').innerText();
 console.log('CLOCK_AFTER_START',clock);
 console.log('BROWSER_ERRORS',JSON.stringify(errors.slice(0,15)));
 await page.screenshot({path:'artifacts/alpha3-racing.png',fullPage:false});
 assert.notEqual(clock,'00:00','Race timeline did not advance');
 assert.ok(!errors.length,'Browser errors: '+errors.join('; ').slice(0,1200));
 console.log('PASS: interactive live Three.js race, 12 horses, scene screenshot');
 // The paddock must use the exact shared animated horse and token color set.
 const paddock=await page.goto('https://race.cryptodromo.com/racers/#BTC',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(paddock?.status(),200);
 await page.waitForFunction(()=>document.querySelector('#preview-state')?.textContent?.includes('3D ANIMADO'),{timeout:30000});
 await page.waitForTimeout(2000);
 const paddockState=await page.evaluate(()=>({
  state:document.querySelector('#preview-state').textContent,
  fallback:document.querySelector('#preview-fallback').hidden,
  canvasVisible:!document.querySelector('#horse-canvas').hidden,
  total:document.querySelectorAll('.runner').length,
  symbol:document.querySelector('#horse-symbol').textContent
 }));
 console.log('PADDOCK_3D',JSON.stringify(paddockState));
 assert.equal(paddockState.total,100);
 assert.equal(paddockState.symbol,'BTC');
 assert.ok(paddockState.fallback&&paddockState.canvasVisible,'Paddock 3D preview did not load');
 await page.screenshot({path:'artifacts/alpha4-racers-btc.png',fullPage:false});
 await page.locator('.runner[data-symbol="ETH"]').click();
 await page.waitForTimeout(1000);
 assert.equal(await page.locator('#horse-symbol').innerText(),'ETH');
 assert.equal((await page.locator('#horse-color').innerText()).toLowerCase(),'#627eea');
 assert.equal(errors.length,0,'Live browser JS failures: '+errors.join('; ').slice(0,1200));
 console.log('PASS: 100-runner catalog uses riderless animated horse, synced token coats/colors');
}finally{await browser.close();}
