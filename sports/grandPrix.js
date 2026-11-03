/**
 * Cryptódromo Grande Prix, records and replays: non-invasive sports layer.
 * All outcomes come from the EXISTING synthetic fixture and official engine.
 * Display-only achievements do not change race physics or ranking.
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {RACES_PER_DAY,FIXTURE_DAYS,getRaceFixture,PRICE_FIXTURE} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,positionAt,DISTANCE_METERS} from '../race-lab/source/src/data/officialRace.js';
import {syntheticRaceRecord,assertSyntheticRaceRecord} from '../alpha15/raceRecords.js';
import {FINISH_POINTS} from '../race-lab/source/src/data/trackSplits.js';

export const GRAND_PRIX_CONTRACT='cryptodromo.grand-prix.v1';
export const GRAND_PRIX_SLOTS=Object.freeze([119,239,359,479]);
export const GRAND_PRIX_NAMES=Object.freeze(['Premio Apertura','Copa Volatilidad','Clásico del Mercado','Gran Premio Nakamoto']);
export const GRAND_PRIX_COUNT=FIXTURE_DAYS*GRAND_PRIX_SLOTS.length;
const roster=new Map(TOKEN_ROSTER.map(t=>[t.symbol,t]));
const inRange=(n,max)=>Number.isInteger(n)&&n>=0&&n<max;
const actual=(day,slot)=>day*RACES_PER_DAY+slot;
const eventId=(day,round)=>'synthetic-v1-gp-d'+(day+1)+'-e'+(round+1);
export function listGrandPrix(){
 const result=[];
 for(let day=0;day<FIXTURE_DAYS;day++)for(let round=0;round<GRAND_PRIX_SLOTS.length;round++){
  const slot=GRAND_PRIX_SLOTS[round],fixture=getRaceFixture(slot,day);
  result.push(Object.freeze({
   contract:GRAND_PRIX_CONTRACT,id:eventId(day,round),dayIndex:day,slotIndex:slot,
   absoluteIndex:actual(day,slot),round,name:GRAND_PRIX_NAMES[round],
   time:fixture.time,participants:Object.freeze(fixture.entries.map(x=>x.symbol)),
   provenance:Object.freeze({synthetic:true,source:PRICE_FIXTURE.version,notRealWorld:true})
  }));
 }
 return Object.freeze(result);
}
const events=listGrandPrix();
export function getGrandPrixById(id){return events.find(e=>e.id===id)||null;}
export function getGrandPrixAt(day,slot){
 if(!inRange(day,FIXTURE_DAYS)||!inRange(slot,RACES_PER_DAY))throw new RangeError('Invalid race location');
 return events.find(e=>e.dayIndex===day&&e.slotIndex===slot)||null;
}
export function grandPrixResult(event){
 if(!event||event.contract!==GRAND_PRIX_CONTRACT)throw new TypeError('Invalid Grand Prix');
 const record=syntheticRaceRecord(event.dayIndex,event.slotIndex);
 assertSyntheticRaceRecord(record);
 const finish=record.finish.map((x,i)=>Object.freeze({
  ...x,championshipPoints:FINISH_POINTS[i]||0
 }));
 return Object.freeze({
  contract:'cryptodromo.grand-prix-result.v1',event,record,
  finish:Object.freeze(finish),
  winner:finish[0].symbol,
  provenance:Object.freeze({synthetic:true,observedTransmission:false,officialMethod:record.scoring.method})
 });
}
/** Inclusive cutoff; -1 represents no completed event in the current synthetic cycle. */
export function grandPrixStandings(cutoff=-1){
 if(!Number.isInteger(cutoff)||cutoff < -1||cutoff >= FIXTURE_DAYS*RACES_PER_DAY)throw new RangeError('Invalid completed race cutoff');
 const table=new Map(TOKEN_ROSTER.map(x=>[x.symbol,{
  symbol:x.symbol,name:x.name,color:x.color,tier:x.tier,starts:0,wins:0,podiums:0,points:0,
  bestPlace:null,form:[],trophies:[],latestWin:null
 }]));
 const completed=[];
 for(const event of events){
  if(event.absoluteIndex>cutoff)break;
  const result=grandPrixResult(event);completed.push(result);
  for(const runner of result.finish){
   const row=table.get(runner.symbol);
   row.starts++;row.points+=runner.championshipPoints;
   if(runner.place===1){row.wins++;row.latestWin=event.id;row.trophies.push(Object.freeze({id:event.id,name:event.name,day:event.dayIndex+1}));}
   if(runner.place<=3)row.podiums++;
   row.bestPlace=row.bestPlace===null?runner.place:Math.min(row.bestPlace,runner.place);
   row.form.push(runner.place);
   if(row.form.length>8)row.form.shift();
  }
 }
 const standings=[...table.values()].map(row=>Object.freeze({
  ...row,form:Object.freeze([...row.form]),trophies:Object.freeze([...row.trophies]),
  winRatePct:row.starts?100*row.wins/row.starts:0
 })).sort((a,b)=>b.points-a.points||b.wins-a.wins||b.podiums-a.podiums||a.symbol.localeCompare(b.symbol));
 return Object.freeze({cutoff,eventsCompleted:completed.length,completed:Object.freeze(completed),standings:Object.freeze(standings),source:'synthetic-v1'});
}
export function grandPrixRivalries(cutoff=-1,limit=8){
 const completed=grandPrixStandings(cutoff).completed, duels=new Map();
 for(const result of completed){
  const f=result.finish;
  for(let i=0;i<f.length;i++)for(let j=i+1;j<f.length;j++){
   const first=f[i].symbol,second=f[j].symbol,key=[first,second].sort().join('/');
   const current=duels.get(key)||{first:key.split('/')[0],second:key.split('/')[1],meetings:0,firstAhead:0,secondAhead:0,podiumBattles:0,lastEvent:null};
   current.meetings++;
   if(first===current.first)current.firstAhead++;else current.secondAhead++;
   if(f[i].place<=3&&f[j].place<=3)current.podiumBattles++;
   current.lastEvent=result.event.id;duels.set(key,current);
  }
 }
 return Object.freeze([...duels.values()].filter(x=>x.meetings>=2)
  .sort((a,b)=>b.meetings-a.meetings||b.podiumBattles-a.podiumBattles||a.first.localeCompare(b.first))
  .slice(0,Math.max(0,Math.min(100,limit))).map(x=>Object.freeze({...x})));
}
/** Reuse the official profiles. This never generates a new race result. */
export function prepareGrandPrixReplay(event){
 if(!event||event.contract!==GRAND_PRIX_CONTRACT)throw new TypeError('Invalid Grand Prix');
 const fixture=getRaceFixture(event.slotIndex,event.dayIndex);
 const profiles=createOfficialRace(fixture.entries),ranking=officialRanking(profiles);
 const record=syntheticRaceRecord(event.dayIndex,event.slotIndex);
 if(ranking.some((p,i)=>p.entry.symbol!==record.finish[i].symbol))throw Error('Official result mismatch');
 const tracks=profiles.map(p=>Object.freeze({
  symbol:p.entry.symbol,name:p.entry.name,color:p.entry.color,coat:p.entry.coat,
  profile:p,finalPlace:record.finish.find(x=>x.symbol===p.entry.symbol).place
 }));
 return Object.freeze({event,record,tracks:Object.freeze(tracks),distanceMeters:DISTANCE_METERS,
  durationSeconds:60,provenance:'synthetic-precomputed-replay'});
}
export function replayFrame(replay,seconds){
 if(!replay||replay.provenance!=='synthetic-precomputed-replay')throw new TypeError('Invalid replay');
 if(!Number.isFinite(seconds)||seconds<0||seconds>60)throw new RangeError('Expected 0..60 seconds');
 return replay.tracks.map(t=>Object.freeze({
  symbol:t.symbol,name:t.name,color:t.color,finalPlace:t.finalPlace,
  meters:positionAt(t.profile,seconds),
  fraction:Math.max(0,Math.min(1,positionAt(t.profile,seconds)/DISTANCE_METERS))
 }));
}
