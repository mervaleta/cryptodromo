/**
 * Alpha15 / TV director (wired to scene.js; visual-only decisions).
 * A shot is a PRESENTATION choice: never changes price, dose, position or winner.
 * All inputs are observations supplied by the broadcasting scene.
 */
export const DIRECTOR_SHOTS=Object.freeze([
 'rail','drone','leader','pack','grandstand','finish','orbit'
]);
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
/**
 * @param {object} frame
 * @returns {{shot:string,reason:string,secondsSinceChange:number,changed:boolean}}
 */
export function selectBroadcastShot(frame={}){
 const elapsed=clamp(finite(frame.elapsed),0,180);
 const phase=frame.phase|| (elapsed<60?'race':elapsed<120?'results':'presentation');
 const previousShot=DIRECTOR_SHOTS.includes(frame.previousShot)?frame.previousShot:'pack';
 const lastChangeAt=finite(frame.lastChangeAt,-Infinity);
 const minDwell=clamp(finite(frame.minDwell,6),0,30);
 const maxDwell=clamp(finite(frame.maxDwell,12),Math.max(4,minDwell),30);
 const overtakes=Math.max(0,Math.floor(finite(frame.overtakes,0)));
 const previousOvertakes=Math.max(0,Math.floor(finite(frame.previousOvertakes,0)));
 const margin=Math.max(0,finite(frame.leadMarginMeters,100));
 const progress=clamp(finite(frame.progress,elapsed/60),0,1.25);
 const layout=['straight','s-bend','oval'].includes(frame.layout)?frame.layout:'straight';
 let shot,reason,urgent=false;
 if(phase==='presentation'){
  shot='grandstand';reason='paddock';urgent=true;
 }else if(phase==='results'){
  shot='finish';reason='finish-and-standings';urgent=true;
 }else if(progress>=.925||elapsed>=55){
  shot='finish';reason='final-sprint';urgent=true;
 }else if(overtakes>previousOvertakes&&margin<17){
  shot='leader';reason='overtake';urgent=true;
 }else if(margin<5&&progress>.22){
  shot='pack';reason='photo-duel';
 }else if(elapsed<8){
  shot='rail';reason='start';
 }else if(elapsed<19){
  shot='pack';reason='formation';
 }else if((layout==='oval'&&progress>.16&&progress<.78)||
          (layout==='s-bend'&&progress>.35&&progress<.67)){
  shot='drone';reason='curve-navigation';
 }else if(elapsed<32){
  shot='leader';reason='leader-focus';
 }else if(elapsed<45){
  shot='rail';reason='hoof-action';
 }else{
  shot='drone';reason='aerial-overview';
 }
 // Avoid parking on the same automatic shot for an entire long bend.
 // Alternates are existing, safe camera presets, never invented camera positions.
 if(phase==='race'&&!urgent&&!frame.reduceMotion&&Number.isFinite(lastChangeAt)&&
    previousShot===shot&&elapsed-lastChangeAt>=maxDwell&&progress<.9){
  shot=({drone:'pack',pack:'leader',leader:'rail',rail:'pack',grandstand:'pack',orbit:'pack'})[shot]||'pack';
  reason='coverage-variety';
 }
 // No aggressive cuts: low motion device modes prefer wide/static frames.
 if(frame.reduceMotion && !urgent && shot!=='finish'){
  shot='grandstand';reason='reduced-motion';
 }
 const dwell=elapsed-lastChangeAt;
 if(!urgent && previousShot!==shot && dwell<minDwell){
  return {shot:previousShot,reason:'minimum-shot-duration',secondsSinceChange:Math.max(0,dwell),changed:false};
 }
 return {shot,reason,secondsSinceChange:Math.max(0,dwell),changed:shot!==previousShot};
}
/**
 * Stateful wrapper limited to presentation state. Scene feeds observed
 * race progression at up to 4 Hz. Never edits any sporting data.
 */
export function createBroadcastDirector({minDwell=6,maxDwell=12,initialShot='pack'}={}){
 let shot=DIRECTOR_SHOTS.includes(initialShot)?initialShot:'pack';
 let lastChangeAt=-Infinity,previousOvertakes=0;
 return {
  frame(observation){
   const elapsed=finite(observation?.elapsed);
   const choice=selectBroadcastShot({...observation,minDwell,maxDwell,previousShot:shot,lastChangeAt,previousOvertakes});
   if(choice.changed){shot=choice.shot;lastChangeAt=elapsed;}
   previousOvertakes=Math.max(0,finite(observation?.overtakes,previousOvertakes));
   return {...choice,shot};
  },
  reset(){shot=initialShot;lastChangeAt=-Infinity;previousOvertakes=0;},
  get state(){return Object.freeze({shot,lastChangeAt,previousOvertakes});}
 };
}
