/**
 * Alpha23: never disguise an asset-loading error as a "finished" cardboard
 * horse. Recovery is procedural 3D first, explicit fatal error second.
 * No changes to race positions, fixture, official ranking or game timing.
 *
 * Each factory receives the exact same official entry identity.
 */
export function horseCreationOptions(entry,index,coats){
 return {
  coat:entry.coat||coats[index],accent:entry.color,symbol:entry.symbol,
  stallNumber:index+1,height:2.85,mode:'Gallop',phase:index*.13
 };
}
export async function loadHorsesWithRecovery({
 entries,coats,primary,procedural,requestedMode='legacy'
}={}){
 if(!Array.isArray(entries)||entries.length!==12)throw RangeError('Expected official 12-horse fixture');
 if(!Array.isArray(coats)||coats.length<12)throw RangeError('Missing coat palette');
 if(typeof primary!=='function'||typeof procedural!=='function')throw TypeError('Both horse factories required');
 const results=await Promise.allSettled(entries.map(async (entry,index)=>{
  const options=horseCreationOptions(entry,index,coats);
  try{
   const model=await primary(options);
   if(!model?.root||typeof model.update!=='function')throw Error('Primary horse factory returned an invalid model');
   return {model,recovered:false,entry,index};
  }catch(primaryError){
   console.error('[CRP] Horse model load failed; retrying full 3D procedural horse', {
    lane:index+1,symbol:entry.symbol,requestedMode,
    reason:String(primaryError)
   });
   // The old scene used a sphere, box neck and four sticks here. Never again.
   // This factory is fully geometric with gait, jockey and mantle, not a sprite.
   const model=await procedural(options);
   if(!model?.root||typeof model.update!=='function')throw Error(
    'Procedural fallback returned an invalid horse for lane '+(index+1)
   );
   return {model,recovered:true,entry,index,reason:String(primaryError)};
  }
 }));
 const failures=results.filter(r=>r.status==='rejected');
 if(failures.length){
  // Do not mount an incomplete or misleading starting lineup.
  for(const result of results){
   if(result.status==='fulfilled')try{result.value.model.dispose?.();}catch{}
  }
  throw new AggregateError(failures.map(r=>r.reason),
   'Horse 3D loading failed, including procedural recovery. The race view is disabled rather than displaying box-and-sphere placeholders.');
 }
 const prepared=results.map(r=>r.value);
 return {
  models:prepared.map(r=>r.model),
  recovered:prepared.filter(r=>r.recovered).map(r=>({
   lane:r.index+1,symbol:r.entry.symbol,reason:r.reason
  }))
 };
}
