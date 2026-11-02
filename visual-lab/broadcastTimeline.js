/**
 * Stadium broadcast phases repeat precisely every 180 seconds:
 * [0,60): racing, [60,120): finish/official results,
 * [120,180): next race paddock presentation and countdown.
 * These are synthetic fixture replays, not live financial feeds.
 */
export const PHASES=Object.freeze({RACE:'race',RESULTS:'results',PRESENTATION:'presentation'});
export const FINISH_SECONDS=60,RESULTS_END=120,SLOT_SECONDS=180;
export function broadcastPhase(slotSeconds){
 const s=Math.max(0,Number(slotSeconds)||0);
 if(s<FINISH_SECONDS)return {phase:PHASES.RACE,time:s,secondsLeft:FINISH_SECONDS-s};
 if(s<RESULTS_END)return {phase:PHASES.RESULTS,time:s-FINISH_SECONDS,secondsLeft:RESULTS_END-s};
 return {phase:PHASES.PRESENTATION,time:s-RESULTS_END,secondsLeft:SLOT_SECONDS-s,
   runnerIndex:Math.min(11,Math.floor((s-RESULTS_END)/5))};
}
export function allRunnersCrossed(profiles,distances,finishLine){
 return profiles.length===12&&profiles.every((_,i)=>distances[i]>=finishLine-1e-6);
}
export function finishReveal({allCrossed,elapsed,firstCrossAt=60,minimumHold=1.8}){
 return Boolean(allCrossed)&&elapsed>=firstCrossAt+minimumHold;
}
export const runnerPresentationIndex=secondsIntoPresentation=>
 Math.min(11,Math.floor(Math.max(0,secondsIntoPresentation)/5));
