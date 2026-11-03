import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCompletedSeason,assertSeasonSnapshot,historicalPalmares,isSeasonClosed,parseSeasonStart,seasonEnd,SEASON_CONTRACT} from '../sports/seasonArchive.js';
import {writeCompletedSeason} from '../sports/archiveWriter.mjs';
import {listClubs,normalizeFanPreferences,chooseMainClub,togglePinnedClub,clubSportsProfile} from '../sports/fanClubs.js';
import {createGrandPrixCeremonyController} from '../sports/grandPrixCeremony.js';
import {getGrandPrixAt,grandPrixResult} from '../sports/grandPrix.js';

const closedAt=new Date('2026-11-09T03:00:01Z');
test('synthetic season only closes after 7 complete Buenos Aires calendar days',()=>{
 assert.equal(isSeasonClosed('2026-11-02',new Date('2026-11-09T02:59:59Z')),false);
 assert.equal(isSeasonClosed('2026-11-02',closedAt),true);
 assert.equal(seasonEnd('2026-11-02'),'2026-11-09');
 assert.throws(()=>parseSeasonStart('2026-11-03'),RangeError);
 assert.throws(()=>parseSeasonStart('2026-02-30'),RangeError);
 assert.throws(()=>createCompletedSeason('2026-11-02',{now:new Date('2026-11-05T00:00:00Z')}),RangeError);
});
test('archive contains 28 results, 100 racers and never implies observed transmission',()=>{
 const snap=createCompletedSeason('2026-11-02',{now:closedAt});
 assert.equal(snap.contract,SEASON_CONTRACT);
 assert.equal(snap.events.length,28);
 assert.equal(new Set(snap.events.map(x=>x.id)).size,28);
 assert.equal(snap.standings.length,100);
 assert.equal(snap.standings.reduce((n,x)=>n+x.wins,0),28);
 assert.equal(snap.standings.reduce((n,x)=>n+x.trophies.length,0),28);
 assert.equal(snap.events.every(x=>x.classification.length===12),true);
 assert.equal(snap.provenance.synthetic,true);
 assert.equal(snap.provenance.transmissionObserved,false);
 assert.equal(assertSeasonSnapshot(snap),true);
 const tally=historicalPalmares([snap]);
 assert.equal(tally.reduce((n,x)=>n+x.trophies,0),28);
 assert.throws(()=>historicalPalmares([snap,snap]),/Duplicate season/);
 const tampered=structuredClone(snap);tampered.events[0].winner='UNKNOWN';
 assert.throws(()=>assertSeasonSnapshot(tampered),/differs/);
});
test('append-only writer is idempotent, hashes every file and refuses forged or future seasons',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'cryptodromo-sports-test-'));
 try{
  const first=await writeCompletedSeason({start:'2026-11-02',now:closedAt,outDir:folder});
  assert.equal(first.alreadyArchived,false);
  assert.match(first.sha256,/^[a-f0-9]{64}$/);
  const index=JSON.parse(await readFile(join(folder,'index.json'),'utf8'));
  assert.equal(index.seasons.length,1);assert.equal(index.seasons[0].sha256,first.sha256);
  const again=await writeCompletedSeason({start:'2026-11-02',now:closedAt,outDir:folder});
  assert.equal(again.alreadyArchived,true);
  assert.equal(JSON.parse(await readFile(join(folder,'index.json'),'utf8')).seasons.length,1);
  assert.rejects(writeCompletedSeason({start:'2026-11-09',now:closedAt,outDir:folder}),/Cannot archive/);
  await writeFile(join(folder,'2026-11-02.json'),'{ "fake":true }');
  await assert.rejects(writeCompletedSeason({start:'2026-11-02',now:closedAt,outDir:folder}),/changed/);
 }finally{await rm(folder,{recursive:true,force:true});}
});
test('100 fan clubs map exactly to roster with bounded local preferences',()=>{
 const clubs=listClubs();
 assert.equal(clubs.length,100);
 assert.equal(new Set(clubs.map(x=>x.symbol)).size,100);
 const raw=normalizeFanPreferences({mainClub:'BTC',pinned:['ETH','BAD','ETH','SOL','XMR','ADA','DOGE','DOGE','LTC']});
 assert.equal(raw.mainClub,'BTC');assert.deepEqual(raw.pinned,['ETH','SOL','XMR','ADA','DOGE']);
 assert.equal(chooseMainClub(raw,'ETH').mainClub,'ETH');
 assert.throws(()=>chooseMainClub(raw,'unknown'),RangeError);
 assert.throws(()=>togglePinnedClub(raw,'BTC'),RangeError);
 const clear=chooseMainClub(raw,null);assert.equal(clear.mainClub,null);
 const btc=clubSportsProfile('BTC',3359);
 assert.equal(btc.club.symbol,'BTC');assert.ok(btc.sporting.starts>=0);
 assert.equal(btc.provenance.memberCount,null);
 assert.equal(btc.provenance.observedTransmission,false);
});
test('LIVE podium fails closed until all 12 horses cross and finish orchestrator reveals',()=>{
 const ceremony=createGrandPrixCeremonyController();
 assert.equal(ceremony.reset({dayIndex:0,slotIndex:0}),null);
 assert.equal(ceremony.authorize({crossedCount:12,revealed:true,lastCrossAt:65}),null);
 const gp=ceremony.reset({dayIndex:0,slotIndex:119});assert.ok(gp);
 assert.equal(ceremony.authorize({crossedCount:12,revealed:false,lastCrossAt:63}),null);
 assert.equal(ceremony.authorize({crossedCount:11,revealed:true,lastCrossAt:63}),null);
 assert.equal(ceremony.authorize({crossedCount:12,revealed:true,lastCrossAt:59}),null);
 assert.equal(ceremony.isRevealed,false);
 const result=ceremony.authorize({crossedCount:12,revealed:true,lastCrossAt:65});
 assert.equal(result.winner,grandPrixResult(getGrandPrixAt(0,119)).winner);
 assert.equal(result.podium.length,3);
 assert.equal(result.provenance.synthetic,true);
 assert.equal(ceremony.authorize({crossedCount:12,revealed:true,lastCrossAt:67}),null);
 ceremony.reset({dayIndex:0,slotIndex:120});assert.equal(ceremony.snapshot,null);
});
test('LIVE integration adds only a gated presentation hook and pages are separate',()=>{
 const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 const module=readFileSync(new URL('../sports/grandPrixCeremony.js',import.meta.url),'utf8');
 assert.match(scene,/mountGrandPrixCeremony/);
 assert.match(scene,/grandPrixCeremony\.show\(finishController\.state\)/);
 assert.match(scene,/grandPrixCeremony\.reset\(\{dayIndex:race\.day-1,slotIndex:race\.number-1\}\)/);
 assert.match(scene,/if\(gate\.showOfficialResult\)showOfficialResult\(\)/);
 assert.match(module,/crossedCount!==12/);
 for(const path of ['../clubes/index.html','../temporadas/index.html']){
  const html=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.match(html,/crp-global-nav/);
  assert.match(html,/sintétic|synthetic/i);
 }
 const community=readFileSync(new URL('../comunidad/index.html',import.meta.url),'utf8');
 assert.match(community,/href="\/clubes\/"/);
});
