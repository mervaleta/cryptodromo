/**
 * Broadcast-only deceleration after the official 60-second finish.
 * Official ranking/results freeze at exactly 60. Runout is not scored.
 */
export const OFFICIAL_FINISH_SECONDS=60;
export const RUNOUT_SECONDS=19;
export const RUNOUT_TAU=7.5;
export function coastDistance(metersAt60,velocityAt60,secondsPastFinish){
 const t=Math.max(0,Number(secondsPastFinish)||0);
 return metersAt60+Math.max(0,velocityAt60)*RUNOUT_TAU*(1-Math.exp(-t/RUNOUT_TAU));
}
export function coastSpeed(velocityAt60,secondsPastFinish){
 return Math.max(0,velocityAt60)*Math.exp(-Math.max(0,secondsPastFinish)/RUNOUT_TAU);
}
// Runout is cinematic only, never alters the 60-second score. A minimum
// cruise on the exit straight guarantees the final runner crosses camera's
// finish stripe before results are superimposed.
export function broadcastRunoutDistance(profile,officialFinish,t){
 const elapsed=Math.max(0,t);
 const nominal=coastDistance(profile.distanceAt60,profile.exitVelocity,elapsed);
 const required=Math.max(0,officialFinish-profile.distanceAt60);
 const minCruise=Math.max(1.6,required/12.8);
 return Math.max(nominal,profile.distanceAt60+minCruise*elapsed);
}
export function narrateEvent({type,leader,previous,elapsed=0,changes=0}={}){
 const name=String(leader||'el puntero'),former=String(previous||'el pelotón');
 const slot=Math.max(0,Math.floor(elapsed/5));
 if(type==='start')return '¡Se abrieron las gateras del Satoshi Nakamoto! Largaron los doce, con el cronómetro de sesenta segundos en marcha.';
 if(type==='lead'){
   const styles=[
    name+' mete el hocico por delante de '+former+'. ¡Cambio de punta!',
    'Por afuera aparece '+name+', que supera a '+former+' y se queda con el liderazgo.',
    '¡Hay lucha en el frente! '+name+' pasa a '+former+' y el lote se reordena.'
   ];
   return styles[Math.max(0,changes)%styles.length];
 }
 if(type==='dose'){
   if(elapsed>=45)return 'Recta final de la simulación: entran las últimas tres dosis. ¡Cada centésima empieza a pesar!';
   const clips=[
    'Primera descarga de precios sintéticos. Hay cambios de velocidad y nadie levanta.',
    'Los movimientos del mercado ficticio empiezan a ordenar el pelotón. ¡Pican por los andariveles centrales!',
    'Nueva dosis: algunos aceleran y otros ceden terreno, pero todos siguen al galope.',
    '¡Se comprime el grupo! Hay espacio por afuera y se prepara otro adelantamiento.',
    'El contador marca el ecuador; doce caballos siguen peleando la punta.',
    'Otra tanda de variaciones mueve las posiciones: el lote se estira a lo largo de la pista.',
    'Se juega cada metro. ¡Los de atrás buscan un carril limpio!',
    'El hipódromo ruge; nadie tiene asegurada la carrera antes del resultado oficial.'
   ];
   return clips[slot%clips.length];
 }
 if(type==='close')return '¡Últimos metros! Se viene la meta, los caballos lanzados y el resultado a punto de confirmarse.';
 if(type==='finish')return '¡Cruzaron el disco! '+name+' gana el Gran Premio Cripto. Se confirma el orden de los doce en el tablero oficial.';
 return 'El lote avanza, los cascos marcan el ritmo y las dosis siguen definiendo posiciones.';
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
