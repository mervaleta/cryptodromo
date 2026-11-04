/**
 * Quality gate for the actual skinned WebGL horse. Compares V4 and V5 at
 * identical cameras and a frozen Gallop pose, then records real animated frames.
 * No stock imagery, screenshots used as textures, procedural RNG for ranking,
 * or changes to race logic are involved.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const out='artifacts/btc-v5/evidence';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const errors=[];
async function waitHero(page,version){
 await page.waitForFunction(version=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.symbol==='BTC'&&s?.heroGroom?.version===version&&s?.drawCalls>0;
 },version,{timeout:120000});
 await page.waitForTimeout(440);
}
async function setVariant(page,variant,version){
 await page.locator('[data-btc-variant="'+variant+'"]').click();
 await waitHero(page,version);
}
async function scorePair(page,a,b){
 // Decode the *real* WebGL screenshots in the same browser and compare RGB
 // (not compressed PNG bytes). No screenshot is ever displayed as scene content.
 return page.evaluate(async ({a,b})=>{
  const make=async encoded=>{
   const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
   return createImageBitmap(new Blob([bytes],{type:'image/png'}));
  };
  const first=await make(a),last=await make(b);
  if(first.width!==last.width||first.height!==last.height)throw Error('Render dimensions differ');
  const cv=document.createElement('canvas');cv.width=first.width;cv.height=first.height;
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(first,0,0);
  const A=ctx.getImageData(0,0,cv.width,cv.height).data;
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.drawImage(last,0,0);
  const B=ctx.getImageData(0,0,cv.width,cv.height).data;
  let changed=0,totalDelta=0;
  for(let i=0;i<A.length;i+=4){
   const delta=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);
   totalDelta+=delta;
   if(delta>56)changed++;
  }
  first.close();last.close();
  return {width:cv.width,height:cv.height,
   changedPixels:changed,changedFraction:changed/(A.length/4),
   meanChannelDifference:totalDelta/(A.length/4*3)};
 },{a:a.toString('base64'),b:b.toString('base64')});
}
try{
 const ctx=await browser.newContext({
  viewport:{width:1180,height:800},deviceScaleFactor:1,reducedMotion:'no-preference'
 });
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8799/racers/?btcPass=10&btcFreeze=1#BTC',{
  waitUntil:'domcontentloaded',timeout:90000
 });
 await waitHero(page,'btc-v5-motion-study-20261103');
 const result={head:'BTC V5 vs V4',source:'original GLB / native Gallop',
  pose:'frozen at same 0.3s clip offset',angles:{}};
 for(const view of ['profile','rear']){
  await page.locator('[data-btc-camera="'+view+'"]').click();
  await setVariant(page,'baseline','btc-real-hero-v4-20261103');
  await page.locator('[data-btc-camera="'+view+'"]').click();
  const v4=await page.locator('#horse-view').screenshot({
   path:out+'/btc-v4-'+view+'.png',timeout:60000
  });
  await setVariant(page,'enhanced','btc-v5-motion-study-20261103');
  await page.locator('[data-btc-camera="'+view+'"]').click();
  const v5=await page.locator('#horse-view').screenshot({
   path:out+'/btc-v5-'+view+'.png',timeout:60000
  });
  const score=await scorePair(page,v4,v5);
  // 1.2% of all viewport pixels with appreciable RGB change is a minimum
  // *technical* difference, not a subjective AAA approval.
  assert.ok(score.changedFraction>.012,
   'V5 must show a substantive visible change from V4 at '+view+': '+JSON.stringify(score));
  result.angles[view]=score;
  const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
  assert.equal(state.heroGroom.source,'original-skinned-glb');
  assert.ok(state.heroGroom.silkLocks>=140,'V5 lock topology not updated');
  assert.ok(state.heroGroom.silkShellVertices>=60000,'V5 silk masses not updated');
  assert.equal(state.heroGroom.nativeTailBones,7,'V5 tail must use seven native Gallop bones');
  console.log('BTC_V5_VS_V4_RENDER',view,JSON.stringify(score));
 }
 writeFileSync(out+'/v4-v5-pixel-comparison.json',JSON.stringify(result,null,2));
 await page.close();await ctx.close();

 // This is a REAL short video of the moving Three.js skeleton and
 // per-frame hair simulation. No media file is used to render the horse.
 const film=await browser.newContext({
  viewport:{width:1100,height:740},deviceScaleFactor:1,
  reducedMotion:'no-preference',recordVideo:{
   dir:out+'/raw-video',size:{width:1100,height:740}
  }
 });
 const filmPage=await film.newPage();
 filmPage.on('pageerror',e=>errors.push(e.message));
 await filmPage.goto('http://127.0.0.1:8799/racers/?btcPass=10#BTC',{
  waitUntil:'domcontentloaded',timeout:90000
 });
 await waitHero(filmPage,'btc-v5-motion-study-20261103');
 await filmPage.locator('[data-btc-camera="profile"]').click();
 // Film the horse, not the page header. Real WebGL remains in the visible
 // browser viewport throughout the shot. Explicitly fail if it is cropped.
 await filmPage.evaluate(()=>document.querySelector('.feature')?.scrollIntoView({
  block:'start',behavior:'instant'
 }));
 const coverage=await filmPage.evaluate(()=>{
  const rect=document.querySelector('#horse-view').getBoundingClientRect();
  const visible=Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0));
  return visible/rect.height;
 });
 assert.ok(coverage>.97,'The REAL gallop viewport must be fully on screen; got '+coverage);
 await filmPage.waitForTimeout(450);
 const start=await filmPage.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(start.fixedFrame,false);
 assert.ok(start.clips.includes('Gallop'));
 assert.equal(start.paused,false);
 await filmPage.waitForTimeout(3600);
 const mid=await filmPage.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(Math.abs(mid.hoofPhase-start.hoofPhase)>.005,'gallop must be running');
 // A browser automation click would scroll the hidden camera control into
 // view and push the horse OUT of the video frame. Dispatch it in-page.
 await filmPage.evaluate(()=>document.querySelector('[data-btc-camera="rear"]')?.click());
 const rearCoverage=await filmPage.evaluate(()=>{
  const rect=document.querySelector('#horse-view').getBoundingClientRect();
  return Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0))/rect.height;
 });
 assert.ok(rearCoverage>.97,'Rear camera must keep the FULL horse viewport visible');
 await filmPage.waitForTimeout(2700);
 const end=await filmPage.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(end.heroGroom.hairMotion.time>mid.heroGroom.hairMotion.time);
 assert.ok(end.heroGroom.hairMotion.energy>0.000001);
 const video=filmPage.video();
 await filmPage.close();
 await video.saveAs(out+'/btc-v5-real-WebGL-gallop.webm');
 await film.close();
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_V5_EVIDENCE_VIDEO_OK',JSON.stringify({
  durationSec:end.heroGroom.hairMotion.time,
  locks:end.heroGroom.silkLocks,drawCalls:end.drawCalls,visualScore:result.angles
 }));
}finally{await browser.close();}
