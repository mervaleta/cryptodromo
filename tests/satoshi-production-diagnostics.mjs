import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.CRP_BASE_URL||'https://race.cryptodromo.com';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
await mkdir('artifacts/production-diagnostics',{recursive:true});
const problems=[],report=[];
const paths=[
 '/stadiums/crypto/live/?track=muybridge',
 '/stadiums/crypto/archive/?track=genesis&day=0',
 '/estadio/?venue=crypto&stadium-qa=1',
 '/stadiums/crypto/broadcast/index.html?track=genesis&replayDay=0&replayMinute=1&finish-qa=alpha06'
];
try{
 for(let i=0;i<paths.length;i++){
  const path=paths[i],page=await browser.newPage({viewport:{width:1450,height:900},deviceScaleFactor:1});
  const entry={path,console:[],failedRequests:[],pageErrors:[],httpErrors:[]};
  report.push(entry);
  page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')entry.console.push(msg.type()+': '+msg.text().slice(0,300))});
  page.on('pageerror',e=>entry.pageErrors.push(e.stack||e.message));
  page.on('requestfailed',req=>entry.failedRequests.push(req.url()+' '+req.failure()?.errorText));
  page.on('response',res=>{if(res.status()>=400)entry.httpErrors.push(res.status()+' '+res.url());});
  try{
   const res=await page.goto(new URL(path,base).toString(),{waitUntil:'domcontentloaded',timeout:35000});
   entry.http=res?.status();
   for(const delay of [1200,3500,8500]){
    await page.waitForTimeout(delay);
    const snap=await page.evaluate(()=>{
      const q=id=>document.querySelector(id);
      const frame=q('#stadium-broadcast');
      const child=(()=>{try{return frame?.contentDocument}catch{return null}})();
      const c=child?.querySelector('#raceCanvas')||q('#raceCanvas')||q('#stadiumCanvas');
      const notice=q('#stadiumNotice');
      const gl=c?.getContext?.('webgl2')||c?.getContext?.('webgl');
      const snapshot={bodyText:document.body.innerText.slice(0,900),
       title:document.title,
       errorVisible:q('#tv-error')?.hidden===false,
       errorText:q('#tv-error-detail')?.innerText,
       loadingVisible:q('#tv-loading')?.hidden===false,
       playerSrc:frame?.src,
       playerFrameCount:document.querySelectorAll('iframe').length,
       childTitle:child?.title,
       childBody:child?.body?.innerText.slice(0,700),
       raceStatus:child?.querySelector('#status')?.innerText||q('#status')?.innerText,
       raceButton:child?.querySelector('#start')?.textContent||q('#start')?.textContent,
       raceButtonDisabled:child?.querySelector('#start')?.disabled ?? q('#start')?.disabled,
       raceCanvasSize:c?[c.width,c.height]:null,
       raceCanvasRect:c?{w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height}:null,
       glVersion:gl?gl.getParameter(gl.VERSION):null,
       stadiumNotice:notice?.innerText,
       stadiumQA:window.__crpStadiumQA?.snapshot?.(),
       archiveRows:q('#archive-results')?.children?.length,
       archiveContent:q('#archive-results')?.innerText.slice(0,650),
       archiveCount:q('#archive-count')?.innerText
      };
      return snapshot;
    }).catch(e=>({evaluationError:e.message}));
    entry['after'+delay]=snap;
   }
   try{
    await page.screenshot({path:'artifacts/production-diagnostics/screen-'+i+'.png',timeout:15000});
   }catch(e){entry.screenshotWarning=e.message;}
  }catch(e){entry.error=String(e);}
  console.log('DIAG',JSON.stringify(entry).slice(0,15000));
  await page.close();
 }
}finally{await browser.close();}
await writeFile('artifacts/production-diagnostics/report.json',JSON.stringify(report,null,2));
const failures=[];
for(const entry of report){
 if(entry.error)failures.push(entry.path+': '+entry.error);
 for(const e of entry.pageErrors)failures.push(entry.path+' JS: '+e);
 const last=entry.after8500||{};
 if(entry.path.includes('/stadiums/crypto/live/')||entry.path.includes('/stadiums/crypto/broadcast/')){
  if(!last.raceStatus||/CARGANDO ESCENARIO 3D|ERROR EN ESCENA/.test(last.raceStatus))
   failures.push(entry.path+' race not ready: '+last.raceStatus);
  if(last.raceButtonDisabled!==false)failures.push(entry.path+' twelve models did not finish booting');
  if(!last.raceCanvasSize||last.raceCanvasSize[0]<=300)
   failures.push(entry.path+' race canvas left at HTML placeholder size');
 }
 if(entry.path.includes('/archive/')){
  if(!last.archiveCount||last.archiveContent?.includes('Preparando archivo sintético'))
   failures.push(entry.path+' fixture results were never generated');
 }
 if(entry.path.startsWith('/estadio/')){
  if(last.stadiumQA?.courses?.length!==3||last.stadiumQA?.renderCalls<=0)
   failures.push(entry.path+' three tracks not rendered: '+JSON.stringify(last.stadiumQA||last.stadiumNotice));
 }
}
console.log('PUBLIC_3D_DIAGNOSTIC',JSON.stringify({ok:!failures.length,failures}));
if(failures.length)process.exitCode=1;
