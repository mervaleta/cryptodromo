import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';

const project=resolve(import.meta.dirname,'..');
const tmp=mkdtempSync(join(tmpdir(),'crp-horse-editor-'));
const port=21000+Math.floor(Math.random()*1500);
const origin=`http://127.0.0.1:${port}`;
const hash=execFileSync('php',['-r','echo password_hash("horse-secret",PASSWORD_DEFAULT);'],{encoding:'utf8'});
const auth='Basic '+Buffer.from('horse-admin:horse-secret').toString('base64');
// Real 32x32 raster PNG. Uploaded logos are private until their horse is published.
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAM0lEQVR4nO3OQQEAMAjEsGMqZntaETBk8EkNNNXv/ix2NucAAAAAAAAAAAAAAAAAAABJMhO7AttkveffAAAAAElFTkSuQmCC','base64');
const upload=async (bytes=png,format='image/png',options={})=>{
 const fd=new FormData();fd.append('csrf',options.csrf??csrf);fd.append('symbol','BTC');fd.append('logo',new Blob([bytes],{type:format}),format==='image/png'?'btc.png':'bad.svg');
 return fetch(origin+'/admin/horses/logo-upload.php',{method:'POST',headers:{...(options.auth===false?{}:{Authorization:auth}),...(cookie?{Cookie:cookie}:{}),Origin:options.origin??origin},body:fd});
};
const server=spawn('php',['-S',`127.0.0.1:${port}`,'-t',project],{cwd:project,env:{...process.env,CRP_HORSES_TEST_DIR:tmp,CRP_FIXTURE_ADMIN_USER:'horse-admin',CRP_FIXTURE_ADMIN_PASSWORD_HASH:hash},stdio:'ignore'});
let cookie='';let csrf='';
const get=async (path,authorized=true)=>fetch(origin+path,{headers:{...(authorized?{Authorization:auth}:{}),...(cookie?{Cookie:cookie}:{})}});
const post=async (body,options={})=>fetch(origin+'/admin/horses/api.php',{method:'POST',headers:{Authorization:auth,...(cookie?{Cookie:cookie}:{}),Origin:options.origin||origin,'Content-Type':'application/json'},body:JSON.stringify({...body,csrf:options.csrf??csrf})});
const profile=(name='Bitcoin')=>({name,nickname:'Satoshi',tagline:'El relámpago',biography:'Caballo de pista\ncon historia.',
 networks:[{name:'Bitcoin',contract:'nativo',explorer:'https://mempool.space/'}],links:{website:'https://bitcoin.org',x:'',telegram:'',discord:''},
 logoId:null,appearance:{raceColor:'#f7931a',coatColor:'#574b46',muzzleColor:'#aa7655',maneColor:'#321e1b',tailColor:'#37201f',hoofColor:'#202022',eyeColor:'#2b1915',legsColor:'#52362e',bridleColor:'#d2c198',appearanceMode:'brand_colored',maneStyle:'medium',tailStyle:'long',maneScale:1.1,tailScale:1.15}});

