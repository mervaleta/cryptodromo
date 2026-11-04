/**
 * JANCH World | Validation-only closing-price adapter.
 * No provider, network, winner or payout logic. Supports safely feeding a
 * future settlement engine only after a market data source is connected.
 */
const validNumber = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isIso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const pending = reason => ({status:'PENDING',reason,price:null,source:null});

/**
 * @param {object} args
 * @param {string} args.marketCloseAt Full UTC ISO instant, exclusive end.
 * @param {'minute-candle'|'official-close'} args.sourcePolicy Must be explicit per instrument/provider.
 * @param {{timestamp:string,close:number,final:boolean,observedAt:string}} [args.candle]
 *   With timestamps at the opening of the 1m candle.
 * @param {{price:number,final:boolean,publishedAt:string,sessionCloseAt:string}} [args.officialClose]
 * @param {string} args.now Trusted observation instant; sim/replay must advance this deterministically.
 */
export function resolveClosingPrice({marketCloseAt,sourcePolicy,candle,officialClose,now}={}){
 if(!isIso(marketCloseAt)||!isIso(now))return pending('INVALID_TIMESTAMP');
 const end=Date.parse(marketCloseAt),seen=Date.parse(now);
 if(seen<end)return pending('SESSION_STILL_OPEN');
 if(sourcePolicy==='minute-candle'){
  if(!candle||!isIso(candle.timestamp)||!isIso(candle.observedAt)||!validNumber(candle.close))return pending('MISSING_OR_INVALID_CANDLE');
  if(Date.parse(candle.timestamp)!==end-60000)return pending('WRONG_CANDLE_INTERVAL');
  if(candle.final!==true)return pending('CANDLE_NOT_FINAL');
  const observed=Date.parse(candle.observedAt);
  if(observed<end||observed>seen)return pending('CANDLE_NOT_YET_AVAILABLE');
  return {status:'VERIFIED',reason:null,price:candle.close,source:'minute-candle',asOf:candle.observedAt};
 }
 if(sourcePolicy==='official-close'){
  if(!officialClose||!isIso(officialClose.publishedAt)||!isIso(officialClose.sessionCloseAt)||!validNumber(officialClose.price))return pending('MISSING_OR_INVALID_OFFICIAL_CLOSE');
  if(officialClose.sessionCloseAt!==marketCloseAt)return pending('WRONG_MARKET_SESSION');
  if(officialClose.final!==true)return pending('OFFICIAL_CLOSE_NOT_FINAL');
  const published=Date.parse(officialClose.publishedAt);
  if(published<end||published>seen)return pending('OFFICIAL_CLOSE_NOT_YET_AVAILABLE');
  return {status:'VERIFIED',reason:null,price:officialClose.price,source:'official-close',asOf:officialClose.publishedAt};
 }
 return pending('SOURCE_POLICY_REQUIRED');
}
