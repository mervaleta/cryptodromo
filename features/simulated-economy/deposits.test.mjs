import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,addAccount,switchAccount} from './ledger.js';
import {CRYPTO_RATES,quoteDeposit,createDepositIntent,resolveDepositIntent} from './deposits.js';
const request=(channel='fiat',method='card',packageUsd=25)=>({channel,method,packageUsd});
test('fiat quote and pending -> confirmed deposit only credit after confirmation',()=>{
 const state=emptyState(),a=addAccount(state,'FiatTester');
 const intent=createDepositIntent(state,request());
 assert.equal(intent.creditedCents,2500);
 assert.equal(a.usdCents,10000);
 assert.equal(intent.status,'pending');
 resolveDepositIntent(state,intent.id,'confirmed');
 assert.equal(a.usdCents,12500);
 assert.equal(intent.status,'confirmed');
 assert.equal(a.ledger.filter(x=>x.depositId===intent.id).length,1);
 assert.throws(()=>resolveDepositIntent(state,intent.id,'confirmed'),/ya fue procesada/);
 assert.equal(a.usdCents,12500);
});
test('crypto uses hardcoded quotes; no real chain or provider transactions',()=>{
 const state=emptyState(),a=addAccount(state,'CryptoTester');
 for(const asset of Object.keys(CRYPTO_RATES)){
  const q=quoteDeposit(request('crypto',asset,5));
  assert.equal(q.provider,'mock-sandbox-v1');
  assert.equal(q.currency,asset);
  assert.match(q.amount,/^\d+\.\d{8}$/);
  assert.equal(q.creditedCents,500);
 }
 const intent=createDepositIntent(state,request('crypto','USDT',10));
 assert.equal(intent.amount,'10.00000000');
 resolveDepositIntent(state,intent.id,'confirmed');
 assert.equal(a.usdCents,11000);
 assert.equal(a.ledger.at(-1).channel,'crypto');
});
test('cancelled deposits do not credit and cannot then confirm',()=>{
 const state=emptyState(),a=addAccount(state,'CancelTester');
 const d=createDepositIntent(state,request('fiat','bank',50));
 resolveDepositIntent(state,d.id,'cancelled');
 assert.equal(a.usdCents,10000);
 assert.throws(()=>resolveDepositIntent(state,d.id,'confirmed'),/ya fue procesada/);
 assert.equal(a.ledger.filter(x=>x.type==='deposit_completed').length,0);
});
test('only active account may resolve its own pending intent',()=>{
 const state=emptyState();const a=addAccount(state,'PlayerOne');
 const d=createDepositIntent(state,request());
 const b=addAccount(state,'PlayerTwo');
 assert.throws(()=>resolveDepositIntent(state,d.id,'confirmed'),/inexistente/);
 switchAccount(state,a.id);resolveDepositIntent(state,d.id,'confirmed');
 assert.equal(a.usdCents,12500);
 assert.equal(b.usdCents,10000);
});
test('reject invalid channel, packages, networks and excess pending',()=>{
 assert.throws(()=>quoteDeposit(request('crypto','DOGE',25)),/inválido/);
 assert.throws(()=>quoteDeposit(request('fiat','card',7)),/inválido/);
 assert.throws(()=>quoteDeposit(request('bank','bank',25)),/Canal/);
 const state=emptyState();addAccount(state,'LimitTester');
 for(let n=0;n<3;n++)createDepositIntent(state,request());
 assert.throws(()=>createDepositIntent(state,request()),/tres depósitos/);
});
