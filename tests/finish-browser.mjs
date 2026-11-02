import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1450,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('https://race.cryptodromo.com/visual-lab/?finish-qa=alpha06',{waitUntil:'domcontentloaded',timeout:40000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>!document.querySelector('#start')?.disabled,{timeout:40000});
 await page.click('#start');
 // Same deterministic precomputed race: jump only the playback clock.
 await page.evaluate(()=>window.__cryptodromoQA.jumpNearFinish());
 await page.waitForFunction(()=>!document.querySelector('#result-overlay').hidden,{timeout:26000});
 const crossing=await page.evaluate(()=>window.__cryptodromoQA.state());
 console.log('LAST_HORSE_CROSSING_QA',JSON.stringify({crossed:crossing.crossed,lastCrossedAt:crossing.lastCrossedAt,revealedAt:crossing.elapsed}));
 assert.equal(crossing.crossed,12,'Result panel must wait for the very last horse to cross the stripe');
 assert.ok(crossing.lastCrossedAt!==null&&crossing.elapsed-crossing.lastCrossedAt>=1.6,
   'Result panel must hold at least 1.6s after the last crossing');
 const result=await page.evaluate(()=>({
  clock:document.querySelector('#clock').textContent,
  status:document.querySelector('#status').textContent,
  visible:!document.querySelector('#result-overlay').hidden,
  placements:document.querySelectorAll('#result-list .result-row').length,
  narration:document.querySelector('#narrator-text').textContent,
  stats:document.querySelector('#race-stat-content').textContent,
 }));
 console.log('ALPHA06_FINISH_QA',JSON.stringify(result));
 const runout0=await page.evaluate(()=>window.__cryptodromoQA.state());
 await page.waitForFunction(before=>window.__cryptodromoQA.state().elapsed>before+.3,runout0.elapsed,{polling:100,timeout:18000});
 const runout1=await page.evaluate(()=>window.__cryptodromoQA.state());
 const distanceIncrease=runout1.positions.map((pos,i)=>pos-runout0.positions[i]);
 console.log('RUNOUT_QA',JSON.stringify({before:runout0.elapsed,after:runout1.elapsed,movement:distanceIncrease}));
 assert.ok(distanceIncrease.every(d=>d>0),'All horses must continue moving past the official post');
 console.log('JS_ERRORS',JSON.stringify(errors));
 assert.equal(result.clock,'01:00');
 assert.equal(result.visible,true);
 assert.equal(result.placements,12);
 assert.match(result.status,/RESULTADO OFICIAL/);
 assert.ok(errors.length===0,'Browser JS: '+errors.join('; '));
 await mkdir('artifacts',{recursive:true});
 await page.locator('#stage').screenshot({path:'artifacts/alpha06-official-finish.png',timeout:60000});
 const winner=await page.evaluate(()=>({
  official:document.querySelector('#status').textContent,
  leaderboardFirst:document.querySelector('#standings li')?.textContent,
  broadcastLeader:document.querySelector('#leader')?.textContent
 }));
 console.log('FROZEN_RESULT_QA',JSON.stringify(winner));
 assert.ok(winner.leaderboardFirst?.includes(winner.broadcastLeader),
    'Leaderboard leader must always equal the official winner after finish');
 assert.ok(winner.official.includes(winner.broadcastLeader),'Official winner must not change during runout');
 console.log('PASS: +60 seconds official overlay, 12 results, complete narration, no page errors');
}finally{await browser.close();}
