import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../visual-lab/showcase.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../visual-lab/index.html',import.meta.url),'utf8');
const {showcaseEnabled}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(src));
test('showcase is opt-in, not default LIVE behavior',()=>{
 assert.equal(showcaseEnabled(''),false);
 assert.equal(showcaseEnabled('?showcase=1'),true);
 assert.equal(showcaseEnabled('?showcase=0'),false);
 assert.equal(showcaseEnabled('?track=muybridge&showcase=1'),true);
});
test('launcher reuses existing replay and start controls',()=>{
 assert.match(src,/querySelector\('#replay-mode'\)/);
 assert.match(src,/querySelector\('#start'\)/);
 assert.match(src,/button\.click\(\)/);
 assert.match(src,/start\.disabled/);
 assert.match(src,/MutationObserver/);
});
test('showcase discloses synthetic data and does not modify race calculations',()=>{
 assert.match(src,/cotizaciones sintéticas/);
 assert.doesNotMatch(src,/officialRanking|createOfficialRace|priceAtStart|priceAtFinish|fetch\(/);
 assert.match(html,/showcase\.js\?v=showcase-20261104/);
});
