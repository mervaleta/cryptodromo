import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {trackPoint} from '../visual-lab/trackMath.js';
import {PARADE_WAVE_CAP,PARADE_WAVES,WAVES,
 buildParadeWaves,paradeLapLength,wavePose,waveDuration,createParadeController} from '../parade/march.js';
import {DRONE_BOUNDS,DRONE_MODES,createDroneRig,droneInputs} from '../parade/drone.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('all 100 named horses parade exactly once per 9 groups, maximum 12 rigs loaded',()=>{
 assert.equal(TOKEN_ROSTER.length,100);
 assert.equal(PARADE_WAVES,9);
 assert.equal(WAVES.length,9);
 const names=WAVES.flatMap(w=>w.runners.map(r=>r.symbol));
 assert.equal(names.length,100);
 assert.equal(new Set(names).size,100);
 assert.deepEqual([...names].sort(),TOKEN_ROSTER.map(r=>r.symbol).sort());
 assert.ok(WAVES.every(w=>w.runners.length>0&&w.runners.length<=PARADE_WAVE_CAP));
 assert.equal(WAVES.filter(w=>w.runners.some(r=>r.tier==='star')).length,8);
 assert.deepEqual(WAVES,buildParadeWaves(TOKEN_ROSTER));
});
test('all walkers complete one full, smooth oval lap before cohort rotation',()=>{
 for(const wave of WAVES){
  const duration=waveDuration(wave),before=wavePose(wave,duration-.001);
  const after=wavePose(wave,duration+.001);
  assert.ok(before.length<=12&&before.length>0);
  assert.ok(duration>300,'walking pace too fast');
  assert.ok(before.every(h=>h.lapCompletion<=1));
  assert.ok(after.every(h=>h.completed),'no group transition with an unfinished horse');
  for(let i=0;i<before.length;i++){
   const a=trackPoint('oval',before[i].progress,before[i].lane),
    b=trackPoint('oval',after[i].progress,after[i].lane);
   assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.09,'track seam / wrap teleport for '+before[i].runner.symbol);
   assert.ok(after[i].metersTraveled>0);
  }
 }
});
test('parade controller advances and is independent of official race score / wall clock',()=>{
 const parade=createParadeController();
 assert.equal(parade.snapshot().waveIndex,0);
 parade.setTimeScale(6);
 assert.equal(parade.snapshot().timeScale,6);
 for(let i=0;i<180;i++)parade.update(2);
 assert.ok(parade.snapshot().waveIndex>=1,'no cohort advances after accelerated time');
 const next=parade.nextWave();
 assert.equal(next.elapsed,0);
 const before=parade.snapshot();
 parade.setPaused(true);parade.update(2);
 assert.equal(parade.snapshot().elapsed,before.elapsed);
 parade.setPaused(false);
 assert.throws(()=>parade.jumpTo(9),RangeError);
 assert.throws(()=>createParadeController({roster:[]}),/nonempty/);
});
test('manual drone: arrows, WASD, orbit, follow, altitude, yaw and FOV have independent constraints',()=>{
 const drone=createDroneRig({x:0,y:90,z:150,yaw:0,pitch:-.4,fov:48,speed:30});
 const input=droneInputs(new Set(['ArrowUp','ArrowRight','KeyR','KeyE','ShiftLeft']));
 assert.deepEqual(input,{forward:1,strafe:1,rise:1,turn:1,tilt:0,boost:true});
 const before=drone.snapshot(),after=drone.update(.2,input);
 assert.ok(after.x>before.x&&after.z<before.z&&after.y>before.y);
 assert.ok(after.yaw>before.yaw);
 const position=drone.view().position;drone.zoom(15);
 assert.equal(drone.view().fov,63);
 assert.deepEqual(drone.view().position,position,'zoom may not change position');
 drone.setPose({x:9999,y:-100,z:-9999,pitch:100,fov:500});
 const clipped=drone.snapshot();
 assert.equal(clipped.x,DRONE_BOUNDS.x[1]);
 assert.equal(clipped.y,DRONE_BOUNDS.y[0]);
 assert.equal(clipped.z,DRONE_BOUNDS.z[0]);
 assert.ok(clipped.pitch<=.42&&clipped.fov<=89);
 drone.setMode('orbit');
 const orbit=drone.view({x:10,y:2,z:20});
 assert.equal(orbit.mode,'orbit');
 assert.deepEqual(orbit.lookAt,{x:10,y:2,z:20});
 drone.setMode('follow');
 drone.update(.2,{}, {x:50,y:1,z:20});
 assert.deepEqual(drone.view({x:50,y:1,z:20}).lookAt,{x:50,y:1,z:20});
 assert.throws(()=>drone.setMode('third-person'),RangeError);
 assert.deepEqual(DRONE_MODES,['free','orbit','follow']);
});
test('Parade is isolated from finance, scene has real horse walk and accessible sightseeing controls',()=>{
 const module=read('parade/parade.js');
 const html=read('parade/index.html');
 const props=read('parade/scenery.js');
 for(const id of ['camera-mode','yaw','pitch','height','fov','camera-speed','distance',
   'wave','pause','next-wave','weather','quality','daytime','daytime-auto','lights',
   'sight','follow-horse','parade-canvas','fps']){
  assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 }
 assert.match(html,/parade\.js\?v=alpha16-1/);
 assert.match(module,/createHorse/);
 assert.match(module,/pickClip/);
 assert.match(module,/\bWalk\b/);
 assert.match(module,/requestAnimationFrame/);
 assert.match(props,/standCenters=\[-210,-5,207\]/);
 assert.match(props,/const labels=\['HAMBURGUESAS'/);
 assert.match(props,/Mantenimiento/);
 assert.match(props,/lampLocations/);
 assert.match(props,/PointLight/);
 assert.doesNotMatch(module,/createOfficialRace|createFinishOrchestrator|betting|wallet|marketPrice/);
 assert.doesNotMatch(read('parade/march.js'),/officialRanking|broadcastPhase|liveSlot/);
});
