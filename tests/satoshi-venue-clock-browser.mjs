import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CRP_CLOCKS_BASE||'http://127.0.0.1:4173';
const pagePath='/stadiums/crypto/?clock-qa=1&verify=satoshi-venue-clocks-20261104-v1';
const browser=await chromium.launch({headless:true});
const errors=[];
const expectedNames=['muybridge','genesis','vint-cerf'];
const url=new URL(pagePath,origin).toString();
await mkdir('artifacts/satoshi-venue-clocks',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1450,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 assert.equal(response?.status(),200,'Satoshi landing must return HTTP 200');
 await page.waitForFunction(()=>!!window.__crpStadiumClocksQA,{timeout:30000});
 const actual=await page.evaluate(()=>window.__crpStadiumClocksQA.setTime('2026-11-04T17:42:14Z'));
 assert.deepEqual(actual.map(v=>v.track),expectedNames);
 assert.deepEqual(actual.map(v=>v.countdown),['00:16','01:16','02:16']);
 assert.deepEqual(actual.map(v=>v.phase),['presentation','results','race']);
 assert.deepEqual(actual.map(v=>v.raceLabel.match(/largada ([0-9:]+)/)?.[1]),
  ['14:42:30','14:43:30','14:44:30']);
 await page.screenshot({path:'artifacts/satoshi-venue-clocks/staggered-001-002-003.png',timeout:20000});
 for(const iso of ['2026-11-04T17:42:29Z','2026-11-04T17:42:30Z',
    '2026-11-04T17:43:30Z','2026-11-04T17:44:30Z','2026-11-05T02:59:29Z']){
  const rows=await page.evaluate(value=>window.__crpStadiumClocksQA.setTime(value),iso);
  const timers=rows.map(x=>{
   const [m,s]=x.countdown.split(':').map(Number);
   return m*60+s;
  }).sort((a,b)=>a-b);
  assert.deepEqual([timers[1]-timers[0],timers[2]-timers[1]],[60,60],iso);
 }
 const real=await page.evaluate(()=>window.__crpStadiumClocksQA.clearTime());
 assert.ok(real.every(v=>/^\d{2}:\d{2}$/.test(v.countdown)));
 assert.equal(await page.locator('[data-track] [data-countdown]').count(),3);
 assert.equal(await page.locator('iframe').count(),0,'Landing must not instantiate TV player');
 assert.deepEqual(errors,[],'Browser JS errors: '+errors.join('; '));
 console.log('PASS: real Satoshi stadium page shows three independent next-race countdowns at 60-second offsets');
}finally{await browser.close();}
