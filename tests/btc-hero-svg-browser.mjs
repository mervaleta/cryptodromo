import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:970},reducedMotion:'no-preference'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const resp=await page.goto('http://127.0.0.1:8912/laboratorio/btc-hero-horse.html',{waitUntil:'domcontentloaded'});
 assert.equal(resp.status(),200);
 const baseline=await page.evaluate(()=>window.__heroQA());
 assert.equal(baseline.mane,19);
 assert.equal(baseline.tail,15);
 await page.locator('#size').evaluate(el=>{el.value='1.65';el.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('#haircolor').evaluate(el=>{el.value='#5d3320';el.dispatchEvent(new Event('input',{bubbles:true}))});
 let s=await page.evaluate(()=>window.__heroQA());
 assert.equal(s.mane,19);assert.equal(s.tail,15);
 assert.equal(s.size,1.65);assert.equal(s.color,'#5d3320');
 await page.locator('#pause').click();
 assert.equal(await page.locator('#stage').getAttribute('class'),'stage paused');
 assert.deepEqual(errors,[]);
 mkdirSync('artifacts',{recursive:true});
 await page.locator('#stage').screenshot({path:'artifacts/btc-hero-svg-preview.png',timeout:30000});
 console.log('BTC_HERO_SVG_OK',JSON.stringify(s));
}finally{await browser.close()}