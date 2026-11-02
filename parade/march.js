import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
/**
 * Parade uses the COMPLETE 100-runner roster, not the next twelve-race fixture.
 * No price inputs, scoring, odds, winners, broadcast clock or wallet state.
 * In each cohort every horse travels one complete oval lap at walking pace.
 */
export const PARADE_WAVE_CAP=12;
export const PARADE_WAVES=Math.ceil(TOKEN_ROSTER.length/PARADE_WAVE_CAP);
export const PARADE_CENTER_LOOP=2*(500+Math.PI*72);
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function paradeLapLength(lane=5.5){
 const side=(Number(lane)-5.5)*2.55;
 return 2*(500+Math.PI*(72+side));
}
export function buildParadeWaves(roster=TOKEN_ROSTER){
 if(!Array.isArray(roster)||!roster.length)throw Error('Parade requires a nonempty roster');
 const count=Math.ceil(roster.length/PARADE_WAVE_CAP);
 const waves=Array.from({length:count},()=>[]);
 // Round-robin across tiers: stars, principal assets and challengers appear
 // throughout the event instead of all featured horses arriving together.
 for(const tier of ['star','core','challenger']){
  const tierRunners=roster.filter(r=>r.tier===tier);
  const offset=tier==='star'?0:tier==='core'?3:6;
  for(let i=0;i<tierRunners.length;i++){
   let candidate=(i+offset)%count;
   while(waves[candidate].length>=PARADE_WAVE_CAP)candidate=(candidate+1)%count;
   waves[candidate].push(tierRunners[i]);
  }
 }
 // Any future category is still included, never silently omitted.
 for(const r of roster.filter(r=>!['star','core','challenger'].includes(r.tier))){
  let n=0;while(waves[n].length>=PARADE_WAVE_CAP)n++;
  waves[n].push(r);
 }
 if(waves.flat().length!==roster.length)throw Error('Parade lost runners');
 return waves.map((wave,index)=>Object.freeze({index,runners:Object.freeze(wave)}));
}
export const WAVES=buildParadeWaves();
function speedForSymbol(symbol,pace=3.2){
 let hash=2166136261;
 for(const ch of String(symbol))hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 return pace*(.975+((hash%51)/1000));
}
export function waveDuration(wave,{pace=3.2}={}){
 if(!wave?.runners?.length)throw Error('Invalid parade wave');
 return Math.max(...wave.runners.map((runner,i)=>paradeLapLength(i)/speedForSymbol(runner.symbol,pace)));
}
export function wavePose(wave,elapsedSeconds,{pace=3.2}={}){
 if(!wave?.runners?.length)throw Error('Invalid parade wave');
 const time=Math.max(0,Number(elapsedSeconds)||0);
 return wave.runners.map((runner,i)=>{
  const lane=i+(PARADE_WAVE_CAP-wave.runners.length)/2;
  const lapLength=paradeLapLength(lane);
  const speed=speedForSymbol(runner.symbol,pace);
  const traveled=time*speed;
  const offset=(wave.runners.length-1-i)*.010;
  const progress=((offset+traveled/lapLength)%1+1)%1;
  return Object.freeze({runner,lane,speed,progress,lapCompletion:clamp(traveled/lapLength,0,1),
    metersTraveled:Math.min(traveled,lapLength),completed:traveled>=lapLength});
 });
}
export function createParadeController({roster=TOKEN_ROSTER,pace=3.2}={}){
 const waves=buildParadeWaves(roster);
 let waveIndex=0,elapsed=0,paused=false,timeScale=1;
 const durations=waves.map(w=>waveDuration(w,{pace}));
 return {
  update(deltaSeconds){
   const dt=Math.max(0,Math.min(2,Number(deltaSeconds)||0));
   if(!paused){
    elapsed+=dt*timeScale;
    if(elapsed>=durations[waveIndex]){
     // A giant time jump must also progress through subsequent cohorts.
     let guard=0;
     while(elapsed>=durations[waveIndex]&&guard++<waves.length){
      elapsed-=durations[waveIndex];waveIndex=(waveIndex+1)%waves.length;
     }
    }
   }
   return this.snapshot();
  },
  snapshot(){
   return Object.freeze({
    waveIndex,wave:waves[waveIndex],allWaves:waves.length,
    elapsed,remaining:Math.max(0,durations[waveIndex]-elapsed),
    totalParaders:roster.length,paused,timeScale,
    horses:wavePose(waves[waveIndex],elapsed,{pace})
   });
  },
  jumpTo(index){
   if(!Number.isInteger(index)||index<0||index>=waves.length)throw RangeError('Invalid parade cohort');
   waveIndex=index;elapsed=0;return this.snapshot();
  },
  nextWave(){return this.jumpTo((waveIndex+1)%waves.length);},
  togglePause(){paused=!paused;return paused;},
  setPaused(flag){paused=Boolean(flag);return paused;},
  setTimeScale(scale){timeScale=clamp(Number(scale)||1,.25,6);return timeScale;},
  get isPaused(){return paused;}
 };
}
