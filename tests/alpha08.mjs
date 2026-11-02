import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {liveSlot,formatCountdown,SLOT_SECONDS} from '../visual-lab/liveSchedule.js';
import {trackPoint,COURSE_LENGTH,COURSE_MODES} from '../visual-lab/trackMath.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('LIVE: 480 races per local day, 3 min slots, UTC−3, seven-day calendar rotation',()=>{
 const a=liveSlot(new Date('2026-11-02T17:00:00Z'));
 assert.equal(a.slot,280);
 assert.equal(a.dayIndex,0);
 assert.equal(a.index,280);
 assert.equal(a.label,'14:00');
 assert.equal(a.slotSeconds,0);
 assert.equal(a.secondsToNext,SLOT_SECONDS);
 assert.equal(a.next.index,281);
 assert.equal(a.previous.index,279);
 const atNight=liveSlot(new Date('2026-11-03T02:59:59Z'));
 assert.equal(atNight.slot,479);
 assert.equal(atNight.next.index,480);
 assert.equal(atNight.next.label,'00:00');
 const nextDay=liveSlot(new Date('2026-11-03T03:00:00Z'));
 assert.equal(nextDay.dayIndex,1);
 assert.equal(nextDay.index,480);
 assert.equal(nextDay.previous.index,479);
 const afterWeek=liveSlot(new Date('2026-11-09T17:00:00Z'));
 assert.equal(afterWeek.index,280);
 assert.equal(formatCountdown(61),'01:01');
});
test('three physical layouts progress without freezing, preserve forward facing tangent',()=>{
 assert.equal(COURSE_LENGTH,640);
 assert.deepEqual(COURSE_MODES,['straight','s-bend','oval']);
 for(const mode of COURSE_MODES){
  let previous;
  for(let p=0;p<=1.005;p+=.005){
   const point=trackPoint(mode,p);
   assert.ok([point.x,point.z,point.heading,point.tangentX,point.tangentZ].every(Number.isFinite));
   assert.ok(Math.abs(Math.hypot(point.tangentX,point.tangentZ)-1)<1e-9);
   if(previous&&p<1.001)assert.ok(Math.hypot(point.x-previous.x,point.z-previous.z)>.1);
   previous=point;
  }
 }
 for(const p of [.15,.4,.85]){
  const front=trackPoint('oval',p,0),outer=trackPoint('oval',p,11);
  assert.ok(Math.hypot(outer.x-front.x,outer.z-front.z)>17);
 }
});
test('procedural fur, normals, original token tattoo and audio work without added polygon count',()=>{
 const h=read('race-lab/source/src/horseSurface.js');
 assert.match(h,/triangleCountAdded:0/);
 assert.match(h,/normal\.setXYZ/);
 const shader=read('race-lab/source/src/horseLivery.js');
 assert.match(shader,/furPigment/);
 assert.match(shader,/furFine/);
 assert.match(shader,/roughnessFactor/);
 assert.match(shader,/normal=normalize\(normal/);
 assert.match(shader,/cryptoFurLogo/);
 const horse=read('race-lab/source/src/horse.js');
 assert.match(horse,/smoothHorseNormals\(gltf\.scene/);
 const audio=read('visual-lab/raceAudio.js');
 assert.match(audio,/setVolume/);
 assert.match(audio,/surface==='grass'/);
 assert.match(audio,/cycles\*4/);
 const scene=read('visual-lab/scene.js');
 assert.match(scene,/activateBroadcastAudio\(\)/);
 assert.match(scene,/createAlternativeTracks/);
 assert.match(scene,/liveFollowing/);
 assert.match(scene,/SINTONIZAR LIVE/);
 assert.match(scene,/VISUAL_START_X=-320,VISUAL_FINISH_X=320/);
 assert.match(scene,/for\(let x=-336;x<=336;x\+=8\)box/);
});
