/**
 * Cryptódromo race contract. The visual shuffle is deterministic per competitor,
 * but its order can NEVER influence the official result.
 * All source candles are explicitly synthetic in Alpha.
 */
export const FIRST_COEFFICIENTS = Object.freeze([-10,-5,1,5,10,15,20,25,30]);
export const SECOND_COEFFICIENTS = Object.freeze([20,40,60]);
export const DISTANCE_METERS = 1000;
const sum = arr => arr.reduce((a,b)=>a+b,0);
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
const officialDistance = (a,b) => DISTANCE_METERS*(1+(sum(FIRST_COEFFICIENTS)*a + sum(SECOND_COEFFICIENTS)*b)/1200);
export function createOfficialRace(entries) {
  if (entries.length!==12 || new Set(entries.map(e=>e.symbol)).size!==12) throw new Error('Each race needs twelve unique assets');
  const profiles = entries.map((entry,index)=>{
    const c1=Number(entry.input1), c2=Number(entry.input2);
    if (!Number.isFinite(c1)||!Number.isFinite(c2)) throw new Error('Invalid candle data: '+entry.symbol);
    const coefficients=[...entry.coefficients1,...entry.coefficients2];
    if(coefficients.length!==12)throw new Error('Invalid dose count: '+entry.symbol);
    for(const [expected,actual] of [[FIRST_COEFFICIENTS,entry.coefficients1],[SECOND_COEFFICIENTS,entry.coefficients2]]) {
      if([...expected].sort((a,b)=>a-b).join()!==[...actual].sort((a,b)=>a-b).join()) throw new Error('Invalid dose deck: '+entry.symbol);
    }
    const resultMeters=officialDistance(c1,c2);
    if(!(resultMeters>0))throw new Error('Price volatility outside supported race domain: '+entry.symbol);
    // CRP-like acceleration envelopes for animation only. They are normalized
    // to the predetermined official distance after integration.
    const raw=[];
    let previousSpeed=60;
    for(let step=0;step<12;step++){
      const variation=step<9?c1:c2;
      const speed=clamp(60*(1+coefficients[step]*variation/100),48,72);
      raw.push(5*(previousSpeed+speed)/(2*3.6));
      previousSpeed=speed;
    }
    const total=sum(raw);
    const cumulative=[0];
    for(const meters of raw)cumulative.push(cumulative.at(-1)+(meters/total)*resultMeters);
    return {
      entry, index, input1:c1,input2:c2, coefficients, cumulative,
      distanceAt60:resultMeters, finishTime:60*DISTANCE_METERS/resultMeters
    };
  });
  return profiles;
}
export function positionAt(profile,seconds) {
  const second=clamp(seconds,0,60);
  if(second>=60)return profile.distanceAt60;
  const i=Math.min(11,Math.floor(second/5));
  const f=(second-i*5)/5;
  return profile.cumulative[i]+(profile.cumulative[i+1]-profile.cumulative[i])*f;
}
export function officialRanking(profiles) {
  return [...profiles].sort((a,b)=>a.finishTime-b.finishTime||a.index-b.index);
}
export function officialAudit(profiles,day,number) {
  return {
    simulation:true,live:false,race:{day,number},distanceMeters:DISTANCE_METERS,
    method:'CRP-DOSE-FAIR-V1',coefficients:{first:FIRST_COEFFICIENTS,second:SECOND_COEFFICIENTS},
    formula:'distance60=1000*(1+(91*variationMinute1Pct+120*variationMinute2Pct)/1200)',
    horses:officialRanking(profiles).map((p,i)=>({
      position:i+1,symbol:p.entry.symbol,priceStart:p.entry.priceAtStart,priceMinute1:p.entry.priceAtMid,priceMinute2:p.entry.priceAtFinish,variation1Pct:p.input1,
      variation2Pct:p.input2,coefficients1:p.coefficients.slice(0,9),
      coefficients2:p.coefficients.slice(9),distance60Meters:p.distanceAt60,
      finish1000mSeconds:p.finishTime
    }))
  };
}
