import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const root=process.env.BTC_FAST_ORIGIN||'http://127.0.0.1:8799';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1450,height:950},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const faults=[];page.on('pageerror',e=>faults.push(e.stack||e.message));
 await page.goto(root+'/racers/?btcCapture=1&btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{const s=window.__cryptodromoBTCAtelierQA?.();return s?.variant==='maya'&&s?.heroGroom?.harmonyBuild==='btc-master-procedural-hind-groom-20261104-v12-fx2'&&s?.drawCalls>0;},null,{timeout:120000});
 const s=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(s.heroGroom.eyeApertureBorders,22);
 assert.equal(s.heroGroom.eyeApertureCenters,2);
 assert.equal(s.heroGroom.vertices,5411);
 assert.equal(s.heroGroom.eyeAssembly,'integrated-maya-eyelid-shading-v15');
 mkdirSync('artifacts/btc-ocular-fast',{recursive:true});
 for(const camera of ['face','poll','profile']){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  await page.waitForTimeout(300);
  // Capture the existing WebGL drawing buffer directly to avoid Chromium's
  // animated-page screenshot stability wait. Empty frames are rejected.
  const raw=await page.evaluate(()=>{
   const canvas=document.querySelector('#horse-canvas');
   if(!canvas||canvas.width<100||canvas.height<100)throw Error('BTC WebGL canvas invalid');
   return canvas.toDataURL('image/png');
  });
  assert.ok(raw.startsWith('data:image/png;base64,')&&raw.length>40000,'WebGL screenshot must contain painted pixels, not an empty buffer');
  writeFileSync('artifacts/btc-ocular-fast/'+camera+'.png',
   Buffer.from(raw.split(',')[1],'base64'));
 }
 assert.deepEqual(faults,[],faults.join('; '));
 console.log('BTC_ORBITAL_TOPOLOGY_REAL_WEBGL',JSON.stringify({
  harmonyBuild:s.heroGroom.harmonyBuild,eyes:s.heroGroom.eyeGlobes,
  eyeApertureBorders:s.heroGroom.eyeApertureBorders,
  eyeApertureCenters:s.heroGroom.eyeApertureCenters,
  corneaX:s.heroGroom.eyeCenterX,poll:s.heroGroom.pollAnchoredVertices,
  drawCalls:s.drawCalls
 }));
}finally{await browser.close();}
