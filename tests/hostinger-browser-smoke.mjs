import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url='https://race.cryptodromo.com/stadiums/crypto/broadcast/?track=muybridge';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
let errors=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push('PAGE_ERROR '+error.message));
 page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push('CONSOLE_'+message.type()+' '+message.text());});
 page.on('requestfailed',req=>errors.push('REQUEST_FAILED '+req.url()+' '+req.failure()?.errorText));
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
 await page.locator('#live-now').click(); // enter manual replay, enabling controls
 const start=page.locator('#start');
 await start.click();
 await page.waitForTimeout(4000);
 const tick=await page.locator('#clock').innerText();
 console.log('Race clock after start',tick);
 console.log('Browser errors',JSON.stringify(errors));
 console.log('Module contract',JSON.stringify(await page.evaluate(async()=>{ try {const a=await import('/race-lab/source/src/data/raceFixture.js?debug=20261102');const b=await import('/race-lab/source/src/data/officialRace.js?debug=20261102');const entries=a.getRaceFixture(0,0).entries;let result;try{result=b.createOfficialRace(entries).map(x=>x.entry.symbol).slice(0,2);}catch(e){result=String(e);}return {sample:entries.slice(0,2).map(e=>({symbol:e.symbol,coefficients1:e.coefficients1,coefficients2:e.coefficients2})),expected:b.FIRST_COEFFICIENTS, result};}catch(e){return{error:String(e)}} })));

 console.log('Main script status',await page.evaluate(()=>({scripts: [...document.scripts].map(e=>({src:e.src,type:e.type})),status:document.querySelector('#raceStatus')?.textContent,canvas:document.querySelector('#raceCanvas')?.getContext('2d')!==null,diagnostics:[...document.querySelector('#sceneWrap').children].map(x=>({tag:x.tagName,text:x.textContent.slice(0,100)}))})));
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/cryptodromo-race-live.png',fullPage:true});
 assert.notEqual(tick,'00:00','Race clock did not start');
 await page.locator('#start').click();
 if(errors.length)throw new Error(errors.join('\n').slice(0,5000));
 console.log('PASS: production domain renders canvas, game starts, and clock advances. Screenshot saved.');
} finally{await browser.close();}
