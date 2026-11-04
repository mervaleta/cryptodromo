/**
 * Satoshi TV source contract. Only first-party static race documents are allowed.
 * This prevents a host rewrite from recursively embedding /live/ inside itself.
 */
export const RACE_PLAYER_SOURCES=Object.freeze([
 '/stadiums/crypto/broadcast/index.html',
 '/visual-lab/index.html'
]);
export const TV_TRACKS=Object.freeze({
 muybridge:Object.freeze({offset:0,label:'Eadweard Muybridge'}),
 genesis:Object.freeze({offset:1,label:'Genesis'}),
 'vint-cerf':Object.freeze({offset:2,label:'Vint Cerf'})
});
export function readTvReplay(query,trackId){
 const p=query instanceof URLSearchParams?query:new URLSearchParams(query);
 if(!Object.hasOwn(TV_TRACKS,trackId))return null;
 const day=p.get('replayDay'),minute=p.get('replayMinute');
 if(day===null||minute===null||!/^[0-6]$/.test(day)||!/^(0|[1-9]\d{0,3})$/.test(minute))return null;
 const d=Number(day),m=Number(minute);
 if(m>=1440||m%3!==TV_TRACKS[trackId].offset)return null;
 return Object.freeze({day:d,minute:m,trackId});
}
export function buildTvPlayerUrl(source,trackId,replay=null){
 if(!RACE_PLAYER_SOURCES.includes(source))throw new RangeError('Invalid first-party player route');
 if(!Object.hasOwn(TV_TRACKS,trackId))throw new RangeError('Invalid track');
 const q=new URLSearchParams({track:trackId,embed:'tv',build:'satoshi-cachefix-20261104-v3'});
 if(replay){
  if(replay.trackId!==trackId||!Number.isInteger(replay.day)||replay.day<0||replay.day>6||
   !Number.isInteger(replay.minute)||replay.minute<0||replay.minute>=1440||
   replay.minute%3!==TV_TRACKS[trackId].offset)throw new RangeError('Invalid replay');
  q.set('replayDay',String(replay.day));q.set('replayMinute',String(replay.minute));
 }
 return source+'?'+q.toString();
}
export function isRaceDocument(html){
 return typeof html==='string'&&/<canvas\s[^>]*\bid=['"]raceCanvas['"]/.test(html)&&
  /\bid=['"]stage['"]/.test(html)&&
  !/\bid=['"]stadium-broadcast['"]/.test(html);
}
export async function findRacePlayerSource(fetchHtml){
 for(const path of RACE_PLAYER_SOURCES){
  try{
   const response=await fetchHtml(path);
   if(response?.ok&&isRaceDocument(await response.text()))return path;
  }catch{ /* Allow fallback if only the primary broadcast route is absent. */ }
 }
 return null;
}
