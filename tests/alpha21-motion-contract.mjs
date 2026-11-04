import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../visual-lab/polish/'+name+'.js',import.meta.url),'utf8');
const load=async name=>import('data:text/javascript;charset=utf-8,'+encodeURIComponent(read(name)));
const motion=await load('motionDirector');
const hoof=await load('hoofContacts');
const venue=await load('stadiumFinishing');
const follow=await load('bodyFollowThrough');

test('bounded gallop cadence follows physical speed without silly 3.15x playback',()=>{
 assert.equal(motion.GALLOP_CLIP_SECONDS,.583);
 for(const v of [0,1,8,14,17,30,90,1000]){
  const r=motion.targetGallopRate(v,16.67);
  assert.ok(Number.isFinite(r)&&r>=motion.MOTION_LIMITS.minRate&&r<=motion.MOTION_LIMITS.maxRate);
 }
 assert.ok(motion.targetGallopRate(9)<motion.targetGallopRate(17));
 assert.ok(motion.targetGallopRate(29)>motion.targetGallopRate(17));
 assert.ok(motion.targetGallopRate(17)<1.4);
});
test('clip cadence smoothing is approximately frame-rate independent',()=>{
 function simulate(dt,n){
  const director=motion.createLocomotionDirector({count:12});
  director.reset();let sample;
  for(let i=0;i<n;i++)sample=director.sample(0,{delta:dt,metersPerSecond:25,reference:16.67,elapsed:i*dt,phase:'race'});
  return sample.rate;
 }
 assert.ok(Math.abs(simulate(.02,50)-simulate(.04,25))<.025);
});
test('idle, reset and runner isolation cannot affect official race positions',()=>{
 const director=motion.createLocomotionDirector({count:12});
 const ready=director.sample(1,{delta:.02,metersPerSecond:0,phase:'presentation'});
 assert.equal(ready.active,false);
 const moving=director.sample(0,{delta:.02,metersPerSecond:20,elapsed:.35});
 assert.ok(moving.rate>0);assert.equal(moving.active,true);
 assert.equal(director.rates[1],motion.MOTION_LIMITS.startRate);
 director.reset();assert.equal(director.rates[0],motion.MOTION_LIMITS.startRate);
});
test('four animation-phase contacts have stable order and no duplicate impacts',()=>{
 assert.equal(hoof.HOOF_CONTACTS.length,4);
 const tracker=hoof.createHoofContactTracker({count:12});
 assert.equal(tracker.sample(0,{hoofPhase:.01,elapsed:0}).length,0);
 assert.equal(tracker.sample(0,{hoofPhase:.16,elapsed:.09}).length,2);
 assert.equal(tracker.sample(0,{hoofPhase:.34,elapsed:.18}).length,1);
 assert.equal(tracker.sample(0,{hoofPhase:.46,elapsed:.26}).length,1);
 assert.equal(tracker.sample(0,{hoofPhase:.46,elapsed:.28}).length,0);
 tracker.sample(0,{active:false,hoofPhase:.8});
 assert.equal(tracker.sample(0,{hoofPhase:.01,elapsed:1}).length,0);
 assert.equal(hoof.crossingContacts(.2,.91).length,0,'skip catch-up on seek/frame drop');
 assert.equal(hoof.crossingContacts(.98,.05).length,1,'one trailing hind impact on wrap');
});
test('eight thematic venue identities have strictly off-track placement',()=>{
 assert.ok(venue.validateDecorFootprint());
 assert.ok(venue.DECOR_OFF_TRACK_Z>53);
 assert.ok(Object.keys(venue.STADIUM_THEMES).length>=8);
 assert.equal(venue.getStadiumTheme('satoshi').story.length,3);
 assert.equal(venue.getStadiumTheme('unknown').title,'SATOSHI NAKAMOTO');
});
test('polish modules never read results, price candles or wagers',()=>{
 for(const name of ['motionDirector','hoofContacts','contactSpray','stadiumFinishing','bodyFollowThrough','racePolishKit']){
  const source=read(name);
  assert.doesNotMatch(source,/\b(officialRanking|officialRace|PRICE_FIXTURE|payout|betsLedger|getRaceFixture)\b/);
 }
});
test('no duplicate geometry in original stadium or horse engine on this staged branch',()=>{
 const mainScene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 assert.doesNotMatch(mainScene,/polish\/racePolishKit|createRacePolishKit/);
 const currentHorse=readFileSync(new URL('../race-lab/source/src/horse.js',import.meta.url),'utf8');
 assert.doesNotMatch(currentHorse,/alpha21/i);
});

test('secondary spine head and tail inertia stays small and quality-bounded',()=>{
 const a=follow.followAngles({phase:.22,rate:1.5,burst:.4,quality:'high'});
 assert.deepEqual(Object.keys(a),['Neck1','Head','Back','Tail2']);
 for(const angle of Object.values(a))assert.ok(Math.abs(angle)<=.038);
 const eco=follow.followAngles({phase:.22,rate:1.5,quality:'eco'});
 assert.ok(Object.values(eco).every(a=>a===0));
});
test('additive bone corrections are fully reversible across horse mixer updates',()=>{
 class Q{constructor(){this.v=0;}setFromAxisAngle(_axis,a){this.v=a;return this}
  multiply(q){this.v+=q.v;return this}copy(q){this.v=q.v;return this}
  invert(){this.v=-this.v;return this}identity(){this.v=0;return this}
  normalize(){return this}}
 class V{constructor(x,y,z){this.x=x;this.y=y;this.z=z}}
 const bones=Object.fromEntries(follow.FOLLOW_BONES.map(name=>[name,{isBone:true,quaternion:new Q()}]));
 const horse={root:{getObjectByName:name=>bones[name]}};
 const director=follow.createBodyFollowThrough({THREE:{Quaternion:Q,Vector3:V},count:1,quality:'high'});
 director.beforeUpdate(0,horse);director.afterUpdate(0,horse,{phase:.13,rate:1.5,burst:.3});
 assert.ok(Object.values(bones).some(b=>Math.abs(b.quaternion.v)>.0001));
 director.beforeUpdate(0,horse);
 assert.ok(Object.values(bones).every(b=>Math.abs(b.quaternion.v)<.00000001));
 director.afterUpdate(0,horse,{phase:.13,rate:1.5,burst:.3});director.reset();
 assert.ok(Object.values(bones).every(b=>Math.abs(b.quaternion.v)<.00000001));
 director.dispose();
});


test('GLB-only follow-through does not overwrite Alpha20 or Alpha22 generated skeletons',()=>{
 const code=read('racePolishKit');
 assert.match(code,/horse\.procedural!==true&&horse\.generated!==true/);
 assert.match(code,/if\(legacyRig\)body\.beforeUpdate/);
 assert.match(code,/if\(legacyRig\)body\.afterUpdate/);
 assert.equal((code.match(/horse\.update\(delta,/g)||[]).length,1,
  'exactly one horse animation update for any renderer');
 assert.doesNotMatch(code,/horse\.root\.position\.(set|x\s*=|z\s*=)/);
});
