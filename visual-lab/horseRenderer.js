/* CRP 100-token master switch: one CC0 Quaternius skeleton/mesh source,
 * native Gallop and CC0 mane/tail. The procedural renderer remains opt-in
 * diagnostic rollback (?horse-engine=procedural). Neither changes results.
 */
import {createTokenHorse,CRP_UNIFIED_HORSE_BUILD} from '../race-lab/source/src/tokenHorseFactory.js?v=crp-100-cc0-groom-20261115-v1';
import {createProceduralRaceHorse} from './proceduralHorse.js?v=alpha20-procedural-2';
export {CRP_UNIFIED_HORSE_BUILD};
export function selectedHorseRenderer(search=globalThis.location?.search||''){
 return new URLSearchParams(search).get('horse-engine')==='procedural'?'procedural':'cc0-unified';
}
export async function createHorse(options={}){
 if(selectedHorseRenderer()==='procedural'){
  return createProceduralRaceHorse(options);
 }
 const {symbol='BTC',coat='#956342',accent='#f7931a',height=2.5,mode='Gallop',phase=0,quality='balanced'}=options;
 return createTokenHorse({
  symbol,coat,color:accent,name:symbol
 },{height,mode,phase,quality,profiles:options.profiles||{}});
}
