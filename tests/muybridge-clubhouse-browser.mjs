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
   const response=await page.goto(url+'/visual-lab/?track='+id+'&pavilion-qa=1',
     {waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response.status(),200,id+' page status');
   await page.waitForFunction(()=>typeof window.__cryptodromoPavilionQA?.snapshot==='function',
     null,{timeout:45000});
   const result=await page.evaluate(()=>window.__cryptodromoPavilionQA.snapshot());
   assert.equal(result.livePavilionGroupZ,-67,'wrong visible building group displacement');
   assert.equal(result.liveVIPWorldZ,-145,'real spires/roof not relocated');
   assert.equal(result.currentLayout,mode);
   assert.ok(result.ovalClearance>25,'building still on oval backstraight');
   assert.ok(result.standGap>=4,'no rear spectator walkway');
   assert.ok(result.straightClearance>25);
   assert.ok(result.sBendClearance>25);
   assert.equal(result.finishMarkerVisible,mode==='straight');
   assert.equal(result.visible,true);
   const camera=page.locator('#camera');
   if(await camera.count()) await camera.selectOption('aerial');
   await page.waitForTimeout(900);
   await page.screenshot({path:'/tmp/muybridge-clubhouse-'+id+'.png'});
   console.log('CLUBHOUSE_QA_OK',JSON.stringify({id,layout:mode,worldZ:result.liveVIPWorldZ,
     ovalClearance:result.ovalClearance}));
 }
 assert.deepEqual(errors,[],'no Javascript exceptions while switching broadcast channel');
}finally{
 await browser.close();
}
