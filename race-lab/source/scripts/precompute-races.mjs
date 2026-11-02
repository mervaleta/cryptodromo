// Static MVP schedule: all synthetic race outcomes are computed before building the website.
// Results are for demonstration only and are NOT eligible for wagering.
import { mkdir, writeFile } from 'node:fs/promises';
import { getRaceFixture, RACES_PER_DAY, FIXTURE_DAYS } from '../src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../src/data/officialRace.js';
const outDir=new URL('../public/fixture/',import.meta.url);
await mkdir(outDir,{recursive:true});
let winners=[], podium=[],runnerCount=0;
for(let day=0;day<FIXTURE_DAYS;day++){
 const dayResults=[];
 for(let n=0;n<RACES_PER_DAY;n++){
  const race=getRaceFixture(n,day);
  const result=officialRanking(createOfficialRace(race.entries));
  const record={
   race:n+1, day:day+1, time:race.time, winner:result[0].entry.symbol,
   runners:result.map((h,rank)=>({
    rank:rank+1,symbol:h.entry.symbol,
    firstInputPct:h.input1,secondInputPct:h.input2,
    metersAt60:h.distanceAt60,finishSeconds:h.finishTime,
    doses1:h.coefficients.slice(0,9),doses2:h.coefficients.slice(9)
   }))
  };
  dayResults.push(record);
  winners.push(record.winner);runnerCount+=record.runners.length;
 }
 podium.push({day:day+1,count:dayResults.length});
 await writeFile(new URL('day-'+(day+1)+'.json',outDir),
  JSON.stringify({simulation:true,predetermined:true,day:day+1,races:dayResults}));
}
await writeFile(new URL('manifest.json',outDir),JSON.stringify({
 simulation:true,predetermined:true,live:false,days:FIXTURE_DAYS,racesPerDay:RACES_PER_DAY,
 totalRaces:winners.length,totalRunners:runnerCount,
 origin:'synthetic minute-by-minute 100-asset fixture',
 resultMethod:'CRP-DOSE-FAIR-V1', podium
},null,2));
if(winners.length!==3360||runnerCount!==40320)throw Error('Incomplete fixture');
console.log('Precomputed',winners.length,'races,',runnerCount,'runners');
