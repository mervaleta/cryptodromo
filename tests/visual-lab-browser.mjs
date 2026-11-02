import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('PAGE '+e.message));
 page.on('requestfailed',r=>errors.push('REQUEST '+r.url()+' '+r.failure()?.errorText));
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text());});
 const res=await page.goto('https://race.cryptodromo.com/visual-lab/?ci=20261102',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(res?.status(),200,'Live visual lab must exist on Hostinger');
 await page.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,{timeout:30000});
 const initial=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],horses:document.querySelectorAll('#standings li').length}));
 console.log('SCENE_INIT',JSON.stringify(initial));
 assert.ok(initial.canvas[0]>=1000);
 assert.equal(initial.horses,12);
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/alpha3-stadium.png',fullPage:false});
 await page.click('#start');
 await page.waitForTimeout(6500);
 const clock=await page.locator('#clock').innerText();
 console.log('CLOCK_AFTER_START',clock);
 console.log('BROWSER_ERRORS',JSON.stringify(errors.slice(0,15)));
 await page.screenshot({path:'artifacts/alpha3-racing.png',fullPage:false});
 assert.notEqual(clock,'00:00','Race timeline did not advance');
 assert.ok(!errors.length,'Browser errors: '+errors.join('; ').slice(0,1200));
 console.log('PASS: interactive live Three.js race, 12 horses, scene screenshot');
}finally{await browser.close();}
