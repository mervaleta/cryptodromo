import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root = resolve(import.meta.dirname, '..');
const read = p => readFileSync(resolve(root,p),'utf8');
const inv = JSON.parse(read('marketing/inventory.json'));
test('single source of truth: unique placement IDs, six live positions',()=>{
 assert.equal(inv.version,1);
 assert.equal(new Set(inv.placements.map(s=>s.id)).size,inv.placements.length);
 assert.equal(inv.placements.filter(s=>s.status==='available').length,6);
 assert.equal(inv.placements.filter(s=>s.status==='planned').length,3);
 for(const slot of inv.placements)assert.ok(['available','reserved','planned'].includes(slot.status));
});
test('marketing landing exposes every digital placement and a valid inquiry route',()=>{
 const html=read('marketing/index.html');
 assert.match(html,/href="\/assets\/marketing\.css/);
 assert.match(html,/id="mk-inquiry-form"/);
 assert.match(html,/mailto:info@cryptodromo\.com/);
 for(const item of inv.placements.filter(s=>s.status!=='planned')){
  assert.ok(html.includes('data-slot="'+item.id+'"'),item.id);
  assert.ok(html.includes('value="'+item.id+'"'),item.id);
 }
});
test('all added JS parses without external toolchain',()=>{
 for(const path of ['assets/ad-inventory.js','assets/crp-global-nav.js','assets/institutional.js','marketing/marketing.js']){
  assert.doesNotThrow(()=>new vm.Script(read(path),{filename:path}),path);
 }
});
test('advertising mounts outside render and is fed by shared scripts',()=>{
 const ads=read('assets/ad-inventory.js');
 assert.match(ads,/insertAdjacentElement/);
 assert.doesNotMatch(ads,/(?:canvas\.getContext|WebGLRenderer|requestAnimationFrame)/);
 assert.ok(read('assets/crp-global-nav.js').includes('/assets/ad-inventory.js'));
 assert.ok(read('assets/institutional.js').includes('/assets/ad-inventory.js'));
 assert.ok(read('assets/crp-global-nav.js').includes('/marketing/'));
});
