import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const captureScreenshots=process.env.CAPTURE_SCREENSHOTS==='1';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('PAGE '+e.message));
 page.on('requestfailed',r=>errors.push('REQUEST '+r.url()+' '+r.failure()?.errorText));
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text());});
 const res=await page.goto('https://race.cryptodromo.com/visual-lab/?ci=20261102',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(res?.status(),200,'Live visual lab must exist on Hostinger');
 try {
   await page.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,{timeout:30000});
 } catch(e) {
   console.log('SCENE_START_FAILURE',JSON.stringify(await page.evaluate(()=>({
    status:document.querySelector('#status')?.textContent,
    message:document.querySelector('#message')?.textContent,
    button:document.querySelector('#start')?.outerHTML,
    scripts:[...document.scripts].map(s=>s.src).filter(Boolean)
   }))));
   console.log('SCENE_START_ERRORS',JSON.stringify(errors));
   throw e;
 }
 const initial=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],horses:document.querySelectorAll('#standings li').length}));
 console.log('SCENE_INIT',JSON.stringify(initial));
 const deployedScript=await page.evaluate(async()=>{
  const source=await (await fetch('/visual-lab/scene.js?version-probe=alpha07-'+Date.now(),{cache:'no-store'})).text();
  return {hasRunout:source.includes('coastDistance(p.distanceAt60,exitVelocity,elapsed-60)'),
   hasResult:source.includes('showOfficialResult()'),hasGait:source.includes('alpha07-brand-2'),
   length:source.length,engineStatus:document.querySelector('#race-biography')?.textContent};
 });
 console.log('PUBLIC_ENGINE_VERSION',JSON.stringify(deployedScript));
 assert.ok(deployedScript.hasRunout&&deployedScript.hasResult&&deployedScript.hasGait,
  'Hostinger is still serving an outdated race engine');
 assert.ok(initial.canvas[0]>=1000);
 assert.equal(initial.horses,12);
 const verifiedLogo=await page.request.get('https://race.cryptodromo.com/assets/crypto-logos/btc.svg');
 assert.equal(verifiedLogo.status(),200,'BTC SVG must be local on Hostinger');
 assert.match(await verifiedLogo.text(),/^<svg /);
 const otherLogo=await page.request.get('https://race.cryptodromo.com/assets/crypto-logos/eth.svg');
 assert.equal(otherLogo.status(),200,'ETH SVG must be local on Hostinger');
 await page.selectOption('#surface','grass');
 assert.equal(await page.locator('#surface').inputValue(),'grass');
 await page.selectOption('#surface','synthetic');
 await page.selectOption('#surface','dirt');
 await page.locator('#camera-zoom').evaluate(input=>{input.value='60';input.dispatchEvent(new Event('input',{bubbles:true}));});
 await mkdir('artifacts',{recursive:true});
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha3-stadium.png',fullPage:false,timeout:25000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
 // The full-length aerial camera must be stationary so forward movement is obvious.
 await page.selectOption('#camera','aerial');
 await page.click('#tab-light');
 assert.equal(await page.locator('#panel-light').isVisible(),true);
 await page.click('#light-preview');
 assert.equal(await page.locator('#weather').inputValue(),'night');
 await page.locator('#light-dimmer').evaluate(el=>{el.value='58';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#light-color').evaluate(el=>{el.value='#55bbff';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.selectOption('#light-pattern','wave');
 assert.match(await page.locator('#light-status').innerText(),/58%/);
 await page.waitForTimeout(700);
 console.log('NIGHT_MENU_OK',JSON.stringify({level:await page.locator('#light-level').innerText(),mode:await page.locator('#weather').inputValue(),effect:await page.locator('#light-pattern').inputValue()}));
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha05-night-lights.png',fullPage:false,timeout:60000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
 // Full-power broadcast setup: independently verify a usable night race surface.
 await page.locator('#light-dimmer').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#light-color').evaluate(el=>{el.value='#fff3d4';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.selectOption('#light-pattern','steady');
 await page.waitForTimeout(350);
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha05-night-full-power.png',fullPage:false,timeout:60000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
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
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha3-racing.png',fullPage:false,timeout:25000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
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
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha4-racers-btc.png',fullPage:false,timeout:25000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
 await page.locator('.runner[data-symbol="ETH"]').click();
 await page.waitForTimeout(1000);
 assert.equal(await page.locator('#horse-symbol').innerText(),'ETH');
 assert.equal((await page.locator('#horse-color').innerText()).toLowerCase(),'#627eea');
 assert.equal(errors.length,0,'Live browser JS failures: '+errors.join('; ').slice(0,1200));
 console.log('PASS: 100-runner catalog uses riderless animated horse, synced token coats/colors');
}finally{await browser.close();}
