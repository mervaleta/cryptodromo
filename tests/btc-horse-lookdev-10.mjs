/**
 * Screenshot reproducibility harness: each frame is the actual WebGL horse,
 * with original Quaternius GLB + authored Gallop inside the deployed BTC card.
 * These screenshots are NOT conceptual art or generated illustrations.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const root='artifacts/horse-lookdev';
const base='http://127.0.0.1:8799/racers/';
const views=[
 ['profile','profile.png'],
 ['three-quarter','three-quarter.png'],
 ['rear','rear.png'],
 ['detail','detail.png']
];
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const observations=[];
try{
 const page=await browser.newPage({
  viewport:{width:1400,height:950},deviceScaleFactor:1,
  reducedMotion:'no-preference'
 });
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(let i=1;i<=10;i++){
  const folder=`${root}/iteration-${String(i).padStart(2,'0')}`;
  mkdirSync(folder,{recursive:true});
  await page.goto(`${base}?lookdev=${i}#BTC`,{
   waitUntil:'domcontentloaded',timeout:55000
  });
  await page.waitForFunction(expected=>{
   const s=window.__cryptodromoBTCAtelierQA?.();
   return s?.symbol==='BTC'&&s.variant==='enhanced'&&
    s.heroGroom?.lookdevStage===expected&&s.drawCalls>0;
  },i,{timeout:120000});
  let state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
  assert.ok(state.clips.includes('Gallop'),'Original GLB Gallop preserved');
  assert.equal(state.heroGroom.oldHairHidden,true,'Legacy tail must be hidden');
  assert.equal(state.heroGroom.modelPreserved,true,'Original model must remain');
  assert.equal(state.heroGroom.jockey,false,'BTC must not have a jockey');
  assert.equal(state.heroGroom.lookdevStage,i);
  assert.equal(state.heroGroom.maneBodies,1);
  assert.equal(state.heroGroom.tailBodies,1);
  const phaseNotes=state.heroGroom.lookdevNotes||[];
  if(i===1){
   await page.locator('[data-btc-variant="original"]').click();
   await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='original');
   await page.locator('[data-btc-camera="profile"]').click();
   await page.locator('#horse-view').screenshot({path:`${root}/btc-original-before.png`,timeout:60000});
   await page.locator('[data-btc-variant="enhanced"]').click();
   await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.variant==='enhanced');
  }
  for(const [view,file] of views){
   await page.locator(`[data-btc-camera="${view}"]`).click();
   await page.waitForFunction(view=>window.__cryptodromoBTCAtelierQA?.()?.camera===view,view);
   await page.waitForTimeout(280);
   await page.locator('#horse-view').screenshot({path:`${folder}/${file}`,timeout:60000});
  }
  state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
  const notes=[
   `# BTC lookdev iteration ${i}/10`,
   '',
   'Browser: Chromium/SwiftShader, actual 3D GLB, animated Gallop.',
   'Images: profile, three-quarter, rear and detail.',
   `Original hair hidden: ${state.heroGroom.oldHairHidden}`,
   `Draw calls (frame): ${state.drawCalls}`,
   `Groom vertices: ${state.heroGroom.vertices}`,
   `Version: ${state.heroGroom.lookdevVersion}`,
   '',
   '## Code stages active',
   ...phaseNotes.map(n=>'- '+n),
   '',
   '## Visual acceptance',
   'Captured for direct human comparison. Do not infer visual improvement solely from passing tests.',
   ''
  ];
  writeFileSync(`${folder}/notes.md`,notes.join('\\n'));
  observations.push({iteration:i,notes:phaseNotes,drawCalls:state.drawCalls,
   hairHidden:state.heroGroom.oldHairHidden});
  console.log('LOOKDEV_ITERATION_OK',i,'views',views.length,'drawCalls',state.drawCalls);
 }
 await page.goto(`${base}?atelier=off#BTC`,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#btc-atelier-panel').isVisible(),false,'Rollback panel');
 assert.equal(await page.evaluate(()=>Boolean(window.__cryptodromoBTCAtelierQA)),false);
 writeFileSync(`${root}/report.json`,JSON.stringify({
  baseline:'btc-original-before.png',checkedAt:new Date().toISOString(),
  stages:observations,webdriver:'Chromium Playwright'
 },null,2));
 assert.deepEqual(errors,[],errors.join('\\n'));
 console.log('BTC_AAA_10_PASS_OK',observations.length,'stages,',views.length*10,'screenshots');
}finally{await browser.close();}
