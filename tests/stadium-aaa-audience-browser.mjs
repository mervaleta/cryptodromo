import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CRP_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
await mkdir('artifacts/stadium-aaa-audience',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1600,height:940}});
 const errors=[];
 // Capture rendered pixels through CDP: Playwright screenshot can stall while
 // animated SwiftShader frames keep invalidating the compositor surface.
 const cdp=await page.context().newCDPSession(page);
 const capture=async filename=>{
  const {data}=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  assert.ok(data?.length>1000,'Chromium returned no screenshot pixels');
  await writeFile('artifacts/stadium-aaa-audience/'+filename,Buffer.from(data,'base64'));
 };
 // QA may run in TV/embed mode where production controls are hidden, but present.
 const setControl=async (id,value)=>page.evaluate(({id,value})=>{
  const control=document.getElementById(id);
  if(!control)throw new Error('Missing control: '+id);
  control.value=value;
  control.dispatchEvent(new Event('change',{bubbles:true}));
 },{id,value});
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(new URL('/visual-lab/?track=genesis&audience-qa=1&finish-qa=alpha06&stadium-perf-qa=1',origin).toString(),{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false && window.__cryptodromoAudienceQA?.snapshot()?.groups?.length===8,null,{timeout:120000});
 const first=await page.evaluate(()=>window.__cryptodromoAudienceQA.snapshot());
 const staticQA=await page.evaluate(()=>window.__cryptodromoStaticQA?.snapshot());
 assert.equal(staticQA?.straight?.previousObjectCount,582);
 assert.equal(staticQA?.straight?.instancedDrawGroups,3);
 assert.equal(staticQA?.straight?.racingSurfaceModified,false);
 assert.ok(staticQA?.woodland?.previousObjectCount>0);
 assert.ok(staticQA?.woodland?.instancedDrawGroups<=4);
 assert.ok(staticQA?.skyline?.buildings>0);
 assert.ok(staticQA?.skyline?.windowBays>staticQA.skyline.buildings);
 assert.equal(staticQA?.skyline?.affectsRace,false);
 assert.equal(first.articulated,true);
 assert.equal(first.remoteGrandstand.parts,8);
 assert.equal(first.remoteGrandstand.originalCoordinatesRetained,true);
 assert.equal(first.remoteGrandstand.trackModified,false);
 assert.ok(first.remoteVisible>0 && first.remoteVisible<=first.remoteGrandstand.people,
  'GPU quality scaling may reduce population, never grow past fixture');
 assert.equal(first.layout,'straight');
 assert.equal(first.groups.find(x=>x.name.endsWith('arms')).count,first.crowd*2);
 assert.ok(first.drawCalls>0);
 await setControl('graphics-quality','balanced');
 await setControl('camera','overview');
 await setControl('weather','noon');
 await page.waitForTimeout(1200);
 await capture('01-overview-day.png');
 await setControl('camera','rail');
 await page.waitForTimeout(1000);
 await capture('02-rail-day.png');
 await setControl('weather','night');
 await page.waitForTimeout(1200);
 await capture('03-rail-night.png');
 await setControl('layout','oval');
 await page.waitForFunction(()=>!window.__cryptodromoAudienceQA.snapshot().visible);
 await capture('04-oval-clearance.png');
 assert.deepEqual(errors,[]);
 console.log('PASS real WebGL audience',first.crowd,first.drawCalls);
} finally {await browser.close();}
