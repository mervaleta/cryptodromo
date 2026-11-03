import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const manifest=JSON.parse(readFileSync(new URL('../stables/official-week-v1.json',import.meta.url),'utf8'));
const origin='http://127.0.0.1:18771';
const anchor=Date.parse('2026-11-02T03:00:00Z')/1000;
const xp=[0,27,17,12,7,7,7,2,2,2,2,2,2];
const folder=mkdtempSync(join(tmpdir(),'crp-stables-'));
let child=null, cookie='', csrf='';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function start(unixtime) {
 child=spawn('php',['-S','127.0.0.1:18771','-t','.'],{
  cwd:resolve(import.meta.dirname,'..'),
  env:{...process.env,STABLES_TEST_DIR:folder,STABLES_TEST_UNIX:String(unixtime)},stdio:'ignore'
 });
 for(let attempt=0;attempt<40;attempt++){
  try{const r=await fetch(origin+'/api/stables.php?action=bootstrap',{headers:cookie?{Cookie:cookie}:{}});if(r.ok)return;}
  catch(e){}
  await wait(125);
 }
 throw Error('PHP test server could not start');
}
async function stop(){
 if(!child)return;
 const proc=child;
 if(proc.exitCode===null){proc.kill('SIGTERM');await Promise.race([new Promise(resolve=>proc.once('exit',resolve)),wait(1500)]);}
 child=null;
 await wait(150);
}
async function api(action,body=null,params=null,altCookie=null){
 const url=new URL('/api/stables.php',origin);url.searchParams.set('action',action);
 for(const [key,value] of Object.entries(params||{}))url.searchParams.set(key,String(value));
 const r=await fetch(url,{
  method:body?'POST':'GET',
  headers:{...(altCookie===null?cookie?{Cookie:cookie}:{}:{Cookie:altCookie}),...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify({...body,csrf}):undefined
 });
 if(!cookie)cookie=(r.headers.get('set-cookie')||'').split(';')[0];
 const result=await r.json();
 return {status:r.status,data:result};
}
test('guest demo economy, idempotence, exact XP, transfers, upgrades and rankings',async()=>{
 try{
  await start(anchor+10*180+1);
  let r=await api('bootstrap');
  assert.equal(r.status,200);csrf=r.data.csrf;
  assert.equal(r.data.state.user.credits,5000);
  const first=manifest.positions[11].slice(0,2);
  const base={name:'Satoshi Racing',capacity:2,tokens:first,captain:first[0],color:'#13d69a',key:'test-create-000001'};
  r=await api('create',base);
  assert.equal(r.status,200);assert.equal(r.data.state.user.credits,4900);
  const stableId=r.data.state.stable.id;
  r=await api('create',base);
  assert.equal(r.status,200);assert.equal(r.data.replayed,true);
  assert.equal(r.data.state.user.credits,4900);
  r=await api('roster',{capacity:2,tokens:['NOT_A_TOKEN','BTC'],captain:'BTC',color:'#13d69a'});
  assert.equal(r.status,400);
  r=await api('leaderboard',null,{period:'daily',mode:'efficiency'});
  assert.equal(r.data.entries[0].provisional,true);assert.equal(r.data.entries[0].rank,null);
  await stop();

  await start(anchor+11*180+65);
  r=await api('bootstrap');
  assert.equal(r.data.state.stable.xp,44);assert.equal(r.data.state.stable.starts,2);
  r=await api('bootstrap');
  assert.equal(r.data.state.stable.xp,44);
  const next=manifest.positions[12].filter(t=>!first.includes(t)).slice(0,2);
  const replacement={capacity:2,tokens:next,captain:next[0],color:'#f7931a'};
  r=await api('roster',replacement);
  assert.equal(r.status,200);assert.deepEqual(new Set(r.data.state.stable.roster),new Set(next));
  r=await api('roster',replacement);
  assert.equal(r.status,409,'must reject another update before next start');
  await stop();

  await start(anchor+12*180+65);
  r=await api('bootstrap');
  const delta=next.reduce((sum,t)=>sum+xp[manifest.positions[12].indexOf(t)+1],0);
  assert.equal(r.data.state.stable.xp,44+delta);
  assert.equal(r.data.state.stable.starts,4);
  const enlarged=manifest.positions[13].slice(0,3);
  const upgrade={capacity:3,tokens:enlarged,captain:enlarged[0],color:'#f7931a',key:'test-upgrade-00001'};
  r=await api('upgrade',upgrade);
  assert.equal(r.status,200);assert.equal(r.data.state.stable.capacity,3);
  assert.equal(r.data.state.user.credits,4750);
  r=await api('upgrade',upgrade);
  assert.equal(r.status,200);assert.equal(r.data.replayed,true);
  assert.equal(r.data.state.user.credits,4750);
  await stop();

  await start(anchor+13*180+65);
  r=await api('bootstrap');
  assert.equal(r.data.state.stable.xp,44+delta+56);
  assert.equal(r.data.state.stable.starts,7);
  const xpTotal=44+delta+56;
  r=await api('leaderboard',null,{period:'daily',mode:'total'});
  assert.equal(r.status,200);assert.equal(r.data.entries[0].xp,xpTotal);
  assert.equal(r.data.entries[0].rank,1);
  r=await api('leaderboard',null,{period:'daily',mode:'efficiency'});
  assert.equal(r.data.entries[0].rank,1);
  assert.equal(r.data.entries[0].efficiency,Math.round((xpTotal/7)*100)/100);
  assert.equal(r.data.entries[0].starts,7);
  r=await api('stable',null,{id:stableId});
  assert.equal(r.data.stable.ledger.length,7);
  // Another guest must not be able to modify this stable.
  const second=await fetch(origin+'/api/stables.php?action=bootstrap');
  const secondCookie=(second.headers.get('set-cookie')||'').split(';')[0];
  const secondState=await second.json();
  assert.equal(secondState.state.stable,null);
  const forged=await fetch(origin+'/api/stables.php?action=roster',{
   method:'POST',headers:{Cookie:secondCookie,'Content-Type':'application/json'},
   body:JSON.stringify({...replacement,csrf:secondState.csrf})
  });
  assert.equal(forged.status,409);
 }finally{
  await stop();
  rmSync(folder,{force:true,recursive:true});
 }
});
