import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.CRP_DUST_BASE||'http://127.0.0.1:8799';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
try{
 const page=await browser.newPage({viewport:{width:1350,height:780},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto(new URL('/stadiums/crypto/broadcast/index.html?track=muybridge&hoof-qa=1',base).toString(),{
  waitUntil:'domcontentloaded',timeout:45000
 });
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>
  document.querySelector('#start')?.disabled===false&&
  window.__cryptodromoHoofQA?.snapshot(),
  null,{timeout:110000});
 // The timeline is synthetic, but the rendered 12 horses must produce dust.
 await page.evaluate(()=>{
  if(!window.__cryptodromoHoofQA.snapshot().running)document.getElementById('start').click();
 });
 await page.waitForFunction(()=>{
  const q=window.__cryptodromoHoofQA?.snapshot();
  return q?.running&&q.raceDustVisible&&q.raceDustCount>0;
 },null,{timeout:25000,polling:300});
 for(const surface of ['dirt','sand','grass']){
  await page.locator('#surface').selectOption(surface);
  await page.waitForFunction(s=>{
   const q=window.__cryptodromoHoofQA?.snapshot();
   return q?.surface===s&&q?.raceDustVisible&&!q?.visibleGroundStains;
  },surface,{timeout:15000,polling:250});
  const q=await page.evaluate(()=>window.__cryptodromoHoofQA.snapshot());
  assert.equal(q.visibleGroundStains,false,'Black hoof decals must not appear in races');
  assert.equal(q.raceDustVisible,true,'Airborne gallop dust missing on '+surface);
  assert.ok(q.raceDustCount>=20,'Too few airborne plume points on '+surface);
  assert.ok(q.impacts>=0,'Hoof contact system must remain alive');
  console.log('PASS_RACE_DUST',surface,JSON.stringify({
   dustVisible:q.raceDustVisible,dustPoints:q.raceDustCount,
   groundStains:q.visibleGroundStains,impacts:q.impacts
  }));
 }
 assert.deepEqual(errors,[],errors.join('; '));
}finally{
 await browser.close();
}
