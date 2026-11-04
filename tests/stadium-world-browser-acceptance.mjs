/**
 * Browser acceptance on a LOCAL copy of the branch, not Hostinger production.
 * Run with CRP_WORLD_URL=http://127.0.0.1:4173 after starting a static server.
 * An official result is only accepted after the full finish orchestrator runout.
 */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CRP_WORLD_URL||'http://127.0.0.1:4173';
const routes=[
 {track:'muybridge',minute:0},
 {track:'genesis',minute:1},
 {track:'vint-cerf',minute:2}
];
const browser=await chromium.launch({
 headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']
});
await mkdir('artifacts/stadium-world',{recursive:true});
const failures=[];
try{
 for(const {track,minute} of routes){
  const page=await browser.newPage({viewport:{width:1360,height:860},deviceScaleFactor:1});
  const fatal=[];
  page.on('pageerror',e=>fatal.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')fatal.push('console: '+m.text())});
  page.on('requestfailed',req=>{
   if(!req.failure()?.errorText?.includes('ERR_ABORTED'))fatal.push('request: '+req.url()+' '+req.failure()?.errorText);
  });
  try{
   const url=new URL('/stadiums/crypto/broadcast/',origin);
   url.search=new URLSearchParams({
    track,replayDay:'0',replayMinute:String(minute),
    'finish-qa':'alpha06','camera-qa':'alpha17'
   }).toString();
   const response=await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response?.status(),200,track+' HTTP');
   await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false,
    null,{timeout:120000});
   const init=await page.evaluate(()=>({
    status:document.querySelector('#status')?.textContent,
    preview:!!document.querySelector('#present-horse-3d canvas'),
    dimensions:[document.querySelector('#raceCanvas')?.width,document.querySelector('#raceCanvas')?.height],
    count:document.querySelectorAll('#standings li').length
   }));
   assert.ok(init.dimensions.every(n=>n>0),track+' uninitialized WebGL canvas');
   assert.ok(init.preview,track+' preview WebGL canvas missing');
   assert.equal(init.count,12,track+' runners not initialized');
   assert.doesNotMatch(init.status,/CARGANDO ESCENARIO 3D|ERROR EN ESCENA/);
   await page.screenshot({path:'artifacts/stadium-world/'+track+'-ready.png'});
   const before=await page.evaluate(()=>window.__cryptodromoQA.state().positions);
   await page.locator('#start').click();
   await page.waitForFunction(original=>{
    const current=window.__cryptodromoQA?.state()?.positions;
    return current?.length===12&&current.every((v,i)=>Number.isFinite(v)&&Math.abs(v-original[i])>.02);
   },before,{timeout:30000,polling:200});
   await page.waitForFunction(()=>document.querySelector('#clock')?.textContent!=='00:00',
    null,{timeout:15000});
   const clock=await page.locator('#clock').innerText();
   assert.notEqual(clock,'00:00',track+' did not advance');
   await page.evaluate(()=>window.__cryptodromoQA.jumpNearFinish());
   await page.waitForFunction(()=>!document.querySelector('#result-overlay')?.hidden,
    null,{timeout:60000});
   const actual=await page.locator('#result-list .result-row b').allInnerTexts();
   assert.equal(actual.length,12,track+' no complete official ranking');
   const expected=await page.evaluate(async minute=>{
    const f=await import('/race-lab/source/src/data/tripleRaceFixture.js');
    const o=await import('/race-lab/source/src/data/officialRace.js');
    return o.officialRanking(o.createOfficialRace(f.getTripleRaceFixture(minute,0).entries))
      .map(row=>row.entry.symbol);
   },minute);
   assert.deepEqual(actual,expected,track+' broadcast differs from official fixture');
   const crossing=await page.evaluate(()=>window.__cryptodromoQA.state());
   assert.equal(crossing.crossed,12,track+' official overlay before twelve crossings');
   assert.ok(crossing.lastCrossedAt!==null&&crossing.elapsed-crossing.lastCrossedAt>=1.6,
    track+' official overlay was revealed before the finish hold');
   await page.screenshot({path:'artifacts/stadium-world/'+track+'-result.png'});
   await page.locator('#live-now').click();
   const mode=await page.locator('#replay-mode').innerText();
   assert.match(mode,/REPLAY MANUAL/,track+' cannot re-enter LIVE');
   assert.deepEqual(fatal,[],track+' browser faults');
   console.log('PASS',track,'canvas',init.dimensions.join('x'),'clock',clock,'winner',actual[0]);
  }catch(e){
   failures.push(track+': '+e.stack+'\nBrowser: '+fatal.join('\n'));
   await page.screenshot({path:'artifacts/stadium-world/'+track+'-failure.png'}).catch(()=>{});
  }finally{await page.close();}
 }
}finally{await browser.close();}
if(failures.length)throw new Error(failures.join('\n\n'));
