import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {captureOptional} from './helpers/optionalScreenshot.mjs';

const base=process.env.HOOF_FX_TEST_ORIGIN||'http://127.0.0.1:8799';
const browser=await chromium.launch({headless:true,args:[
 '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
try{
 const page=await browser.newPage({viewport:{width:1500,height:960},deviceScaleFactor:1});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('response',res=>{if(res.status()>=400&&/\.(js|glb|gz)(\?|$)/.test(res.url()))missing.push(res.status()+' '+res.url());});
 const res=await page.goto(base+'/racers/?atelier=btc&btcMaster=v5#BTC',{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(res?.status(),200);
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.ready,
  undefined,{timeout:90000,polling:500});
 const state=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(state.symbol,'BTC');
 assert.equal(state.variant,'enhanced','BTC must show restored V5 while preserving native Gallop');
 assert.equal(state.heroGroom?.version,'btc-v5-motion-study-20261103');
 assert.equal(state.heroGroom?.pass,10);
 assert.ok(state.heroGroom?.silkLocks>100,'restored 3D mane/tail shell missing');
 assert.equal(state.terrain.visible,true);
 assert.equal(state.terrain.surface,'dirt');
 assert.ok(['skeleton','master'].includes(state.terrain.contactSource),
  'Expected animated hoof rig, got '+state.terrain.contactSource);
 assert.equal(await page.locator('#btc-terrain-surface').isVisible(),true);
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.terrain.impacts>=2,
  undefined,{timeout:45000,polling:400});
 const dirt=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.ok(dirt.terrain.imprints>=2);
 await page.selectOption('#btc-terrain-surface','sand');
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.terrain.impacts>=2,
  undefined,{timeout:45000,polling:400});
 const sand=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(sand.terrain.surface,'sand');
 await page.selectOption('#btc-terrain-surface','grass');
 await page.waitForFunction(()=>window.__cryptodromoBTCAtelierQA?.()?.terrain.impacts>=2,
  undefined,{timeout:45000,polling:400});
 const grass=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(grass.terrain.surface,'grass');
 await page.locator('#btc-terrain-wetness').evaluate(el=>{
  el.value='65';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).terrain.wetness,.65);
 await mkdir('artifacts',{recursive:true});
 await captureOptional(page,'artifacts/hoof-btc-ficha-grass.png');
 await page.click('#motion');
 const paused=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 await page.waitForTimeout(750);
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).terrain.impacts,paused.terrain.impacts,
  'Stationary horse must not create extra hoof impacts');
 await page.selectOption('#btc-terrain-surface','off');
 const off=await page.evaluate(()=>window.__cryptodromoBTCAtelierQA());
 assert.equal(off.terrain.visible,false);
 await page.selectOption('#btc-terrain-surface','dirt');
 assert.equal((await page.evaluate(()=>window.__cryptodromoBTCAtelierQA())).terrain.visible,true);
 assert.equal(errors.length,0,'JS exceptions: '+errors.join('\n').slice(0,1000));
 assert.equal(missing.length,0,'Missing JS/GPU assets: '+missing.join('; ').slice(0,1000));
 console.log('PASS BTC FICHA contact',JSON.stringify({dirt:dirt.terrain,sand:sand.terrain,grass:grass.terrain,drawCalls:grass.drawCalls}));
}finally{await browser.close();}
