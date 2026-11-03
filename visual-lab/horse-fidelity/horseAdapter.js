/**
 * Alpha22 opt-in adapter for the existing Alpha18/Alpha20 scene contract.
 * It doesn't import or bundle a legacy GLB: legacyFactory is injected.
 * This adapter may be activated per quality preset after visual acceptance.
 */
import {createProceduralHorse} from './proceduralHorse.js';
import {randomHorseProfile,COAT_PRESETS} from './horseProfiles.js';
const HEX=/^#[0-9a-f]{6}$/i;
const vec=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function closestCoatPreset(color){
 if(typeof color!=='string'||!HEX.test(color))return 'bay';
 const rgb=vec(color);
 let winner='bay',best=Infinity;
 for(const [key,coat] of Object.entries(COAT_PRESETS)){
  const target=vec(coat.coat);
  // Luminance-biased weighted RGB gives stable natural-family matching.
  const score=rgb.reduce((sum,v,i)=>sum+[.28,.55,.17][i]*(v-target[i])**2,0);
  if(score<best){best=score;winner=key;}
 }
 return winner;
}
export function visualHorseProfile(entry={},index=0,quality='balanced'){
 const symbol=String(entry.symbol||'TOKEN').slice(0,15);
 const base=randomHorseProfile(symbol,index);
 return {...base,coat:HEX.test(entry.coat||'')?closestCoatPreset(entry.coat):base.coat,
  accent:HEX.test(entry.color||'')?entry.color:base.accent,
  number:index+1,quality:['eco','balanced','high'].includes(quality)?quality:'balanced'};
}
export async function createRaceHorseVisual({THREE,entry,index=0,quality='balanced',
 mode='procedural',legacyFactory}={}){
 if(mode==='procedural'){
  return createProceduralHorse({THREE,profile:visualHorseProfile(entry,index,quality)});
 }
 if(mode==='legacy'){
  if(typeof legacyFactory!=='function')throw Error('legacyFactory required when using legacy horses');
  return await legacyFactory({coat:entry?.coat,accent:entry?.color,
   symbol:entry?.symbol,height:2.85,mode:'Gallop',phase:index*.13});
 }
 throw RangeError('Unknown horse visual mode');
}

/**
 * Exact bridge for Alpha20 LIVE horseRenderer.js, whose current args are
 * {coat,accent,symbol,stallNumber,height,phase,mode,quality}.
 * Does not edit that renderer: during integration it becomes a third
 * opt-in 'horse-engine=fidelity' branch, leaving 'procedural' Alpha20 intact.
 */
export function createAlpha22RaceHorse({
 THREE,coat='#784b35',accent='#e5b568',symbol='BTC',
 stallNumber=1,height=2.85,phase=0,mode='Gallop',
 quality='balanced',jockey=true
}={}){
 const q=quality==='cinematic'?'high':quality==='performance'?'eco':quality;
 const p=visualHorseProfile({coat,color:accent,symbol},Math.max(0,stallNumber-1),q);
 const profile={...p,height,phase,number:stallNumber,jockey,gaitStyle:'ik'};
 const horse=createProceduralHorse({THREE,profile});
 horse.setAppearance({coat,accent,number:stallNumber});
 horse.play(mode);
 return horse;
}
