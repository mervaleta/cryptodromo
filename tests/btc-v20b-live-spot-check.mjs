/**
 * Rapid, independently captured Chromium/WebGL screenshot from LIVE Hostinger.
 * This checks actual served public pixels, not GitHub source or a local server.
 * It does NOT approve the horse as AAA.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const BUILD='btc-v20b-native-hind-gallop-20261105';
const DIR='artifacts/btc-v20b-live-spot';mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1100,height:750},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error'&&!e.text().includes('favicon'))errors.push(e.text())});
try{
 await page.goto('https://race.cryptodromo.com/racers/?btcCapture=1&btcFreeze=1#BTC',
  {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(expected=>{
  const q=window.__cryptodromoBTCAtelierQA?.();
  return q?.symbol==='BTC'&&q.variant==='maya'&&q.drawCalls>0&&
   q.heroGroom?.harmonyBuild===expected&&
   q.heroGroom?.hindRestoration?.sameOriginalSkeleton===true;
 },BUILD,{timeout:70000});
 for(const phase of [4,8]){
  await page.evaluate(phase=>{
   document.querySelector('[data-btc-camera="profile"]')?.click();
   window.__cryptodromoBTCAtelierSetPose?.(phase);
  },phase);
  await page.waitForFunction(p=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===p,
   phase,{timeout:15000});
  await page.waitForTimeout(200);
  const bytes=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(bytes?.startsWith('data:image/png;base64,')&&bytes.length>30000,'Missing actual Hostinger WebGL pixels');
  writeFileSync(DIR+'/profile-'+String(phase).padStart(2,'0')+'.png',Buffer.from(bytes.split(',')[1],'base64'));
  console.log('BTC_V20B_LIVE_HOSTINGER_WEBGL_FRAME_CONFIRMED',phase);
 }
 const q=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(q.heroGroom?.hindRestoration?.donorHindTriangles>280);
 assert.deepEqual(errors,[],errors.join('\n'));
 writeFileSync(DIR+'/report.json',JSON.stringify({build:BUILD,publicUrl:page.url(),
  source:'Actual Hostinger-served public Three.js modules rendered with Chromium/WebGL',
  donor:q.heroGroom.hindRestoration,AAAApproved:false},null,2));
}finally{await browser.close();}
