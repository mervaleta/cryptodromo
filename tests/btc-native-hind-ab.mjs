/**
 * Diagnostic A/B: render the complete Maya 2017 hind-limb sculpt without the
 * Quaternius donor transplant. This does NOT restore Maya's private 70-weight
 * skinCluster; the sculpt is still skinned by nearest-neighbour transfer onto
 * the original 50-joint Quaternius Gallop rig. Never treat this as a release.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {chromium} from 'playwright';

const DIR='artifacts/btc-native-hind-ab';
mkdirSync(DIR,{recursive:true});
const BUILD='btc-v23-native-hind-sculpt-20261127';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1100,height:750},deviceScaleFactor:1});
const errors=[],frames=[],profileHashes=new Set();
const threeRoot=resolve('node_modules/three');
await page.route('https://cdn.jsdelivr.net/npm/three@0.187.0/**',async route=>{
 const url=new URL(route.request().url());
 const marker='/npm/three@0.187.0/';
 const offset=url.pathname.indexOf(marker);
 if(offset<0)return route.abort();
 const relative=url.pathname.slice(offset+marker.length);
 const target=resolve(threeRoot,relative);
 if(!target.startsWith(threeRoot+sep))return route.abort();
 await route.fulfill({path:target,contentType:'text/javascript'});
});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{
 if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());
});
try{
 await page.goto('http://127.0.0.1:8799/racers/?btcFreeze=1&btcCapture=1&btcNativeHindExperiment=1#BTC',
  {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(build=>{
  const s=window.__cryptodromoBTCAtelierQA?.();
  return s?.heroGroom?.harmonyBuild===build&&s.drawCalls>0&&s.clips?.includes('Gallop')&&
   s.heroGroom?.hindRestoration?.nativeMayaHindExperiment===true;
 },BUILD,{timeout:120000});
 const baseline=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 const experiment=baseline.heroGroom.hindRestoration;
 assert.equal(experiment.nativeMayaHindExperiment,true);
 assert.equal(experiment.originalMayaSkinClusterRestored,false);
 assert.equal(experiment.donorHindTriangles,0);
 assert.ok(baseline.heroGroom.triangles>5000,'full Maya sculpt must remain visible');
 async function capture(camera,index){
  await page.evaluate(name=>document.querySelector('[data-btc-camera="'+name+'"]')?.click(),camera);
  await page.evaluate(i=>window.__cryptodromoBTCAtelierSetPose?.(i),index);
  await page.waitForFunction(i=>window.__cryptodromoBTCAtelierQA?.()?.heldPoseIndex===i,index,{timeout:15000});
  await page.waitForTimeout(160);
  const sample=await page.evaluate(()=>{
   const canvas=document.querySelector('#horse-canvas');
   if(!canvas)return null;
   const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
   if(!gl)return {webgl:false};
   const pixels=new Uint8Array(64);
   gl.readPixels(Math.max(0,Math.floor(gl.drawingBufferWidth/2)-2),
    Math.max(0,Math.floor(gl.drawingBufferHeight/2)-2),4,4,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   return {webgl:true,error:gl.getError(),width:gl.drawingBufferWidth,height:gl.drawingBufferHeight};
  });
  assert.ok(sample?.webgl&&sample.width>0&&sample.height>0,'WebGL unavailable '+camera+index);
  assert.equal(sample.error,0,'WebGL readback error '+camera+index);
  const png=await page.evaluate(()=>document.querySelector('#horse-canvas')?.toDataURL('image/png'));
  assert.ok(png?.startsWith('data:image/png;base64,')&&png.length>20000,'Empty frame '+camera+index);
  const bytes=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
  const sha=await import('node:crypto').then(c=>c.createHash('sha256').update(bytes).digest('hex'));
  const name=camera+'-'+String(index).padStart(2,'0')+'.png';
  writeFileSync(DIR+'/'+name,bytes);
  frames.push({name,camera,index,sha,bytes:bytes.length});
  if(camera==='profile')profileHashes.add(sha);
 }
 for(let i=0;i<16;i++)await capture('profile',i);
 for(const camera of ['threeQuarter','rear','front','top'])
  for(const i of [0,4,8,12])await capture(camera,i);
 for(const i of [0,8])await capture('detail',i);
 assert.equal(profileHashes.size,16,'Native Maya hind experiment must preserve 16 distinct Gallop phases');
 assert.deepEqual(errors,[],errors.join('\n'));
 writeFileSync(DIR+'/qa.json',JSON.stringify({
  build:BUILD,
  experiment:'uncropped Maya 2017 hind-limb sculpt; Quaternius donor transplant bypassed',
  releaseCandidate:false,
  originalGallopPreserved:true,
  originalMayaSkinClusterRestored:false,
  originalMayaInfluenceCount:70,
  activeSkinMethod:'nearest-neighbour transfer from original Quaternius 50-joint Gallop',
  donorHindTriangles:0,
  mayaSculptTriangles:baseline.heroGroom.triangles,
  liveHostingerVerified:false,
  AAAApproved:false,
  photographs:frames,
  visualGate:'Compare rear/3Q/profile/front/top and all 16 profile phases against donor candidate; this diagnostic is not a release or a numbered milestone.'
 },null,2));
 console.log('BTC_NATIVE_MAYA_HIND_AB_COMPLETE',frames.length);
}finally{
 await page.close();
 await browser.close();
}
