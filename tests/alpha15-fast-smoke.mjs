import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1200,height:760}});
 const faults=[];
 page.on('pageerror',error=>faults.push(error.message));
 page.on('console',message=>{if(message.type()==='error')faults.push('console: '+message.text());});
 page.on('response',response=>{if(response.status()>=400)faults.push('HTTP '+response.status()+' '+response.url());});
 for(const [url,selector,min,max] of [
  ['/resultados/','#results tr',12,12],
  ['/cronicas/','#articles .story',1,12],
  ['/apuestas/','#odds tr',12,12],
  ['/fixture/','#rows tr',1,24],
  ['/estadisticas/','#ranking tr',100,100]
 ]){
  faults.length=0;
  const response=await page.goto('https://race.cryptodromo.com'+url+'?fast-qa=alpha15-'+Date.now(),
    {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200,'HTTP '+url);
  try{await page.waitForSelector(selector,{timeout:15000});}
  catch(error){
   const info=await page.evaluate(()=>({
    title:document.title,
    script:[...document.querySelectorAll('script[src]')].map(s=>s.src),
    status:document.querySelector('[role=status]')?.textContent,
    body:document.body.innerText.slice(0,300)
   }));
   console.log('FAST_FAILURE',url,JSON.stringify({faults,info}));
   throw error;
  }
  const count=await page.locator(selector).count();
  assert.ok(count>=min&&count<=max,'rows '+url+': '+count);
  console.log('FAST_PASS',url,{count,errors:faults});
  assert.equal(faults.length,0,'JS '+url+': '+faults.join('; ').slice(0,900));
  if(url==='/resultados/'){
   assert.equal(await page.locator('#results tr:first-child td').count(),7,'Expected split bonus and points columns');
   assert.match(await page.locator('thead').innerText(),/Bonus parciales/i);
  }
  if(url==='/estadisticas/'){
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('puntos calculados'),{timeout:45000});
   assert.equal(await page.locator('#ranking tr:first-child td').count(),10,'Expected complete championship scores');
  }
 }
 faults.length=0;
 const response=await page.goto('https://race.cryptodromo.com/visual-lab/?fast-qa=alpha15',
   {waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(response?.status(),200);
 try{
  await page.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,{timeout:35000});
 }catch(error){
  const diagnostic=await page.evaluate(async()=>{
   const response=await fetch('/visual-lab/scene.js?no-cache='+Date.now(),{cache:'no-store'});
   return {url:location.href,stage:document.querySelector('#stage')?.getBoundingClientRect().toJSON(),
    status:document.querySelector('#status')?.textContent,
    message:document.querySelector('#message')?.textContent,
    start:document.querySelector('#start')?.outerHTML,
    scripts:[...document.scripts].map(x=>x.src).filter(Boolean),sceneStatus:response.status};
  });
  console.error('ALPHA16_3D_LOAD_FAILURE',JSON.stringify({diagnostic,faults:faults.slice(-15)}));
  throw error;
 }
 const stage=await page.evaluate(()=>({
  horses:document.querySelectorAll('#standings li').length,
  clouds:!!document.querySelector('#cloud-cover'),
  fog:!!document.querySelector('#fog-intensity'),
  quality:!!document.querySelector('#graphics-quality'),
  script:document.querySelector('script[src*="scene.js"]')?.src,
  status:document.querySelector('#status')?.textContent
 }));
 console.log('3D_FAST',stage, faults);
 await page.waitForSelector('#race-splits .crp-split-checkpoint',{timeout:12000});
 const splitState=await page.evaluate(()=>({
  checkpoints:document.querySelectorAll('#race-splits .crp-split-checkpoint').length,
  preset:document.querySelector('#split-mode')?.value,
  markersModule:document.querySelector('script[src*="scene.js"]')?.src
 }));
 assert.equal(splitState.checkpoints,4,'Four split checkpoints must render');
 assert.equal(splitState.preset,'quarters');
 assert.equal(stage.horses,12);
 assert.ok(stage.clouds&&stage.fog&&stage.quality);
 assert.match(stage.script||'',/alpha16-village-2/);
 assert.equal(faults.length,0,'3D runtime faults '+faults.join('; ').slice(0,800));
 // Alpha16 is a separate contemplative path: never replaces LIVE.
 faults.length=0;
 const paradeResponse=await page.goto('https://race.cryptodromo.com/parade/?fast-qa=alpha16',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(paradeResponse?.status(),200,'Parade public page');
 await page.waitForFunction(()=>window.__cryptodromoParadeQA?.snapshot().ready,{timeout:45000});
 const parade=await page.evaluate(()=>window.__cryptodromoParadeQA.snapshot());
 assert.equal(parade.parade.totalParaders,100);
 assert.equal(parade.models,12);
 assert.ok(parade.walkClips.every(clip=>/walk/i.test(clip)), 'GLB walk mode must be available');
 assert.equal(parade.village.stands,3);
 assert.equal(parade.village.foodStalls,6);
 assert.equal(parade.village.bulbs,48);
 console.log('PARADE_LIVE',JSON.stringify({
  models:parade.models,active:parade.parade.horses.length,
  total:parade.parade.totalParaders,clips:parade.walkClips.slice(0,2)
 }));
 assert.equal(faults.length,0,'Parade JS runtime faults: '+faults.join('; ').slice(0,800));
 console.log('PASS Alpha16 public quick production smoke test');
}finally{await browser.close();}
