import test from 'node:test';
import assert from 'node:assert/strict';
import {tvShot,cameraBlend} from '../visual-lab/cinematicCamera.js';
test('TV plan prioritizes approach and finish without affecting race state',()=>{
 assert.equal(tvShot(0),'chase');
 assert.equal(tvShot(12),'rail');
 assert.equal(tvShot(31),'drone');
 assert.equal(tvShot(50),'chase');
 assert.equal(tvShot(57),'finish');
 assert.equal(tvShot(65),'finish');
 assert.equal(tvShot(0,{running:false}),'paddock');
});
test('camera smoothing stays within 0 and 1 and is frame-rate aware',()=>{
 assert.equal(cameraBlend(0),0);
 for(const dt of [1/120,1/60,1/30,.08])assert.ok(cameraBlend(dt)>0&&cameraBlend(dt)<1);
 assert.ok(Math.abs(cameraBlend(1/30)-(1-(1-cameraBlend(1/60))**2))<1e-12);
});
