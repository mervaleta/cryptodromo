import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectBroadcastShot,createBroadcastDirector} from '../alpha15/director.js';
import {narrateEvent} from '../visual-lab/raceBroadcast.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('opening shot has priority over curved-track overview and finish remains decisive',()=>{
 for(const layout of ['straight','oval','s-bend']){
  assert.equal(selectBroadcastShot({elapsed:2,layout,progress:.25}).shot,'rail',layout);
  assert.equal(selectBroadcastShot({elapsed:59,layout,progress:.98}).shot,'finish',layout);
 }
 assert.equal(selectBroadcastShot({elapsed:32,layout:'oval',progress:.51}).shot,'drone');
 assert.equal(selectBroadcastShot({elapsed:32,layout:'s-bend',progress:.51}).shot,'drone');
});

test('long continuous bends alternate existing camera presets without rapid cutting',()=>{
 const original=selectBroadcastShot({
  elapsed:34,phase:'race',layout:'oval',progress:.55,
  previousShot:'drone',lastChangeAt:29,minDwell:5.5,maxDwell:12
 });
 assert.equal(original.shot,'drone');
 assert.equal(original.changed,false);
 const alternate=selectBroadcastShot({
  elapsed:42,phase:'race',layout:'oval',progress:.7,
  previousShot:'drone',lastChangeAt:29,minDwell:5.5,maxDwell:12
 });
 assert.equal(alternate.shot,'pack');
 assert.equal(alternate.reason,'coverage-variety');
 assert.equal(alternate.changed,true);
 const hold=selectBroadcastShot({
  elapsed:44,phase:'race',layout:'oval',progress:.74,
  previousShot:'pack',lastChangeAt:42,minDwell:5.5,maxDwell:12
 });
 assert.equal(hold.shot,'pack');
 assert.equal(hold.reason,'minimum-shot-duration');
});

test('director follows actual overtake events without modifying event data',()=>{
 const observation={
  elapsed:25,layout:'oval',progress:.4,leadMarginMeters:8,
  overtakes:3,previousOvertakes:2,previousShot:'drone',lastChangeAt:24
 };
 const copy=structuredClone(observation);
 const selected=selectBroadcastShot(observation);
 assert.equal(selected.shot,'leader');
 assert.equal(selected.reason,'overtake');
 assert.deepEqual(observation,copy);
 const director=createBroadcastDirector({minDwell:5.5,maxDwell:12});
 assert.equal(director.frame({elapsed:1,layout:'oval'}).shot,'rail');
 assert.equal(director.frame({elapsed:3,layout:'oval'}).shot,'rail');
 director.reset();
 assert.equal(director.state.shot,'pack');
});

test('motion preferences and broadcast phase are stronger than coverage variety',()=>{
 assert.equal(selectBroadcastShot({
  elapsed:42,layout:'oval',progress:.7,previousShot:'drone',
  lastChangeAt:20,reduceMotion:true
 }).shot,'grandstand');
 assert.equal(selectBroadcastShot({elapsed:75,phase:'results'}).shot,'finish');
 assert.equal(selectBroadcastShot({elapsed:135,phase:'presentation'}).shot,'grandstand');
});

test('commentary states only official or observed sporting events',()=>{
 for(const changes of [0,1,2]){
  const clip=narrateEvent({type:'lead',leader:'BTC',previous:'ETH',changes});
  assert.match(clip,/BTC/);
  assert.match(clip,/ETH/);
  assert.doesNotMatch(clip,/por afuera|por adentro|salta|carril|atropellada/i);
 }
 for(const elapsed of [5,10,20,30,40]){
  const clip=narrateEvent({type:'dose',elapsed});
  assert.match(clip,/sintético|datos|intervalo|carrera|clasificación|competidores/i);
  assert.doesNotMatch(clip,/pican|se comprime|por afuera|nadie levanta|alarga la ventaja/i);
 }
 assert.match(narrateEvent({type:'finish',leader:'BTC'}),/BTC/);
 assert.doesNotMatch(narrateEvent({type:'finish',leader:'BTC'}),/Gran Premio Cripto/);
});

test('existing broadcasting scene still owns camera, replay and official outcome',()=>{
 const scene=read('visual-lab/scene.js');
 for(const path of ['visual-lab/index.html','stadiums/crypto/broadcast/index.html'])
  assert.match(read(path),/scene\.js\?v=broadcast-aaa-20261105-v1/);
 assert.match(scene,/director\.js\?v=broadcast-aaa-20261105-v1/);
 assert.match(scene,/raceBroadcast\.js\?v=broadcast-aaa-20261105-v1/);
 assert.match(scene,/tvDirector\.frame\(/);
 assert.match(scene,/elapsed-lastLeaderNarrationAt>=8/);
 assert.doesNotMatch(scene,/Math\.floor\(elapsed\)%9===0/);
 assert.match(scene,/selectedMode==='broadcast'/);
 assert.match(scene,/officialRanking\(profiles\)/);
 assert.match(scene,/winnerReplay\.advance/);
 assert.doesNotMatch(read('alpha15/director.js'),/createOfficialRace|getRaceFixture|PRICE_FIXTURE/);
});
