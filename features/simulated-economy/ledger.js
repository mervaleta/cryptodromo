// Cryptódromo simulated-money MVP. Browser-local only, NOT a payment/wagering backend.
// State and quotes are client-controlled and NOT suitable for real-value transactions.
export const STORAGE_KEY='cryptodromo-economy-demo-v1';
export const RATE=100; // 100 demo CR = 1 fictitious USD
export const PACKS=Object.freeze([5,10,25,50,100]);
export const VALID_ACTIONS=Object.freeze(['WIN','PLACE','SHOW']);
const shortId=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'demo-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const validInt=n=>Number.isSafeInteger(n)&&n>=0;
const requirePositive=(n,label)=>{if(!Number.isSafeInteger(n)||n<1)throw Error(label+' debe ser un entero positivo');};
export function makeAccount(alias){
 const name=String(alias||'').trim().replace(/[<>\x00-\x1f]/g,'').slice(0,24);
 if(name.length<3)throw Error('Alias: mínimo tres caracteres');
 return {id:shortId(),alias:name,createdAt:new Date().toISOString(),usdCents:10000,credits:0,experience:0,ledger:[],tickets:[],achievements:[],stats:{wagers:0,wins:0}};
}
export function emptyState(){return {version:1,activeId:null,accounts:[]};}
export function loadState(storage){
 let state;try{state=JSON.parse(storage.getItem(STORAGE_KEY));}catch{state=null;}
 if(!state||state.version!==1||!Array.isArray(state.accounts))return emptyState();
 // Untrusted device state: reject malformed amounts rather than spreading invalid entries.
 state.accounts=state.accounts.filter(a=>a&&typeof a.id==='string'&&typeof a.alias==='string'&&validInt(a.usdCents)&&validInt(a.credits)&&Array.isArray(a.ledger)&&Array.isArray(a.tickets));
 if(!state.accounts.some(a=>a.id===state.activeId))state.activeId=state.accounts[0]?.id||null;
 return state;
}
export function saveState(storage,state){storage.setItem(STORAGE_KEY,JSON.stringify(state));return state;}
export const activeAccount=state=>state.accounts.find(a=>a.id===state.activeId)||null;
const append=(a,type,amount,currency,meta={})=>{
 const record={id:shortId(),at:new Date().toISOString(),type,amount,currency,...meta};
 a.ledger.push(record);return record;
};
export function addAccount(s,alias){
 if(s.accounts.length>=6)throw Error('Máximo 6 jugadores de demostración en este navegador');
 const a=makeAccount(alias);
 if(s.accounts.some(x=>x.alias.toLowerCase()===a.alias.toLowerCase()))throw Error('El alias ya existe en este dispositivo');
 append(a,'initial_demo_funds',10000,'USD_CENTS');
 s.accounts.push(a);s.activeId=a.id;return a;
}
export function switchAccount(s,id){if(!s.accounts.some(a=>a.id===id))throw Error('Cuenta inexistente');s.activeId=id;return activeAccount(s);}
export function topUp(s,usd){
 const a=activeAccount(s);if(!a)throw Error('Seleccioná un jugador');
 if(!PACKS.includes(usd))throw Error('Paquete no disponible');
 const cents=usd*100;
 if(a.usdCents+cents>100000000)throw Error('Límite de caja demo alcanzado');
 a.usdCents+=cents;append(a,'simulated_topup',cents,'USD_CENTS',{note:'Ingreso ficticio; no se procesó ningún pago'});
 return a.usdCents;
}
export function buyCredits(s,usd){
 const a=activeAccount(s);if(!a)throw Error('Seleccioná un jugador');
 const cents=Math.round(usd*100);
 requirePositive(cents,'Importe');
 if(cents<100||cents>10000||cents!==usd*100)throw Error('Comprá entre 1 y 100 USD simulados, en centavos exactos');
 if(a.usdCents<cents)throw Error('Fondos simulados insuficientes');
 const credits=cents; // 1 cent = 1 CR, sin spread en el modo demo.
 a.usdCents-=cents;a.credits+=credits;
 const transfer=shortId();append(a,'exchange_buy',-cents,'USD_CENTS',{transfer});append(a,'exchange_buy',credits,'CR',{transfer});
 return credits;
}
export function sellCredits(s,credits){
 const a=activeAccount(s);if(!a)throw Error('Seleccioná un jugador');
 requirePositive(credits,'Créditos');
 if(a.credits<credits)throw Error('Créditos insuficientes');
 // 1 CR = 1 cent. No spread, no real crypto conversions.
 a.credits-=credits;a.usdCents+=credits;
 const transfer=shortId();append(a,'exchange_sell',-credits,'CR',{transfer});append(a,'exchange_sell',credits,'USD_CENTS',{transfer});
 return credits;
}
export function quoteTicket({raceId,day,slot,runner,kind,stake,decimalOdds,startsAt},nowMs=Date.now()){
 if(!Number.isSafeInteger(raceId)||raceId<0||!Number.isInteger(day)||day<0||day>6||!Number.isInteger(slot)||slot<0||slot>=480)throw Error('Carrera inválida');
 if(!/^[A-Z0-9]{2,15}$/.test(runner))throw Error('Corredor inválido');
 if(!VALID_ACTIONS.includes(kind))throw Error('Modalidad inválida');
 requirePositive(stake,'Apuesta');
 if(stake>10000)throw Error('Límite: 10.000 CR por ticket');
 if(!Number.isFinite(decimalOdds)||decimalOdds<1.01||decimalOdds>100)throw Error('Cuota inválida');
 if(!Number.isFinite(startsAt)||nowMs>=startsAt-5000)throw Error('Apuestas cerradas para esta carrera (5 segundos antes de largar)');
 const payout=Math.floor(stake*decimalOdds);
 return {raceId,day,slot,runner,kind,stake,decimalOdds:Number(decimalOdds.toFixed(3)),potentialPayout:payout,startsAt};
}
export function placeTicket(s,quote,nowMs=Date.now()){
 const a=activeAccount(s);if(!a)throw Error('Seleccioná un jugador');
 // Recheck close time; never trust client-supplied amount or a stale quote.
 const q=quoteTicket(quote,nowMs);
 if(a.credits<q.stake)throw Error('Créditos insuficientes');
 if(a.tickets.some(t=>t.raceId===q.raceId&&t.runner===q.runner&&t.kind===q.kind&&t.status==='open'))throw Error('Ya tenés un ticket abierto para esta combinación');
 const t={...q,id:shortId(),accountId:a.id,createdAt:new Date(nowMs).toISOString(),status:'open',payout:0};
 a.credits-=q.stake;a.tickets.push(t);a.stats.wagers=(a.stats.wagers||0)+1;
 append(a,'stake',-q.stake,'CR',{ticketId:t.id,raceId:q.raceId});
 return t;
}
export function settleTickets(s,resolveRace,nowMs=Date.now()){
 const newly=[];
 for(const a of s.accounts)for(const t of a.tickets){
  if(t.status!=='open'||nowMs<t.startsAt+60000)continue;
  // resolveRace must return a verified result with 12 ranked symbols or null.
  const ranking=resolveRace(t.day,t.slot);
  if(!Array.isArray(ranking)||ranking.length!==12||new Set(ranking).size!==12||!ranking.includes(t.runner))continue;
  const position=ranking.indexOf(t.runner)+1;
  const win=t.kind==='WIN'?position===1:t.kind==='PLACE'?position<=2:position<=3;
  const payout=win?t.potentialPayout:0;
  t.status=win?'won':'lost';t.payout=payout;t.position=position;t.settledAt=new Date(nowMs).toISOString();
  if(payout){a.credits+=payout;a.stats.wins=(a.stats.wins||0)+1;append(a,'payout',payout,'CR',{ticketId:t.id,raceId:t.raceId})}
  newly.push(t);
 }return newly;
}
export function rankAccounts(s){
 return s.accounts.map(a=>{
  const settled=a.tickets.filter(t=>t.status!=='open');
  const wins=settled.filter(t=>t.status==='won').length;
  return {alias:a.alias,settled:settled.length,wins,accuracy:settled.length?100*wins/settled.length:0,net:a.ledger.filter(l=>l.currency==='CR'&&['stake','payout'].includes(l.type)).reduce((n,l)=>n+l.amount,0)};
 }).sort((a,b)=>b.accuracy-a.accuracy||b.settled-a.settled||a.alias.localeCompare(b.alias));
}
