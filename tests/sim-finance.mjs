import test from 'node:test';
import assert from 'node:assert/strict';
import {SimLedger,quote,ASSETS} from '../finance/sim-core.mjs';
const prices={CR:10000,USD:1000000,USDT:1000000,BTC:95000000000,ETH:3400000000};
test('multi-asset conversion is balanced and fees belong to treasury',()=>{
 const l=new SimLedger();l.seed('test','CR',10000000,'seed');
 const q=quote({from:'CR',to:'USDT',amount:1000000,usdMicroPerUnit:prices,now:1000});
 const x=l.convert('test','conversion-1',q,1100);
 assert.equal(x.metadata.kind,'conversion');
 assert.equal(l.balance('user/test','CR'),9000000);
 assert.equal(l.balance('user/test','USDT'),q.received);
 assert.equal(l.balance('platform/fees','CR'),q.fee);
 assert.equal(l.balance('platform/spread','CR'),q.spread);
 assert.equal(l.convert('test','conversion-1',q,1100),x,'idempotent conversion');
 assert.throws(()=>l.convert('test','conversion-2',q,50000),/expired/);
 assert.throws(()=>l.convert('test','conversion-3',{...q,amount:99999999},1100),/Insufficient/);
});
test('simulated withdrawal settlement and rejection are double-entry',()=>{
 const l=new SimLedger();l.seed('test','USDT',5000000,'seed');
 l.requestWithdrawal('test','wd1','USDT',1000000,10000);
 assert.equal(l.balance('user/test','USDT'),4000000);
 assert.equal(l.balance('platform/withdrawal-pending/wd1','USDT'),990000);
 l.settleWithdrawal('settle1','wd1','USDT',990000);
 assert.equal(l.balance('platform/withdrawal-pending/wd1','USDT'),0);
 assert.throws(()=>l.settleWithdrawal('settle2','wd1','USDT',990000),/Already finalized/);
 l.requestWithdrawal('test','wd2','USDT',1000000,10000);
 l.settleWithdrawal('reject2','wd2','USDT',990000,{fail:true});
 assert.equal(l.balance('user/test','USDT'),3990000);
});
test('asset catalogue and validation',()=>{
 assert.equal(Object.keys(ASSETS).length,20);
 assert.throws(()=>quote({from:'CR',to:'BTC',amount:1,usdMicroPerUnit:prices}),/small/);
 assert.throws(()=>quote({from:'CR',to:'XYZ',amount:10000,usdMicroPerUnit:prices}),/Unsupported/);
});
