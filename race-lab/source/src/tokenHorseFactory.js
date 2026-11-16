/**
 * CRP unified CC0 horse factory. 100 token identities, 12 active skeletons per race.
 * No price, race fixture, ranking, or animation order is changed here.
 * Quaternius Ultimate Animated Animal Pack: CC0 1.0.
 */
import {TOKEN_ROSTER} from './data/tokenRoster.js';
import {createHorse} from './horse.js';
import {resolveHorseProfile,toMasterHorseOptions,applyHorseProfileToRenderer,fetchPublishedHorseProfiles} from './data/horseProfileAdapter.js';

export const CRP_UNIFIED_HORSE_BUILD='crp-100-cc0-groom-20261115-v1';
export const CRP_HORSE_TOKEN_COUNT=TOKEN_ROSTER.length;
const bySymbol=new Map(TOKEN_ROSTER.map(t=>[t.symbol,t]));

export function tokenIdentity(token,profiles={}){
 const original=bySymbol.get(token?.symbol);
 if(!original)throw new TypeError('Corredor desconocido: '+String(token?.symbol));
 // Preserve the authoritative roster's token color and its stable race symbol.
 return toMasterHorseOptions({...original,...token,color:original.color,coat:original.coat},profiles);
}
export function allTokenIdentities(profiles={}){
 // 100 parameters only, never allocate 100 3D skeletons or mixers at once.
 return TOKEN_ROSTER.map(token=>Object.freeze(tokenIdentity(token,profiles)));
}
/** Apply visual metadata only. Race positions and official coefficients untouched. */
export function updateTokenHorse(horse,token,profiles={}){
 const original=bySymbol.get(token?.symbol);
 if(!original)throw new TypeError('Corredor desconocido: '+String(token?.symbol));
 return applyHorseProfileToRenderer(horse,{...original,...token,color:original.color,coat:original.coat},profiles);
}
/**
 * Clone the single CC0 rig, native Gallop, and shared CC0 groom geometry.
 * Callers can pass their own display phase, altitude and LOD only.
 */
export async function createTokenHorse(token,{
 profiles={},height=2.5,mode='Gallop',phase=0,quality='balanced',
 gaitCorrectionStrength=0,wind=.55
}={}){
 const id=tokenIdentity(token,profiles);
 const horse=await createHorse({
  symbol:id.symbol,coat:id.coat,accent:id.accent,height,mode,phase,
  maneMotion:false,gaitCorrectionStrength,cc0Groom:true,groomQuality:quality
 });
 horse.setTokenProfile=(next,activeProfiles=profiles)=>updateTokenHorse(horse,next,activeProfiles);
 horse.setTokenProfile(token,profiles);
 horse.setWind?.(wind);
 return horse;
}
let profileLoad=null;
/** Public visual edits are optional and never block a race when the editor API is offline. */
export function loadPublishedVisualProfiles(){
 if(!profileLoad){
  profileLoad=fetchPublishedHorseProfiles().then(data=>data.profiles||{}).catch(error=>{
   console.warn('CRP horse profiles unavailable; default 100-token palette active:',error.message);
   return {};
  });
 }
 return profileLoad;
}
