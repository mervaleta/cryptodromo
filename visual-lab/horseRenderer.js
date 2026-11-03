/* CRP LIVE visual backend adapter. Never changes market results.
 * Modes: legacy GLB (default), procedural Alpha20, fidelity Alpha22.
 * Alpha22 is imported lazily, so regular visitors do not load beta geometry code.
 */
import * as THREE from 'three';
import {createHorse as createLegacyHorse} from '../race-lab/source/src/horse.js?v=alpha18-gaitmane-1';
import {createProceduralRaceHorse} from './proceduralHorse.js?v=alpha20-procedural-2';

export function selectedHorseRenderer(search=globalThis.location?.search||''){
 const requested=new URLSearchParams(search).get('horse-engine');
 return requested==='fidelity'||requested==='procedural'?requested:'legacy';
}
export async function createHorse(options={}){
 const mode=selectedHorseRenderer();
 if(mode==='fidelity'){
  const {createAlpha22RaceHorse}=await import('./horse-fidelity/horseAdapter.js?v=alpha22-fidelity-1');
  return createAlpha22RaceHorse({THREE,...options});
 }
 if(mode==='procedural')return createProceduralRaceHorse(options);
 return createLegacyHorse(options);
}
