import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const filename=new URL('../visual-lab/broadcastGates.js',import.meta.url);
const source=readFileSync(filename,'utf8');
// Import as ESM regardless of repository package-type settings, without WebGL.
const {GATE_COUNT,GATE_PITCH,gateOpenFraction,gatePositions,validateGateEntries}=
 await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
const entries=Array.from({length:12},(_,i)=>({symbol:'TOKEN'+i,color:'#19cc99'}));
test('fixture contract is strictly twelve distinct symbols',()=>{
 assert.equal(validateGateEntries(entries),true);
 assert.throws(()=>validateGateEntries(entries.slice(0,11)),/Exactly 12/);
 assert.throws(()=>validateGateEntries([...entries.slice(0,11),entries[0]]),/Repeated/);
});
test('stalls match the pre-existing Alpha18 geometric layout',()=>{
 const positions=gatePositions(-390);
 assert.equal(GATE_COUNT,12);assert.equal(GATE_PITCH,2.55);
 assert.equal(positions.length,12);
 assert.equal(positions[0].x,-393.6);
 assert.ok(Math.abs(positions[0].z+14.025)<1e-8);
 assert.ok(Math.abs(positions[11].z-14.025)<1e-8);
});
test('door timing is stable, clamped, and monotonically opening',()=>{
 assert.equal(gateOpenFraction(-1),0);
 assert.equal(gateOpenFraction(0),0);
 assert.equal(gateOpenFraction(.72),1);
 assert.equal(gateOpenFraction(8),1);
 let previous=0;
 for(let i=0;i<=72;i++){const n=gateOpenFraction(i/100);assert.ok(n>=previous);previous=n;}
});
test('graphics module contains no official race output dependencies',()=>{
 assert.doesNotMatch(source,/\b(import|fetch)\b/);
 assert.doesNotMatch(source,/officialRanking|input1|input2|PRICE_FIXTURE/);
});
