/**
 * Cryptódromo simulated settlement domain. Pure deterministic integer accounting.
 * This module has no network, custodial, payment or blockchain integration.
 * Money is integer atomic units; FX rates are integer USD-micro per asset unit.
 */
export const ASSETS=Object.freeze({
 CR:{scale:10000},USD:{scale:100},EUR:{scale:100},ARS:{scale:100},
 USDT:{scale:1000000},USDC:{scale:1000000},DAI:{scale:1000000},
 BTC:{scale:100000000},ETH:{scale:100000000},SOL:{scale:1000000000},
 BNB:{scale:100000000},XRP:{scale:1000000},ADA:{scale:1000000},
 DOGE:{scale:100000000},LTC:{scale:100000000},TRX:{scale:1000000},
 AVAX:{scale:100000000},DOT:{scale:100000000},LINK:{scale:100000000},
 XLM:{scale:10000000},BCH:{scale:100000000}
});
export const DEFAULT_POLICY=Object.freeze({spreadBps:150,feeBps:75,withdrawalBps:50});
const check=(n,label)=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid '+label);return n;};
const multiply=(a,b,den)=>{check(a,'amount');check(b,'factor');check(den,'denominator');if(!den)throw Error('Zero denominator');const v=(BigInt(a)*BigInt(b))/BigInt(den);if(v>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Overflow');return Number(v);};
export function quote({from,to,amount,usdMicroPerUnit,policy=DEFAULT_POLICY,ttlMs=30000,now=Date.now()}){
 if(!ASSETS[from]||!ASSETS[to]||from===to)throw Error('Unsupported pair');
 check(amount,'amount');if(!amount)throw Error('Zero amount');
 check(now,'time');check(ttlMs,'ttl');if(!ttlMs||ttlMs>300000)throw Error('Invalid TTL');
 for(const k of ['spreadBps','feeBps'])if(!Number.isSafeInteger(policy[k])||policy[k]<0||policy[k]>2000)throw Error('Invalid '+k);
 const a=check(usdMicroPerUnit[from],'source rate'),b=check(usdMicroPerUnit[to],'target rate');
 if(!a||!b)throw Error('Missing market price');
 const spread= multiply(amount,policy.spreadBps,10000);
 const fee=multiply(amount,policy.feeBps,10000);
 if(spread+fee>=amount)throw Error('Amount too small for conversion');
 const net=amount-spread-fee;
 const numerator=BigInt(net)*BigInt(a)*BigInt(ASSETS[to].scale);
 const denominator=BigInt(ASSETS[from].scale)*BigInt(b);
 const received=Number(numerator/denominator);
 if(!Number.isSafeInteger(received)||received<=0)throw Error('Amount too small for target asset');
 return Object.freeze({from,to,amount,received,spread,fee,net,expiresAt:now+ttlMs,
   sourcePrice:a,targetPrice:b,mode:'simulation'});
}
export class SimLedger{
 constructor(){this.accounts=new Map();this.entries=[];this.operations=new Map();this.sequence=0;}
 key(owner,asset){if(!ASSETS[asset]||!owner)throw Error('Invalid account');return owner+':'+asset;}
 balance(owner,asset){return this.accounts.get(this.key(owner,asset))||0;}
 post(id,legs,metadata={}){
  if(this.operations.has(id))return this.operations.get(id);
  if(!id||!Array.isArray(legs)||legs.length<2)throw Error('Invalid operation');
  const totals=new Map(),changes=new Map();
  for(const leg of legs){
   if(!ASSETS[leg.asset]||!Number.isSafeInteger(leg.delta)||leg.delta===0)throw Error('Invalid leg');
   const key=this.key(leg.owner,leg.asset);
   totals.set(leg.asset,(totals.get(leg.asset)||0)+BigInt(leg.delta));
   changes.set(key,(changes.get(key)||0)+BigInt(leg.delta));
  }
  if([...totals.values()].some(v=>v!==0n))throw Error('Unbalanced journal');
  for(const [key,delta] of changes){
   const next=BigInt(this.accounts.get(key)||0)+delta;
   if(next>BigInt(Number.MAX_SAFE_INTEGER)||next<BigInt(Number.MIN_SAFE_INTEGER))throw Error('Overflow');
   // External clearing, platform and issuance accounts may go negative (liabilities).
   if(key.startsWith('user/')&&next<0n)throw Error('Insufficient balance');
  }
  for(const [key,delta] of changes)this.accounts.set(key,Number(BigInt(this.accounts.get(key)||0)+delta));
  const record=Object.freeze({id,sequence:++this.sequence,legs:legs.map(x=>({...x})),metadata:{...metadata}});
  this.operations.set(id,record);this.entries.push(record);return record;
 }
 seed(user,asset,amount,id){
  check(amount,'seed');if(!amount)throw Error('Zero seed');
  return this.post(id,[{owner:'user/'+user,asset,delta:amount},{owner:'simulation/issuance',asset,delta:-amount}],{kind:'test-funding'});
 }
 convert(user,id,q,now=Date.now()){
  if(this.operations.has(id))return this.operations.get(id);
  if(now>q.expiresAt)throw Error('Quote expired');
  if(q.mode!=='simulation')throw Error('Live execution prohibited');
  const u='user/'+user;
  return this.post(id,[
   {owner:u,asset:q.from,delta:-q.amount},
   {owner:'platform/liquidity',asset:q.from,delta:q.net},
   {owner:'platform/fees',asset:q.from,delta:q.fee},
   {owner:'platform/spread',asset:q.from,delta:q.spread},
   {owner:'platform/liquidity',asset:q.to,delta:-q.received},
   {owner:u,asset:q.to,delta:q.received}
  ],{kind:'conversion',quote:{...q}});
 }
 requestWithdrawal(user,id,asset,amount,fee=0){
  check(amount,'withdraw amount');check(fee,'withdraw fee');
  if(!amount||fee>=amount)throw Error('Invalid withdrawal');
  return this.post(id,[
   {owner:'user/'+user,asset,delta:-amount},
   {owner:'platform/withdrawal-pending/'+id,asset,delta:amount-fee},
   ...(fee?[{owner:'platform/fees',asset,delta:fee}]:[])
  ],{kind:'withdrawal-request',status:'pending',destination:'SIMULATED'});
 }
 settleWithdrawal(id,requestId,asset,amount,{fail=false}={}){
  const pending='platform/withdrawal-pending/'+requestId;
  const req=this.operations.get(requestId);
  if(!req||req.metadata.kind!=='withdrawal-request'||req.legs[0].asset!==asset)throw Error('Unknown withdrawal');
  if(this.operations.has(id))return this.operations.get(id);
  if(this.entries.some(e=>e.metadata.requestId===requestId))throw Error('Already finalized');
  const user=req.legs[0].owner;
  const legs=fail?
   [{owner:pending,asset,delta:-amount},{owner:user,asset,delta:amount}]:
   [{owner:pending,asset,delta:-amount},{owner:'simulation/external-settlement',asset,delta:amount}];
  return this.post(id,legs,{kind:fail?'withdrawal-failed':'withdrawal-settled',requestId});
 }
}
