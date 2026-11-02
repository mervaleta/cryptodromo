/**
 * Event-driven FINISH presentation state, separate from scoring.
 * No overlay before all 12 have crossed. Fail CLOSED on missing geometry.
 * This controller does not change the financial distanceAt60.
 */
const valid=n=>typeof n==='number'&&Number.isFinite(n);
export function createFinishOrchestrator({runners=12,holdAfterLast=2.4,maxVisualSeconds=20}={}){
 if(!Number.isInteger(runners)||runners<2)throw RangeError('Invalid runner count');
 let crossed=Array(runners).fill(false),lastCrossAt=null,revealed=false;
 let firstCrossAt=null,previousElapsed=-Infinity;
 function reset(){
  crossed=Array(runners).fill(false);lastCrossAt=null;revealed=false;
  firstCrossAt=null;previousElapsed=-Infinity;
 }
 return {
  update({elapsed=0,distances=[],finishDistance}={}){
   if(!valid(elapsed)||elapsed<0||!valid(finishDistance)||finishDistance<=0||
      !Array.isArray(distances)||distances.length!==runners||
      !distances.every(d=>valid(d)&&d>=0))throw Error('Invalid visual finish measurements');
   if(elapsed+1e-6<previousElapsed)throw Error('Elapsed went backwards: reset before new race');
   previousElapsed=elapsed;
   const newlyCrossed=[];
   if(elapsed>=60)for(let i=0;i<runners;i++)if(!crossed[i]&&distances[i]>=finishDistance-1e-6){
    crossed[i]=true;newlyCrossed.push(i);
    firstCrossAt??=elapsed;
   }
   const count=crossed.filter(Boolean).length;
   if(count===runners&&lastCrossAt===null)lastCrossAt=elapsed;
   // Do NOT silently force the result overlay on timeout. The scene must
   // diagnose a stalled runout instead of showing scores too early.
   const overdue=elapsed>60+maxVisualSeconds&&count<runners;
   if(count===runners&&elapsed>=lastCrossAt+holdAfterLast)revealed=true;
   const celebration=count>0&&!revealed;
   return Object.freeze({
    phase:revealed?'results':elapsed<60?'racing':'arrival',
    crossedCount:count,allCrossed:count===runners,
    newCrossings:Object.freeze(newlyCrossed),
    firstCrossAt,lastCrossAt,showOfficialResult:revealed,
    celebration,overdue,secondsAfterLast:lastCrossAt===null?null:Math.max(0,elapsed-lastCrossAt)
   });
  },
  reset,
  get state(){return Object.freeze({crossedCount:crossed.filter(Boolean).length,
   firstCrossAt,lastCrossAt,revealed});}
 };
}
