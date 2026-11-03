import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const origin='http://127.0.0.1:18779';
const root=resolve(import.meta.dirname,'..');
const anchor=Date.parse('2026-11-02T03:00:00Z')/1000;
const manifest=JSON.parse(readFileSync(new URL('../stables/official-week-v1.json',import.meta.url),'utf8'));
const directory=mkdtempSync(join(tmpdir(),'crp-shared-wallet-'));
let child,cookie='',csrf='',tick=anchor+100*180+10;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){
 child=spawn('php',['-S','127.0.0.1:18779','-t','.'],{cwd:root,env:{...process.env,STABLES_TEST_DIR:directory,STABLES_TEST_UNIX:String(tick)},stdio:'ignore'});
 for(let attempt=0;attempt<40;attempt++){try{await fetch(origin+'/api/demo-wallet.php?action=bootstrap');return;}catch{}await delay(125)}throw Error('PHP server did not launch');
}
async function stop(){if(child?.exitCode===null){child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),delay(1500)])}child=null;await delay(120)}
const id=()=> 'unified-'+Math.random().toString(36).slice(2)+'-000';
async function call(action,body=null,stables=false){
 const path=stables?'/api/stables.php':'/api/demo-wallet.php';
 const r=await fetch(origin+path+'?action='+action,{method:body?'POST':'GET',
  headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json','Origin':origin}:{})},
  body:body?JSON.stringify({...body,csrf,key:body.key||id()}):undefined
 });
 if(!cookie)cookie=(r.headers.get('set-cookie')||'').split(';')[0];
 const data=await r.json();if(data.csrf)csrf=data.csrf;return {status:r.status,data};
}
test('one session and ledger across stable, crypto, exchange, bet and withdrawals',async()=>{
 try{
  await start();
  let r=await call('bootstrap');assert.equal(r.status,200);assert.equal(Number(r.data.wallet.credits),5000);
  let s=await call('bootstrap',null,true);assert.equal(s.status,200);csrf=s.data.csrf;
  const horses=manifest.positions[101].slice(0,2);
  r=await call('create',{name:'Unified Test',capacity:2,tokens:horses,captain:horses[0],color:'#13d69a',key:'unified-create-test'},true);
  assert.equal(r.status,200);assert.equal(r.data.state.user.credits,4900);
  r=await call('bootstrap');assert.equal(Number(r.data.wallet.credits),4900);
  const dkey='unified-deposit-test-01';
  r=await call('deposit_create',{key:dkey,channel:'crypto',method:'USDT',package_usd:5});
  assert.equal(r.status,200);assert.equal(Number(r.data.wallet.usd_cents),0);
  r=await call('deposit_create',{key:dkey,channel:'crypto',method:'USDT',package_usd:5});
  assert.equal(r.data.replayed,true);assert.equal(r.data.deposits.length,1);
  r=await call('deposit_confirm',{intent:dkey});assert.equal(Number(r.data.wallet.usd_cents),500);
  r=await call('deposit_confirm',{intent:dkey});assert.equal(r.status,409);
  r=await call('exchange_buy',{amount_cents:500});
  assert.equal(Number(r.data.wallet.credits),5400);assert.equal(Number(r.data.wallet.usd_cents),0);
  s=await call('bootstrap',null,true);assert.equal(s.data.state.user.credits,5400);
  const round=102,runner=manifest.positions[round][0];
  r=await call('bet_place',{absolute_round:round,runner,market:'WIN',stake:100,key:'unified-bet-test-001'});
  assert.equal(r.status,200);assert.equal(Number(r.data.wallet.credits),5300);
  r=await call('bet_place',{absolute_round:round,runner,market:'WIN',stake:100,key:'unified-bet-test-001'});
  assert.equal(r.data.replayed,true);assert.equal(r.data.tickets.length,1);
  r=await call('exchange_sell',{amount_cents:1000});assert.equal(Number(r.data.wallet.usd_cents),1000);
  const wkey='unified-withdraw-test-1';
  r=await call('withdraw_create',{key:wkey,method:'bank',amount_cents:600});
  assert.equal(Number(r.data.wallet.usd_cents),400);assert.equal(Number(r.data.wallet.held_cents),600);
  r=await call('withdraw_action',{intent:wkey,transition:'approve'});
  r=await call('withdraw_action',{intent:wkey,transition:'process'});
  r=await call('withdraw_action',{intent:wkey,transition:'fail'});
  assert.equal(Number(r.data.wallet.usd_cents),1000);assert.equal(Number(r.data.wallet.held_cents),0);
  const repeats=r.data.ledger.filter(x=>x.kind==='withdraw_action'&&x.currency==='USD_CENTS'&&x.bucket==='available'&&Number(x.delta)===600);
  assert.equal(repeats.length,1);
  r=await call('withdraw_action',{intent:wkey,transition:'fail'});assert.equal(r.status,409);
  r=await call('bootstrap');assert.equal(Number(r.data.wallet.credits),4300);
 }finally{await stop();rmSync(directory,{force:true,recursive:true})}
});
