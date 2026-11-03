import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reframeCamera,droneOrbitView,countdownVisibility,CAMERA_PARAMETERS,clampCameraSetting} from '../visual-lab/cameraRig.js';
import {createDroneRig,DRONE_MODES} from '../parade/drone.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const metric=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const finite=p=>Object.values(p).every(Number.isFinite);
test('six LIVE camera axes have truly independent effects',()=>{
 const eye={x:60,y:22,z:110},focus={x:0,y:2,z:5};
 const initial=reframeCamera(eye,focus),yaw=reframeCamera(eye,focus,{yaw:60}),
   pitch=reframeCamera(eye,focus,{pitch:18}),height=reframeCamera(eye,focus,{height:25}),
   close=reframeCamera(eye,focus,{distance:45}),
   lateral=reframeCamera(eye,focus,{lateral:20});
 assert.ok(metric(yaw.position,initial.position)>20);
 assert.ok(pitch.position.y>initial.position.y+15);
 assert.equal(height.position.y-initial.position.y,25);
 assert.ok(close.actualDistance<initial.actualDistance*.46);
 assert.ok(Math.abs((lateral.position.x-lateral.focus.x)-(initial.position.x-initial.focus.x))<1e-10);
 assert.ok(metric(lateral.focus,initial.focus)>19);
 assert.deepEqual(CAMERA_PARAMETERS.fov,{min:18,max:90,step:1,unit:'°'});
 assert.equal(clampCameraSetting('pitch',90),75);
 assert.equal(clampCameraSetting('distance',-5),30);
 assert.throws(()=>clampCameraSetting('roll',5),RangeError);
});
test('degenerate orbit, extreme pitch, FOV and oversized distances remain finite',()=>{
 for(const yaw of [-180,0,180])for(const pitch of [-150,0,150]){
  const frame=reframeCamera({x:0,y:0,z:0},{x:0,y:0,z:0},
    {yaw,pitch,height:-500,distance:1,lateral:Infinity});
  assert.ok(finite(frame.position)&&finite(frame.focus));
  assert.ok(frame.position.y>=1.3);
 }
});
test('Parade drone orbit, follow and crane respect actual independent height / lens / pan',()=>{
 assert.deepEqual(DRONE_MODES,['free','orbit','follow','crane']);
 const view=droneOrbitView({x:0,y:2,z:0},{yaw:0,pitch:-.5,distance:80,height:95});
 const higher=droneOrbitView({x:0,y:2,z:0},{yaw:0,pitch:-.5,distance:80,height:140});
 assert.equal(higher.position.y-view.position.y,45);
 const tilt=droneOrbitView({x:0,y:2,z:0},{yaw:0,pitch:-1,distance:80,height:95});
 assert.ok(tilt.position.y>view.position.y+25);
 const drone=createDroneRig({yaw:0,pitch:-.5,y:95,distance:120,fov:45});
 drone.setMode('orbit');
 const initial=drone.view({x:40,y:2,z:90});
 drone.setPose({y:135});const afterHeight=drone.view({x:40,y:2,z:90});
 assert.ok(Math.abs(afterHeight.position.y-initial.position.y-40)<1e-9);
 drone.setPose({lateral:17});
 const afterPan=drone.view({x:40,y:2,z:90});
 assert.ok(metric(afterPan.lookAt,afterHeight.lookAt)>16);
 drone.zoom(12);assert.equal(drone.view({x:40,y:2,z:90}).fov,57);
 assert.deepEqual(drone.view({x:40,y:2,z:90}).position,afterPan.position,'Optical zoom must not physically move drone');
 drone.dolly(30);
 assert.ok(metric(drone.view({x:40,y:2,z:90}).position,afterPan.position)>20);
 drone.setMode('follow');
 assert.equal(drone.view({x:10,y:2,z:20}).mode,'follow');
 drone.setMode('crane');
 assert.equal(drone.view({x:10,y:2,z:20}).mode,'crane');
 drone.setMode('free');
 const prev=drone.view();drone.dolly(15);
 assert.ok(metric(prev.position,drone.view().position)>12);
});
test('only one on-stage countdown visible per LIVE phase, without changing broadcast clock',()=>{
 assert.deepEqual(countdownVisibility('presentation'),{dial:false,presentation:true});
 assert.deepEqual(countdownVisibility('race'),{dial:true,presentation:false});
 assert.deepEqual(countdownVisibility('results'),{dial:true,presentation:false});
 assert.deepEqual(countdownVisibility('presentation',true),{dial:true,presentation:false});
 const scene=read('visual-lab/scene.js');
 const presenter=scene.slice(scene.indexOf('function showPresentation'),scene.indexOf('function buildPresentRoster'));
 assert.match(presenter,/stage\.classList\.add\('is-presenting'\)/);
 assert.doesNotMatch(presenter,/clockEl\.textContent/);
 assert.match(scene,/countdownVisibility\(/);
 for(const path of ['index.html','visual-lab/index.html']){
  const html=read(path);
  assert.match(html,/\.stage\.is-presenting \.dial\{display:none!important\}/);
  assert.equal((html.match(/id="present-countdown"/g)||[]).length,1);
  assert.equal((html.match(/id="clock"/g)||[]).length,1);
  assert.match(html,/id="tab-camera"/);
  assert.match(html,/id="panel-camera"/);
  for(const id of ['camera','camera-angle','camera-pitch','camera-height','camera-distance','camera-zoom','camera-lateral']){
   assert.ok(html.includes('id="'+id+'"'),path+' missing '+id);
  }
 }
});
test('Parade and LIVE share real camera console component and leave scores untouched',()=>{
 const live=read('visual-lab/scene.js'),parade=read('parade/parade.js');
 const ui=read('parade/index.html'),bindings=read('visual-lab/cameraPanel.js');
 assert.match(live,/bindCameraPanel/);assert.match(parade,/bindCameraPanel/);
 assert.match(live,/reframeCamera/);
 assert.match(parade,/cameraPanel\.sync/);
 assert.match(bindings,/data-camera-field/);
 for(const id of ['yaw','pitch','height','distance','fov','lateral','camera-speed','camera-mode','sight','follow-horse'])
  assert.ok(ui.includes('id="'+id+'"'),'Parade missing '+id);
 assert.match(ui,/assets\/camera-console\.css/);
 assert.match(read('index.html'),/assets\/camera-console\.css/);
 assert.doesNotMatch(read('visual-lab/cameraRig.js'),/createOfficialRace|officialRanking|PRICE_FIXTURE|RACES_PER_DAY/);
});
