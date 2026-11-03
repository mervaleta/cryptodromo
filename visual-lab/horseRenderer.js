/* CRP Alpha20 renderer switch. Leaves the market engine and official race untouched.
 * Legacy is preserved during visual QA; procedural does not fetch GLB or textures.
 */
import {createHorse as createLegacyHorse} from '../race-lab/source/src/horse.js?v=alpha18-gaitmane-1';
import {createProceduralRaceHorse} from './proceduralHorse.js?v=alpha20-procedural-2';
export function selectedHorseRenderer(search=globalThis.location?.search||''){
 return new URLSearchParams(search).get('horse-engine')==='procedural'?'procedural':'legacy';
}
export async function createHorse(options={}){
 if(selectedHorseRenderer()==='procedural'){
  return createProceduralRaceHorse(options);
 }
 return createLegacyHorse(options);
}
