import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CRP_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
await mkdir('artifacts/stadium-aaa-audience',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1600,height:940}});
 const errors=[];
 // QA may run in TV/embed mode where production controls are hidden, but present.
 const setControl=async (id,value)=>page.evaluate(({id,value})=>{
  const control=document.getElementById(id);
  if(!control)throw new Error('Missing control: '+id);
  control.value=value;
  control.dispatchEvent(new Event('change',{bubbles:true}));
 },{id,value});
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(new URL('/visual-lab/?track=genesis&audience-qa=1',origin).toString(),{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false && window.__cryptodromoAudienceQA?.snapshot()?.groups?.length===8,null,{timeout:120000});
 const first=await page.evaluate(()=>window.__cryptodromoAudienceQA.snapshot());
 assert.equal(first.articulated,true);
 assert.equal(first.remoteGrandstand.parts,8);
 assert.equal(first.remoteGrandstand.originalCoordinatesRetained,true);
 assert.equal(first.remoteGrandstand.trackModified,false);
 assert.equal(first.remoteVisible,first.remoteGrandstand.people);
 assert.equal(first.layout,'straight');
 assert.equal(first.groups.find(x=>x.name.endsWith('arms')).count,first.crowd*2);
 assert.ok(first.drawCalls>0);
 await setControl('camera','overview');
 await setControl('weather','noon');
 await page.waitForTimeout(1200);
 await page.screenshot({path:'artifacts/stadium-aaa-audience/01-overview-day.png'});
 await setControl('camera','rail');
 await page.waitForTimeout(1000);
 await page.screenshot({path:'artifacts/stadium-aaa-audience/02-rail-day.png'});
 await setControl('weather','night');
 await page.waitForTimeout(1200);
 await page.screenshot({path:'artifacts/stadium-aaa-audience/03-rail-night.png'});
 await setControl('layout','oval');
 await page.waitForFunction(()=>!window.__cryptodromoAudienceQA.snapshot().visible);
 await page.screenshot({path:'artifacts/stadium-aaa-audience/04-oval-clearance.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS real WebGL audience',first.crowd,first.drawCalls);
} finally {await browser.close();}
