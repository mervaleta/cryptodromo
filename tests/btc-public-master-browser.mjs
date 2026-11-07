import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const BUILD='btc-v21-ocular-tail-root-20261107-v1',dir='artifacts/btc-live';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:920,height:700},deviceScaleFactor:1,reducedMotion:'no-preference'});
const faults=[];page.on('pageerror',e=>faults.push(e.message));
const root='https://race.cryptodromo.com/racers/';
async function ready(){
 await page.waitForFunction(build=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s.variant==='maya'&&s.heroGroom?.harmonyBuild===build&&s.drawCalls>0&&s.clips.includes('Gallop');
 },BUILD,{timeout:120000});
 return page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
}
try{
 await page.goto(root+'#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 let live=await ready();
 assert.equal(live.heroGroom.originalRig,true);
 assert.equal(live.heroGroom.hindRestoration?.sameOriginalSkeleton,true,'The published hind limbs must be the authored native GLB rig');
 assert.ok(live.heroGroom.hindRestoration?.donorHindTriangles>280,'Actual original GLB hind geometry must be served');
 assert.equal(live.heroGroom.hindVolumeConsistent,true);
 assert.ok(live.heroGroom.hindCrossSideAfter<live.heroGroom.hindCrossSideBefore);
 await page.goto(root+'?btcCapture=1&btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 live=await ready();
 const capture=async(camera,phase)=>{
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),phase);
  const s=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA?.());
  assert.equal(s?.heldPoseIndex,phase);
  await page.waitForTimeout(90);
  const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>40000,'Empty live WebGL frame '+camera+phase);
  writeFileSync(dir+'/'+camera+'-'+String(phase).padStart(2,'0')+'.png',Buffer.from(png.split(',')[1],'base64'));
 };
 for(const camera of ['profile','front','rear','threeQuarter','top','detail']){
  await page.evaluate(name=>document.querySelector('[data-btc-camera="'+name+'"]')?.click(),camera);
  const phases=camera==='profile'?Array.from({length:16},(_,i)=>i):[0,4,8,12];
  for(const phase of phases)await capture(camera,phase);
 }
 assert.deepEqual(faults,[],faults.join('; '));
 console.log('BTC_MAYA_V16_HOSTINGER_REAL_GALLOP_PHOTOGRAPHED',BUILD);
}finally{await browser.close();}
