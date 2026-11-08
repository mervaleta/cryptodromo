import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trackPoint} from '../visual-lab/trackMath.js';
import {GATE_START_OFFSET} from '../visual-lab/broadcastGates.js';
import {
  railCameraSideOffset, RAIL_CAMERA_BASE_SIDE,
  RAIL_CAMERA_START_SIDE, RAIL_CAMERA_SBEND_START_SIDE,
  RAIL_CAMERA_CLEARANCE_METERS,
} from '../visual-lab/stadiumRailClearance.js';

const START_X=-390;
const GATE_CANOPY_HALF_LENGTH_X=4.32/2;
const GATE_CANOPY_HALF_WIDTH_Z=32/2;
const GATE_CLEARANCE_MARGIN=2.0;

function launchShot(layout) {
  const point=trackPoint(layout,0,5.5);
  const off=railCameraSideOffset(0,layout);
  return {
    camera:{x:point.x-point.tangentX*8+point.sideX*off,
      z:point.z-point.tangentZ*8+point.sideZ*off},
    focus:{x:point.x+point.tangentX*11,z:point.z+point.tangentZ*11},
  };
}

test('rail shot begins outside the physical gate canopy for both straight layouts',()=>{
  for(const layout of ['straight','s-bend']){
    const {camera,focus}=launchShot(layout);
    const gateX=START_X+GATE_START_OFFSET;
    for(const edgeX of [gateX-GATE_CANOPY_HALF_LENGTH_X,gateX+GATE_CANOPY_HALF_LENGTH_X]){
      const t=(edgeX-camera.x)/(focus.x-camera.x);
      assert.ok(t>0 && t<1,`${layout}: expected camera ray to pass gate's x bounds`);
      const z=camera.z+t*(focus.z-camera.z);
      assert.ok(z>GATE_CANOPY_HALF_WIDTH_Z+GATE_CLEARANCE_MARGIN,
        `${layout}: camera ray clips the gate roof at x=${edgeX.toFixed(2)}, z=${z.toFixed(2)}`);
    }
  }
});

test('rail shot clears launch gate without abrupt jump in visual framing',()=>{
  assert.equal(railCameraSideOffset(0,'straight'),RAIL_CAMERA_START_SIDE);
  assert.equal(railCameraSideOffset(0,'s-bend'),RAIL_CAMERA_SBEND_START_SIDE);
  assert.equal(railCameraSideOffset(0,'oval'),RAIL_CAMERA_BASE_SIDE);
  for(const layout of ['straight','s-bend']){
    const offsets=[0,5,10,20,30,36,50].map(m=>railCameraSideOffset(m/780,layout));
    assert.ok(offsets.every((v,i)=>i===0 || v<=offsets[i-1]));
    assert.equal(offsets.at(-1),RAIL_CAMERA_BASE_SIDE);
    assert.equal(railCameraSideOffset(RAIL_CAMERA_CLEARANCE_METERS/780,layout),RAIL_CAMERA_BASE_SIDE);
    assert.ok(Math.abs(railCameraSideOffset(0.001,layout)-offsets[0])<.1);
  }
});

test('only rail visual camera uses clearance, without changing the race or shared rigs',()=>{
  const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
  assert.match(scene,/import \{railCameraSideOffset\} from '\.\/stadiumRailClearance\.js/);
  assert.match(scene,/else if\(mode==='rail'\)\s*\{[\s\S]*?const railSide=railCameraSideOffset\(avg,layoutMode\)/);
  assert.match(scene,/goal\.set\(point\.x-tx\*8\+nx\*railSide,2\.8,point\.z-tz\*8\+nz\*railSide\)/);
});
