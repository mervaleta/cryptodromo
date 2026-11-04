#!/usr/bin/env node
/**
 * Satoshi seven-day independent sports digest.
 * Dry-run audit, not live prices, bets or a feed. No writes to fixture source.
 *
 * node scripts/audit-satoshi-week.mjs --summary
 * node scripts/audit-satoshi-week.mjs --csv > satoshi-week-results.csv
 */
import {createHash} from 'node:crypto';
import {getTripleRaceFixture,TRIPLE_RACES_PER_DAY,TRACKS} from '../race-lab/source/src/data/tripleRaceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {FIXTURE_DAYS,PRICE_FIXTURE} from '../race-lab/source/src/data/raceFixture.js';

const csv=process.argv.includes('--csv'),summary=process.argv.includes('--summary');
if(!csv&&!summary)throw Error('Choose --csv or --summary');
const digest=createHash('sha256');
const counts=Object.fromEntries(TRACKS.map(t=>[t.id,{races:0,participants:0,winners:{}}]));
const totals={races:0,participants:0,invalid:0};
if(csv)process.stdout.write('day,track,track_race,venue_race,local_start,winner,podium,participants,source_version\n');
for(let day=0;day<FIXTURE_DAYS;day++){
 for(let minute=0;minute<TRIPLE_RACES_PER_DAY;minute++){
  const race=getTripleRaceFixture(minute,day);
  const finish=officialRanking(createOfficialRace(race.entries));
  const winner=finish[0]?.entry.symbol;
  if(finish.length!==12||!winner||!Number.isFinite(finish[0].finishTime)){
   totals.invalid++;continue;
  }
  const current=counts[race.trackId];
  current.races++;current.participants+=12;
  current.winners[winner]=(current.winners[winner]||0)+1;
  const row=[
   day+1,race.trackId,race.trackRaceNumber,race.venueRaceNumber,
   race.time+':30',winner,finish.slice(0,3).map(x=>x.entry.symbol).join('/'),
   race.entries.map(x=>x.symbol).join('/'),PRICE_FIXTURE.version
  ];
  const serialized=row.join(',');
  digest.update(serialized+'\n');
  if(csv)process.stdout.write(serialized+'\n');
  totals.races++;totals.participants+=12;
 }
}
if(summary){
 process.stdout.write(JSON.stringify({
  title:'Cryptodromo Satoshi Nakamoto | seven-day deterministic simulated fixture',
  version:'satoshi-synthetic-week-v2-continuous',
  source:PRICE_FIXTURE.version,
  notice:'DEMO synthetic prices. Outcomes known in advance. Never suitable for real-money bets.',
  days:FIXTURE_DAYS,tracks:TRACKS.map(t=>t.id),counts,
  total:totals,manifestSha256:digest.digest('hex')
 },null,2)+'\n');
}
if(totals.invalid!==0||totals.races!==10080||totals.participants!==120960)process.exitCode=1;
