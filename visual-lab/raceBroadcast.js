/**
 * Broadcast-only deceleration after the official 60-second finish.
 * Official ranking/results freeze at exactly 60. Runout is not scored.
 */
export const OFFICIAL_FINISH_SECONDS=60;
export const RUNOUT_SECONDS=15;
export const RUNOUT_TAU=7.5;
export function coastDistance(metersAt60,velocityAt60,secondsPastFinish){
 const t=Math.max(0,Number(secondsPastFinish)||0);
 return metersAt60+Math.max(0,velocityAt60)*RUNOUT_TAU*(1-Math.exp(-t/RUNOUT_TAU));
}
export function coastSpeed(velocityAt60,secondsPastFinish){
 return Math.max(0,velocityAt60)*Math.exp(-Math.max(0,secondsPastFinish)/RUNOUT_TAU);
}
export function narrateEvent({type,leader,previous,rank,elapsed=0,race=1,changes=0}={}){
 const who=String(leader||'el puntero');
 const transition=String(previous||'el pelotón');
 switch(type){
 case 'start':return '¡Largaron! Ya se mueven los doce caballos en el Cryptódromo.';
 case 'lead':return who+' toma la punta. Supera a '+transition+' y el lote cambia de orden.';
 case 'dose':return elapsed>=45?'Entran las últimas tres dosis. Se define la carrera.':
   'Nueva dosis de precios. Cada corredor ajusta su velocidad, nadie deja de avanzar.';
 case 'close':return 'Entramos en la recta final. Los caballos siguen acelerando y descontando terreno.';
 case 'finish':return '¡Cruzaron la meta! Ganador oficial: '+who+'. El marcador confirma la clasificación.';
 default:return 'El pelotón sigue a velocidad de carrera.';
 }
}
export function raceStatistics(profiles){
 const order=[...profiles].sort((a,b)=>a.finishTime-b.finishTime||a.index-b.index);
 const leader=order[0],last=order.at(-1);
 const changes=profiles.map(p=>p.input1+p.input2);
 return {
  count:profiles.length,leader:leader.entry.symbol,leaderFinishTime:leader.finishTime,
  leadGapMeters:leader.distanceAt60-order[1].distanceAt60,
  spreadMeters:leader.distanceAt60-last.distanceAt60,
  averageChangePct:changes.reduce((a,b)=>a+b,0)/profiles.length,
  biggestRise:profiles.reduce((a,b)=>a.input1+a.input2>b.input1+b.input2?a:b).entry.symbol,
  biggestFall:profiles.reduce((a,b)=>a.input1+a.input2<b.input1+b.input2?a:b).entry.symbol,
  entries:order.map((p,i)=>({place:i+1,symbol:p.entry.symbol,name:p.entry.name,color:p.entry.color,
    finishTime:p.finishTime,distanceAt60:p.distanceAt60,
    input1:p.input1,input2:p.input2,changePct:p.input1+p.input2}))
 };
}
