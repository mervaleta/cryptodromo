/**
 * Cryptódromo: non-invasive split timing and championship scoring.
 * Accepts createOfficialRace() profiles; never changes the race result.
 * The historical CRP scoring lives in the legacy preset (200, 400, 600, 800m).
 */
export const FINISH_POINTS = Object.freeze([25,18,15,12,10,8,6,4,2,1,0,0]);
export const SPLIT_PRESETS = Object.freeze({
  legacy: Object.freeze({meters:Object.freeze([200,400,600,800]),bonusMeters:Object.freeze([200,400,600,800]),label:'4 parciales históricos'}),
  quarters: Object.freeze({meters:Object.freeze([250,500,750,1000]),bonusMeters:Object.freeze([250,500,750]),label:'4 cuartos de pista'}),
});
export const SPLITS_METHOD = 'CRP-TRACK-SPLITS-V1';
const numeric = value => typeof value==='number' && Number.isFinite(value);
const byTime = (a,b) => (a.seconds??Infinity)-(b.seconds??Infinity) || a.index-b.index;

/** The current engine integrates twelve 5-second segments over 0..60 s. */
export function timeAtMark(profile,meters) {
  if(!numeric(meters)||meters<=0||meters>1000)throw new RangeError('Mark must be in (0, 1000] meters');
  // The official engine owns the 1000m finish time. Never re-rank its result.
  if(meters===1000) return profile.finishTime;
  // Use the same movement samples that drive the current 3D broadcast.
  // Official finish times remain immutable and independent of visuals.
  const values=profile.broadcastDistance??profile.cumulative;
  if(!Array.isArray(values)||values.length!==13||values.some(x=>!numeric(x)) || values.some((x,i)=>i&&x<values[i-1])){
    throw new Error('Expected thirteen monotonically increasing cumulative-distance samples');
  }
  for(let i=1;i<values.length;i++){
    if(values[i]<meters)continue;
    const traveled=values[i]-values[i-1];
    if(traveled===0)return (i-1)*5;
    return (i-1)*5+5*(meters-values[i-1])/traveled;
  }
  return null; // runner has not yet reached this checkpoint at t=60 s
}

/** Scoring matches the historic CRP archive: finish points + 1 per fastest split. */
export function buildTrackSplits(profiles,{mode='legacy'}={}) {
  const preset=SPLIT_PRESETS[mode];
  if(!preset)throw new Error('Unknown split mode: '+mode);
  if(!Array.isArray(profiles)||profiles.length!==12)throw new Error('Expected 12 official race profiles');
  const rows=profiles.map((profile,index)=>{
    if(!profile||!profile.entry||typeof profile.entry.symbol!=='string'||!numeric(profile.finishTime)||profile.finishTime<=0)
      throw new Error('Invalid official profile at '+index);
    return {profile,index:Number.isInteger(profile.index)?profile.index:index, symbol:profile.entry.symbol,name:profile.entry.name||profile.entry.symbol,color:profile.entry.color||'#ffffff'};
  });
  if(new Set(rows.map(r=>r.symbol)).size!==12)throw new Error('Each runner must have a unique symbol');
  const finish=[...rows].sort((a,b)=>a.profile.finishTime-b.profile.finishTime||a.index-b.index);
  const splitScores=new Map(rows.map(row=>[row.symbol,0]));
  const wins=new Map(rows.map(row=>[row.symbol,[]]));
  const splits=preset.meters.map((meters,splitIndex)=>{
    const previous=splitIndex===0?0:preset.meters[splitIndex-1];
    const checkpoint=rows.map(row=>{
      const seconds=timeAtMark(row.profile,meters);
      const prior=previous?timeAtMark(row.profile,previous):0;
      return {symbol:row.symbol,name:row.name,color:row.color,index:row.index,meters,
        seconds,sectorSeconds:seconds===null||prior===null?null:seconds-prior};
    }).sort(byTime).map((row,i)=>({...row,place:row.seconds===null?null:i+1}));
    const leader=checkpoint.find(r=>r.seconds!==null)||null;
    const bonus=preset.bonusMeters.includes(meters)?1:0;
    if(leader&&bonus){splitScores.set(leader.symbol,splitScores.get(leader.symbol)+bonus);wins.get(leader.symbol).push(meters);}
    return {number:splitIndex+1,meters,previousMeters:previous,bonus,record:leader?.symbol??null,
      recordSeconds:leader?.seconds??null,ranking:checkpoint};
  });
  const results=finish.map((row,index)=>({
    symbol:row.symbol,name:row.name,color:row.color,position:index+1,
    finishSeconds:row.profile.finishTime,finishPoints:FINISH_POINTS[index],
    bonusPoints:splitScores.get(row.symbol),splitWins:[...wins.get(row.symbol)],
    totalPoints:FINISH_POINTS[index]+splitScores.get(row.symbol),
    splits:splits.map(s=>s.ranking.find(r=>r.symbol===row.symbol)),
  }));
  return {method:SPLITS_METHOD,mode,modeLabel:preset.label,distanceMeters:1000,
    scoring:'Historical finishing scale + 1 for first across each bonus checkpoint',
    splits,results,finishWinner:results[0].symbol};
}

