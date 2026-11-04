/**
 * Autódromo Crypto: adaptation layer only.
 * It reuses the exact 7-day / 100-token / 12-runner synthetic fixture and
 * CRP-DOSE-FAIR-V1, without inventing car-only outcomes or new financial inputs.
 */
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {getTripleRaceFixture} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {getContinuousFixturePrice,MINUTES_PER_DAY} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking,positionAt} from '../race-lab/source/src/data/officialRace.js';
import {tripleLiveSlot} from '../visual-lab/tripleLiveSchedule.js';

export const CAR_TRACKS=Object.freeze([
  Object.freeze({id:'muybridge',name:'Circuito Vector',subtitle:'Gran Premio de velocidad',layout:'speed',accent:'#ffb547'}),
  Object.freeze({id:'genesis',name:'Circuito Delta',subtitle:'Gran Premio de curvas',layout:'technical',accent:'#26ddd0'}),
  Object.freeze({id:'vint-cerf',name:'Circuito Neón',subtitle:'Gran Premio nocturno',layout:'street',accent:'#ac88ff'})
]);
export const CAR_ROSTER=TOKEN_ROSTER.map((token,index)=>Object.freeze({
  symbol:token.symbol,name:token.name,color:token.color,tier:token.tier,
  number:index+1, liveryId:'CRP-'+String(index+1).padStart(3,'0')
}));
export const CAR_RACE_SECONDS=60;
export const CAR_SLOT_SECONDS=180;
export const CAR_WEEK_DAYS=7;
export const CAR_RACES_PER_DAY=1440;
export const CAR_RACES_PER_TRACK=480;
/**
 * Qualifying is based ONLY on the previous three minutes of the synthetic tape.
 * It chooses the starting grid, never the finishing order or official race score.
 */
export const QUALIFYING_LOOKBACK_MINUTES=3;
export const GRID_ROW_GAP_METERS=15;
export const GRID_COLUMN_STAGGER_METERS=5;
export const GRID_LEAD_BACK_METERS=5;
export const GRID_RELEASE_SECONDS=45;
const sigmoid=s=>Math.tanh(s);
function qualifyingGrid(fixture,dayIndex){
  const startMinute=dayIndex*MINUTES_PER_DAY+fixture.minute;
  const lookback=Math.max(0,startMinute-QUALIFYING_LOOKBACK_MINUTES);
  const rows=fixture.entries.map(entry=>{
    const previous=getContinuousFixturePrice(entry.symbol,lookback);
    const atStart=entry.priceAtStart;
    if(!(previous>0)||!(atStart>0))throw new Error('Missing valid qualifying candle for '+entry.symbol);
    const qualifyingPct=100*(atStart/previous-1);
    return {symbol:entry.symbol,name:entry.name,color:entry.color,
      qualifyingPct,qualifyingStartMinute:lookback,
      qualifyingEndMinute:startMinute,preRacePrice:previous};
  });
  rows.sort((a,b)=>b.qualifyingPct-a.qualifyingPct||a.symbol.localeCompare(b.symbol));
  return rows.map((row,index)=>Object.freeze({
    ...row,position:index+1,row:Math.floor(index/2)+1,
    column:index%2,sideMeters:index%2===0?-6:6,
    backMeters:GRID_LEAD_BACK_METERS+
      Math.floor(index/2)*GRID_ROW_GAP_METERS+
      (index%2)*GRID_COLUMN_STAGGER_METERS
  }));
}

if(CAR_ROSTER.length!==100||new Set(CAR_ROSTER.map(c=>c.symbol)).size!==100)
  throw new Error('Autódromo requires 100 unique token liveries');

export function carTrack(id){
  return CAR_TRACKS.find(track=>track.id===id)||null;
}
export function getCarSession(trackId,date=new Date()){
  const track=carTrack(trackId);
  if(!track)throw new RangeError('Unknown car track: '+trackId);
  const clock=tripleLiveSlot(date,trackId);
  const fixture=getTripleRaceFixture(clock.minuteOfDay,clock.dayIndex);
  if(fixture.trackId!==trackId)throw new Error('Autódromo fixture/stadium mismatch');
  const profiles=createOfficialRace(fixture.entries);
  const grid=qualifyingGrid(fixture,clock.dayIndex);
  const gridBySymbol=new Map(grid.map(row=>[row.symbol,row]));
  return {track,clock,fixture,profiles,grid,gridBySymbol,
    official:officialRanking(profiles),
    key:clock.dayIndex+':'+clock.minuteOfDay+':'+trackId};
}
/**
 * Visual positioning: the grid starts behind the line in two staggered columns.
 * Its temporary offset vanishes by the 45-second second-candle phase.
 * Pack spacing is an ORDER-PRESERVING visual transform to keep 12 big cars
 * legible on track; it is NEVER consulted by the official finish result.
 */
export function positionsAt(session,seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>60)
    throw new RangeError('Car replay must be 0..60 seconds');
  const fade=Math.max(0,1-seconds/GRID_RELEASE_SECONDS);
  const raw=session.profiles.map((profile,index)=>{
    const grid=session.gridBySymbol.get(profile.entry.symbol);
    if(!grid)throw new Error('Missing qualifying grid row: '+profile.entry.symbol);
    const meters=positionAt(profile,seconds);
    return {symbol:profile.entry.symbol,name:profile.entry.name,color:profile.entry.color,
      meters,index,profile,time:profile.finishTime,
      gridPosition:grid.position,qualifyingPct:grid.qualifyingPct,
      gridRow:grid.row,gridColumn:grid.column,sideMeters:grid.sideMeters,
      gridOffsetMeters:grid.backMeters,
      trackMeters:meters-grid.backMeters*fade};
  });
  // Render the pack with a visible gap, without touching positionAt() values.
  // A smooth odd function preserves pairwise order even when two cars exchange places.
  const spreadWeight=Math.min(1,seconds/8);
  for(const row of raw){
    let extra=0;
    for(const other of raw){
      if(other===row)continue;
      extra+=3*sigmoid((row.trackMeters-other.trackMeters)/.25);
    }
    row.visualMeters=row.trackMeters+extra*spreadWeight;
  }
  return raw.sort((a,b)=>b.trackMeters-a.trackMeters||a.index-b.index);
}
export function resultsAtFinish(session){
  return session.official.map((profile,index)=>({
    place:index+1,symbol:profile.entry.symbol,name:profile.entry.name,
    color:profile.entry.color,variation1Pct:profile.input1,
    variation2Pct:profile.input2,finishTime:profile.finishTime
  }));
}
