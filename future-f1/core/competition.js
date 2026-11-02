// Pure deterministic simulation; percentage inputs such as 0.42 mean +0.42%.
// Rendering, camera, elapsed wall-clock time and geometry cannot change rankings.
export const FIRST_DECK=Object.freeze([-20,-10,0,10,20,30,40,50,60]);
export const SECOND_DECK=Object.freeze([20,40,60]);
const SUM1=FIRST_DECK.reduce((a,b)=>a+b,0),SUM2=SECOND_DECK.reduce((a,b)=>a+b,0);
const sameDeck=(a,b)=>Array.isArray(a)&&a.length===b.length&&[...a].sort((x,y)=>x-y).every((v,i)=>v===[...b].sort((x,y)=>x-y)[i]);
export function createCompetition({id,entries,duration=60}={}){
  if(typeof id!=='string'||!id||!Array.isArray(entries)||entries.length<2||entries.length>100)throw new Error('Invalid competition');
  if(duration!==60)throw new Error('Only 60 seconds supported in v1');
  const seen=new Set();
  const racers=entries.map((entry,index)=>{
    const symbol=String(entry.symbol||'').trim().toUpperCase();
    if(!symbol||seen.has(symbol))throw new Error('Duplicate or missing runner');
    seen.add(symbol);
    const input1=Number(entry.input1),input2=Number(entry.input2);
    if(!Number.isFinite(input1)||!Number.isFinite(input2))throw new Error('Invalid market input');
    const coefficients1=entry.coefficients1||FIRST_DECK,coefficients2=entry.coefficients2||SECOND_DECK;
    if(!sameDeck(coefficients1,FIRST_DECK)||!sameDeck(coefficients2,SECOND_DECK))throw new Error('Invalid dose set');
    return Object.freeze({symbol,index,input1,input2,coefficients:Object.freeze([...coefficients1,...coefficients2])});
  });
  const ranked=racers.map(r=>({symbol:r.symbol,score:r.input1*SUM1+r.input2*SUM2}))
    .sort((a,b)=>b.score-a.score||a.symbol.localeCompare(b.symbol))
    .map((r,i)=>Object.freeze({...r,rank:i+1}));
  const rankBySymbol=new Map(ranked.map(r=>[r.symbol,r.rank]));
  function sample(seconds){
    if(!Number.isFinite(seconds))throw new Error('Invalid sample time');
    const t=Math.max(0,Math.min(duration,seconds)),tick=Math.min(12,Math.floor(t/5)),fraction=tick<12?(t%5)/5:0;
    const calculated=racers.map(r=>{
      let score=0;
      for(let k=0;k<tick;k++)score+=r.coefficients[k]*(k<9?r.input1:r.input2);
      if(tick<12)score+=fraction*r.coefficients[tick]*(tick<9?r.input1:r.input2);
      return {symbol:r.symbol,index:r.index,score,rankAtFinish:rankBySymbol.get(r.symbol)};
    });
    const scale=Math.max(1,...calculated.map(r=>Math.abs(r.score)));
    return calculated.map(r=>Object.freeze({...r,progress:Math.min(1,Math.max(0,t/duration+r.score/scale*.025))}));
  }
  return Object.freeze({id,duration,entries:Object.freeze(racers),result:Object.freeze(ranked),sample});
}
