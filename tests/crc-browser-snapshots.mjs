/**
 * CRC browser comparison. Runs against two isolated local HTTP servers, never production.
 * Required env: CRC_AFTER_URL (default 127.0.0.1:8799), CRC_BEFORE_URL (8798).
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const before = process.env.CRC_BEFORE_URL || 'http://127.0.0.1:8798';
const after  = process.env.CRC_AFTER_URL  || 'http://127.0.0.1:8799';
const output = 'artifacts/crc';
const routes=[
  {id:'portada',path:'/',canonical:true,align:'.hub-hero .hub-shell'},
  {id:'satoshi',path:'/stadiums/crypto/',canonical:true,align:'main.hub-shell'},
  {id:'archivo',path:'/stadiums/crypto/archive/',canonical:true,align:'main.hub-shell'},
  {id:'live',path:'/stadiums/crypto/live/',canonical:false,align:'main.hub-shell',pending:'PR 79'},
  {id:'corredor',path:'/racers/#BTC',canonical:true,align:null,pending:'Maestro BTC activo'},
  {id:'fixture',path:'/fixture/',canonical:true,align:'main.shell'},
  {id:'resultados',path:'/resultados/',canonical:true,align:'main.shell'},
  {id:'estadios',path:'/stadiums/',canonical:true,align:'.world-shell'},
  {id:'cuenta-demo',path:'/apuestas/',canonical:true,align:'main.shell',pending:'PR 67'},
  {id:'gaceta',path:'/cryptodromo-gazette/public/',canonical:false,align:'main'},
  {id:'estilo',path:'/design/crc-styleguide.html',canonical:false,align:'main.crc-container',onlyAfter:true},
];
const sizes=[
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844},
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
let failed=0;
mkdirSync(output,{recursive:true});
try{
  for(const size of sizes){
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,reducedMotion:'reduce'});
    for(const item of routes){
      for(const phase of (item.onlyAfter?['after']:['before','after'])){
        const page=await context.newPage();
        const url=(phase==='before'?before:after)+item.path;
        let row={page:item.id,phase,viewport:size.name,url,pending:item.pending||null};
        try{
          const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
          assert.ok(response && response.ok(),url+' HTTP status '+response?.status());
          await page.waitForTimeout(250);
          row.metrics=await page.evaluate(sel=>{
            const h=document.querySelector('header.crp-unified');
            const main=sel?document.querySelector(sel):document.querySelector('main');
            const rect=x=>x?({left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right,width:x.getBoundingClientRect().width}):null;
            const head=h?.querySelector('.sitebar-inner');
            return {header:rect(head),main:rect(main),scrollWidth:document.documentElement.scrollWidth,viewport:window.innerWidth,hasCanonical:!!h,bodyClass:document.body.className};
          },item.align);
          if(phase==='after' && item.canonical){
            assert.ok(row.metrics.hasCanonical,'missing CRP canonical navigation: '+item.id);
            assert.ok(row.metrics.header && row.metrics.header.width<=1482,'header exceeds CRC maximum: '+item.id);
            if(row.metrics.main){
              const dx=Math.abs(row.metrics.main.left-row.metrics.header.left);
              row.alignDeltaPx=Math.round(dx);
              if(item.id==='portada'||item.id==='satoshi'||item.id==='archivo'||item.id==='fixture'||item.id==='resultados'){
                assert.ok(dx<=8,'horizontal shell drift '+item.id+' '+size.name+': '+dx.toFixed(1)+'px');
              }
            }
          }
          const screenshot=output+'/'+item.id+'-'+size.name+'-'+phase+'.png';
          try {
            await page.screenshot({path:screenshot,fullPage:false,animations:'disabled',timeout:25000});
          } catch(firstError) {
            // Chromium occasionally rejects a capture during fixture repaint. Retry once without animation injection.
            await page.waitForTimeout(350);
            await page.screenshot({path:screenshot,fullPage:false,animations:'allow',timeout:30000});
            row.screenshotRetry=true;
          }
          row.ok=true;
        }catch(error){
          row.ok=false;row.error=String(error?.message||error);failed++;
        }finally{
          results.push(row);await page.close();
        }
      }
    }
    await context.close();
  }
}finally{await browser.close();}
writeFileSync(output+'/results.json',JSON.stringify({baseline:'47ab154cf8eddfbd55577a430f7b4c5d537c0f7b',generated:new Date().toISOString(),failed,results},null,2));
console.log('CRC visual QA:',results.length,'cases,',failed,'failures. See '+output+'/results.json');
for(const row of results.filter(r=>!r.ok))console.error(row.page,row.phase,row.viewport,row.error);
if(failed)process.exitCode=1;
