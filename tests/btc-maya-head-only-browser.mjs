/**
 * This test renders real Three.js GLB + actual Maya-source head surfaces.
 * It never qualifies as anatomical/AAA approval without image inspection.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const OUT='artifacts/btc-maya-head-only';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1320,height:820},deviceScaleFactor:1,reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',e=>errors.push('PAGE '+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('CONSOLE '+e.text())});
const URL='http://127.0.0.1:8799/tests/fixtures/btc-maya-head-preview.html';
async function ready(){
 await page.waitForFunction(()=>{
  const s=window.__btcHeadQA?.snapshot();
  return s?.drawCalls>0&&s?.clips.includes('Gallop');
 },null,{timeout:120000});
 return await page.evaluate(()=>window.__btcHeadQA.snapshot());
}
async function capture(name){
 await page.waitForTimeout(230);
 return await page.locator('#view').screenshot({path:OUT+'/'+name+'.png',timeout:90000});
}
try{
 await page.goto(URL+'?graft=0',{waitUntil:'domcontentloaded',timeout:90000});
 const baseline=await ready();
 assert.equal(baseline.graft,false);
 assert.equal(baseline.head,null);
 await page.evaluate(()=>{window.__btcHeadQA.setCamera('profile');window.__btcHeadQA.setPose(4)});
 const original=await capture('00-original-head-profile');
 await page.evaluate(()=>{window.__btcHeadQA.setCamera('detail');window.__btcHeadQA.setPose(4)});
 await capture('00-original-head-detail');
 await page.goto(URL+'?graft=1',{waitUntil:'domcontentloaded',timeout:90000});
 const graft=await ready();
 assert.equal(graft.graft,true);
 assert.equal(graft.headRealMaya,true,'must use the actual 2017 geometry, not procedural tubes');
 assert.equal(graft.head.untouchedNativeBones,50);
 assert.ok(graft.head.mayaHeadVertices>=1800&&graft.head.mayaHeadVertices<=2300);
 assert.ok(graft.head.mayaHeadTriangles>=3700&&graft.head.mayaHeadTriangles<=4100);
 assert.ok(graft.head.nativeHeadTrianglesRemoved>100&&graft.head.nativeHeadTrianglesRemoved<500);
 assert.equal(graft.head.originalGallopUnchanged,true);
 assert.equal(graft.head.detachedEyeOverlays,0);
 const views=['profile','front','rear','threeQuarter','detail','top'];
 let changed=false;
 for(const camera of views){
  await page.evaluate(a=>window.__btcHeadQA.setCamera(a),camera);
  const frames=camera==='profile'?Array.from({length:16},(_,i)=>i):[0,4,8,12];
  for(const phase of frames){
   await page.evaluate(i=>window.__btcHeadQA.setPose(i),phase);
   const pixels=await capture(camera+'-'+String(phase).padStart(2,'0'));
   if(camera==='profile'&&phase===4)changed=!pixels.equals(original);
  }
  console.log('BTC_MAYA_2017_HEAD_ONLY_CAMERA_OK',camera,frames.length);
 }
 assert.ok(changed,'Real Maya source should produce a visibly changed head');
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('BTC_HEAD_MAYA_2017_REAL_WEBGL_EVIDENCE_READY',JSON.stringify({
  build:graft.head.build,vertices:graft.head.mayaHeadVertices,
  triangles:graft.head.mayaHeadTriangles,originalGallop:true,
  humanVisualApproval:false,publiclyDeployed:false
 }));
}finally{await page.close();await browser.close();}
