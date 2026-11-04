import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin=process.env.CRP_TV_BASE||'http://127.0.0.1:4173';
const url=path=>new URL(path,origin).toString();
const liveHtml=readFileSync(new URL('../stadiums/crypto/live/index.html',import.meta.url),'utf8');
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
await mkdir('artifacts/satoshi-tv',{recursive:true});
const issues=[];
async function openPage(context,path){
 const page=await context.newPage();
 page.on('pageerror',e=>issues.push(path+': '+e.message));
 const response=await page.goto(url(path),{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200,path+' HTTP');
 return page;
}
async function requirePlayer(page,track){
 await page.waitForFunction(track=>{
  const frame=document.getElementById('stadium-broadcast');
  return !!frame&&!frame.hidden&&
   frame.src.includes('/index.html?')&&frame.src.includes('track='+track)&&
   !!frame.contentDocument?.querySelector('#raceCanvas')&&
   !frame.contentDocument?.querySelector('#stadium-broadcast');
 },track,{timeout:100000});
 const player=page.frameLocator('#stadium-broadcast');
 await player.locator('#raceCanvas').waitFor({state:'visible',timeout:20000});
 await page.waitForFunction(()=>{
  const child=document.querySelector('#stadium-broadcast')?.contentDocument;
  return !!child&&child.querySelector('#start')?.disabled===false&&
   child.querySelector('#raceCanvas')?.width>300&&
   !/CARGANDO ESCENARIO 3D|ERROR EN ESCENA/.test(child.querySelector('#status')?.textContent||'');
 },null,{timeout:110000});
 const body=await player.locator('body').evaluate(el=>({
  embed:document.documentElement.classList.contains('tv-embed'),
  stage:document.querySelector('#stage').getBoundingClientRect().toJSON(),
  canvas:document.querySelector('#raceCanvas').getBoundingClientRect().toJSON(),
  sitebar:document.querySelector('.sitebar,.top')?
    getComputedStyle(document.querySelector('.sitebar,.top')).display:null
 }));
 assert.equal(body.embed,true,'broadcast embed mode not enabled');
 assert.equal(body.sitebar,'none','site chrome is visible inside TV');
 assert.ok(body.canvas.width>=250&&body.canvas.height>=230,'player is not a real 3D stage');
 assert.ok(body.stage.height<=body.canvas.height+3,'stage grows beyond TV screen');
 assert.equal(page.frames().length,2,'a nested web page created another iframe');
 return player;
}
try{
 const desktop=await browser.newContext({viewport:{width:1560,height:930},deviceScaleFactor:1});
 const page=await openPage(desktop,'/stadiums/crypto/live/?track=muybridge');
 const player=await requirePlayer(page,'muybridge');
 await page.screenshot({path:'artifacts/satoshi-tv/live-main-channel.png'});
 assert.equal(await page.locator('.tv-channel').count(),3);
 assert.equal(await page.locator('iframe').count(),1);
 assert.equal(await page.locator('#tv-error').isVisible(),false);
 await page.locator('[data-tv-tune="genesis"]').click();
 await requirePlayer(page,'genesis');
 assert.match(new URL(page.url()).searchParams.get('track'),/^genesis$/);
 assert.equal(await page.locator('[data-tv-tune="genesis"]').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:'artifacts/satoshi-tv/live-genesis.png'});
 await page.locator('[data-tv-tune="vint-cerf"]').click();
 await requirePlayer(page,'vint-cerf');
 await page.screenshot({path:'artifacts/satoshi-tv/live-vint-cerf.png'});
 await desktop.close();

 // Replay navigation from actual archive must open the SAME single player.
 const archiveCtx=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const archive=await openPage(archiveCtx,'/stadiums/crypto/archive/?track=genesis&day=0');
 await archive.locator('#archive-results a').first().waitFor({timeout:40000});
 const link=await archive.locator('#archive-results a').first().getAttribute('href');
 assert.match(link,/\/stadiums\/crypto\/live\/\?track=genesis&replayDay=0&replayMinute=/);
 const replayPage=await openPage(archiveCtx,link);
 const replayPlayer=await requirePlayer(replayPage,'genesis');
 assert.match(await replayPage.locator('#tv-mode-badge').innerText(),/REPLAY/);
 assert.equal(await replayPage.locator('#tv-live-now').isEnabled(),true);
 await replayPlayer.locator('#start').waitFor({state:'attached',timeout:60000});
 await replayPlayer.locator('#start').evaluate(async element=>{
  const timeout=Date.now()+100000;
  while(element.disabled&&Date.now()<timeout)await new Promise(resolve=>setTimeout(resolve,200));
  if(element.disabled)throw Error('Race models did not initialize');
 });
 await replayPage.waitForFunction(()=>{
  const doc=document.querySelector('#stadium-broadcast')?.contentDocument;
  return !!doc&&doc.querySelector('#clock')?.textContent!=='00:00';
 },null,{timeout:18000});
 await replayPage.screenshot({path:'artifacts/satoshi-tv/archive-replay-auto-start.png'});
 await replayPage.locator('#tv-live-now').click();
 await requirePlayer(replayPage,'genesis');
 assert.equal(await replayPage.locator('#tv-live-now').isDisabled(),true);
 assert.ok(!replayPage.url().includes('replayDay='));
 await archiveCtx.close();

 // Hostinger-style fallback that returns /live/ HTML with 200 instead of
 // /broadcast/ must switch to the known good visual-lab race document.
 const rewritten=await browser.newContext({viewport:{width:1300,height:830}});
 await rewritten.route('**/stadiums/crypto/broadcast/index.html**',route=>
  route.fulfill({status:200,contentType:'text/html',body:liveHtml}));
 const fallback=await openPage(rewritten,'/stadiums/crypto/live/?track=muybridge');
 await requirePlayer(fallback,'muybridge');
 assert.match(await fallback.locator('#stadium-broadcast').getAttribute('src'),/\/visual-lab\/index\.html/);
 assert.equal(await fallback.locator('#tv-error').isVisible(),false);
 await fallback.screenshot({path:'artifacts/satoshi-tv/rewritten-route-safe-fallback.png'});
 await rewritten.close();

 // Even if both origins are misconfigured, do not recurse: show a clear error.
 const broken=await browser.newContext({viewport:{width:1000,height:780}});
 await broken.route(/\/(stadiums\/crypto\/broadcast|visual-lab)\/index\.html/,route=>
  route.fulfill({status:200,contentType:'text/html',body:liveHtml}));
 const faulty=await openPage(broken,'/stadiums/crypto/live/');
 await faulty.locator('#tv-error').waitFor({state:'visible',timeout:30000});
 assert.equal(await faulty.locator('#stadium-broadcast').getAttribute('src'),'about:blank');
 assert.equal(faulty.frames().length,2);
 await faulty.screenshot({path:'artifacts/satoshi-tv/error-no-recursion.png'});
 await broken.close();

 assert.deepEqual(issues,[],'JavaScript errors: '+issues.join('; '));
 console.log('PASS Satoshi TV: 3 live channels, single WebGL iframe, replay autoplay, safe rewrite fallback, no recursion');
}finally{await browser.close();}
