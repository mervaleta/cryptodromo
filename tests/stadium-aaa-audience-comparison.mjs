import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
await mkdir('artifacts/stadium-aaa-audience/comparison',{recursive:true});
const metrics=[];
try{
 for(const [name,host] of [['before','http://127.0.0.1:4174'],['after','http://127.0.0.1:4173']]){
  const page=await browser.newPage({viewport:{width:1600,height:940}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(host+'/visual-lab/?track=genesis&finish-qa=alpha06',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false,null,{timeout:120000});
  const renderReady=await page.evaluate(()=>{
   const canvas=document.querySelector('#raceCanvas');
   return {width:canvas?.width||0,height:canvas?.height||0,
    webgl:!!(canvas?.getContext('webgl2')||canvas?.getContext('webgl'))};
  });
  assert.ok(renderReady.width>=640&&renderReady.height>=360,`${name}: render canvas not initialized`);
  assert.ok(renderReady.webgl,`${name}: WebGL context unavailable`);
  await page.evaluate(()=>{
   const control=document.getElementById('graphics-quality');
   control.value='balanced';
   control.dispatchEvent(new Event('change',{bubbles:true}));
  });
  for(const [view,weather] of [['overview','noon'],['rail','noon'],['rail','night']]){
   await page.evaluate(([view,weather])=>{
    for(const [id,value] of [['camera',view],['weather',weather]]){
     const input=document.getElementById(id);input.value=value;
     input.dispatchEvent(new Event('change',{bubbles:true}));
    }
   },[view,weather]);
   await page.waitForTimeout(950);
   await page.screenshot({path:'artifacts/stadium-aaa-audience/comparison/'+name+'-'+view+'-'+weather+'.png'});
   // Approximate frame pacing only, measured in a software WebGL CI browser.
   // It is useful for relative regression checks, NOT desktop hardware FPS.
   const pacing=await page.evaluate(()=>new Promise(resolve=>{
    const intervals=[];let last=0,start=0;
    const frame=now=>{
     if(!start)start=now;
     if(last)intervals.push(now-last);
     last=now;
     if(now-start<1300)requestAnimationFrame(frame);
     else {
      intervals.sort((a,b)=>a-b);
      const at=p=>intervals[Math.min(intervals.length-1,Math.floor((intervals.length-1)*p))]||0;
      resolve({frames:intervals.length,medianFrameMs:at(.5),p95FrameMs:at(.95),
       approximateFps:intervals.length/((now-start)/1000)});
     }
    };
    requestAnimationFrame(frame);
   }));
   assert.ok(pacing.frames>=2&&pacing.medianFrameMs>0,`${name}/${view}/${weather}: no animation frames`);
   assert.deepEqual(pageErrors,[],`${name}/${view}/${weather}: browser runtime errors`);
   metrics.push({revision:name,camera:view,weather,engine:'Chromium SwiftShader',
    ...pacing});

  }
  await page.close();
 }
}finally{
 await writeFile('artifacts/stadium-aaa-audience/comparison/frame-pacing.json',
 JSON.stringify({note:'Software WebGL approximation, not real-GPU FPS approval',samples:metrics},null,2));
 await browser.close();
}
