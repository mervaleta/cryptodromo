/**
 * Career and rivalry records as-of a synthetic fixture cutoff.
 * No "future career" leakage into pre-race introductions.
 * Nothing here is real market data or an observed racing history.
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js';
import {syntheticRaceRecord} from './raceRecords.js';
const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
const blank=(r)=>({symbol:r.symbol,name:r.name,tier:r.tier,color:r.color,coat:r.coat,
 starts:0,wins:0,podiums:0,placeSum:0,bestPlace:12,fastest1000mSeconds:Infinity,
 currentWinStreak:0,longestWinStreak:0,form:[],rivals:new Map()});
export function buildSyntheticCareers({throughDay=6,throughSlot=479,formLength=8,rivalsLimit=4}={}){
 if(!Number.isInteger(throughDay)||throughDay<0||throughDay>=FIXTURE_DAYS||
 !Number.isInteger(throughSlot)||throughSlot<0||throughSlot>=RACES_PER_DAY)
 throw new RangeError('Unknown synthetic cutoff');
 const careers=new Map(TOKEN_ROSTER.map(r=>[r.symbol,blank(r)]));
 let analyzed=0;
 for(let d=0;d<=throughDay;d++)for(let slot=0;slot<=(d===throughDay?throughSlot:479);slot++){
  const finish=syntheticRaceRecord(d,slot).finish;analyzed++;
  for(const runner of finish){
   const st=careers.get(runner.symbol);
   st.starts++;st.placeSum+=runner.place;st.bestPlace=Math.min(st.bestPlace,runner.place);
   st.fastest1000mSeconds=Math.min(st.fastest1000mSeconds,runner.finishTimeSeconds);
   if(runner.place===1){
    st.wins++;st.currentWinStreak++;
    st.longestWinStreak=Math.max(st.longestWinStreak,st.currentWinStreak);
   }else st.currentWinStreak=0;
   if(runner.place<=3)st.podiums++;
   st.form.push(runner.place);
   if(st.form.length>clamp(formLength,1,30))st.form.shift();
  }
  for(let a=0;a<finish.length;a++)for(let b=a+1;b<finish.length;b++){
   const p=finish[a],q=finish[b],ap=careers.get(p.symbol),aq=careers.get(q.symbol);
   const r1=ap.rivals.get(q.symbol)||{symbol:q.symbol,meetings:0,placedAhead:0,placedBehind:0,podiumDuels:0};
   const r2=aq.rivals.get(p.symbol)||{symbol:p.symbol,meetings:0,placedAhead:0,placedBehind:0,podiumDuels:0};
   r1.meetings++;r2.meetings++;
   r1.placedAhead++;r2.placedBehind++;
   if(p.place<=3&&q.place<=3){r1.podiumDuels++;r2.podiumDuels++;}
   ap.rivals.set(q.symbol,r1);aq.rivals.set(p.symbol,r2);
  }
 }
 const result=new Map();
 for(const [symbol,s] of careers){
  const rivals=[...s.rivals.values()].sort((a,b)=>b.meetings-a.meetings||
    b.podiumDuels-a.podiumDuels||a.symbol.localeCompare(b.symbol))
    .slice(0,Math.max(0,Math.min(10,rivalsLimit))).map(x=>Object.freeze({...x}));
  result.set(symbol,Object.freeze({
   symbol,name:s.name,tier:s.tier,color:s.color,coat:s.coat,
   starts:s.starts,wins:s.wins,podiums:s.podiums,
   averagePlace:s.starts?s.placeSum/s.starts:null,
   bestPlace:s.starts?s.bestPlace:null,
   fastest1000mSeconds:s.starts?s.fastest1000mSeconds:null,
   winRatePct:s.starts?100*s.wins/s.starts:0,
   podiumRatePct:s.starts?100*s.podiums/s.starts:0,
   currentWinStreak:s.currentWinStreak,longestWinStreak:s.longestWinStreak,
   recentForm:Object.freeze([...s.form]),rivals:Object.freeze(rivals),
   provenance:Object.freeze({source:'synthetic-v1',synthetic:true,
     throughDay,throughSlot,transmissionObserved:false})
  }));
 }
 return Object.freeze({contract:'cryptodromo.synthetic-careers.v1',racesAnalyzed:analyzed,
  cutoff:Object.freeze({throughDay,throughSlot}),careers:result});
}
