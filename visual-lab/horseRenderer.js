/* Public CRP race: single cinematic Fidelity renderer.
 * Alpha20/legacy source files remain in repository as internal development
 * references, but the public race cannot select or silently use them.
 */
import * as THREE from 'three';

export function selectedHorseRenderer(_search=''){
 return 'fidelity';
}
export async function createHorse(options={}){
 const {createAlpha22RaceHorse}=await import('./horse-fidelity/horseAdapter.js?v=alpha22-fidelity-1');
 return createAlpha22RaceHorse({THREE,...options,quality:'high',jockey:true});
}
