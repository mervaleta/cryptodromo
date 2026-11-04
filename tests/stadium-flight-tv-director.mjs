import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {travelEase,isTravelClick,clampTravelPoint} from '../estadio/flightControls.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('flight camera travels with bounded eased interpolation, not instant teleport',()=>{
 assert.equal(travelEase(0),0);assert.equal(travelEase(.5),.5);assert.equal(travelEase(1),1);
 assert.equal(travelEase(-5),0);assert.equal(travelEase(20),1);
 assert.ok(travelEase(.1)<.1&&travelEase(.9)>.9);
 assert.ok(isTravelClick({x:10,y:10},{x:14,y:12}));
 assert.equal(isTravelClick({x:10,y:10},{x:150,y:12}),false);
 assert.deepEqual(clampTravelPoint(2000,-2000),{x:590,z:-590});
});
test('stadium explorer provides real quick-access icons, raycast travel and keyboard movement',()=>{
 const html=read('estadio/index.html'),js=read('estadio/flightControls.js');
 const explorer=read('estadio/estadio.js');
 assert.ok(html.includes('id="stadiumFlightDeck"'));
 for(const target of ['aerial','grandstand','entrance','paddock','side','muybridge','genesis','vint-cerf'])
  assert.ok(html.includes('data-flight-view="'+target+'"'),target);
 for(const action of ['click','orbit','forward','back','left','right','up','down','home','help'])
  assert.ok(html.includes('data-flight-action="'+action+'"'),action);
 assert.match(html,/data-flight-speed/);
 assert.equal((html.match(/href="\/stadiums\/crypto\/live\/\?track=/g)||[]).length,3);
 assert.match(js,/raycaster\.ray\.intersectPlane\(plane,hit\)/);
 assert.match(js,/travelTo\(point\)/);
 assert.match(js,/camera\.position\.copy\(startEye\)\.lerp\(endEye,t\)/);
 assert.match(js,/controls\.target\.copy\(startTarget\)\.lerp\(endTarget,t\)/);
 assert.match(js,/KeyW:'forward'/);
 assert.match(js,/KeyQ:'down'/);
 assert.match(explorer,/flight\.update\(dt\)/);
 assert.match(explorer,/flight\.state/);
 assert.match(explorer,/flight\.dispose\(\)/);
 assert.doesNotMatch(js,/getTripleRaceFixture|createOfficialRace|PRICE_FIXTURE|finishTime/);
});
test('TV player uses one iframe with 3 immediate channel buttons and 12 camera icons',()=>{
 const html=read('stadiums/crypto/live/index.html'),controller=read('assets/crypto-venue.js');
 const css=read('assets/satoshi-tv.css');
 assert.equal((html.match(/<iframe\b/g)||[]).length,1);
 assert.equal((html.match(/data-tv-switch="/g)||[]).length,3);
 assert.equal((html.match(/data-tv-shot="/g)||[]).length,12);
 assert.ok(html.includes('id="tv-transition"'));
 for(const id of ['muybridge','genesis','vint-cerf'])
  assert.ok(html.includes('data-tv-switch="'+id+'"'));
 for(const shot of ['broadcast','rail','aerial','drone','finish','leader','pack','grandstand','orbit'])
  assert.ok(html.includes('data-tv-shot="'+shot+'"'));
 assert.match(controller,/function setShot\(mode\)/);
 assert.match(controller,/requestAnimationFrame\(uncover\)/);
 assert.match(controller,/await wait\(270\)/);
 assert.match(controller,/button\.dataset\.tvSwitch/);
 assert.match(css,/\.tv-transition/);
 assert.match(css,/transition:opacity 520ms/);
 assert.match(html,/tv-director-params-20261104-v2/);
});
