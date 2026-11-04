import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CRP_BASE_URL||'https://race.cryptodromo.com';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
await mkdir('artifacts/stadium-flight-public',{recursive:true});
const problems=[];
async function open(page,path){
 const response=await page.goto(new URL(path,origin).toString(),{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200,path+' HTTP');
}
async function shot(page,name){
 try{await page.screenshot({path:'artifacts/stadium-flight-public/'+name+'.png',timeout:18000,animations:'disabled'});}
 catch(e){console.warn('Screenshot optional:',name,e.message);}
}
try{
 const page=await browser.newPage({viewport:{width:1512,height:925},deviceScaleFactor:1});
 page.on('pageerror',e=>problems.push('runtime: '+e.message));
 await open(page,'/estadio/?venue=crypto&stadium-qa=1&verify=flight-final');
 await page.waitForFunction(()=>{
  const qa=window.__crpStadiumQA?.snapshot();
  return qa?.courses?.length===3&&qa?.flight&&qa?.canvas[0]>300;
 },null,{timeout:90000});
 assert.equal(await page.locator('[data-flight-view]').count(),8);
 await page.locator('[data-flight-view="genesis"]').click();
 await page.waitForFunction(()=>window.__crpStadiumQA.snapshot().focusedCourse==='genesis',null,{timeout:15000});
 await page.waitForFunction(()=>!window.__crpStadiumQA.snapshot().flight.traveling,null,{timeout:15000});
 const before=await page.evaluate(()=>window.__crpStadiumQA.snapshot().flight.target);
 await page.locator('#stadiumCanvas').click({position:{x:870,y:420}});
 await page.waitForFunction(previous=>{
  const target=window.__crpStadiumQA?.snapshot()?.flight?.target;
  return target&&Math.hypot(target[0]-previous[0],target[2]-previous[2])>2;
 },before,{timeout:15000});
 const view=await page.evaluate(()=>window.__crpStadiumQA.snapshot());
 assert.ok(view.renderCalls>0,'No visible stadium WebGL draw calls');
 console.log('PASS stadium click-to-fly',JSON.stringify(view.flight));
 await shot(page,'stadium-click-flight');
 
 await open(page,'/stadiums/crypto/live/?track=muybridge&tv-qa=1&verify=director-final');
 await page.waitForFunction(()=>{
  const f=document.querySelector('#stadium-broadcast');
  return window.__satoshiTvQA&&f&&!f.hidden&&f.contentDocument?.querySelector('#start')?.disabled===false&&f.contentDocument?.querySelector('#raceCanvas')?.width>300;
 },null,{timeout:120000});
 assert.equal(await page.locator('[data-tv-switch]').count(),3);
 assert.equal(await page.locator('[data-tv-shot]').count(),12);
 await page.locator('[data-tv-shot="drone"]').click();
 await page.waitForFunction(()=>{
  const f=document.querySelector('#stadium-broadcast');
  return f?.contentDocument?.querySelector('#camera')?.value==='drone';
 },null,{timeout:18000});
 await page.locator('[data-tv-switch="genesis"]').click();
 await page.waitForFunction(()=>{
  const qa=window.__satoshiTvQA?.snapshot(),f=document.querySelector('#stadium-broadcast');
  return qa?.track==='genesis'&&qa.ready&&f.contentDocument?.querySelector('#start')?.disabled===false&&!qa.transition;
 },null,{timeout:110000});
 assert.equal(page.frames().length,2,'Nested player pages');
 await shot(page,'tv-genesis-drone');
 await page.locator('[data-tv-switch="vint-cerf"]').click();
 await page.waitForFunction(()=>{
  const qa=window.__satoshiTvQA?.snapshot();
  return qa?.track==='vint-cerf'&&qa.ready&&!qa.transition;
 },null,{timeout:110000});
 console.log('PASS public TV three-channel director and drone camera');
 assert.deepEqual(problems,[],problems.join('; '));
}finally{await browser.close();}
