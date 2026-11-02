import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url='https://race.cryptodromo.com/';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
let errors=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push('PAGE_ERROR '+error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push('CONSOLE_ERROR '+message.text());});
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 assert.equal(response?.status(),200);
 await page.waitForSelector('#raceCanvas',{timeout:30000});
 await page.waitForFunction(()=>{
    const c=document.querySelector('#raceCanvas');return c&&c.width>0&&c.height>0;
 },{timeout:30000});
 // Allow the GLTF and environment to initialize before checking animation.
 await page.waitForTimeout(3500);
 const init=await page.evaluate(()=>({
  diagnostic:document.querySelector('#sceneWrap>div[style*="position: absolute"]')?.textContent||document.querySelector('#sceneWrap')?.textContent?.slice(-120)||'',
  body:document.querySelector('body')?.innerText?.slice(0,300),
  canvasSize:[document.querySelector('#raceCanvas').width,document.querySelector('#raceCanvas').height],
  modelScripts:[...document.scripts].map(s=>s.src).filter(Boolean),
 }));
 console.log('Browser initialization',JSON.stringify(init));
 const start=page.locator('#startButton');
 await start.click();
 await page.waitForTimeout(4000);
 const tick=await page.locator('#raceClock').innerText();
 console.log('Race clock after start',tick);
 assert.notEqual(tick,'00:00','Race clock did not start');
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/cryptodromo-race-live.png',fullPage:true});
 await page.locator('#startButton').click();
 if(errors.length)throw new Error(errors.join('\n').slice(0,5000));
 console.log('PASS: production domain renders canvas, game starts, and clock advances. Screenshot saved.');
} finally{await browser.close();}
