import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWindMane,maneMotionTarget} from '../race-lab/source/src/windMane.js';

const closeToZero=x=>Math.abs(x)<.001;
const mesh=()=>({
 isSkinnedMesh:true,
 geometry:{attributes:{position:{count:510}},
  boundingBox:{min:{x:-.0022,y:-.0298,z:.0144},max:{x:.0022,y:.0223,z:.0458}}}
});
const material=()=>({onBeforeCompile(){},customProgramCacheKey(){return 'hair';}});
const makeMane=()=>createWindMane([{name:'Hair',material:material(),mesh:mesh()}]);

test('Parade Walk: no mane flutter at ordinary walking pace',()=>{
 assert.equal(maneMotionTarget({gait:'Walk',speed:1,wind:.5}),0);
 assert.equal(maneMotionTarget({gait:'Walk',speed:2.5,wind:.5}),0);
 const mane=makeMane();
 for(let i=0;i<50;i++)mane.update(.05,{gait:'Walk',speed:1.2,wind:.5});
 assert.ok(closeToZero(mane.motion));
});
test('Rain is not a gale: walking Parade stays still in wet weather',()=>{
 assert.equal(maneMotionTarget({gait:'Walk',speed:1.2,wind:1.25}),0);
 assert.equal(maneMotionTarget({gait:'Trot',speed:2,wind:1.25}),0);
 assert.equal(maneMotionTarget({gait:'Idle',speed:0,wind:1.25}),0);
});
test('Very strong wind can move the mane of a walking or stationary horse',()=>{
 assert.equal(maneMotionTarget({gait:'Walk',wind:1.45}),0);
 assert.ok(maneMotionTarget({gait:'Walk',wind:1.8})>.35);
 assert.ok(maneMotionTarget({gait:'Idle',speed:0,wind:2})>.6);
 const mane=makeMane();
 for(let i=0;i<20;i++)mane.update(.05,{gait:'Walk',wind:2});
 assert.ok(mane.motion>.6);
});
test('Race Gallop generates airflow even with moderate ambient wind',()=>{
 const gallop=maneMotionTarget({gait:'Gallop',speed:1.3,wind:.55});
 assert.ok(gallop>.55);
 assert.ok(gallop>maneMotionTarget({gait:'Walk',speed:1.3,wind:.55}));
 assert.equal(maneMotionTarget({gait:'Gallop',speed:0,wind:.55}),0);
});
test('Gait changes from Gallop to Walk settle smoothly',()=>{
 const mane=makeMane();
 for(let i=0;i<20;i++)mane.update(.05,{gait:'Gallop',speed:1.5,wind:.55});
 assert.ok(mane.motion>.6);
 const previous=mane.motion;
 mane.update(.05,{gait:'Walk',speed:1,wind:.5});
 assert.ok(mane.motion<previous&&mane.motion>0);
 for(let i=0;i<30;i++)mane.update(.05,{gait:'Walk',speed:1,wind:.5});
 assert.ok(closeToZero(mane.motion));
});
test('Racer profile preview disables flutter even when Gallop is displayed',()=>{
 assert.equal(maneMotionTarget({gait:'Gallop',speed:2,wind:2,motionEnabled:false}),0);
 const mane=makeMane();
 for(let i=0;i<10;i++)mane.update(.05,{gait:'Gallop',speed:2,wind:2,motionEnabled:false});
 assert.equal(mane.motion,0);
});
test('Reduced motion suppresses both gallop and gale immediately',()=>{
 const mane=makeMane();
 for(let i=0;i<10;i++)mane.update(.05,{gait:'Gallop',speed:2,wind:2});
 assert.ok(mane.motion>0);
 mane.update(.05,{gait:'Gallop',speed:2,wind:2,reducedMotion:true});
 assert.equal(mane.motion,0);
});
test('Parade overrides legacy animation fallback with walking airflow',()=>{
 const fs=awaitImportRead();
 assert.match(fs.parade,/maneGait:'Walk'/);
 assert.match(fs.horse,/gait:maneGait\|\|action\?\.getClip\(\)\.name/);
});
function awaitImportRead(){
 const fs=requireRead();
 return {parade:fs('parade/parade.js'),horse:fs('race-lab/source/src/horse.js')};
}
function requireRead(){
 return path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
}
