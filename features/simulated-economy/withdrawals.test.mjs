import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,addAccount,switchAccount} from './ledger.js';
import {quoteWithdrawal,requestWithdrawal,advanceWithdrawal} from './withdrawals.js';
test('fees are fixed plus rounded-up basis points, sum balances exactly',()=>{
 const q=quoteWithdrawal({method:'bank',amountCents:10000});
 assert.equal(q.feeCents,125);assert.equal(q.netCents,9875);
 assert.equal(q.feeCents+q.netCents,q.amountCents);
 const b=quoteWithdrawal({method:'crypto_usdt',amountCents:10000});
 assert.equal(b.feeCents,100);assert.equal(b.netCents,9900);
});
test('request reserves amount; processing and completion cannot duplicate payout',()=>{
 const s=emptyState(),a=addAccount(s,'RetiroDemo');
 const w=requestWithdrawal(s,{method:'bank',amountCents:5000});
 assert.equal(a.usdCents,5000);assert.equal(w.status,'pending');
 advanceWithdrawal(s,w.id,'approve');advanceWithdrawal(s,w.id,'process');advanceWithdrawal(s,w.id,'complete');
 assert.equal(w.status,'completed');assert.equal(a.usdCents,5000);
 assert.equal(a.ledger.filter(l=>l.withdrawalId===w.id&&l.type==='withdrawal_completed').length,1);
 assert.throws(()=>advanceWithdrawal(s,w.id,'complete'),/Transición inválida/);
 assert.throws(()=>advanceWithdrawal(s,w.id,'fail'),/Transición inválida/);
 assert.equal(a.usdCents,5000);
});
test('cancel, reject and fail release reserved funds once',()=>{
 const s=emptyState(),a=addAccount(s,'ReversaDemo');
 let w=requestWithdrawal(s,{method:'bank',amountCents:600});
 advanceWithdrawal(s,w.id,'cancel');assert.equal(a.usdCents,10000);
 assert.throws(()=>advanceWithdrawal(s,w.id,'cancel'));
 w=requestWithdrawal(s,{method:'bank',amountCents:700});
 advanceWithdrawal(s,w.id,'reject');assert.equal(a.usdCents,10000);
 w=requestWithdrawal(s,{method:'bank',amountCents:800});
 advanceWithdrawal(s,w.id,'approve');advanceWithdrawal(s,w.id,'process');advanceWithdrawal(s,w.id,'fail');
 assert.equal(a.usdCents,10000);
 assert.equal(a.ledger.filter(l=>l.type==='withdrawal_reversed').length,3);
});
test('no overdrafts and no cross-account processing',()=>{
 const s=emptyState(),one=addAccount(s,'CuentaUno');
 assert.throws(()=>requestWithdrawal(s,{method:'bank',amountCents:20000}),/insuficiente/);
 const w=requestWithdrawal(s,{method:'bank',amountCents:500});
 const two=addAccount(s,'CuentaDos');
 assert.throws(()=>advanceWithdrawal(s,w.id,'approve'),/inexistente/);
 switchAccount(s,one.id);advanceWithdrawal(s,w.id,'approve');
 assert.equal(two.usdCents,10000);
});
test('reject invalid methods and amounts',()=>{
 assert.throws(()=>quoteWithdrawal({method:'btc',amountCents:1500}),/no disponible/);
 assert.throws(()=>quoteWithdrawal({method:'bank',amountCents:100}),/mínimo/);
 assert.throws(()=>quoteWithdrawal({method:'crypto_btc',amountCents:500}),/mínimo/);
 assert.throws(()=>quoteWithdrawal({method:'bank',amountCents:3.2}),/monto/);
});
