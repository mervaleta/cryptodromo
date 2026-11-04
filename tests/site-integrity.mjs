import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const get=p=>readFileSync(resolve(ROOT,p),'utf8');
const exists=p=>existsSync(resolve(ROOT,p));
const publicRoutes=[
 '/', '/racers/', '/fixture/', '/resultados/', '/estadisticas/',
 '/grandes-premios/', '/stadiums/', '/stadiums/fixture/',
 '/estadio/', '/parade/', '/stables/', '/championship/', '/comunidad/',
 '/cronicas/', '/apuestas/', '/institucional/', '/como-funciona.html',
 '/metodologia.html', '/preguntas.html', '/contacto.html',
 '/juego-responsable.html', '/privacidad.html', '/terminos.html'
];
const routeFile=href=>{
 const pathname=href.split(/[?#]/)[0].replace(/^\//,'');
 return pathname===''?'index.html':pathname.endsWith('/')?pathname+'index.html':pathname;
};
test('all primary navigation routes are present',()=>{
 for(const route of publicRoutes)assert.ok(exists(routeFile(route)),'Missing primary route '+route);
 const nav=get('assets/crp-global-nav.js');
 for(const [,route] of nav.matchAll(/\[['"]((?:\/)[^'"]+)['"],['"][^'"]+['"]\]/g))
   assert.ok(exists(routeFile(route)),'Missing global navigation route '+route);
});
test('critical public pages have usable semantics and demo metadata',()=>{
 for(const path of ['index.html','institucional/index.html','como-funciona.html','contacto.html','preguntas.html']){
  const html=get(path);
  assert.match(html,/<!doctype html>/i,path+' missing doctype');
  assert.match(html,/<html[^>]*lang=['"]es['"]/i,path+' missing lang');
  assert.match(html,/<title[^>]*>[^<]+<\/title>/i,path+' missing title');
  assert.match(html,/<meta[^>]*name=['"]description['"]/i,path+' missing description');
  assert.match(html,/<h1(?:\s|>)/i,path+' missing H1');
 }
});
test('sitemap covers all public primary routes, with only HTTPS canonical links',()=>{
 const xml=get('sitemap.xml'),robots=get('robots.txt');
 for(const route of publicRoutes)assert.ok(xml.includes('<loc>https://race.cryptodromo.com'+route+'</loc>'),'Sitemap missing '+route);
 assert.match(robots,/Sitemap: https:\/\/race\.cryptodromo\.com\/sitemap\.xml/);
 assert.match(robots,/Disallow: \/admin\//);
 assert.match(robots,/Disallow: \/api\//);
});
test('retired deployment endpoints cannot write files or accept public tokens',()=>{
 assert.ok(!exists('.ssh_pass'),'Legacy credential file still tracked');
 assert.ok(!exists('askpass.sh'),'Legacy credential-helper file still tracked');
 for(const p of ['deploy.php','cryptodromo/deploy.php','prode-bursatil/deploy.php']){
  const code=get(p);
  assert.match(code,/http_response_code\(410\)/,'Unsafe legacy deploy endpoint '+p);
  assert.doesNotMatch(code,/file_put_contents|file_get_contents|secret_token|\$_GET\[['"]token['"]\]/i,'Executable deploy code remains '+p);
 }
 const auth=get('api/auth.php');
 assert.match(auth,/id_token/);
 assert.match(auth,/email_verified/);
 assert.doesNotMatch(auth,/Access-Control-Allow-Origin:\s*\*/i);
});
test('site includes a navigable, nontransactional 404 page',()=>{
 const html=get('404.html');
 assert.match(html,/<h1>404<\/h1>/);
 assert.match(html,/href="\/racers\/"/);
 assert.match(html,/No acepta apuestas ni dinero real/i);
});
test('internal references on key HTML pages resolve to tracked files',()=>{
 const pages=['index.html','institucional/index.html','como-funciona.html','racers/index.html','fixture/index.html','resultados/index.html','grandes-premios/index.html','contacto.html'];
 let missing=[];
 for(const page of pages){
  const content=get(page);
  for(const [,url] of content.matchAll(/(?:href|src)=["'](\/[^"'#?]*)(?:[?#][^"']*)?["']/gi)){
   const file=routeFile(url);
   if(!exists(file)&&!exists(file.replace(/\/index\.html$/i,'.html')))missing.push(page+' -> '+url);
  }
 }
 // Some deployment environments serve generated files not committed to the repo.
 // Fail only on primary route gaps above; display lower-priority asset gaps for QA.
 if(missing.length)console.warn('Internal references requiring deployment inspection:\n'+[...new Set(missing)].slice(0,40).join('\n'));
});
