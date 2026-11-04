/**
 * Broadcast-only deterministic winner replay. Reconstructs the last seconds
 * from the already-frozen official race profile: never re-runs prices/scoring.
 * duration is wall-clock seconds, sourceSpan is race-time seconds.
 */
export const WINNER_REPLAY_DURATION=7.2;
export const WINNER_REPLAY_SOURCE_SPAN=3.6;
export const WINNER_REPLAY_END=60;
export const WINNER_REPLAY_POST_HOLD=2.2;
export function createWinnerSlowMotion({
 duration=WINNER_REPLAY_DURATION,
 sourceSpan=WINNER_REPLAY_SOURCE_SPAN,
 sourceEnd=WINNER_REPLAY_END,
 holdAfter=WINNER_REPLAY_POST_HOLD
}={}){
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(sourceSpan)||sourceSpan<=0||
  !Number.isFinite(sourceEnd)||sourceEnd<sourceSpan||
  !Number.isFinite(holdAfter)||holdAfter<0||holdAfter>10)throw new RangeError('Invalid slow-motion replay');
 let phase='idle',elapsed=0,held=0,winnerIndex=-1,winnerSymbol='';
 const state=()=>Object.freeze({
  phase,active:phase==='playing'||phase==='holding',complete:phase==='complete',
  holdElapsed:held,holdAfter,postHold:phase==='holding',
  winnerIndex,winnerSymbol,elapsed,duration,
  progress:Math.min(1,elapsed/duration),
  sampleTime:Math.min(sourceEnd,sourceEnd-sourceSpan+Math.min(1,elapsed/duration)*sourceSpan),
  speed:sourceSpan/duration
 });
 return Object.freeze({
  begin(index,symbol){
   if(phase!=='idle'||!Number.isInteger(index)||index<0||index>=12||
    !String(symbol||'').trim())return false;
   winnerIndex=index;winnerSymbol=String(symbol);elapsed=0;held=0;phase='playing';
   return true;
  },
  advance(dt){
   if(phase!=='playing'&&phase!=='holding')return state();
   const seconds=Number(dt);
   if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Replay time cannot go backwards');
   if(phase==='playing'){
    const remains=Math.max(0,duration-elapsed);
    const played=Math.min(seconds,remains);
    elapsed=Math.min(duration,elapsed+played);
    if(elapsed>=duration){phase=holdAfter>0?'holding':'complete';held=Math.min(holdAfter,seconds-played);}
   }else held=Math.min(holdAfter,held+seconds);
   if(phase==='holding'&&held>=holdAfter)phase='complete';
   return state();
  },
  reset(){phase='idle';elapsed=0;held=0;winnerIndex=-1;winnerSymbol='';},
  get state(){return state();}
 });
}
