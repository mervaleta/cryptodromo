import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const revision=JSON.parse(read('racers/btc-master-revision.json'));
const master=read('racers/btc-maya-master.js');
const page=read('racers/index.html');
const racers=read('racers/racers.js');

test('master revision matches the actually selected BTC 3D render build',()=>{
 assert.equal(revision.symbol,'BTC');
 assert.match(revision.buildId,/^[a-z0-9-]+$/i);
 if(revision.masterId==='btc-original-glb-gallop'){
  const native=read('race-lab/source/src/btcNativeLookdev.js');
  const match=native.match(/export const BTC_NATIVE_MASTER_BUILD='([^']+)'/);
  assert.ok(match,'native GLB lookdev build identifier missing');
  assert.equal(revision.buildId,match[1],'Public BTC fiche must describe the native GLB master');
  assert.match(racers,/requestedBTCMaster==='maya'\?'maya'/,'Maya remains explicit debug only');
 }else{
  const match=master.match(/export const BTC_MAYA_RENDER_BUILD='([^']+)'/);
  assert.ok(match,'Maya build identifier missing');
  assert.equal(revision.buildId,match[1],'The visible fiche must not promise another build');
  assert.equal(revision.masterId,master.match(/export const BTC_MAYA_MASTER='([^']+)'/)?.[1]);
 }
 assert.ok(['verified','pending_deploy','needs_fix','needs_visual_qa'].includes(revision.status));
 assert.match(revision.publicUrl,/https:\/\/race\.cryptodromo\.com\/racers\/#BTC/);
 assert.ok(Array.isArray(revision.openIssues));
});
test('canonical fiche exposes build metadata and unresolved defects',()=>{
 assert.match(page,/id="btc-master-revision"/);
 assert.match(page,/id="btc-master-build"/);
 assert.match(page,/id="btc-master-status"/);
 assert.match(racers,/btc-master-revision\.json/);
 assert.match(racers,/renderBTCRevision/);
 assert.match(read('AGENTS.md'),/CUALQUIER modificación del maestro BTC/);
 assert.match(read('racers/AGENTS.md'),/212734\.mp4/);
 assert.match(read('docs/BTC-MASTER-CHANGELOG.md'),/Ficha|https:\/\/race\.cryptodromo\.com\/racers\/#BTC/);
 assert.match(read('docs/BTC-MASTER-VISUAL-BACKLOG.md'),/pupila/);
 assert.match(read('docs/BTC-MANE-TAIL-PHYSICS-BRIEF.md'),/212734\.mp4/);
});
test('source changes to BTC require version bump, public fiche and changelog in one PR',()=>{
 const base=process.env.CRP_POLICY_BASE;
 if(!base)return;
 const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const masterChanged=changed.some(path=> /^racers\/btc-(?!master-revision\.json)/.test(path) ||
  /^(race-lab\/source\/src\/horse\.js|race-lab\/source\/public\/assets\/horse\.glb)$/.test(path));
 if(!masterChanged)return;
 for(const mandatory of ['racers/btc-master-revision.json','docs/BTC-MASTER-CHANGELOG.md','racers/index.html'])
   assert.ok(changed.includes(mandatory),'A BTC change MUST update '+mandatory+' in the same PR');
 try{
  const old=JSON.parse(execFileSync('git',['show',base+':racers/btc-master-revision.json'],{encoding:'utf8'}));
  assert.notEqual(old.buildId,revision.buildId,'BTC source change requires a NEW buildId');
 }catch(e){
  if(e?.code!=='ENOENT'&&!(String(e?.stderr||'').includes('does not exist'))&&!(String(e?.message||'').includes('does not exist')))
   throw e;
 }
});
