/**
 * Fast A/B render of the complete Maya posterior sculpt with the Quaternius
 * donor transplant bypassed. This is diagnostic only: skin remains transferred
 * to the 50-joint Quaternius Gallop rig, not restored from Maya's 70 weights.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const dest='artifacts/btc-native-hind-ab-smoke';mkdirSync(dest,{recursive:true});
const build='btc-v23-native-hind-sculpt-20261127';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1100,height:750}});
const errors=[],frames=[];
const threeRoot=resolve('node_modules/three');
await page.route('https://cdn.jsdelivr.net/npm/three@0.187.0/**',async route=>{
 const url=new URL(route.request().url()),marker='/npm/three@0.187.0/',offset=url.pathname.indexOf(marker);
 if(offset<0)return route.abort();
 const target=resolve(threeRoot,url.pathname.slice(offset+marker.length));
 if(!target.startsWith(threeRoot+sep))return route.abort();
 await route.fulfill({path:target,contentType:'text/javascript'});
});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1&btcNativeHindExperiment=1#BTC',
  {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(b=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.harmonyBuild===b&&s.drawCalls>0&&s.clips?.includes('Gallop')&&
   s.heroGroom?.hindRestoration?.nativeMayaHindExperiment===true;
 },build,{timeout:120000});
 const qa=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 const hind=qa.heroGroom.hindRestoration;
 assert.equal(hind.nativeMayaHindExperiment,true);
 assert.equal(hind.originalMayaSkinClusterRestored,false);
 assert.equal(hind.donorHindTriangles,0);
 assert.ok(qa.heroGroom.triangles>5000,'Full Maya hind geometry was not retained');
 for(const camera of ['rear','threeQuarter','profile'])for(const pose of [0,8]){
  await page.locator('[data-btc-camera="'+camera+'"]').click();
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),pose);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,pose,{timeout:15000});
  await page.waitForTimeout(180);
  const data=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(data?.startsWith('data:image/png;base64,')&&data.length>20000);
  const bytes=Buffer.from(data.split(',')[1],'base64'),name=camera+'-'+String(pose).padStart(2,'0')+'-native-maya-hind.png';
  writeFileSync(dest+'/'+name,bytes);
  frames.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  console.log('BTC_NATIVE_MAYA_HIND_AB_FRAME',name);
 }
 writeFileSync(dest+'/metadata.json',JSON.stringify({
  build,experiment:'uncropped full Maya 2017 hind-limb sculpt, Quaternius donor bypassed',
  releaseCandidate:false,AAAApproved:false,originalGallopPreserved:true,
  originalMayaSkinClusterRestored:false,originalMayaInfluenceCount:70,
  activeSkinMethod:'nearest-neighbour transfer from Quaternius 50-joint Gallop',
  donorHindTriangles:0,mayaSculptTriangles:qa.heroGroom.triangles,
  frames,errors,visualGate:'Compare all six frames with the donor candidate; no version credit.'
 },null,2));
 assert.deepEqual(errors,[]);
 console.log('BTC_NATIVE_MAYA_HIND_AB_SMOKE_DONE',frames.length);
}finally{await page.close();await browser.close();}
