import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const url=process.env.CRP_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 for(const [id,mode] of [['muybridge','oval'],['genesis','straight'],['vint-cerf','s-bend']]){
   const response=await page.goto(url+'/visual-lab/?track='+id+'&pavilion-qa=1&finish-qa=alpha06&camera-qa=alpha17',
     {waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response.status(),200,id+' page status');
   await page.waitForFunction(()=>typeof window.__cryptodromoPavilionQA?.snapshot==='function' &&
     document.querySelector('#start')?.disabled===false &&
     document.querySelector('#presentation-overlay')?.hidden===true,
     null,{timeout:120000});
   const result=await page.evaluate(()=>window.__cryptodromoPavilionQA.snapshot());
   assert.equal(result.livePavilionGroupZ,-67,'wrong visible building group displacement');
   assert.equal(result.liveVIPWorldZ,-145,'real spires/roof not relocated');
   assert.equal(result.grandstandCameraZ,-119,'broadcast must look from the actual spectator bank');
   assert.equal(result.currentLayout,mode);
   assert.ok(Math.abs(result.ovalClearance-36.5)<.15,
     'Hostinger clearance must match the real oval backstretch, not cached geometry');
   assert.ok(result.standGap>=4,'no rear spectator walkway');
   assert.ok(result.straightClearance>25);
   assert.ok(result.sBendClearance>25);
   assert.equal(result.finishMarkerVisible,mode==='straight');
   assert.equal(result.visible,true);
   assert.equal(result.detailVersion,'satoshi-vip-architecture-20261105-v1');
   assert.equal(result.detailSupported,true,'upper floor must have real ground supports');
   assert.ok(result.detailBatches>=8 && result.detailBatches<=12,'draw-call budget');
   assert.ok(result.detailInstances>100,'building contains actual modelled elements');
   assert.ok(result.detailBounds.minZ>=-13.5 && result.detailBounds.maxZ<=15.5,
     'architectural detail may not escape the established pavilion/forecourt footprint');
   // LIVE can disable manual camera dropdown while following a broadcast.
   // For screenshot QA change its value without waiting for user enablement.
   await page.evaluate(()=>{
     const camera=document.getElementById('camera');
     if(camera&&[...camera.options].some(o=>o.value==='architecture')){
       camera.value='architecture';
       camera.dispatchEvent(new Event('change',{bubbles:true}));
     }
   });
   await page.waitForFunction(()=>window.__cryptodromoCameraQA?.state()?.view==='architecture');
   await page.waitForTimeout(1700);
   assert.equal(await page.locator('#presentation-overlay').isVisible(),false,
     'Do not approve photos with a presentation scrim hiding the building');
   await page.screenshot({path:'/tmp/muybridge-clubhouse-'+id+'.png'});
   await page.locator('#stage').screenshot({path:'/tmp/muybridge-clubhouse-'+id+'-architecture.png'});
   // Camera and lighting are the real controls used by the LIVE page, not
   // synthetic render images. The select may be hidden in TV/embed mode.
   await page.evaluate(()=>{
     const weather=document.getElementById('weather');
     if(!weather)throw new Error('Missing weather control');
     weather.value='night';weather.dispatchEvent(new Event('change',{bubbles:true}));
   });
   await page.waitForFunction(()=>window.__cryptodromoPavilionQA.snapshot().detailNight===true);
   await page.waitForTimeout(1300);
   await page.screenshot({path:'/tmp/muybridge-clubhouse-'+id+'-night.png'});
   await page.locator('#stage').screenshot({path:'/tmp/muybridge-clubhouse-'+id+'-architecture-night.png'});
   console.log('CLUBHOUSE_QA_OK',JSON.stringify({id,layout:mode,worldZ:result.liveVIPWorldZ,
     ovalClearance:result.ovalClearance}));
 }
 assert.deepEqual(errors,[],'no Javascript exceptions while switching broadcast channel');
}finally{
 await browser.close();
}
