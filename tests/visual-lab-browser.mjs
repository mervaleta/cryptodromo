import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const captureScreenshots=process.env.CAPTURE_SCREENSHOTS==='1';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const errors=[],requestedLogos=[];
 const debuggerSession=await page.context().newCDPSession(page);
 await debuggerSession.send('Debugger.enable');
 await debuggerSession.send('Runtime.enable');
 debuggerSession.on('Runtime.exceptionThrown',e=>{
  const d=e.exceptionDetails;
  console.log('RUNTIME_EXCEPTION_LOCATION',JSON.stringify({url:d.url,line:d.lineNumber,column:d.columnNumber,description:d.exception?.description,text:d.text}));
 });
 debuggerSession.on('Debugger.scriptFailedToParse',e=>{
   console.log('FAILED_SCRIPT_TO_PARSE',JSON.stringify({url:e.url,line:e.lineNumber,column:e.columnNumber,start:e.startLine,end:e.endLine}));
 });
 page.on('request',request=>{if(request.url().includes('/assets/crypto-logos/'))requestedLogos.push(request.url());});
 page.on('pageerror',e=>errors.push('PAGE '+(e.stack||e.message)));
 page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+' '+response.url());});
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
   const actual=await page.evaluate(()=>({
    scripts:[...document.scripts].map(s=>({src:s.src,type:s.type})),
    importMap:document.querySelector('script[type="importmap"]')?.textContent?.slice(0,200)
   }));
   console.log('SCRIPT_CONTEXT',JSON.stringify(actual));
   const diagnostics=await page.evaluate(async()=>{
    const paths=['/visual-lab/scene.js','/visual-lab/trackMath.js','/visual-lab/trackVisuals.js','/visual-lab/liveSchedule.js','/visual-lab/raceAudio.js','/race-lab/source/src/horse.js','/race-lab/source/src/horseSurface.js'];
    return Promise.all(paths.map(async path=>{
      try{const r=await fetch(path+'?diag=a08-'+Date.now(),{cache:'no-store'}),text=await r.text();
        return{path,status:r.status,type:r.headers.get('content-type'),prefix:text.slice(0,90),size:text.length};
      }catch(e){return{path,error:String(e)};}
    }));
   });
   console.log('SCENE_MODULE_DIAGNOSTICS',JSON.stringify(diagnostics));
   const imports=await page.evaluate(async()=>{
     const paths=[
      '/visual-lab/liveSchedule.js?v=a08-1',
      '/visual-lab/trackMath.js?v=a08-2',
      '/visual-lab/trackVisuals.js?v=a08-2',
      '/visual-lab/raceAudio.js?v=alpha08-1',
      '/race-lab/source/src/horseSurface.js?v=alpha08-1',
      '/race-lab/source/src/horseLivery.js?v=alpha08-fur-1'
     ];
     return Promise.all(paths.map(async p=>{
       try{await import(p);return{path:p,ok:true};}
       catch(e){return{path:p,error:String(e),stack:e.stack};}
     }));
   });
   console.log('SCENE_IMPORT_DIAGNOSTICS',JSON.stringify(imports));
   throw e;
 }
 const initial=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],horses:document.querySelectorAll('#standings li').length}));
 console.log('SCENE_INIT',JSON.stringify(initial));
 const deployedScript=await page.evaluate(async()=>{
  const source=await (await fetch('/visual-lab/scene.js?version-probe=alpha09-'+Date.now(),{cache:'no-store'})).text();
  return {hasRunout:source.includes('broadcastRunoutDistance({...p,exitVelocity},leaderMeters,elapsed-60)'),
   hasResult:source.includes('showOfficialResult()'),hasGait:source.includes('alpha18-gaitmane-1')&&source.includes('h.model.setBank?.'),
   length:source.length,engineStatus:document.querySelector('#race-biography')?.textContent};
 });
 console.log('PUBLIC_ENGINE_VERSION',JSON.stringify(deployedScript));
 assert.ok(deployedScript.hasRunout&&deployedScript.hasResult&&deployedScript.hasGait,
  'Hostinger is still serving an outdated race engine');
 assert.ok(initial.canvas[0]>=1000);
 assert.equal(initial.horses,12);
 console.log('NATIVE_LOGO_NETWORK',JSON.stringify(requestedLogos));
 assert.ok(requestedLogos.length>=4,'At least the four star horses must receive their official skin mark');
 assert.ok(new Set(requestedLogos).size<=24,'Only current and next 12 runners may request SVGs; never prefetch 100-token roster');
 const verifiedLogo=await page.request.get('https://race.cryptodromo.com/assets/crypto-logos/btc.svg');
 assert.equal(verifiedLogo.status(),200,'BTC SVG must be local on Hostinger');
 assert.match(await verifiedLogo.text(),/^<svg /);
 const otherLogo=await page.request.get('https://race.cryptodromo.com/assets/crypto-logos/eth.svg');
 assert.equal(otherLogo.status(),200,'ETH SVG must be local on Hostinger');
 // All three courses must be selectable and draw with the same 12 horses.
 await page.selectOption('#layout','s-bend');
 assert.equal(await page.locator('#layout').inputValue(),'s-bend');
 await page.waitForTimeout(180);
 await page.selectOption('#layout','oval');
 assert.equal(await page.locator('#layout').inputValue(),'oval');
 await page.waitForTimeout(180);
 await page.selectOption('#layout','straight');
 // Alpha15 atmospheric lighting and scalable quality must be accessible.
 await page.selectOption('#graphics-quality','eco');
 await page.waitForTimeout(250);
 assert.match(await page.locator('#fps-readout').innerText(),/ECO/);
 await page.selectOption('#graphics-quality','auto');
 await page.locator('#cloud-cover').evaluate(input=>{input.value='85';input.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#fog-intensity').evaluate(input=>{input.value='145';input.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await page.locator('#cloud-cover-label').innerText()).trim(),'85%');
 assert.equal((await page.locator('#fog-intensity-label').innerText()).trim(),'145%');
 await page.click('#tab-camera');
 assert.equal(await page.locator('#panel-camera').isVisible(),true,'Unified camera panel must open');
 await page.selectOption('#camera','leader');
 await page.selectOption('#camera','orbit');
 await page.selectOption('#camera','broadcast');
 await page.click('#tab-race');
 const nowLabel=await page.locator('#live-current').innerText();
 console.log('LIVE_SCHEDULE',JSON.stringify({
   current:nowLabel,
   previous:await page.locator('#live-previous').innerText(),
   next:await page.locator('#live-next-label').innerText(),
   status:await page.locator('#live-state').innerText()
 }));
 assert.match(nowLabel,/^\d{2}:\d{2}$/);
 // The default view is continuous LIVE, never waiting for a Start click.
 assert.equal(await page.locator('#automatic-label').isVisible(),true);
 assert.equal(await page.locator('#start').isVisible(),false);
 await page.click('#live-now'); // switch to manual replay for deterministic QA
 assert.equal(await page.locator('#start').isVisible(),true);
 await page.click('#live-now'); // go back to automatic broadcast
 assert.equal(await page.locator('#automatic-label').isVisible(),true);
 await page.click('#replay-mode'); // opt into replay once for this test only
 await page.click('#reset');
 await page.selectOption('#surface','grass');
 assert.equal(await page.locator('#surface').inputValue(),'grass');
 await page.selectOption('#surface','synthetic');
 await page.selectOption('#surface','dirt');
 await page.locator('#camera-zoom').evaluate(input=>{input.value='60';input.dispatchEvent(new Event('input',{bubbles:true}));});
 await mkdir('artifacts',{recursive:true});
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha3-stadium.png',fullPage:false,timeout:25000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
 // The full-length aerial camera must be stationary so forward movement is obvious.
 await page.click('#tab-camera');
 await page.selectOption('#camera','aerial');
 await page.click('#tab-race');
 if(captureScreenshots)await page.screenshot({path:'artifacts/alpha15-oval-atmosphere.png',fullPage:false,timeout:30000}).catch(e=>console.log('SCREENSHOT_WARNING',e.message));
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
 await page.selectOption('#weather','rain');
 await page.waitForFunction(()=>Number.parseInt(document.querySelector('#wet-state')?.textContent.match(/\d+%/)?.[0])>0,{timeout:7000});
 const wetLabel=await page.locator('#wet-state').innerText();
 console.log('RAIN_WETNESS',wetLabel);
 assert.match(wetLabel,/acumulando agua/);
 await page.selectOption('#weather','noon');
 await page.waitForTimeout(1100);
 const dryLabel=await page.locator('#wet-state').innerText();
 console.log('DRYING_WETNESS',dryLabel);
 assert.match(dryLabel,/secándose gradualmente|superficie seca/);
 await page.selectOption('#weather','golden');
 await page.click('#start');
 const autoAudio=await page.locator('#sound').getAttribute('aria-pressed');
 console.log('AUDIO_UNLOCK',JSON.stringify({autoAudio,volume:await page.locator('#audio-volume').inputValue()}));
 if(await page.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext)))assert.equal(autoAudio,'true');
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
 // The public homepage must run the exact same cinematic 3D broadcast.
 const home=await page.goto('https://race.cryptodromo.com/?ci=alpha13-home',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(home?.status(),200,'Public homepage must be online');
 await page.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,{timeout:30000});
 const homeState=await page.evaluate(()=>({
  title:document.title,
  count:document.querySelectorAll('#standings li').length,
  live:document.querySelector('#automatic-label')?.textContent,
  legacy:!!document.querySelector('#startButton'),
  backdrop:document.querySelector('#status')?.textContent
 }));
 console.log('ALPHA13_PUBLIC_HOME',JSON.stringify(homeState));
 assert.equal(homeState.count,12);
 assert.equal(homeState.legacy,false);
 assert.match(homeState.live||'',/TRANSMISIÓ[N]/);
 assert.equal(errors.length,0,'Homepage browser errors: '+errors.join('; ').slice(0,1200));

}finally{await browser.close();}
