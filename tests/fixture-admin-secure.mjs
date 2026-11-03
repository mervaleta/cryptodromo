import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getRaceFixture,FIXTURE_DAYS,RACES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
const root=new URL('../',import.meta.url).pathname;
const temp=mkdtempSync(join(tmpdir(),'crp-fixture-admin-'));
const hash=execFileSync('php',['-r','echo password_hash("testpass",PASSWORD_DEFAULT);'],{encoding:'utf8'});
const port=18000+Math.floor(Math.random()*2000);
const server=spawn('php',['-S','127.0.0.1:'+port,'-t',root],{cwd:root,env:{...process.env,CRP_FIXTURE_ADMIN_USER:'testadmin',CRP_FIXTURE_ADMIN_PASSWORD_HASH:hash,CRP_FIXTURE_TEST_DIR:temp},stdio:'ignore'});
const auth='Basic '+Buffer.from('testadmin:testpass').toString('base64');
const base='http://127.0.0.1:'+port;
async function request(path,opts={}){return fetch(base+path,opts);}
try{
 assert.equal(TOKEN_ROSTER.length,100);
 assert.equal(FIXTURE_DAYS,7);
 assert.equal(RACES_PER_DAY,480);
 for(let d=0;d<7;d++)for(let n=0;n<480;n++){
  const f=getRaceFixture(n,d);
  assert.equal(f.entries.length,12);
  assert.equal(new Set(f.entries.map(e=>e.symbol)).size,12);
  for(const tier of ['star','core','challenger'])assert.equal(f.entries.filter(e=>e.tier===tier).length,4);
  assert.equal(officialRanking(createOfficialRace(f.entries)).length,12);
 }
 let up=false;
 for(let i=0;i<50;i++){try{const r=await request('/admin/fixture/');if(r.status===401){up=true;break;}}catch{}await pause(100);}
 assert.ok(up,'php server did not start');
 assert.equal((await request('/admin/fixture/')).status,401);
 assert.equal((await request('/admin/fixture/',{headers:{Authorization:'Basic '+Buffer.from('testadmin:wrong').toString('base64')}})).status,401);
 const page=await request('/admin/fixture/',{headers:{Authorization:auth}});
 assert.equal(page.status,200);
 assert.match(await page.text(),/Guardar borrador privado/);
 const bootstrap=await request('/admin/fixture/api.php',{headers:{Authorization:auth}});
 assert.equal(bootstrap.status,200);
 const cookie=bootstrap.headers.get('set-cookie')?.split(';')[0];
 assert.ok(cookie);
 const initial=await bootstrap.json();
 assert.equal(initial.revision,0);
 const fixture=getRaceFixture(0,0);
 const payload={csrf:initial.csrf,revision:0,drafts:{'0:0':fixture.entries.map(x=>x.symbol)}};
 const post=async body=>request('/admin/fixture/api.php',{method:'POST',headers:{Authorization:auth,Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await post({...payload,csrf:'invalid'})).status,403);
 const valid=await post(payload);assert.equal(valid.status,200);
 const saved=await valid.json();assert.equal(saved.revision,1);
 assert.deepEqual(saved.drafts['0:0'],payload.drafts['0:0']);
 assert.equal((await post(payload)).status,409);
 const bad={...saved.drafts,'0:1':Array(12).fill('BTC')};
 assert.equal((await post({csrf:initial.csrf,revision:1,drafts:bad})).status,400);
 const fresh=await request('/admin/fixture/api.php',{headers:{Authorization:auth,Cookie:cookie}});
 assert.equal((await fresh.json()).revision,1);
 console.log('PASS: 3360 races, Basic Auth, session+CSRF, revisions, tier validation and private drafts');
}finally{server.kill('SIGTERM');rmSync(temp,{recursive:true,force:true});}
