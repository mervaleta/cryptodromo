import {syntheticRaceRecord} from './raceRecords.js';
import {RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js';
/**
 * Editorial generator for synthetic races, NOT the separate real-source Gazette.
 * Only uses deterministic outcomes up to the supplied day and slot.
 * No future results, people, wagering actions or unsourced claims.
 */
const provenance=Object.freeze({synthetic:true,archiveType:'fixture-replay',
 publicationStatus:'draft',recordType:'derived-editorial',
 label:'Crónica automática de una simulación. No es una noticia de una carrera real.'});
const fresh=()=>({starts:0,wins:0,consecutiveWins:0,podiums:0});
const round=n=>Math.round(n*100)/100;
function writeMoment(record,kind,{score=1,title,body,subjects=[]}){
 return Object.freeze({
  id:record.id+':'+kind,kind,raceId:record.id,day:record.race.day,slot:record.race.slotIndex,
  score,title,body,subjects:Object.freeze([...subjects]),provenance
 });
}
export function buildSyntheticChronicle({dayIndex=0,throughSlot=RACES_PER_DAY-1,limit=12}={}){
 if(!Number.isInteger(dayIndex)||dayIndex<0||dayIndex>=FIXTURE_DAYS)
  throw new RangeError('Invalid synthetic day');
 if(!Number.isInteger(throughSlot)||throughSlot<0||throughSlot>=RACES_PER_DAY)
  throw new RangeError('Invalid synthetic slot');
 const states=new Map(),moments=[];
 let racesExamined=0;
 for(let d=0;d<=dayIndex;d++)for(let r=0;r<=(d===dayIndex?throughSlot:RACES_PER_DAY-1);r++){
  const record=syntheticRaceRecord(d,r),order=record.finish;
  racesExamined++;
  const winner=order[0],second=order[1];
  const winnerBefore=states.get(winner.symbol)||fresh();
  const raceName='Día '+record.race.day+' · carrera '+String(record.race.number).padStart(3,'0');
  // First win is derived strictly from earlier appearances in this fixture.
  if(winnerBefore.wins===0){
   moments.push(writeMoment(record,'first-win',{score:35,title:'Primera victoria de '+winner.symbol,
    body:winner.symbol+' ('+winner.name+') logró su primer triunfo en el ciclo sintético, '+raceName+'.',
    subjects:[winner.symbol]}));
  }
  if(winnerBefore.consecutiveWins>=2){
   moments.push(writeMoment(record,'streak',{score:55,
    title:'Tres triunfos seguidos de '+winner.symbol,
    body:winner.symbol+' encadenó '+(winnerBefore.consecutiveWins+1)+
      ' victorias en sus últimas participaciones del fixture sintético, '+raceName+'.',
    subjects:[winner.symbol]}));
  }
  const gap=record.summary.firstSecondMarginMeters;
  if(gap<=.4){
   moments.push(writeMoment(record,'photo-finish',{score:45+(0.4-gap)*12,
    title:'Llegada ajustada: '+winner.symbol+' delante de '+second.symbol,
    body:raceName+': '+winner.symbol+' superó a '+second.symbol+
      ' por '+round(gap).toFixed(2)+' metros de distancia calculada a los 60 segundos.',
    subjects:[winner.symbol,second.symbol]}));
  }
  if(winner.tier==='challenger'){
   moments.push(writeMoment(record,'challenger-win',{score:26,
    title:'Un desafiante se impone: '+winner.symbol,
    body:raceName+': el corredor de categoría desafiante '+winner.symbol+
      ' terminó primero en la clasificación sintética.',
    subjects:[winner.symbol]}));
  }
  // Lightweight recap for every race, so a window never yields empty data.
  if(d===dayIndex)moments.push(writeMoment(record,'result',{score:2,
   title:winner.symbol+' gana la carrera '+record.race.number,
   body:raceName+': podio '+order.slice(0,3).map(x=>x.symbol).join(', ')+
      '. Margen de la primera posición: '+round(gap).toFixed(2)+' m.',
   subjects:order.slice(0,3).map(x=>x.symbol)}));
  // Update ALL participants only after writing this race's editorial moments.
  for(const [position,p] of order.entries()){
   const previous=states.get(p.symbol)||fresh();
   previous.starts++;if(position===0){
    previous.wins++;previous.consecutiveWins++;
   }else previous.consecutiveWins=0;
   if(position<3)previous.podiums++;
   states.set(p.symbol,previous);
  }
 }
 const target=moments.filter(m=>m.day===dayIndex+1);
 target.sort((a,b)=>b.score-a.score||b.slot-a.slot||a.id.localeCompare(b.id));
 const selected=target.slice(0,Math.max(1,Math.min(50,Number(limit)||12)));
 return Object.freeze({
  contract:'cryptodromo.synthetic-chronicle.v1',day:dayIndex+1,throughSlot,
  racesExamined,fixtureRacesInDay:throughSlot+1,provenance,
  highlights:Object.freeze(selected),
  counters:Object.freeze({
   differentWinners:[...states.values()].filter(s=>s.wins>0).length,
   racesProcessed:racesExamined
  })
 });
}
export function asTextBrief(moment){
 if(!moment?.provenance?.synthetic)throw Error('Missing synthetic provenance');
 return moment.title+'\n'+moment.body+'\n'+moment.provenance.label;
}
