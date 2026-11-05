import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
await mkdir('artifacts/stadium-aaa-audience/comparison',{recursive:true});
try{
 for(const [name,host] of [['before','http://127.0.0.1:4174'],['after','http://127.0.0.1:4173']]){
  const page=await browser.newPage({viewport:{width:1600,height:940}});
  await page.goto(host+'/visual-lab/?track=genesis',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false,null,{timeout:120000});
  for(const [view,weather] of [['overview','noon'],['rail','noon'],['rail','night']]){
   await page.evaluate(([view,weather])=>{
    for(const [id,value] of [['camera',view],['weather',weather]]){
     const input=document.getElementById(id);input.value=value;
     input.dispatchEvent(new Event('change',{bubbles:true}));
    }
   },[view,weather]);
   await page.waitForTimeout(950);
   await page.screenshot({path:'artifacts/stadium-aaa-audience/comparison/'+name+'-'+view+'-'+weather+'.png'});
  }
  await page.close();
 }
}finally{await browser.close();}
