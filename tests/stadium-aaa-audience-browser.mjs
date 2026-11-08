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
  const probe=await page.evaluate(()=>window.__cryptodromoOcclusionQA?.snapshot());
  assert.ok(probe,'Missing camera occlusion diagnostic');
  assert.equal(probe.samples?.length,25,'Expected 25 camera rays per screenshot');
  assert.ok(probe.samples.every(sample=>sample.hit===null || typeof sample.hit==='object'));
  if(filename==='02-rail-day.png'||filename==='03-rail-night.png'){
   // Guard against the P0 seen in the actual Nov 5 images: the rail lens
   // looked straight through the starting-gate roof and posts at t=00:00.
   const gateHits=probe.samples.filter(sample=>
    sample.hit?.chain?.includes('Alpha20 broadcast start gates'));
   assert.ok(gateHits.length<=4,
    filename+': gate structure still occludes '+gateHits.length+'/25 rays');
   assert.ok(gateHits.every(sample=>sample.x!==0),
    filename+': gate structure occludes the central rail sightline');
  }
  await writeFile('artifacts/stadium-aaa-audience/'+filename.replace(/\.png$/,'.occlusion.json'),JSON.stringify(probe,null,2));
  const {data}=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  assert.ok(data?.length>1000,'Chromium returned no screenshot pixels');
  await writeFile('artifacts/stadium-aaa-audience/'+filename,Buffer.from(data,'base64'));
  return probe;
 };
 // QA may run in TV/embed mode where production controls are hidden, but present.
 const setControl=async (id,value)=>page.evaluate(({id,value})=>{
  const control=document.getElementById(id);
  if(!control)throw new Error('Missing control: '+id);
  control.value=value;
  control.dispatchEvent(new Event('change',{bubbles:true}));
 },{id,value});
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(new URL('/visual-lab/?track=genesis&audience-qa=1&finish-qa=alpha06&stadium-perf-qa=1&stadium-occlusion-qa=1',origin).toString(),{waitUntil:'domcontentloaded',timeout:45000});
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
 // WebGL software rasterization can take longer than 1s to settle from the
 // high overview shot; measure the actual rail camera, not a transition frame.
 await page.waitForFunction(()=>{
  const shot=window.__cryptodromoOcclusionQA?.snapshot();
  return shot?.view==='rail'
   && Math.abs(shot.camera[1]-2.8)<.7
   && Math.abs(shot.camera[2]-32)<1.6;
 },null,{timeout:45000,polling:500});
 // A screenshot can be taken while the smoothed camera is still moving,
 // even after an earlier waitForFunction passed. Verify the actual saved
 // camera snapshots at both lighting states, not just the requested preset.
 const dayRail=await capture('02-rail-day.png');
 await setControl('weather','night');
 await page.waitForTimeout(1200);
 const nightRail=await capture('03-rail-night.png');
 for(const [label,shot] of [['day',dayRail],['night',nightRail]]){
  assert.equal(shot.layout,'straight',label+' rail layout drift');
  assert.equal(shot.view,'rail',label+' rail view drift');
  assert.ok(Math.abs(shot.camera[2]-32)<2,label+' rail camera did not settle to launch offset: '+shot.camera);
 }
 assert.ok(Math.hypot(...dayRail.camera.map((n,i)=>n-nightRail.camera[i]))<2.5,
  'Day/night rail screenshots are not geometrically comparable at t=00:00');
 // Camera position alone cannot guarantee equivalent photographs: a moving
 // look-at target can rotate the rail lens while its origin stays fixed.
 // Compare the exact focus recorded alongside each saved PNG.
 for(const [label,shot] of [['day',dayRail],['night',nightRail]]){
  assert.equal(shot.elapsed,0,label+' rail capture must be at launch');
  assert.ok(Array.isArray(shot.focus)&&shot.focus.length===3
   &&shot.focus.every(Number.isFinite),label+' rail focus is invalid');
  assert.ok(shot.samples.some(sample=>sample.x===0&&sample.y===0),
   label+' rail diagnostic lacks central sightline');
 }
 assert.ok(Math.hypot(...dayRail.focus.map((n,i)=>n-nightRail.focus[i]))<2.5,
  'Day/night rail focus differs despite matching camera positions');
 await setControl('layout','oval');
 await page.waitForFunction(()=>!window.__cryptodromoAudienceQA.snapshot().visible);
 await capture('04-oval-clearance.png');
 assert.deepEqual(errors,[]);
 console.log('PASS real WebGL audience',first.crowd,first.drawCalls);
} finally {await browser.close();}
