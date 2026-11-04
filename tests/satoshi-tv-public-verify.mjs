import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CRP_BASE_URL||'https://race.cryptodromo.com';
const stamp='satoshi-tv-deploy-20261104';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const resources=[
 ['/stadiums/crypto/live/',/Cryptódromo\s*<em>TV/],
 ['/stadiums/crypto/live/index.html',/id="tv-player"/],
 ['/stadiums/crypto/broadcast/index.html',/id="raceCanvas"/],
 ['/visual-lab/index.html',/id="raceCanvas"/],
 ['/assets/crypto-venue.js',/findRacePlayerSource/],
 ['/assets/crypto-archive.js',/Ver repetición en TV/],
 ['/race-lab/source/src/data/tripleRaceFixture.js',/alpha19-triple-v2-continuous-week/],
 ['/race-lab/source/src/data/raceFixture.js',/getContinuousFixturePrice/]
];
async function inspect(){
 const issues=[];
 for(const [path,pattern] of resources){
  try{
   const r=await fetch(new URL(path+'?check='+stamp,origin),{
    redirect:'follow',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(22000)
   });
   const html=await r.text();
   if(r.status!==200||!pattern.test(html))
    issues.push(path+' got '+r.status+' ('+html.length+' bytes) marker='+pattern);
   else if(path.includes('/broadcast/')){
    if(html.includes('id="stadium-broadcast"'))issues.push(path+' is recursively returning the TV hub');
    else console.log('OK',path,r.status,html.length);
   }else console.log('OK',path,r.status,html.length);
  }catch(e){issues.push(path+': '+e.message)}
 }
 return issues;
}
let issues=[];
for(let n=0;n<8;n++){
 console.log('Production deploy check',n+1,'of 8');
 issues=await inspect();
 if(!issues.length)break;
 console.log('Pending deployment:',issues.join('; ').slice(0,1000));
 if(n<7)await sleep(17000);
}
if(issues.length)throw new Error('Hostinger not running integrated Satoshi build:\n'+issues.join('\n'));

const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader'
]});
await mkdir('artifacts/satoshi-public-tv',{recursive:true});
const faults=[];
async function loadTrack(page,id){
 await page.waitForFunction(id=>{
  const f=document.querySelector('#stadium-broadcast');
  return f&&!f.hidden&&f.src.includes('track='+id)&&
   !!f.contentDocument?.querySelector('#raceCanvas')&&
   !f.contentDocument?.querySelector('#stadium-broadcast')&&
   f.contentDocument.querySelector('#start')?.disabled===false&&
   f.contentDocument.querySelector('#raceCanvas').width>300&&
   !/CARGANDO ESCENARIO 3D|ERROR EN ESCENA/.test(f.contentDocument.querySelector('#status')?.textContent||'');
 },id,{timeout:115000});
 assert.equal(page.frames().length,2,'Recursive iframe discovered');
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>faults.push('page: '+e.message));
 const live=new URL('/stadiums/crypto/live/?track=muybridge',origin);
 const response=await page.goto(live.toString(),{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200,'LIVE page not published');
 await loadTrack(page,'muybridge');
 await page.screenshot({path:'artifacts/satoshi-public-tv/muybridge-live.png'});
 console.log('PASS public Muybridge TV');
 for(const id of ['genesis','vint-cerf']){
  await page.locator('[data-tv-tune="'+id+'"]').click();
  await loadTrack(page,id);
  await page.screenshot({path:'artifacts/satoshi-public-tv/'+id+'-live.png'});
  console.log('PASS public '+id+' TV');
 }
 const archive=await page.goto(new URL('/stadiums/crypto/archive/?track=genesis&day=0',origin).toString(),
  {waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(archive?.status(),200,'Archive not available');
 await page.locator('#archive-results a').first().waitFor({timeout:35000});
 const href=await page.locator('#archive-results a').first().getAttribute('href');
 assert.match(href,/\/stadiums\/crypto\/live\/\?track=genesis&replayDay=0&replayMinute=/);
 await page.locator('#archive-results a').first().click();
 await loadTrack(page,'genesis');
 await page.waitForFunction(()=>{
  const f=document.querySelector('#stadium-broadcast');
  return f?.contentDocument?.querySelector('#clock')?.textContent!=='00:00';
 },null,{timeout:125000});
 assert.match(await page.locator('#tv-mode-badge').innerText(),/REPLAY/);
 await page.screenshot({path:'artifacts/satoshi-public-tv/archive-replay.png'});
 console.log('PASS public archive replay');
 await page.locator('#tv-live-now').click();
 await loadTrack(page,'genesis');
 assert.ok(!page.url().includes('replayDay='));
 console.log('PASS return to public LIVE');
 assert.deepEqual(faults,[],'JavaScript errors: '+faults.join('; ').slice(0,1000));
}finally{await browser.close();}
console.log('PASS: integrated Satoshi is deployed and publicly verified, three live channels, archive replay, no recursion');
