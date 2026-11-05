/**
 * Export official Alpha19 results for the PHP-only Hostinger predictions service.
 * This is a materialized read-only view of worldRaceRecord, NOT another race engine.
 * The synthetic rankings are knowable in advance, so credits must NEVER be money.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveWorldRace } from '../race-lab/source/src/data/worldRaceRecord.js';

const folder=resolve(import.meta.dirname,'../predictions/fixtures');
const check=process.argv.includes('--check');
if(!check) mkdirSync(folder,{recursive:true});
let count=0;
for(let dayIndex=0;dayIndex<7;dayIndex++){
 const races=[];
 for(let minute=0;minute<1440;minute++){
  const trackId=['muybridge','genesis','vint-cerf'][minute%3];
  const slot=Math.floor(minute/3);
  const official=resolveWorldRace({family:'alpha19',dayIndex,slot,trackId});
  if(official.minuteOfDay!==minute || official.participantSymbols.length!==12 ||
     official.ranking.length!==12 || new Set(official.participantSymbols).size!==12) {
    throw new Error('Unexpected official event '+dayIndex+'/'+minute);
  }
  races.push({
   key:official.key,
   trackId, minute, slot,
   runners:official.participantSymbols,
   ranking:official.ranking.map(row=>row.symbol)
  });
  count++;
 }
 const data={schema:'crp19-predictions-fixture-v1',simulation:true,live:false,
  dayIndex,source:'worldRaceRecord.js / officialRace.js',
  publicPredictabilityWarning:'Synthetic replay outcomes can be known before the start.',
  races};
 const json=JSON.stringify(data)+'\n';
 const filename=resolve(folder,'day-'+(dayIndex+1)+'.json');
 if(check){
  if(readFileSync(filename,'utf8')!==json) throw new Error('Fixture drift at day '+(dayIndex+1));
 }else writeFileSync(filename,json);
}
console.log((check?'Verified ':'Exported ')+count+' immutable synthetic Alpha19 events');
