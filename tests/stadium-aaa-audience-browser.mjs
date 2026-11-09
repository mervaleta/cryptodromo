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
  const {data}=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  // A pre-capture ray snapshot is only valid for this PNG if the camera did
  // not move during CDP capture. Reject transition frames rather than archive
  // geometrically mismatched image/raycast evidence.
  const after=await page.evaluate(()=>window.__cryptodromoOcclusionQA?.snapshot());
  assert.equal(after?.layout,probe.layout,filename+': layout changed during screenshot');
  assert.equal(after?.view,probe.view,filename+': view changed during screenshot');
  for(const key of ['camera','focus']){
   assert.ok(Array.isArray(probe[key])&&Array.isArray(after?.[key])&&probe[key].length===3&&after[key].length===3,
    filename+': missing '+key+' for capture synchronization');
   const drift=Math.hypot(...probe[key].map((n,i)=>n-after[key][i]));
   assert.ok(drift<0.35,filename+': '+key+' drifted '+drift.toFixed(3)+'m while screenshot was captured');
  }
  assert.equal(after?.elapsed,probe.elapsed,filename+': race time changed during screenshot');
  assert.ok(data?.length>1000,'Chromium returned no screenshot pixels');
  const png=Buffer.from(data,'base64');
  // Reject blank/truncated or wrong-viewport evidence before archiving it.
  // PNG IHDR dimensions are authoritative for the actual CDP frame, not the DOM.
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',filename+': invalid PNG signature');
  assert.equal(png.toString('ascii',12,16),'IHDR',filename+': missing PNG header');
  assert.equal(png.readUInt32BE(16),1600,filename+': unexpected screenshot width');
  assert.equal(png.readUInt32BE(20),940,filename+': unexpected screenshot height');
  // IHDR alone does not establish a complete PNG: CDP can return a truncated
  // stream with a valid header. Require the terminal zero-length IEND chunk.
  assert.ok(png.length>=45,filename+': PNG too short');
  assert.equal(png.subarray(-12,-8).toString('hex'),'00000000',filename+': missing zero-length IEND');
  assert.equal(png.toString('ascii',png.length-8,png.length-4),'IEND',filename+': truncated PNG');
  assert.equal(png.subarray(-4).toString('hex'),'ae426082',filename+': invalid IEND CRC');
  // Only persist the JSON/PNG pair after the image has passed validation.
  await writeFile('artifacts/stadium-aaa-audience/'+filename,png);
  await writeFile('artifacts/stadium-aaa-audience/'+filename.replace(/\.png$/,'.occlusion.json'),JSON.stringify(probe,null,2));
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
 // The rail preset can enter its broad y/z tolerance while still panning
 // from overview. Require a stable origin AND look-at target before both
 // captures, otherwise day/night ray parity can compare transition frames.
 const waitForStableRail=async()=>{
  let previous=null,stable=0;
  for(let attempt=0;attempt<80;attempt++){
   await page.waitForTimeout(250);
   const shot=await page.evaluate(()=>window.__cryptodromoOcclusionQA?.snapshot());
   assert.equal(shot?.view,'rail','Rail view changed while settling');
   assert.equal(shot?.layout,'straight','Rail layout changed while settling');
   if(previous){
    const movement=Math.hypot(...shot.camera.map((n,i)=>n-previous.camera[i]));
    const aim=Math.hypot(...shot.focus.map((n,i)=>n-previous.focus[i]));
    stable=movement<0.08&&aim<0.08?stable+1:0;
    if(stable>=3)return;
   }
   previous=shot;
  }
  throw new Error('Rail camera/focus did not stabilize before screenshot');
 };
 await waitForStableRail();
 const dayRail=await capture('02-rail-day.png');
 await setControl('weather','night');
 await page.waitForTimeout(1200);
 await waitForStableRail();
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

 // Lighting must not change the geometry of the launch canopy. A clear
 // central ray in daylight but a blocked one at night indicates stale or
 // non-equivalent visual evidence even when both screenshots are valid PNGs.
 const gateSignature=shot=>shot.samples
  .filter(sample=>sample.hit?.chain?.includes('Alpha20 broadcast start gates'))
  .map(sample=>[sample.x,sample.y].join(',')).sort();
 assert.deepEqual(gateSignature(nightRail),gateSignature(dayRail),
  'Day/night rail gate occlusion rays differ at the same launch pose');
 const centralRay=shot=>shot.samples.find(sample=>sample.x===0&&sample.y===0);
 assert.equal(Boolean(centralRay(dayRail)?.hit?.chain?.includes('Alpha20 broadcast start gates')),false,
  'Day rail central sightline intersects the Alpha20 canopy');
 assert.equal(Boolean(centralRay(nightRail)?.hit?.chain?.includes('Alpha20 broadcast start gates')),false,
  'Night rail central sightline intersects the Alpha20 canopy');
 // Switching layouts while the rail preset is active can leave the oval
 // photograph pointed at the straight-course launch rail. Explicitly use
 // the course overview for cross-layout architectural clearance evidence.
 await setControl('camera','overview');
 await setControl('layout','oval');
 await page.waitForFunction(()=>!window.__cryptodromoAudienceQA.snapshot().visible);
 // Layout changes can retain the previous straight-course rail pose for several
 // rendered frames. Wait for the overview camera AND its focus to converge,
 // then require two successive stable samples before archiving evidence.
 const waitForOverview=async layout=>{
  await page.waitForFunction(expected=>{
   const shot=window.__cryptodromoOcclusionQA?.snapshot();
   return shot?.layout===expected && shot.view==='overview'
    && shot.camera?.every(Number.isFinite) && shot.focus?.every(Number.isFinite);
  },layout,{timeout:45000,polling:250});
  let previous=null,stable=0;
  for(let attempt=0;attempt<80;attempt++){
   await page.waitForTimeout(250);
   const shot=await page.evaluate(()=>window.__cryptodromoOcclusionQA?.snapshot());
   if(shot?.layout!==layout||shot.view!=='overview')throw new Error('Overview layout changed while settling: '+layout);
   if(previous){
    const movement=Math.hypot(...shot.camera.map((n,i)=>n-previous.camera[i]));
    const aim=Math.hypot(...shot.focus.map((n,i)=>n-previous.focus[i]));
    stable=movement<0.08&&aim<0.08?stable+1:0;
    if(stable>=3)return;
   }
   previous=shot;
  }
  throw new Error('Overview camera/focus did not stabilize for '+layout);
 };
 await waitForOverview('oval');
 const ovalShot=await capture('04-oval-clearance.png');
 assert.equal(ovalShot.layout,'oval','Oval screenshot must capture the oval geometry');
 assert.equal(ovalShot.view,'overview','Oval clearance evidence must use course overview, not stale rail framing');
 assert.ok(Math.hypot(...ovalShot.camera.map((n,i)=>n-dayRail.camera[i]))>20,
  'Oval overview camera is still effectively the straight-course launch rail pose');
 assert.ok(ovalShot.samples.every(sample=>!sample.hit?.chain?.includes('Alpha20 broadcast start gates')),
  'Hidden straight-only Alpha20 canopy must not appear in oval ray diagnostics');
 // Cover the third official layout in the same real Chromium/WebGL run.
 // Alpha20's straight-only canopy must not leak into the S-bend scene.
 await setControl('layout','s-bend');
 await page.waitForFunction(()=>window.__cryptodromoOcclusionQA?.snapshot()?.layout==='s-bend',null,{timeout:30000});
 await waitForOverview('s-bend');
 const bendShot=await capture('05-sbend-clearance.png');
 assert.equal(bendShot.layout,'s-bend','S-bend screenshot must capture the third course');
 assert.equal(bendShot.view,'overview','S-bend clearance evidence must use course overview');
 assert.ok(Math.hypot(...bendShot.camera.map((n,i)=>n-dayRail.camera[i]))>20,
  'S-bend overview camera is still effectively the straight-course launch rail pose');
 assert.ok(Math.hypot(...bendShot.camera.map((n,i)=>n-ovalShot.camera[i]))>2,
  'S-bend overview reused the oval camera position instead of reframing the course');
 assert.equal(bendShot.samples.length,25);
 assert.ok(bendShot.samples.every(sample=>!sample.hit?.chain?.includes('Alpha20 broadcast start gates')),
  'Straight-only Alpha20 start canopy leaked into S-bend sightlines');
 assert.deepEqual(errors,[]);
 console.log('PASS real WebGL audience',first.crowd,first.drawCalls);
} finally {await browser.close();}
