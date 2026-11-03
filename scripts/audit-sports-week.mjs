/**
 * Solo lectura. Analiza el fixture sintético de Cryptódromo sin tocar la escena,
 * el scheduler, el motor oficial ni ninguna fuente de resultados.
 *
 * Ejecutar: node scripts/audit-sports-week.mjs
 * Reporte JSON: node scripts/audit-sports-week.mjs --json
 * CSV por corredor: node scripts/audit-sports-week.mjs --csv
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getRaceFixture,FIXTURE_DAYS,RACES_PER_DAY,PRICE_FIXTURE} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,positionAt,FIRST_COEFFICIENTS,SECOND_COEFFICIENTS} from '../race-lab/source/src/data/officialRace.js';

export const AUDIT_VERSION='sports-week-audit-v1';
export const AUDIT_BASELINE='27a8f119c57d883b9e589945e9f37849d8934d70';
const TIERS=['star','core','challenger'];
const POINTS=[25,18,15,12,10,8,6,4,2,1,0,0];
const average=(sum,n)=>n?sum/n:0;
function equalDeck(actual,expected){
  return actual?.length===expected.length &&
    [...actual].sort((a,b)=>a-b).every((n,i)=>n===[...expected].sort((a,b)=>a-b)[i]);
}
export function auditSportsWeek(){
  const roster=new Map(TOKEN_ROSTER.map(t=>[t.symbol,t]));
  if(roster.size!==100)throw Error('Roster does not contain 100 unique symbols');
  const runners=new Map(TOKEN_ROSTER.map(t=>[t.symbol,{
    symbol:t.symbol,name:t.name,tier:t.tier,weight:t.weight,
    starts:0,wins:0,podiums:0,points:0,placeTotal:0,timeTotal:0
  }]));
  const issues=[],daily=[],tierWins={star:0,core:0,challenger:0};
  let races=0,starts=0,exactFinishTies=0,nearTiesUnderMillisecond=0;
  let firstWinner=null,lastWinner=null;
  for(let day=0;day<FIXTURE_DAYS;day++){
    const d={day:day+1,races:0,wins:{star:0,core:0,challenger:0}};
    for(let slot=0;slot<RACES_PER_DAY;slot++){
      const fixture=getRaceFixture(slot,day),entries=fixture.entries;
      const id='d'+(day+1)+'-r'+String(slot+1).padStart(3,'0');
      if(entries.length!==12||new Set(entries.map(e=>e.symbol)).size!==12)
        issues.push({race:id,type:'participants'});
      if(TIERS.some(t=>entries.filter(e=>e.tier===t).length!==4))
        issues.push({race:id,type:'category-allocation'});
      for(const e of entries){
        if(!roster.has(e.symbol))issues.push({race:id,type:'unknown-token',symbol:e.symbol});
        if(!equalDeck(e.coefficients1,FIRST_COEFFICIENTS)||!equalDeck(e.coefficients2,SECOND_COEFFICIENTS))
          issues.push({race:id,type:'dose-deck',symbol:e.symbol});
        const a=100*(e.priceAtMid/e.priceAtStart-1),b=100*(e.priceAtFinish/e.priceAtMid-1);
        if(e.input1!==a||e.input2!==b)issues.push({race:id,type:'price-provenance',symbol:e.symbol});
      }
      const profiles=createOfficialRace(entries),ordered=officialRanking(profiles);
      if(ordered.some(p=>!(Number.isFinite(p.finishTime)&&p.finishTime>0&&p.distanceAt60>0)))
        issues.push({race:id,type:'invalid-finish'});
      if(ordered.some(p=>positionAt(p,0)!==0||positionAt(p,60)!==p.distanceAt60))
        issues.push({race:id,type:'trajectory-contract'});
      if(day===0&&slot===0)firstWinner=ordered[0].entry.symbol;
      if(day===FIXTURE_DAYS-1&&slot===RACES_PER_DAY-1)lastWinner=ordered[0].entry.symbol;
      if(ordered[0].finishTime===ordered[1].finishTime)exactFinishTies++;
      if(ordered[1].finishTime-ordered[0].finishTime<.001)nearTiesUnderMillisecond++;
      // Un order-of-dose check per day. Changes may alter trajectories, never winners.
      if(slot===117){
        const reverse=entries.map(e=>({...e,coefficients1:[...e.coefficients1].reverse(),coefficients2:[...e.coefficients2].reverse()}));
        const rerank=officialRanking(createOfficialRace(reverse)).map(p=>p.entry.symbol);
        if(rerank.some((symbol,i)=>symbol!==ordered[i].entry.symbol))
          issues.push({race:id,type:'visual-dose-affects-result'});
      }
      ordered.forEach((p,i)=>{
        const row=runners.get(p.entry.symbol);
        if(!row){issues.push({race:id,type:'missing-roster',symbol:p.entry.symbol});return;}
        row.starts++;
        row.wins+=Number(i===0);
        row.podiums+=Number(i<3);
        row.points+=POINTS[i];
        row.placeTotal+=i+1;
        row.timeTotal+=p.finishTime;
      });
      tierWins[ordered[0].entry.tier]++;
      d.wins[ordered[0].entry.tier]++;
      starts+=ordered.length;races++;d.races++;
    }
    daily.push(d);
  }
  const athletes=[...runners.values()].map(r=>({
    symbol:r.symbol,name:r.name,tier:r.tier,weight:r.weight,
    starts:r.starts,wins:r.wins,podiums:r.podiums,points:r.points,
    winRate:r.starts?r.wins/r.starts:0,averagePlace:average(r.placeTotal,r.starts),
    averageFinishSeconds:average(r.timeTotal,r.starts)
  })).sort((a,b)=>b.wins-a.wins||a.symbol.localeCompare(b.symbol));
  const byTier=Object.fromEntries(TIERS.map(t=>{
    const members=athletes.filter(x=>x.tier===t);
    const starts=members.reduce((s,x)=>s+x.starts,0);
    const wins=members.reduce((s,x)=>s+x.wins,0);
    return [t,{runners:members.length,starts,wins,
      podiums:members.reduce((s,x)=>s+x.podiums,0),
      victoriesPerStart:wins/starts,
      minStarts:Math.min(...members.map(x=>x.starts)),
      maxStarts:Math.max(...members.map(x=>x.starts))}];
  }));
  return {
    auditVersion:AUDIT_VERSION,referenceCommit:AUDIT_BASELINE,
    provenance:{fixtureVersion:PRICE_FIXTURE.version,synthetic:true,live:false,
      meaning:'One deterministic simulated week, NOT empirical odds or real-world market prices'},
    counts:{days:FIXTURE_DAYS,races,starts,uniqueRunners:roster.size,
      exactFinishTies,nearTiesUnderMillisecond,issues:issues.length},
    winners:{first:firstWinner,last:lastWinner,byTier:tierWins},
    byTier,daily,runners:athletes,issues
  };
}
export function asCsv(report){
  const keys=['symbol','name','tier','weight','starts','wins','podiums','points','winRate','averagePlace','averageFinishSeconds'];
  const enc=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  return [keys.join(','),...report.runners.map(r=>keys.map(k=>enc(r[k])).join(','))].join('\n');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const report=auditSportsWeek();
  if(process.argv.includes('--csv'))console.log(asCsv(report));
  else if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else console.log(JSON.stringify({
    provenance:report.provenance,counts:report.counts,winners:report.winners,
    byTier:report.byTier,daily:report.daily,topWinners:report.runners.slice(0,15),
    issues:report.issues
  },null,2));
  if(report.issues.length)process.exitCode=1;
}
