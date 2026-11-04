import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.CRP_WORLD_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
const err=[];
try{
 const page=await browser.newPage({viewport:{width:1550,height:960},deviceScaleFactor:1});
 page.on('pageerror',e=>err.push('PAGE '+e.stack));
 page.on('requestfailed',req=>err.push('REQUEST '+req.url()+' '+req.failure()?.errorText));
 const url=new URL('/estadio/?venue=crypto&stadium-qa=1',base);
 const response=await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200);
 await page.waitForFunction(()=>{
  const qa=window.__crpStadiumQA?.snapshot();
  return qa?.courses?.length===3&&qa?.canvas?.every(n=>n>0);
 },null,{timeout:60000});
 const initial=await page.evaluate(()=>window.__crpStadiumQA.snapshot());
 assert.deepEqual(initial.courses,['muybridge','genesis','vint-cerf']);
 assert.equal(initial.courseStats.courseCount,3);
 assert.equal(initial.courseStats.signCount,3);
 assert.equal(initial.courseStats.ribbonCount,6);
 await mkdir('artifacts/stadium-world',{recursive:true});
 await page.screenshot({path:'artifacts/stadium-world/satoshi-master-overview.png'});
 for(const course of ['muybridge','genesis','vint-cerf']){
  await page.selectOption('#course-select',course);
  await page.waitForFunction(id=>window.__crpStadiumQA.snapshot().focusedCourse===id,course,{timeout:10000});
  await page.waitForTimeout(280);
  await page.screenshot({path:'artifacts/stadium-world/satoshi-'+course+'-course.png'});
  const view=await page.evaluate(()=>window.__crpStadiumQA.snapshot());
  assert.equal(view.focusedCourse,course);
  assert.equal(view.courseStats.courseCount,3);
  console.log('COURSE',course,'meshes',JSON.stringify(view.courseStats));
 }
 await page.selectOption('#quality-select','low');
 await page.waitForFunction(()=>window.__crpStadiumQA.snapshot().courseStats?.courseCount===3);
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(300);
 await page.screenshot({path:'artifacts/stadium-world/satoshi-mobile.png'});
 assert.deepEqual(err.filter(e=>!e.includes('ERR_ABORTED')),[],err.join('\n').slice(0,2000));
 console.log('PASS: Satoshi master 3D overview, three course focus views and mobile');
}finally{await browser.close();}
