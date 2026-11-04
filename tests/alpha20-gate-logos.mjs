import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync(new URL('../visual-lab/broadcastGateNumbers.js',import.meta.url),'utf8');
const {localGateLogoUrl,gateLogoCandidates}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
test('local gate logos point to real committed assets',()=>{
 const symbols=source.match(/LOCAL_LOGOS=new Set\(\('([^']+)'\)/)[1].split(' ');
 assert.ok(symbols.length>=40);
 for(const symbol of symbols){
  const url=localGateLogoUrl(symbol);
  assert.ok(url&&url.startsWith('/assets/crypto-logos/'));
  assert.ok(existsSync(new URL('..'+url,import.meta.url)),symbol+' logo missing');
 }
});
test('fallback is published same-origin horse logo, never remote',()=>{
 assert.deepEqual(gateLogoCandidates('BTC'),['/assets/crypto-logos/btc.svg','/api/horse-logo.php?symbol=BTC']);
 assert.deepEqual(gateLogoCandidates('HYPE'),['/api/horse-logo.php?symbol=HYPE']);
 assert.deepEqual(gateLogoCandidates('../../bad'),[]);
 assert.deepEqual(gateLogoCandidates(''),[]);
});
test('gate signage uses fixture order and never touches race engine',()=>{
 assert.match(source,/next\.forEach\(\(entry,i\)=>/);
 assert.match(source,/draw\(i,entry,null\)/);
 assert.match(source,/generation===version/);
 assert.match(source,/texture\.needsUpdate=true/);
 assert.doesNotMatch(source,/officialRanking|input1|input2|setInterval|new Date/);
});
