import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createServer} from 'node:net';
import {setTimeout as sleep} from 'node:timers/promises';

const root=resolve(import.meta.dirname,'..');
const php=spawnSync('php',['-m'],{encoding:'utf8'});
const hasSqlite=/^pdo_sqlite$/im.test(php.stdout);
const secret='test-only-cryptodromo-session-secret-hmac-2026-123456';
function port(){return new Promise((ok,err)=>{const s=createServer();s.once('error',err);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>ok(p));});});}

test('users system: complete HTTP flow against a real SQLite database', {skip:!hasSqlite?'pdo_sqlite required to run real integration test':false,timeout:30000}, async()=>{
 const dir=mkdtempSync(join(tmpdir(),'crp-users-'));
 const database=join(dir,'users.sqlite');
 const env={...process.env,CRP_USERS_DSN:'sqlite:'+database,CRP_USERS_SECRET:secret,CRP_USERS_TEST_HTTP:'1',
   CRP_MAIL_API_KEY:'',CRP_MAIL_FROM:''};
 let server=null;
 try {
   const one=spawnSync('php',['scripts/users-migrate.php'],{cwd:root,env,encoding:'utf8'});
   assert.equal(one.status,0,one.stderr);
   const address=await port();
   server=spawn('php',['-S','127.0.0.1:'+address,'-t',root],{cwd:root,env,stdio:'ignore'});
   const base='http://127.0.0.1:'+address+'/api/users.php?action=';
   for(let i=0;i<40;i++){try{const r=await fetch(base+'bootstrap');if(r.ok)break;}catch{} await sleep(100);}
   function client(){
     let cookie='',csrf='';
     return {
       async call(action,data){
         const r=await fetch(base+action,{method:data?'POST':'GET',redirect:'manual',
           headers:{...(cookie?{Cookie:cookie}:{}),...(data?{'Content-Type':'application/json'}:{})},
           body:data?JSON.stringify({...data,csrf}):undefined});
         const set=r.headers.get('set-cookie');
         if(set)cookie=set.split(';')[0];
         const body=await r.json();
         if(body.csrf)csrf=body.csrf;
         return {status:r.status,body};
       },
       get csrf(){return csrf;}
     };
   }
   const alice=client(),bob=client(),otherAlice=client();
   let r=await alice.call('bootstrap');
   assert.equal(r.status,200);assert.equal(r.body.user,null);assert.ok(alice.csrf.length>20);
   r=await alice.call('register',{email:'alice@example.test',alias:'corredora_1',password:'correct horse battery 2026'});
   assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.user.alias,'corredora_1');
   assert.equal(r.body.user.email_verified,false);assert.equal(r.body.verification_email_sent,false);
   r=await alice.call('bootstrap');assert.equal(r.body.user.email,'alice@example.test');
   r=await alice.call('favorite',{symbol:'BTC',enabled:true});assert.equal(r.status,200,JSON.stringify(r.body));
   r=await alice.call('favorite',{symbol:'NOT-A-HORSE',enabled:true});assert.equal(r.status,400);
   r=await alice.call('favorites');assert.deepEqual(r.body.favorites.map(x=>x.symbol),['BTC']);
   r=await alice.call('update_profile',{alias:'corredora_2',timezone:'UTC',locale:'es',public_profile:true,notify_enabled:false});
   assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.user.alias,'corredora_2');
   r=await alice.call('profile&alias=corredora_2');assert.equal(r.status,200);
   assert.ok(!('email' in r.body.profile),'Public view must not leak email');
   await bob.call('bootstrap');
   r=await bob.call('register',{email:'bob@example.test',alias:'jinete_1',password:'correct horse battery 2027'});
   assert.equal(r.status,201,JSON.stringify(r.body));
   r=await bob.call('favorites');assert.equal(r.body.favorites.length,0,'No cross-account favorites');
   r=await bob.call('profile&alias=jinete_1');assert.equal(r.status,404,'Private profile must be hidden');
   await otherAlice.call('bootstrap');
   r=await otherAlice.call('login',{email:'alice@example.test',password:'wrong password 2026'});assert.equal(r.status,401);
   r=await otherAlice.call('login',{email:'alice@example.test',password:'correct horse battery 2026'});assert.equal(r.status,200);
   r=await alice.call('sessions');assert.equal(r.body.active_sessions,2);
   r=await alice.call('logout_all',{});assert.equal(r.status,200);
   r=await alice.call('bootstrap');assert.equal(r.body.user,null,'Logout must revoke current session');
   r=await otherAlice.call('bootstrap');assert.equal(r.body.user,null,'Logout all must revoke other session');
   r=await bob.call('bootstrap');assert.equal(r.body.user.email,'bob@example.test','Other account stays signed in');
   r=await bob.call('request_reset',{email:'bob@example.test'});assert.equal(r.status,503,'No fake mail success');
   r=await bob.call('logout',{});assert.equal(r.status,200);
   r=await bob.call('bootstrap');assert.equal(r.body.user,null);
   console.log('Register, login, separate accounts, CSRF, public privacy, persistent sessions, favorites, revocation and mail gating: OK');
 } finally {
   if(server){server.kill('SIGTERM');await sleep(100);}
   rmSync(dir,{recursive:true,force:true});
 }
});
