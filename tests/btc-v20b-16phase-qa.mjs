/**
 * BTC V20b visual rejection gate: every one of the native Gallop's 16 phases
 * must render in Chromium/WebGL. A passing run is NOT an AAA approval.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const DIR='artifacts/btc-v20b-full-cycle';mkdirSync(DIR,{recursive:true});
const BUILD='btc-v20b-native-hind-gallop-20261105';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:750},deviceScaleFactor:1});
const errors=[],frames=[],all=new Set();
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(build=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.harmonyBuild===build&&s.drawCalls>0&&s.clips?.includes('Gallop');
 },BUILD,{timeout:120000});
 const baseline=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(baseline.heroGroom?.hindRestoration?.sameOriginalSkeleton);
 async function capture(camera,index){
  await page.evaluate(name=>document.querySelector('[data-btc-camera="'+name+'"]')?.click(),camera);
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),index);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,index,{timeout:15000});
  await page.waitForTimeout(160);
  const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>20000,'Empty WebGL frame '+camera+index);
  const bytes=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
  const sha=await import('node:crypto').then(c=>c.createHash('sha256').update(bytes).digest('hex'));
  const name=camera+'-'+String(index).padStart(2,'0')+'.png';
  writeFileSync(DIR+'/'+name,bytes);
  frames.push({name,camera,index,sha,bytes:bytes.length});
  if(camera==='profile')all.add(sha);
  console.log('BTC_V20B_FRAME',camera,index,bytes.length);
 }
 for(let i=0;i<16;i++)await capture('profile',i);
 for(const i of [0,4,8,12])await capture('threeQuarter',i);
 for(const i of [0,8])await capture('rear',i);
 assert.equal(all.size,16,'Original native Gallop must produce 16 distinct actual WebGL poses');
 assert.deepEqual(errors,[],errors.join('\n'));
 writeFileSync(DIR+'/qa.json',JSON.stringify({
  build:BUILD,source:'actual original Quaternius GLB authored Gallop plus original Maya 2017 torso',
  liveHostingerVerified:false,AAAApproved:false,photographs:frames,
  hind:baseline.heroGroom.hindRestoration,
  visualGate:'Inspect all profile frames for hock inversion, hoof detachment, thigh seam and tissue spikes'
 },null,2));
 console.log('BTC_V20B_16_POSES_REAL_WEBGL_COMPLETE',frames.length);
}finally{await page.close();await browser.close();}
