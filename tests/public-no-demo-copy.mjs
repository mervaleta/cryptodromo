import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {join,relative} from 'node:path';

const ROOT=new URL('../',import.meta.url).pathname;
const SKIP=new Set(['.git','node_modules','.next','.cache','dist','coverage','rngmarketdriven-live-backup-20261013']);
function walk(base,out=[]){
 for(const entry of readdirSync(base,{withFileTypes:true})){
   if(entry.name.startsWith('.')&&entry.name!=='.github')continue;
   if(SKIP.has(entry.name))continue;
   const path=join(base,entry.name);
   if(entry.isDirectory())walk(path,out);
   else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(path);
 }
 return out;
}
function visibleCopy(html){
 const stripped=html
   .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'')
   .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'')
   .replace(/<!--[^]*?-->/g,'');
 const copy=stripped.replace(/<[^>]*>/g,' ');
 const attrs=[...stripped.matchAll(/\b(?:content|title|alt|aria-label|placeholder)=(["'])(.*?)\1/gi)]
   .map(x=>x[2]).filter(x=>!/^https?:|^data:/.test(x));
 return [copy,...attrs].join(' ').replace(/\s+/g,' ');
}
test('No publicly rendered HTML, accessibility label or metadata contains the banned badge word',()=>{
 const violations=[];
 const pages=walk(ROOT);
 for(const file of pages){
   const text=visibleCopy(readFileSync(file,'utf8'));
   const m=/\bdemo\b/i.exec(text);
   if(m)violations.push({path:relative(ROOT,file),context:text.slice(Math.max(0,m.index-65),m.index+100)});
 }
 assert.ok(pages.length>170,'expected full public site tree, not a partial stub');
 assert.deepEqual(violations,[],'The public racing website must not render the banned label');
});
test('Broadcast JS and scoreboards never inject that badge',()=>{
 const paths=[
  'assets/crp-global-nav.js','assets/crypto-venue.js','assets/crypto-stadium-clocks.js',
  'assets/stadium-network-ui.js','assets/stadium-network-engine.js','autodromo/app.js',
  'assets/stables.js','race-lab/source/src/churchillStadium.js',
  'race-lab/source/src/stadium/venue.js'
 ];
 for(const path of paths){
  const source=readFileSync(join(ROOT,path),'utf8');
  assert.doesNotMatch(source,/(?:●|·)\s*DEMO\b|<[^>]+>\s*DEMO\s*<|['"]DEMO['"]/,
   'Visible race badge still present in '+path);
 }
});
test('Key public pages retain transparent synthetic-price disclosures',()=>{
 const home=readFileSync(join(ROOT,'index.html'),'utf8');
 const broadcast=readFileSync(join(ROOT,'stadiums/crypto/broadcast/index.html'),'utf8');
 const motor=readFileSync(join(ROOT,'autodromo/index.html'),'utf8');
 assert.match(home,/sintétic/);
 assert.match(broadcast,/WORLD FEED/);
 assert.match(motor,/sintétic/);
 assert.match(motor,/No hay apuestas/);
 assert.doesNotMatch(broadcast,/<b>● DEMO<\/b>/);
 assert.doesNotMatch(readFileSync(join(ROOT,'visual-lab/index.html'),'utf8'),/<b>● DEMO<\/b>/);
});

// Every public entrypoint must reference this copy revision, not a stale
// browser-cached script URL from the previous branding.
test('public race entrypoints use cache-busted scripts for cleaned broadcast copy',()=>{
 const expected={
  'stadiums/crypto/live/index.html':'/assets/crypto-venue-broadcast-aaa-20261105.js',
  'autodromo/index.html':'./app.js?v=copy-clean-20261105-v1',
  'stadiums/index.html':'/assets/stadium-network-ui.js?v=copy-clean-20261105-v1',
  'stadiums/crypto/broadcast/index.html':'/assets/crp-global-nav.js?v=copy-clean-20261105-v1',
  'visual-lab/index.html':'/assets/crp-global-nav.js?v=copy-clean-20261105-v1',
  'institucional/index.html':'/assets/crp-global-nav.js?v=copy-clean-20261105-v1',
  'race-lab/source/index.html':'/assets/crp-global-nav.js?v=copy-clean-20261105-v1',
  'public/index.html':'/race-lab/source/src/main.js?v=copy-clean-20261105-v1'
 };
 for(const [path,expectedSrc] of Object.entries(expected)){
  const html=readFileSync(join(ROOT,path),'utf8');
  assert.ok(html.includes(expectedSrc),path+' still loads stale code instead of '+expectedSrc);
 }
 const worldUI=readFileSync(join(ROOT,'assets/stadium-network-ui.js'),'utf8');
 assert.ok(worldUI.includes('/assets/stadium-network-engine.js?v=copy-clean-20261105-v1'));
 const engine=readFileSync(join(ROOT,'assets/stadium-network-engine.js'),'utf8');
 assert.doesNotMatch(engine,/"stage":"fixture demo"/i);
});
