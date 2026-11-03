/**
 * Sports fan clubs: identity and local preference only, no user registry.
 * A "club" is the virtual supporters' page of a TOKEN_ROSTER entry.
 * No membership counts, payments, racing boosts, NFTs, or public profiles.
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {grandPrixStandings,listGrandPrix,grandPrixRivalries} from './grandPrix.js';
export const FAN_PREF_KEY='cryptodromo-sports-fan-local-v1';
export const FAN_PREF_CONTRACT='cryptodromo.fan-preferences.v1';
const bySymbol=new Map(TOKEN_ROSTER.map(token=>[token.symbol,token]));
const maxPinned=5;
export const getClub=symbol=>bySymbol.get(symbol)||null;
export function listClubs(){return Object.freeze(TOKEN_ROSTER.map(t=>Object.freeze({
 symbol:t.symbol,name:'Club '+t.symbol,assetName:t.name,tier:t.tier,color:t.color,coat:t.coat
})));}
export function normalizeFanPreferences(value){
 const raw=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const main=typeof raw.mainClub==='string'&&bySymbol.has(raw.mainClub)?raw.mainClub:null;
 const pinned=Array.isArray(raw.pinned)?[...new Set(raw.pinned.filter(s=>typeof s==='string'&&bySymbol.has(s)))].slice(0,maxPinned):[];
 return Object.freeze({contract:FAN_PREF_CONTRACT,mainClub:main,pinned:Object.freeze(pinned)});
}
export function chooseMainClub(state,symbol){
 if(symbol!==null&&!bySymbol.has(symbol))throw new RangeError('Unknown club');
 return normalizeFanPreferences({...normalizeFanPreferences(state),mainClub:symbol});
}
export function togglePinnedClub(state,symbol){
 if(!bySymbol.has(symbol))throw new RangeError('Unknown club');
 const current=normalizeFanPreferences(state),pinned=[...current.pinned];
 if(pinned.includes(symbol))pinned.splice(pinned.indexOf(symbol),1);
 else if(pinned.length<maxPinned)pinned.push(symbol);
 else throw new RangeError('Maximum five pinned clubs');
 return normalizeFanPreferences({...current,pinned});
}
export function clubSportsProfile(symbol,cutoff=-1){
 const club=getClub(symbol);
 if(!club)throw new RangeError('Unknown club');
 const standings=grandPrixStandings(cutoff);
 const row=standings.standings.find(x=>x.symbol===symbol);
 const upcoming=listGrandPrix().filter(x=>x.absoluteIndex>cutoff&&x.participants.includes(symbol));
 const rivals=grandPrixRivalries(cutoff,100).filter(x=>x.first===symbol||x.second===symbol).slice(0,5);
 return Object.freeze({
  club:Object.freeze({symbol,name:'Club '+symbol,assetName:club.name,color:club.color,coat:club.coat,tier:club.tier}),
  sporting:Object.freeze({starts:row.starts,wins:row.wins,podiums:row.podiums,points:row.points,winRatePct:row.winRatePct,
   trophies:row.trophies,recentForm:row.form,rank:standings.standings.findIndex(x=>x.symbol===symbol)+1}),
  upcoming:Object.freeze(upcoming.map(x=>Object.freeze({id:x.id,name:x.name,dayIndex:x.dayIndex,slotIndex:x.slotIndex,time:x.time}))),
  rivalries:Object.freeze(rivals.map(x=>Object.freeze({...x}))),
  provenance:Object.freeze({synthetic:true,observedTransmission:false,memberCount:null,cutoff})
 });
}
