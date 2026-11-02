import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1400,height:900}});
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 const targets=[
  {path:'/fixture/',ready:'#rows tr',expected:24},
  {path:'/resultados/',ready:'#results tr',expected:12},
  {path:'/apuestas/',ready:'#odds tr',expected:12},
  {path:'/estadisticas/',ready:'#ranking tr',expected:100}
 ];
 for(const item of targets){
  const response=await page.goto('https://race.cryptodromo.com'+item.path+'?alpha14='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200,'Cannot open '+item.path);
  try {
   await page.waitForSelector(item.ready,{timeout:12000});
  }catch(error){
   console.error('PUBLIC_PAGE_FAILURE',JSON.stringify({
    target:item.path,responseUrl:response?.url(),status:response?.status(),
    documentUrl:page.url(),title:await page.title(),
    domIds:await page.locator('[id]').evaluateAll(elements=>elements.map(e=>e.id).slice(0,40)),
    scripts:await page.locator('script[src]').evaluateAll(elements=>elements.map(e=>e.src)),
    faults:faults.slice(-12),
    bodyPreview:(await page.locator('body').innerText()).slice(0,850)
   }));
   throw error;
  }
  const actual=await page.locator(item.ready).count();
  if(item.path==='/fixture/')assert.ok(actual>0&&actual<=item.expected);
  else assert.equal(actual,item.expected,item.path+' count');
  console.log('PUBLIC_PAGE_OK',item.path,actual);
 }
 const disabled=await page.goto('https://race.cryptodromo.com/apuestas/?alpha14-noaction',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(disabled?.status(),200);
 assert.equal(await page.locator('button[aria-disabled="true"]').isDisabled(),true);
 assert.equal(faults.length,0,'Front-end page errors: '+faults.join('; ').slice(0,800));
 console.log('PASS: fixture, results, synthetic odds and 100-runner rankings');
}finally{await browser.close();}