/** Safe for race broadcasts: never disclose a future crossing or finish result. */
export function splitSnapshot(scored,elapsedSeconds,{finishAuthorized=false}={}) {
  if(!scored||!Array.isArray(scored.splits))throw new TypeError('Expected buildTrackSplits output');
  const elapsed=Math.max(0,numeric(elapsedSeconds)?elapsedSeconds:0);
  const revealFinish=finishAuthorized&&elapsed>=60;
  const checkpoints=scored.splits.map(split=>{
    if(split.meters===1000&&!revealFinish)return {...split,record:null,recordSeconds:null,ranking:[],visible:false,complete:false};
    // After the controller authorizes the finish, reveal ALL official finish positions.
    // A few official finish times may exceed the 60-second data window.
    const ranking=split.meters===1000&&revealFinish
      ? split.ranking.filter(row=>row.seconds!==null)
      : split.ranking.filter(row=>row.seconds!==null&&row.seconds<=elapsed);
    return {...split,ranking,record:ranking[0]?.symbol??null,
      recordSeconds:ranking[0]?.seconds??null,visible:ranking.length>0,
      complete:ranking.length===12};
  });
  const standings=scored.results.map(row=>{
    const bonusPoints=checkpoints.reduce((sum,split)=>sum+Number(split.bonus>0&&split.record===row.symbol),0);
    return {symbol:row.symbol,name:row.name,color:row.color,bonusPoints,
      finishPoints:revealFinish?row.finishPoints:null,
      totalPoints:revealFinish?row.finishPoints+bonusPoints:null,
      position:revealFinish?row.position:null};
  }).sort((a,b)=>revealFinish?a.position-b.position:b.bonusPoints-a.bonusPoints||a.symbol.localeCompare(b.symbol));
  return {mode:scored.mode,elapsedSeconds:elapsed,finishVisible:revealFinish,
    checkpoints,standings,winner:revealFinish?scored.finishWinner:null};
}

/** Sum only completed races to avoid leaking future/scheduled results. */
export function aggregateSplitChampionship(completedRaceScores) {
  const map=new Map();
  for(const race of completedRaceScores){
    if(!race||!Array.isArray(race.results)||race.results.length!==12)throw new Error('Expected completed race score');
    for(const runner of race.results){
      let row=map.get(runner.symbol);
      if(!row){row={symbol:runner.symbol,name:runner.name,color:runner.color,starts:0,wins:0,podiums:0,
        finishPoints:0,bonusPoints:0,totalPoints:0,splitWins:0};map.set(runner.symbol,row);}
      row.starts++;row.wins+=Number(runner.position===1);row.podiums+=Number(runner.position<=3);
      row.finishPoints+=runner.finishPoints;row.bonusPoints+=runner.bonusPoints;
      row.totalPoints+=runner.totalPoints;row.splitWins+=runner.splitWins.length;
    }
  }
  return [...map.values()].sort((a,b)=>b.totalPoints-a.totalPoints||b.wins-a.wins||a.symbol.localeCompare(b.symbol))
    .map((row,i)=>({...row,rank:i+1}));
}
