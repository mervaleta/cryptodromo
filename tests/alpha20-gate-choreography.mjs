import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../visual-lab/gateChoreography.js',import.meta.url),'utf8');
const {horseStartOffset,gateVisualState,applyGateStaging,STAGING_OFFSET_X,VISUAL_RELEASE_SECONDS}=
 await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));

test('visual staging settles at exactly zero after release',()=>{
 assert.equal(horseStartOffset(-1),STAGING_OFFSET_X);
 assert.equal(horseStartOffset(0),STAGING_OFFSET_X);
 assert.equal(horseStartOffset(VISUAL_RELEASE_SECONDS),0);
 assert.equal(horseStartOffset(100),0);
 let last=STAGING_OFFSET_X;
 for(let t=0;t<=1.2;t+=.04){
  const v=horseStartOffset(t);
  assert.ok(v>=last-1e-9 && v<=0);
  last=v;
 }
});
test('clock is derived from caller timeline, no independent wall-clock',()=>{
 const preparing=gateVisualState({phase:'presentation',elapsed:59.9});
 assert.equal(preparing.doorsOpen,false);
 assert.equal(preparing.secondsSinceStart,-1);
 const starting=gateVisualState({phase:'race',elapsed:0});
 assert.equal(starting.doorsOpen,true);
 assert.equal(starting.secondsSinceStart,0);
 const replay=gateVisualState({phase:'race',elapsed:16.5,running:false});
 assert.equal(replay.secondsSinceStart,16.5);
 assert.equal(replay.advancing,false);
 assert.equal(replay.horseOffsetX,0);
});
test('render-only staging never changes official progress or visual speed',()=>{
 const horses=Array.from({length:12},(_,i)=>({index:i,progress:i/100,visualSpeed:1.3,model:{root:{position:{x:0,y:0,z:0}}}}));
 const gate={update(v){this.value=v;}};
 const trackPoint=(_layout,progress,i)=>({x:-390+progress*780,z:(i-5.5)*2.55});
 const prior=horses.map(h=>({progress:h.progress,visualSpeed:h.visualSpeed}));
 applyGateStaging({horses,gate,phase:'presentation',elapsed:-1,layoutMode:'straight',trackPoint});
 assert.equal(horses[0].model.root.position.x,-393.2);
 assert.equal(horses[11].model.root.position.z,14.025);
 assert.deepEqual(horses.map(h=>({progress:h.progress,visualSpeed:h.visualSpeed})),prior);
 assert.equal(gate.value.secondsSinceStart,-1);
 applyGateStaging({horses,gate,phase:'race',elapsed:1.2,layoutMode:'straight',trackPoint});
 assert.equal(gate.value.secondsSinceStart,1.2);
 assert.deepEqual(horses.map(h=>({progress:h.progress,visualSpeed:h.visualSpeed})),prior);
});
test('no official engine, setInterval, date, or network imports',()=>{
 assert.doesNotMatch(source,/\b(setInterval|setTimeout|Date|officialRanking|input1|input2|fetch)\b/);
});
