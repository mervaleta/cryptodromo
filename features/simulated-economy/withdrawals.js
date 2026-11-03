// Retiro simulado de caja USD_DEMO; no redes ni contrapartes reales.
// Importes expresados como centavos enteros. La reserva sucede al solicitar.
// Comisiones calculadas antes de confirmar y aplicadas al monto debitado.
export const WITHDRAWAL_METHODS=Object.freeze({
 bank:{label:'Transferencia bancaria ficticia',fixedFeeCents:25,feeBps:100,minCents:500},
 crypto_usdt:{label:'USDT ficticio (red simulada)',fixedFeeCents:50,feeBps:50,minCents:1000},
 crypto_btc:{label:'BTC ficticio (red simulada)',fixedFeeCents:100,feeBps:75,minCents:1500}
});
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'withdraw-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const account=s=>{const a=s?.accounts?.find(x=>x.id===s.activeId);if(!a)throw Error('Seleccioná primero un jugador');return a};
const positive=n=>Number.isSafeInteger(n)&&n>0;
function ledger(a,type,amount,currency,withdrawalId){
 a.ledger.push({id:uid(),at:new Date().toISOString(),type,amount,currency,withdrawalId});
}
export function quoteWithdrawal({method,amountCents}){
 const m=WITHDRAWAL_METHODS[method];
 if(!m)throw Error('Método de retiro no disponible');
 if(!positive(amountCents)||amountCents>1000000)throw Error('El monto debe estar entre 0,01 y 10.000 USD demo');
 if(amountCents<m.minCents)throw Error('El mínimo ficticio para este método es '+(m.minCents/100).toFixed(2)+' USD demo');
 const variableFeeCents=Math.ceil(amountCents*m.feeBps/10000);
 const feeCents=m.fixedFeeCents+variableFeeCents;
 if(feeCents>=amountCents)throw Error('El importe no cubre la comisión');
 return {method,amountCents,feeCents,netCents:amountCents-feeCents,provider:'mock-sandbox-v1',currency:'USD_CENTS'};
}
export function requestWithdrawal(s,request){
 const a=account(s),q=quoteWithdrawal(request);
 if(!Number.isSafeInteger(a.usdCents)||a.usdCents<q.amountCents)throw Error('Saldo disponible insuficiente');
 if(!Array.isArray(a.withdrawals))a.withdrawals=[];
 if(a.withdrawals.filter(w=>['pending','approved','processing'].includes(w.status)).length>=3)throw Error('Ya tenés tres retiros ficticios pendientes');
 const w={...q,id:uid(),accountId:a.id,createdAt:new Date().toISOString(),completedAt:null,status:'pending'};
 // amountCents is inclusive of fees. Reserve once, no other path can spend reserved money.
 a.usdCents-=q.amountCents;
 a.withdrawals.push(w);
 ledger(a,'withdrawal_reserved',-q.amountCents,'USD_CENTS',w.id);
 return w;
}
export function advanceWithdrawal(s,id,action){
 const a=account(s),w=a.withdrawals?.find(x=>x.id===id);
 if(!w)throw Error('Retiro inexistente para este jugador');
 const next={
  pending:{approve:'approved',reject:'rejected',cancel:'cancelled'},
  approved:{process:'processing',reject:'rejected',cancel:'cancelled'},
  processing:{complete:'completed',fail:'failed'}
 }[w.status]?.[action];
 if(!next)throw Error('Transición inválida o retiro ya procesado');
 // Returning funds must happen once. No refunds after successful completion.
 if(['rejected','cancelled','failed'].includes(next)){
  if(!Number.isSafeInteger(a.usdCents)||a.usdCents+w.amountCents>100000000)throw Error('Límite de caja demo');
  a.usdCents+=w.amountCents;
  ledger(a,'withdrawal_reversed',w.amountCents,'USD_CENTS',w.id);
 }
 if(next==='completed'){
  ledger(a,'withdrawal_completed',w.netCents,'USD_CENTS_OUT',w.id);
  ledger(a,'withdrawal_fee',w.feeCents,'USD_CENTS_FEE',w.id);
 }
 w.status=next;
 w.updatedAt=new Date().toISOString();
 if(['completed','rejected','cancelled','failed'].includes(next))w.completedAt=w.updatedAt;
 return w;
}
