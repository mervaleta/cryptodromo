import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,addAccount,topUp,buyCredits,sellCredits,quoteTicket,placeTicket,settleTickets,rankAccounts} from './ledger.js';
const start=Date.now()+120000;
const fixture=()=>({raceId:100,day:0,slot:100,runner:'BTC',kind:'WIN',stake:100,decimalOdds:8,startsAt:start});
test('demo user, top-up and reversible exchange',()=>{
 const s=emptyState();const a=addAccount(s,'Corredor1');assert.equal(a.usdCents,10000);
 topUp(s,5);assert.equal(a.usdCents,10500);
 buyCredits(s,5);assert.equal(a.usdCents,10000);assert.equal(a.credits,500);
 sellCredits(s,200);assert.equal(a.usdCents,10200);assert.equal(a.credits,300);
 assert.equal(a.ledger.filter(x=>x.type==='exchange_buy').length,2);
});
test('reject insufficient funds, invalid stakes, and closed windows',()=>{
 const s=emptyState();addAccount(s,'Corredor2');
 assert.throws(()=>buyCredits(s,200));
 assert.throws(()=>quoteTicket({...fixture(),stake:0}));
 assert.throws(()=>quoteTicket(fixture(),start-4000));
 assert.throws(()=>placeTicket(s,fixture()));
});
test('settle only finished races once against official ranking',()=>{
 const s=emptyState(),a=addAccount(s,'Corredor3');
 buyCredits(s,10);
 const q=quoteTicket(fixture(),start-60000);
 const t=placeTicket(s,q,start-60000);
 assert.equal(a.credits,900);assert.equal(a.tickets.length,1);
 const resolve=()=>['BTC','ETH','SOL','ADA','DOGE','XRP','BNB','AVAX','DOT','LINK','LTC','UNI'];
 assert.equal(settleTickets(s,resolve,start+59999).length,0);
 assert.equal(settleTickets(s,resolve,start+60000).length,1);
 assert.equal(t.status,'won');assert.equal(a.credits,1700);
 assert.equal(settleTickets(s,resolve,start+70000).length,0);
 assert.equal(rankAccounts(s)[0].wins,1);
});
test('loss, rank and duplicate ticket protections',()=>{
 const s=emptyState(),a=addAccount(s,'Corredor4');buyCredits(s,10);
 const q=quoteTicket(fixture(),start-40000);placeTicket(s,q,start-40000);
 assert.throws(()=>placeTicket(s,q,start-39000),/ticket abierto/);
 settleTickets(s,()=>['ETH','SOL','ADA','DOGE','XRP','BNB','AVAX','DOT','LINK','LTC','UNI','BTC'],start+60000);
 assert.equal(a.credits,900);assert.equal(a.tickets[0].status,'lost');
});
