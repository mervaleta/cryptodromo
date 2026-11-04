import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=read('addons/premium-consumer/consumer.js');
const css=read('addons/premium-consumer/consumer.css');
const home=read('index.html');
const cashier=read('demo-caja/index.html');

test('consumer layer preserves official race and uses server wallet',()=>{
 assert.match(client,/getRaceFixture\(/);
 assert.match(client,/\/api\/demo-wallet\.php/);
 assert.match(client,/absolute_round/);
 assert.match(client,/credentials:'same-origin'/);
 assert.doesNotMatch(client,/officialRanking|createHorse|scene\.add|localStorage|sessionStorage/);
});
test('twelve runners, three markets and explicit confirmation',()=>{
 assert.match(client,/race\.entries\.length!==12/);
 for(const market of ['WIN','PLACE','SHOW'])assert.match(client,new RegExp(market));
 assert.match(client,/Revisar ticket/);
 assert.match(client,/Confirmar ticket/);
 assert.match(client,/crypto\.getRandomValues/);
});
test('prevents parallel account refresh and preserves technical QA controls',()=>{
 assert.match(client,/document\.hidden\|\|loading/);
 assert.match(client,/qa\|debug\|test\|advanced\|camera/);
 assert.match(client,/pm-tech/);
});
test('CSS scoped, separate board and market selectors, mobile and reduced motion',()=>{
 assert.match(css,/body\[data-premium-mounted="1"\]/);
 assert.match(css,/\.pm-board\{/);
 assert.match(css,/\.pm-markets\{display:grid/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/prefers-reduced-motion/);
});
test('home retains WebGL stage and loads .js consumer modules',()=>{
 assert.match(home,/id="raceCanvas"/);
 assert.match(home,/class="stage"/);
 assert.match(home,/addons\/premium-consumer\/consumer\.js/);
 assert.match(home,/addons\/premium-consumer\/consumer\.css/);
 assert.doesNotMatch(home,/addons\/premium-consumer\/consumer\.mjs/);
});
test('single cashier remains connected and is not replaced',()=>{
 assert.match(cashier,/id="cr"/);
 assert.match(cashier,/demo\.js/);
 assert.match(cashier,/Cuenta|Caja|caja|CRÉDITOS|Créditos/);
});