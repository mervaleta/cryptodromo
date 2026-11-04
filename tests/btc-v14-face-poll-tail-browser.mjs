import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
async function captureHorse(page,name){
 // Playwright locator.screenshot waits for visual stability; the horse has
 // an always-running Gallop and a large WebGL buffer, so it can time out.
 // Clip a direct viewport capture to the same card without that requirement.
 const box=await page.locator('#horse-view').boundingBox();
 assert.ok(box?.width>200&&box?.height>200,'BTC WebGL card must be visible');
 await page.screenshot({
  path:'artifacts/btc-v14/'+name,
  clip:{x:Math.max(0,box.x),y:Math.max(0,box.y),
   width:Math.min(box.width,1460-Math.max(0,box.x)),
   height:Math.min(box.height,970-Math.max(0,box.y))},
  animations:'disabled',timeout:90000
 });
}

import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
const origin=process.env.BTC_V14_ORIGIN||'http://127.0.0.1:8799';
try{
 const page=await browser.newPage({viewport:{width:1460,height:970},
  deviceScaleFactor:1,reducedMotion:'no-preference'});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push('JS '+e.stack));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text());});
 page.on('response',r=>{if(r.status()>=400&&/\.(js|gz|glb)(\?|$)/.test(r.url()))
  missing.push(r.status()+' '+r.url());});
 const response=await page.goto(origin+'/racers/#BTC',
  {waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s?.variant==='maya'&&s?.heroGroom?.harmonyBuild==='btc-face-poll-tail-20261104-v15';
 },null,{timeout:90000,polling:500});
 const initial=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 const hero=initial.heroGroom;
 assert.equal(hero.eyeGlobes,2);
 assert.equal(hero.eyeGeometry,'native-eleven-edge-socket-v15');
 assert.equal(hero.faceContinuity,'native-11-edge-closed-orbits-v15');
 assert.equal(hero.eyeSocketVertices,22);
 assert.ok(hero.eyeRecess>.0002);
 assert.ok(hero.pollStabilizedVertices>15,'Native Head->Neck3 must actually reweight the nape');
 assert.ok(hero.hairFinish.maneRoughness>=.78);
 assert.ok(hero.hairFinish.maneSheen<=.20);
 assert.ok(hero.hairFinish.tailStrands>400);
 assert.equal(hero.originalRig,true);
 assert.equal(hero.gallopPreserved,true);
 assert.equal(hero.integratedMayaHooves,true);
 mkdirSync('artifacts/btc-v14',{recursive:true});
 await page.locator('button[data-btc-camera="face"]').click();
 await page.waitForTimeout(850);
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).camera,'face');
 await captureHorse(page,'01-eyes-nape-close.png');
 const dynamics=[];
 for(let i=0;i<8;i++){
  await page.waitForTimeout(320);
  const h=(await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).heroGroom;
  dynamics.push(h.hairDynamics.sway);
 }
 assert.ok(Math.max(...dynamics)-Math.min(...dynamics)>.035,
  'free tail must have meaningful inertial left/right motion: '+JSON.stringify(dynamics));
 await page.locator('button[data-btc-camera="front"]').click();
 await page.waitForTimeout(430);
 await captureHorse(page,'02-eyes-front.png');
 await page.locator('button[data-btc-camera="profile"]').click();
 await page.waitForTimeout(400);
 await captureHorse(page,'03-nape-profile-phase-a.png');
 await page.waitForTimeout(320);
 await captureHorse(page,'04-nape-profile-phase-b.png');
 await page.locator('button[data-btc-camera="rear"]').click();
 await page.waitForTimeout(600);
 await captureHorse(page,'05-tail-rear.png');
 await page.locator('#motion').click();
 await page.waitForTimeout(850);
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).paused,true);
 await page.locator('button.runner[data-symbol="ETH"]').click();
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.symbol==='ETH',null,{timeout:60000});
 const eth=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(eth.heroGroom,null,'99 other token geometry must not be altered');
 assert.deepEqual(errors,[],'Browser exceptions '+errors.join('\n').slice(0,1500));
 assert.deepEqual(missing,[],'Missing browser resources '+missing.join('; '));
 console.log('BTC_V14_FICHA_WEBGL_PASS',JSON.stringify({
  harmonyBuild:hero.harmonyBuild,eyes:hero.eyeGeometry,
  pollVertices:hero.pollStabilizedVertices,finish:hero.hairFinish,
  tailSwayRange:Math.max(...dynamics)-Math.min(...dynamics),drawCalls:initial.drawCalls
 }));
}finally{await browser.close();}
