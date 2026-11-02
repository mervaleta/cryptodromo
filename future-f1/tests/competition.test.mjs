import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompetition,FIRST_DECK,SECOND_DECK} from '../core/competition.js';
const runner=(symbol,input1,input2,c1=FIRST_DECK,c2=SECOND_DECK)=>({symbol,input1,input2,coefficients1:c1,coefficients2:c2});
test('repeatable results and time sampling',()=>{
 const params={id:'d1-r001',entries:[runner('BTC',.6,.5),runner('ETH',-.2,.1)]};
 const a=createCompetition(params),b=createCompetition(params);
 assert.deepEqual(a.result,b.result);
 assert.deepEqual(a.sample(30),b.sample(30));
 assert.ok(a.sample(0).every(x=>x.progress===0));
});
test('shuffled common coefficient decks do not change finish',()=>{
 const a=createCompetition({id:'race',entries:[runner('BTC',.6,.5),runner('ETH',.1,.15)]});
 const b=createCompetition({id:'race',entries:[runner('BTC',.6,.5,[...FIRST_DECK].reverse(),[...SECOND_DECK].reverse()),runner('ETH',.1,.15)]});
 assert.deepEqual(a.result,b.result);
 assert.notDeepEqual(a.sample(7),b.sample(7));
});
test('validation and stable finish ranking',()=>{
 assert.throws(()=>createCompetition({id:'race',entries:[runner('BTC',1,2),runner('BTC',2,3)]}));
 assert.throws(()=>createCompetition({id:'race',entries:[runner('BTC',1,2,[1]),runner('ETH',2,3)]}));
 const a=createCompetition({id:'race',entries:[runner('ETH',0,0),runner('BTC',0,0)]});
 assert.equal(a.result[0].symbol,'BTC');
 assert.deepEqual(a.sample(60),a.sample(100));
});
