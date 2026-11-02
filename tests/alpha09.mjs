import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {broadcastPhase,PHASES,allRunnersCrossed,finishReveal,runnerPresentationIndex} from '../visual-lab/broadcastTimeline.js';
import {COURSE_LENGTH,trackPoint} from '../visual-lab/trackMath.js';
import {broadcastRunoutDistance} from '../visual-lab/raceBroadcast.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {buildBroadcastProfiles,broadcastSpeed} from '../visual-lab/raceChoreography.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('broadcast clock: 60s racing, 60s official results, 60s lineup and 12 five-second cards',()=>{
 assert.equal(broadcastPhase(0).phase,PHASES.RACE);
 assert.equal(broadcastPhase(59.99).phase,PHASES.RACE);
 assert.equal(broadcastPhase(60).phase,PHASES.RESULTS);
 assert.equal(broadcastPhase(119.999).phase,PHASES.RESULTS);
 assert.equal(broadcastPhase(120).phase,PHASES.PRESENTATION);
 assert.equal(broadcastPhase(179.5).phase,PHASES.PRESENTATION);
 assert.equal(broadcastPhase(124).runnerIndex,0);
 assert.equal(broadcastPhase(125).runnerIndex,1);
 assert.equal(broadcastPhase(179.99).runnerIndex,11);
 assert.equal(runnerPresentationIndex(60),11);
 assert.equal(finishReveal({allCrossed:false,elapsed:74,firstCrossAt:60}),false);
 assert.equal(finishReveal({allCrossed:true,elapsed:62,firstCrossAt:61}),false);
 assert.equal(finishReveal({allCrossed:true,elapsed:63,firstCrossAt:61}),true);
});
test('all 3360 synthetic races: official winner unchanged; all 12 clear stripe by cinematic t=13s',()=>{
 let checked=0;
 for(let d=0;d<7;d++)for(let r=0;r<480;r++){
  const official=createOfficialRace(getRaceFixture(r,d).entries);
  const profiles=buildBroadcastProfiles(official);
  const order=officialRanking(official);
  const finish=order[0].distanceAt60;
  const at60=profiles.map(p=>p.distanceAt60);
  const after=profiles.map(p=>broadcastRunoutDistance({...p,exitVelocity:broadcastSpeed(p,59.99)},finish,13));
  assert.ok(after.every((distance,i)=>distance>=at60[i]),'No one may run backwards');
  assert.equal(allRunnersCrossed(profiles,after,finish),true,'last runner did not cross: '+d+'/'+r);
  assert.equal(officialRanking(official)[0].entry.symbol,order[0].entry.symbol);
  checked++;
 }
 assert.equal(checked,3360);
});
test('track, surface, weather and identity use shared instanced graphics and 128px token marks',()=>{
 assert.equal(COURSE_LENGTH,780);
 for(const mode of ['straight','s-bend','oval']){
  const p=trackPoint(mode,.75,6),q=trackPoint(mode,.756,6);
  assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>1);
 }
 const ground=source('visual-lab/trackSurface.js');
 assert.match(ground,/Math\.hypot\(x-prev\.x,z-prev\.z\)/);
 assert.match(ground,/InstancedMesh/);
 assert.match(ground,/wetness=Math\.max\(0/);
 assert.match(ground,/setLayout/);
 const shader=source('race-lab/source/src/horseLivery.js');
 assert.match(shader,/fract\(furUV\*vec2\(3\.,2\.\)\)/);
 assert.match(shader,/canvas\.width=canvas\.height=128/);
 const scene=source('visual-lab/scene.js');
 assert.match(scene,/VISUAL_START_X=-390,VISUAL_FINISH_X=390/);
 assert.match(scene,/lastCrossedAt/);
 assert.match(scene,/finishReveal/);
 assert.match(scene,/lastLiveIndex=-1;lastPhase='';updateLiveProgram/);
 assert.match(scene,/earth\.roughness=Math\.max/);
 assert.match(scene,/model\.setWetness/);
 const html=source('visual-lab/index.html');
 assert.match(html,/PRESENTACIÓN DE CORREDORES/);
 assert.match(html,/present-roster/);
 assert.match(html,/LIVE AUTOMÁTICO/);
});
