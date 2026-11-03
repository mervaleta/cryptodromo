/**
 * Cryptódromo canonical public race: twelve original cinematic Fidelity horses
 * or a visible loading error. Deliberately no low-poly, GLB, sprite, or
 * box-and-sphere visual fallbacks.
 *
 * Positions, official market history, finish ranking and clocks are untouched.
 */
export function canonicalHorseOptions(entry,index,coats){
 if(!entry||!Number.isInteger(index)||index<0||index>=12)
  throw new RangeError('Invalid official runner');
 return {
  coat:entry.coat||coats[index],accent:entry.color,symbol:entry.symbol,
  stallNumber:index+1,height:2.85,mode:'Gallop',phase:index*.13,quality:'high'
 };
}
export async function createCinematicLineup({entries,coats,createHorse}={}){
 if(!Array.isArray(entries)||entries.length!==12)throw RangeError('Expected twelve official runners');
 if(!Array.isArray(coats)||coats.length<12)throw RangeError('Coat palette needs twelve values');
 if(typeof createHorse!=='function')throw TypeError('Horse factory is required');
 const results=await Promise.allSettled(entries.map((entry,index)=>
  createHorse(canonicalHorseOptions(entry,index,coats))));
 const failures=results.map((result,index)=>result.status==='rejected'?
  {lane:index+1,reason:String(result.reason)}:null).filter(Boolean);
 const invalid=results.map((result,index)=>result.status==='fulfilled'&&
  (!result.value?.root||typeof result.value.update!=='function'||
   typeof result.value.setAppearance!=='function')?
  {lane:index+1,reason:'Invalid horse API returned'}:null).filter(Boolean);
 if(failures.length||invalid.length){
  for(const result of results)if(result.status==='fulfilled')
   try{result.value?.dispose?.();}catch{}
  const issues=[...failures,...invalid];
  const error=new Error('No se pudieron cargar los 12 caballos Fidelity. '+
   'La transmisión 3D se detuvo para evitar modelos de emergencia de baja calidad. '+
   issues.map(x=>'Gatera '+x.lane+': '+x.reason).join(' | '));
  error.failedLanes=issues.map(x=>x.lane);
  throw error;
 }
 return results.map(r=>r.value);
}
