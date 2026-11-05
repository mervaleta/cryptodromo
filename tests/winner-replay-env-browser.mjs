import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {captureOptional} from './helpers/optionalScreenshot.mjs';
const root=process.env.CRP_BASE_URL||'http://127.0.0.1:4173';
const url=path=>new URL(path,root).toString();
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
await mkdir('artifacts/winner-replay-env',{recursive:true});
const errors=[];
try{
 const race=await browser.newPage({viewport:{width:1320,height:820},deviceScaleFactor:1});
 race.on('pageerror',e=>errors.push('Replay: '+e.message));
 let response=await race.goto(url('/stadiums/crypto/broadcast/index.html?track=muybridge&finish-qa=alpha06&winner-replay-qa=1&embed=tv'),
  {waitUntil:'domcontentloaded',timeout:50000});
 assert.equal(response?.status(),200);
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.runnerCount===12&&document.querySelector('#start')?.disabled===false,
  null,{timeout:110000});
 assert.equal(await race.evaluate(()=>window.__winnerReplayQA.seekLastCross()),true);
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.replay.phase==='playing',null,{timeout:13000});
 const first=await race.evaluate(()=>window.__winnerReplayQA.snapshot());
 assert.equal(first.gate.crossedCount,12,'The replay may not start before the last runner');
 assert.equal(first.officialVisible,false,'Official standings must stay hidden during winner replay');
 assert.equal(await race.locator('#winner-replay').isVisible(),true);
 assert.equal(await race.locator('#result-overlay').isVisible(),false);
 assert.equal(first.winner,first.replay.winnerSymbol);
 await captureOptional(race,'artifacts/winner-replay-env/slow-motion-winner.png');
 await race.waitForFunction(()=>window.__winnerReplayQA?.snapshot()?.replay.complete===true&&
   window.__winnerReplayQA?.snapshot()?.officialVisible===true,
   null,{timeout:22000});
 assert.equal(await race.locator('#winner-replay').isVisible(),false);
 await race.locator('#result-overlay').waitFor({state:'visible',timeout:8000});
 assert.equal(await race.locator('#result-overlay').isVisible(),true);
 assert.equal(await race.locator('#result-list .result-row').count(),12);
 await captureOptional(race,'artifacts/winner-replay-env/official-after-replay.png');
 console.log('PASS real 3D winner slow-mo begins after last horse, official result after replay, same winner');

 const tv=await browser.newPage({viewport:{width:1450,height:900},deviceScaleFactor:1});
 tv.on('pageerror',e=>errors.push('TV: '+e.message));
 response=await tv.goto(url('/stadiums/crypto/live/?track=muybridge&tv-qa=1'),{
  waitUntil:'domcontentloaded',timeout:50000
 });
 assert.equal(response?.status(),200);
 await tv.waitForFunction(()=>{
  const f=document.querySelector('#stadium-broadcast');
  return !!f&&!f.hidden&&window.__satoshiTvQA?.snapshot()?.ready&&
   f.contentDocument?.querySelector('#start')?.disabled===false;
 },null,{timeout:120000});
 const value=async id=>tv.evaluate(id=>{
  const x=document.querySelector('#stadium-broadcast')?.contentDocument?.getElementById(id);
  return x?.type==='checkbox'?x.checked:x?.value;
 },id);
 assert.equal(await tv.locator('[data-tv-weather]').count(),5);
 assert.equal(await tv.locator('[data-tv-hour]').count(),5);
 await tv.locator('[data-tv-weather="rain"]').click();
 assert.equal(await value('weather'),'rain','Weather icon must change actual live scene');
 await tv.locator('[data-tv-light="power"]').click();
 assert.equal(await value('light-power'),false,'Reflectors icon must toggle real lights');
 await tv.locator('[data-tv-light="pulse"]').click();
 assert.equal(await value('light-pattern'),'pulse');
 await tv.locator('[data-tv-cloud="up"]').click();
 assert.equal(await value('cloud-cover'),'70');
 await tv.locator('[data-tv-fog="toggle"]').click();
 assert.equal(await value('fog-intensity'),'220');
 await tv.locator('[data-tv-hour="1050"]').click();
 assert.equal(await value('daytime'),'1050');
 assert.equal(await value('daytime-auto'),false);
 assert.equal(await value('weather'),'auto','Manual solar time must override weather preset');
 await tv.locator('[data-tv-stage="grandstand"]').click();
 assert.equal(await value('camera'),'grandstand');
 assert.match(await tv.locator('[data-tv-stadium-link]').getAttribute('href'),/course=muybridge/);
 await captureOptional(tv,'artifacts/winner-replay-env/director-environment-controls.png');
 await tv.locator('[data-tv-switch="genesis"]').click();
 await tv.waitForFunction(()=>{
  const qa=window.__satoshiTvQA?.snapshot();
  const f=document.querySelector('#stadium-broadcast');
  return qa?.track==='genesis'&&qa.ready&&!qa.transition&&
   f.contentDocument?.querySelector('#start')?.disabled===false;
 },null,{timeout:120000});
 // Software WebGL may throttle requestAnimationFrame. Poll actual scene
 // form values on a wall-clock interval; never waive the persistence check.
 await tv.waitForFunction(()=>{
  const d=document.querySelector('#stadium-broadcast')?.contentDocument;
  return d?.querySelector('#daytime')?.value==='1050'&&
   d?.querySelector('#light-power')?.checked===false;
 },null,{timeout:30000,polling:250});
 assert.match(await tv.locator('[data-tv-stadium-link]').getAttribute('href'),/course=genesis/);
 assert.equal(await tv.locator('iframe').count(),1);
 console.log('PASS environment remote edits real WebGL settings and persists across TV channel changes');
 assert.deepEqual(errors,[],errors.join('; '));
}finally{await browser.close();}
