/**
 * Grand Prix LIVE ceremony. Presentation-only, fail-closed on finish authorization.
 * Never updates the fixture, scoring, horse trajectories, odds or financial inputs.
 */
import {getGrandPrixAt,grandPrixResult} from './grandPrix.js';

export const CEREMONY_CONTRACT='cryptodromo.gp-ceremony.v1';
export function createGrandPrixCeremonyController(){
 let event=null,revealed=false,payload=null;
 function reset({dayIndex,slotIndex}){
  event=getGrandPrixAt(dayIndex,slotIndex);revealed=false;payload=null;
  return event;
 }
 function authorize(finishState){
  if(!event||revealed)return null;
  if(finishState?.crossedCount!==12||finishState.revealed!==true||
      !Number.isFinite(finishState.lastCrossAt)||finishState.lastCrossAt<60)return null;
  const result=grandPrixResult(event);
  revealed=true;
  payload=Object.freeze({
   contract:CEREMONY_CONTRACT,grandPrixId:event.id,
   dayIndex:event.dayIndex,slotIndex:event.slotIndex,eventName:event.name,
   title:'GRAN PREMIO · RESULTADO SINTÉTICO',
   podium:Object.freeze(result.finish.slice(0,3).map(x=>Object.freeze({
    place:x.place,symbol:x.symbol,name:x.name,color:x.color,finishSeconds:x.finishTimeSeconds
   }))),
   winner:result.winner,
   provenance:Object.freeze({synthetic:true,transmissionObserved:false})
  });
  return payload;
 }
 return Object.freeze({
  reset,authorize,
  get event(){return event;},
  get isRevealed(){return revealed;},
  get snapshot(){return payload;}
 });
}
export function mountGrandPrixCeremony({container}={}){
 if(!container||typeof container.append!=='function')throw new TypeError('Valid DOM container required');
 const controller=createGrandPrixCeremonyController();
 const banner=document.createElement('section');banner.className='crp-gp-ceremony';banner.hidden=true;
 banner.setAttribute('aria-label','Podio del Gran Premio');
 const title=document.createElement('strong');title.className='crp-gp-ceremony__title';
 const podium=document.createElement('div');podium.className='crp-gp-ceremony__podium';
 const links=document.createElement('div');links.className='crp-gp-ceremony__links';
 banner.append(title,podium,links);
 const firstResult=container.querySelector('#result-list');
 if(firstResult)container.insertBefore(banner,firstResult);
 else container.append(banner);
 const link=document.createElement('link');link.rel='stylesheet';
 link.href=new URL('./grandPrixCeremony.css',import.meta.url).href;
 document.head.append(link);
 function reset(position){
  controller.reset(position);banner.hidden=true;
  podium.replaceChildren();links.replaceChildren();title.textContent='';
 }
 function show(finishState){
  const details=controller.authorize(finishState);
  if(!details)return false;
  title.textContent='🏆 '+details.eventName+' · PODIO CONFIRMADO';
  podium.replaceChildren(...details.podium.map(p=>{
   const row=document.createElement('span');row.className='crp-gp-ceremony__medal';
   row.style.setProperty('--gp-runner-color',p.color);
   row.textContent=(p.place===1?'🥇':p.place===2?'🥈':'🥉')+' '+p.symbol;
   return row;
  }));
  const replay=document.createElement('a');
  replay.href='/grandes-premios/replay-3d/?day='+details.dayIndex+'&race='+details.slotIndex;
  replay.textContent='Ver repetición 3D';
  const table=document.createElement('a');table.href='/grandes-premios/';
  table.textContent='Palmarés del campeonato';
  links.append(replay,table);
  banner.hidden=false;
  return true;
 }
 function dispose(){banner.remove();link.remove();}
 return {reset,show,dispose,get snapshot(){return controller.snapshot;}};
}
