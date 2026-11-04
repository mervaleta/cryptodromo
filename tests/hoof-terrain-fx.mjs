import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHoofContactSolver,HOOF_LAYOUT,SURFACES,hoofWorldPoint,normalizedSurface} from '../visual-lab/hoofContactSolver.js';

const source = name => readFileSync(new URL(name,import.meta.url),'utf8');
const make = () => createHoofContactSolver({lanes:12});

test('gallop has four asymmetrical beats, hind pair first, aerial gap last',()=>{
 assert.deepEqual(HOOF_LAYOUT.map(v=>v.id),['LH','RH','LF','RF']);
 assert.deepEqual(HOOF_LAYOUT.map(v=>v.beat),[0,.115,.275,.405]);
 const s=make();
 assert.equal(s.sample({lane:0,x:0,z:0,phase:.91,enabled:true}).length,0);
 const impacts=s.sample({lane:0,x:1,z:0,phase:.41,enabled:true,dt:.06});
 assert.deepEqual(impacts.map(x=>x.id),['LH','RH','LF','RF']);
 assert.ok(impacts.every(e=>e.pressure>0&&e.mode==='phase'));
 assert.equal(s.sample({lane:0,x:1,z:0,phase:.41,enabled:true}).length,0);
});

test('all hooves follow rotated local geometry along bends without a fixed world-X stamp',()=>{
 const heading=Math.PI/2;
 const near=hoofWorldPoint({x:12,z:7,heading,hoof:2});
 assert.ok(Math.abs(near.x-(12-.35))<1e-6);
 assert.ok(Math.abs(near.z-(7-.80))<1e-6);
 assert.deepEqual(HOOF_LAYOUT.map(v=>v.z),[-.33,.33,-.35,.35]);
});

test('one run of 12 lanes creates approximately 4 hoof events per stride, no runaway backlog',()=>{
 const s=make(),phases=new Float64Array(12),distances=new Float64Array(12);
 let count=0;
 for(let frame=0;frame<=3600;frame++){
  for(let lane=0;lane<12;lane++){
   phases[lane]=(frame/60*1.715+(lane*.01))%1;
   distances[lane]=frame/60*7.2;
   const ev=s.sample({lane,phase:phases[lane],x:distances[lane],
    z:(lane-5.5)*2.55,heading:0,dt:1/60,speed:1,enabled:true});
   count+=ev.length;
   assert.ok(ev.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)));
  }
 }
 assert.ok(count>4800&&count<5050,'unexpected impacts: '+count);
 assert.equal(s.getTotals().reduce((a,b)=>a+b,0),count);
});

test('pause, reset, seek and teleport suppress phantom impacts',()=>{
 const s=make();
 assert.equal(s.sample({lane:0,phase:.1,x:0,z:0,enabled:true}).length,0);
 assert.equal(s.sample({lane:0,phase:.8,x:0,z:0,enabled:true}).length,0);
 assert.equal(s.sample({lane:0,phase:.97,x:100,z:0,enabled:true}).length,0);
 assert.equal(s.sample({lane:0,phase:.1,x:100,z:0,enabled:false}).length,0);
 assert.equal(s.sample({lane:0,phase:.1,x:100,z:0,enabled:true}).length,0);
 s.reset();
 assert.equal(s.getTotals()[0],0);
});

test('true sole positions trigger exactly on landing, not once per render frame',()=>{
 const s=make(),points=y=>HOOF_LAYOUT.map((_,i)=>({x:i,y,z:i}));
 assert.equal(s.sample({lane:3,enabled:true,soles:points(.30),dt:.016}).length,0);
 const ev=s.sample({lane:3,enabled:true,soles:points(.025),dt:.016});
 assert.equal(ev.length,4);
 assert.ok(ev.every(e=>e.mode==='soles'));
 for(let i=0;i<10;i++){
  assert.equal(s.sample({lane:3,enabled:true,soles:points(.025),dt:.016}).length,0);
 }
 s.sample({lane:3,enabled:true,soles:points(.31),dt:.2});
 assert.equal(s.sample({lane:3,enabled:true,soles:points(.025),dt:.2}).length,4);
});

test('surface differences and quality budgets are explicit; synthetic stays supported',()=>{
 assert.equal(normalizedSurface('sand'),'sand');
 assert.equal(normalizedSurface('synthetic'),'synthetic');
 assert.equal(normalizedSurface('invalid'),'dirt');
 assert.ok(SURFACES.sand.dust>SURFACES.dirt.dust);
 assert.ok(SURFACES.dirt.dust>SURFACES.grass.dust);
 assert.ok(SURFACES.grass.markScale<SURFACES.sand.markScale);
 const fx=source('../visual-lab/hoofTerrainFX.js');
 assert.match(fx,/maxParticles=1350/);
 assert.match(fx,/depthWrite:false/);
 assert.match(fx,/getHoofContactPoints/);
 assert.match(fx,/dispose\(\)/);
});

test('broadcast calls hoof FX after pose update and does not stamp from traveled distance',()=>{
 const scene=source('../visual-lab/scene.js');
 const update=scene.indexOf('h.model.update(dt,running?h.visualSpeed:1)');
 const contact=scene.indexOf('hoofFX.stepHorse(h.index');
 assert.ok(update>=0&&contact>update);
 assert.doesNotMatch(scene,/trackFX\.stamp\(/);
 assert.match(scene,/createOfficialRace/);
 assert.match(scene,/officialRanking/);
 assert.match(scene,/genesis:'sand'/);
});
