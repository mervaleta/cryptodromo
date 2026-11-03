// Sandbox-only deposit adapters. All rates are deliberately fixed, not live quotes.
// Design contract: create intent -> confirm/cancel -> final ledger credit (idempotent).
export const DEMO_USD_PACKAGES=Object.freeze([5,10,25,50,100]);
export const FIAT_METHODS=Object.freeze({card:'Tarjeta ficticia',bank:'Transferencia bancaria ficticia'});
export const CRYPTO_RATES=Object.freeze({
 BTC:{name:'Bitcoin',usdPerUnit:70000,decimals:8},
 ETH:{name:'Ethereum',usdPerUnit:3500,decimals:8},
 USDT:{name:'Tether (red simulada)',usdPerUnit:1,decimals:8},
 SOL:{name:'Solana',usdPerUnit:150,decimals:8}
});
export const MOCK_PROVIDER='mock-sandbox-v1';
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'mock-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const owner=(s)=>{const a=s?.accounts?.find(x=>x.id===s.activeId);if(!a)throw Error('Seleccioná primero un jugador');return a};
const allowedPackage=usd=>{if(!DEMO_USD_PACKAGES.includes(usd))throw Error('Paquete de demostración inválido');return usd*100};
export function quoteDeposit({channel,method,packageUsd}){
 const cents=allowedPackage(packageUsd);
 if(channel==='fiat'){
  if(!Object.hasOwn(FIAT_METHODS,method))throw Error('Medio fiat de simulación inválido');
  return {channel,method,packageUsd,creditedCents:cents,feeCents:0,payableCents:cents,amount:String(packageUsd.toFixed(2)),currency:'USD_DEMO',provider:MOCK_PROVIDER};
 }
 if(channel==='crypto'){
  const rate=CRYPTO_RATES[method];if(!rate)throw Error('Activo criptográfico inválido');
  // Fixed illustrative quote with 8 decimal places; no actual network or crypto address.
  const units=BigInt(cents)*100000000n/BigInt(rate.usdPerUnit*100);
  if(units<1n)throw Error('El importe de prueba no admite 8 decimales');
  const whole=(units/100000000n).toString(),fraction=(units%100000000n).toString().padStart(8,'0');
  return {channel,method,packageUsd,creditedCents:cents,feeCents:0,payableCents:cents,amount:whole+'.'+fraction,currency:method,provider:MOCK_PROVIDER,rateUsd:rate.usdPerUnit};
 }
 throw Error('Canal no admitido');
}
export function createDepositIntent(s,request){
 const a=owner(s),q=quoteDeposit(request);
 if(!Array.isArray(a.deposits))a.deposits=[];
 if(a.deposits.filter(d=>d.status==='pending').length>=3)throw Error('Máximo tres depósitos simulados pendientes por jugador');
 const record={...q,id:uid(),status:'pending',accountId:a.id,createdAt:new Date().toISOString(),completedAt:null};
 a.deposits.push(record);return record;
}
export function resolveDepositIntent(s,id,decision){
 if(!['confirmed','cancelled'].includes(decision))throw Error('Estado de depósito no válido');
 const a=owner(s);
 const intent=a.deposits?.find(d=>d.id===id);
 if(!intent)throw Error('Solicitud de ingreso inexistente');
 // A finalized intent cannot be charged or credited twice, even after reloading the state.
 if(intent.status!=='pending')throw Error('La operación ya fue procesada');
 if(decision==='confirmed'){
  if(!Number.isSafeInteger(a.usdCents)||a.usdCents+intent.creditedCents>100000000)throw Error('Límite del saldo ficticio');
  a.usdCents+=intent.creditedCents;
  a.ledger.push({id:uid(),at:new Date().toISOString(),type:'deposit_completed',amount:intent.creditedCents,currency:'USD_CENTS',depositId:intent.id,provider:MOCK_PROVIDER,channel:intent.channel,method:intent.method});
 }
 intent.status=decision;intent.completedAt=new Date().toISOString();
 return intent;
}
