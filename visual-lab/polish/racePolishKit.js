import {createLocomotionDirector} from './motionDirector.js';
import {createHoofContactTracker} from './hoofContacts.js';
import {createContactSpray} from './contactSpray.js';
import {createStadiumFinishing} from './stadiumFinishing.js';

/**
 * Single Alpha21 opt-in facade. Integration MUST REPLACE the existing
 * horse.model.update call, NOT run beside it. Never mutates official race data.
 */
export function createRacePolishKit({THREE,scene,horseCount=12,stadiumId='satoshi',
  quality='balanced',enableStadium=true}={}){
 if(!THREE||!scene)throw Error('THREE and scene required');
 const locomotion=createLocomotionDirector({count:horseCount});
 const contacts=createHoofContactTracker({count:horseCount});
 const spray=createContactSpray({THREE,scene,quality});
 const stadium=enableStadium?createStadiumFinishing({THREE,scene,stadiumId,quality}):null;
 let disposed=false,layout='straight';
 const ensure=()=>{if(disposed)throw Error('Race polish kit disposed');};
 function beginRace(){ensure();locomotion.reset();contacts.reset();spray.reset();}
 /**
  * Call AFTER the official trackPoint position and gait-banking have been set.
  * The existing GLB bone clip and gaitRefiner still execute in horse.update.
  * The returned impacts are broadcast/aesthetic only.
  */
 function updateHorse(index,{horse,delta=0,metersPerSecond=0,referenceSpeed=16.67,
  elapsed=0,phase='race',heading=0,position=null}={}){
  ensure();
  if(!horse||typeof horse.update!=='function')throw Error('Existing horse model required');
  const cue=locomotion.sample(index,{delta,metersPerSecond,reference:referenceSpeed,elapsed,phase});
  horse.update(delta,cue.active?cue.rate:1);
  const hoofEvents=contacts.sample(index,{hoofPhase:horse.hoofPhase,elapsed,active:cue.active});
  const location=position||horse.root?.position;
  if(location&&Number.isFinite(location.x)&&Number.isFinite(location.z)){
   for(const contact of hoofEvents){
    spray.emit({x:location.x,z:location.z,heading,
     force:cue.impact*contact.force,side:contact.side,
     qualityScale:phase==='runout'?.58:1});
   }
  }
  return {rate:cue.rate,stridesPerSecond:cue.stridesPerSecond,hoofEvents:hoofEvents.length,
    impact:cue.impact,active:cue.active};
 }
 function updateFrame({delta=0,weather='clear',surface='dirt',wetness=0,
  localHour=17.5,racePhase='race'}={}){
  ensure();spray.setEnvironment({wet:weather==='rain'?Math.max(.5,wetness):wetness,type:surface});
  spray.update(delta);
  stadium?.update({racePhase,localHour,wetness});
 }
 function setQuality(level='balanced'){ensure();spray.setQuality(level);stadium?.setQuality(level);}
 function setLayout(mode='straight'){
  ensure();layout=mode;
  if(stadium)stadium.root.visible=layout==='straight';
 }
 function dispose(){if(disposed)return;disposed=true;contacts.reset();locomotion.reset();spray.dispose();stadium?.dispose();}
 return {beginRace,updateHorse,updateFrame,setQuality,setLayout,dispose,
  locomotion,contacts,spray,stadium,get disposed(){return disposed}};
}
