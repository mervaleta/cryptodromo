import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('canonical hub owns the sole badge album',()=>{
 const hub=read('comunidad/index.html');
 assert.match(hub,/id="badge-album"/);
 assert.match(hub,/id="badge-filters"/);
 assert.match(hub,/id="demo-album"/);
 assert.match(hub,/features\/community-achievements\/catalog-page\.js/);
 assert.doesNotMatch(hub,/id="badge-grid"/);
 assert.equal((hub.match(/id="badge-album"/g)||[]).length,1);
 assert.doesNotMatch(hub,/const badges=\[\['Primer casco'/);
});
test('legacy entry points to canonical hub without deleting local preferences',()=>{
 const legacy=read('comunidad.html');
 const hub=read('comunidad/index.html');
 assert.match(legacy,/http-equiv="refresh" content="0;url=\/comunidad\/"/);
 assert.match(legacy,/href="\/comunidad\/"/);
 assert.match(hub,/cryptodromo-community-local-v2/);
 assert.match(hub,/localStorage\.getItem\(key\)/);
});
test('sport systems stay separate and discoverable',()=>{
 const hub=read('comunidad/index.html');
 assert.match(hub,/href="\/stables\/"/);
 assert.match(hub,/href="\/championship\/"/);
 assert.match(hub,/sesión de invitado distinta/);
 const badgeJs=read('features/community-achievements/catalog-page.js');
 assert.doesNotMatch(badgeJs,/fetch\s*\(|localStorage|awardEvent/);
});
test('catalog and showcase render via textContent, not innerHTML',()=>{
 const album=read('features/community-achievements/album.js');
 assert.match(album,/textContent/);
 assert.doesNotMatch(album,/innerHTML/);
});