test('Horse Atelier: auth, private drafts, individual publication, CSRF, immutability and optimistic concurrency', async()=>{
 try{
  let ready=false;for(let i=0;i<60;i++){try{const r=await get('/admin/horses/api.php',false);if(r.status===401){ready=true;break;}}catch{}await wait(100);}assert.ok(ready,'PHP server failed to start');
  assert.equal((await get('/admin/horses/api.php',false)).status,401);
  let page=await get('/admin/horses/');assert.equal(page.status,200);assert.match(await page.text(),/Horse Atelier/);
  let boot=await get('/admin/horses/api.php');assert.equal(boot.status,200);
  cookie=boot.headers.get('set-cookie')?.split(';')[0]||'';assert.ok(cookie);
  let s=await boot.json();assert.equal(s.schema,'cryptodromo-horses-v1');assert.equal(s.revision,0);assert.equal(s.symbols.length,100);csrf=s.csrf;
  let publicResponse=await fetch(origin+'/api/horse-profiles.php');assert.equal(publicResponse.status,200);
  let pub=await publicResponse.json();assert.deepEqual(pub.profiles,{});assert.ok(!('drafts' in pub));assert.ok(!('csrf' in pub));
  let response=await post({revision:0,action:'save',symbol:'BTC',profile:profile()},{csrf:'invalid'});assert.equal(response.status,403);
  response=await post({revision:0,action:'save',symbol:'NOT_A_TOKEN',profile:profile()});assert.equal(response.status,400);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:{...profile(),weight:1000}});assert.equal(response.status,400);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:{...profile(),appearance:{...profile().appearance,coatColor:'red'}}});assert.equal(response.status,400);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:{...profile(),links:{...profile().links,website:'javascript:alert(1)'}}});assert.equal(response.status,400);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:profile()},{origin:'https://evil.example'});assert.equal(response.status,403);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:{...profile(),logoId:'f'.repeat(64)}});assert.equal(response.status,400);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:{...profile(),appearance:{...profile().appearance,maneStyle:'braided'}}});assert.equal(response.status,400);
  response=await post({revision:0,action:'save',symbol:'BTC',profile:{...profile(),appearance:{...profile().appearance,maneStyle:'short',tailStyle:'short'}}});assert.equal(response.status,200);
  s=await response.json();assert.equal(s.drafts.BTC.appearance.maneStyle,'short');
  response=await post({revision:1,action:'save',symbol:'BTC',profile:profile()});assert.equal(response.status,200);
  s=await response.json();assert.equal(s.revision,2);assert.equal(s.publishedRevision,0);assert.ok(s.drafts.BTC);assert.ok(!s.published.BTC);
  assert.equal((await upload(png,'image/png',{csrf:'bad-token'})).status,403);
  assert.equal((await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),'image/svg+xml')).status,400);
  assert.equal((await upload(png,'image/png',{origin:'https://attacker.example'})).status,403);
  const accepted=await upload();assert.equal(accepted.status,200);const logo=await accepted.json();assert.match(logo.logoId,/^[a-f0-9]{64}$/);
  const draftImage=await get('/admin/horses/logo.php?id='+logo.logoId);assert.equal(draftImage.status,200);assert.equal(draftImage.headers.get('content-type'),'image/png');
  assert.equal((await fetch(origin+'/api/horse-logo.php?symbol=BTC')).status,404,'unpublished logos must remain private');
  response=await post({revision:2,action:'save',symbol:'BTC',profile:{...profile(),logoId:logo.logoId}});assert.equal(response.status,200);
  assert.equal((await fetch(origin+'/api/horse-logo.php?symbol=BTC')).status,404);
  pub=await (await fetch(origin+'/api/horse-profiles.php')).json();assert.deepEqual(pub.profiles,{});
  response=await post({revision:0,action:'save',symbol:'BTC',profile:profile('Old commit')});assert.equal(response.status,409);
  response=await post({revision:3,action:'publish',symbol:'BTC',profile:{...profile('Satoshi, el veloz'),logoId:logo.logoId}});assert.equal(response.status,200);
  s=await response.json();assert.equal(s.revision,4);assert.equal(s.publishedRevision,1);
  const publicLogo=await fetch(origin+'/api/horse-logo.php?symbol=BTC');assert.equal(publicLogo.status,200);
  assert.equal(publicLogo.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await publicLogo.arrayBuffer()),png);
  pub=await (await fetch(origin+'/api/horse-profiles.php')).json();assert.equal(pub.profiles.BTC.name,'Satoshi, el veloz');assert.ok(!('drafts' in pub));assert.equal(pub.publishedRevision,1);
  response=await post({revision:4,action:'save',symbol:'ETH',profile:profile('Ether Runner')});assert.equal(response.status,200);
  pub=await (await fetch(origin+'/api/horse-profiles.php')).json();assert.equal(pub.profiles.BTC.name,'Satoshi, el veloz');assert.ok(!pub.profiles.ETH,'ETH draft must not be public');
  response=await post({revision:5,action:'reset',symbol:'BTC'});assert.equal(response.status,200);
  pub=await (await fetch(origin+'/api/horse-profiles.php')).json();assert.ok(!pub.profiles.BTC);assert.equal(pub.publishedRevision,2);assert.equal((await fetch(origin+'/api/horse-logo.php?symbol=BTC')).status,404);
  assert.equal((await fetch(origin+'/api/horse-profiles.php',{method:'POST'})).status,405);
  assert.ok(readFileSync(join(tmp,'audit.jsonl'),'utf8').split('\n').filter(Boolean).length>=4);
  console.log('PASS 100 symbols, dual color validation, three hair lengths, private PNG upload, CSRF, public-only published logo, versions, concurrency');
 }finally {server.kill('SIGTERM');rmSync(tmp,{recursive:true,force:true});}
});
