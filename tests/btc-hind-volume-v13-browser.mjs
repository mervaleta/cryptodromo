/**
 * Deterministic native Gallop phase sweep on the actual BTC master,
 * 16 frames over one original 0.583s clip. The freeze-only QA hook
 * advances the existing horse/mixer, without reauthoring the animation.
 * Capture front/profile/rear evidence. No production URL is mutated.
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
const base=process.env.BTC_BASE_URL||'http://127.0.0.1:8799';
const dir='artifacts/btc-hind-volume-v13';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--enable-unsafe-swiftshader'
]});
const errors=[];
const report={build:'btc-hind-pose-volume-20261104-v13',frames:[],views:['profile','rear','front'],source:'actual native Gallop mixer with QA-only fixed frame'};
try{
 const page=await browser.newPage({viewport:{width:1320,height:840},
  deviceScaleFactor:1,reducedMotion:'no-preference'});
 page.on('pageerror',err=>errors.push('page: '+err.message));
 page.on('console',msg=>{
  if(msg.type()==='error'&&!msg.text().includes('favicon'))
   errors.push('console: '+msg.text());
 });
 await page.goto(base+'/racers/?btcFreeze=1#BTC',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.poseBuild==='btc-hind-pose-volume-dq-20261104-v13'&&
   s.drawCalls>0&&typeof window.__cryptodromoBTCAtelierAdvanceFrame==='function';
 },null,{timeout:120000});
 const start=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(start.heroGroom.gallopPreserved,true);
 assert.equal(start.heroGroom.originalRig,true);
 assert.equal(start.heroGroom.hindVolumeConsistent,true);
 assert.equal(start.heroGroom.volumeSkinMethod,'masked-dual-quaternion');
 assert.ok(start.heroGroom.hindVolumeStrength>.9);
 assert.ok(start.clips.includes('Gallop'));
 const step=0.583/16;
 await page.locator('[data-btc-camera="profile"]').click();
 for(let i=0;i<16;i++){
   const next=await page.evaluate(dt=>window.__cryptodromoBTCAtelierAdvanceFrame(dt),step);
   assert.ok(next&&Number.isFinite(next.phase),'native Gallop pose did not advance');
   const snap=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
   assert.equal(snap.variant,'maya');
   assert.equal(snap.heroGroom.poseBuild,'btc-hind-pose-volume-dq-20261104-v13');
   report.frames.push({frame:i,phase:Number(snap.hoofPhase.toFixed(5)),
    skin:snap.heroGroom.volumeSkinMethod,drawCalls:snap.drawCalls});
   const id=String(i).padStart(2,'0');
   await page.locator('#horse-view').screenshot({path:dir+'/profile-'+id+'.png',timeout:90000,animations:'allow'});
   assert.ok(statSync(dir+'/profile-'+id+'.png').size>10000,'missing rendered WebGL evidence for pose '+id);
   if([0,4,8,12].includes(i)){
     for(const view of ['rear','front']){
       await page.locator('[data-btc-camera="'+view+'"]').click();
       await page.waitForTimeout(90);
       await page.locator('#horse-view').screenshot({path:dir+'/'+view+'-'+id+'.png',timeout:90000});
     }
     await page.locator('[data-btc-camera="profile"]').click();
   }
 }
 const unique=new Set(report.frames.map(x=>x.phase));
 assert.ok(unique.size>=12,'phase sweep must sample at least 12 distinct Gallop poses; got '+unique.size);
 assert.ok(report.frames.every(x=>x.drawCalls>0));
 assert.deepEqual(errors,[],errors.join('\n'));
 writeFileSync(dir+'/phase-report.json',JSON.stringify(report,null,2));
 console.log('BTC_V13_VOLUME_POSE_SWEEP_OK',JSON.stringify({phases:unique.size,frames:16,heroGroom:start.heroGroom.poseBuild}));
 await page.close();
}finally{await browser.close();}
