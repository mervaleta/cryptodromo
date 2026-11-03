import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createStadiumSurfaces} from '../race-lab/source/src/stadium/surfaces.js';
const require=createRequire(new URL('../race-lab/source/package.json',import.meta.url));
const THREE=require('three');
test('five reproducible procedural textures, no external assets',()=>{
 const names=['stone','roof','gravel','grass','paving'];
 const a=createStadiumSurfaces({THREE,seed:17,resolution:64});
 const b=createStadiumSurfaces({THREE,seed:17,resolution:64});
 for(const kind of names){
  const x=a.make(kind,{repeatX:4}),y=b.make(kind,{repeatX:4});
  assert.equal(x.image.width,64);assert.equal(x.image.height,64);
  assert.equal(x.wrapS,THREE.RepeatWrapping);
  assert.equal(x.repeat.x,4);
  assert.deepEqual(x.image.data,y.image.data);
 }
 assert.equal(a.count,5);
 assert.throws(()=>a.make('unknown'));
 a.dispose();b.dispose();
 assert.equal(a.count,0);
});
test('invalid resolutions are rejected',()=>{
 assert.throws(()=>createStadiumSurfaces({THREE,resolution:16}),RangeError);
 assert.throws(()=>createStadiumSurfaces({THREE,resolution:513}),RangeError);
});
