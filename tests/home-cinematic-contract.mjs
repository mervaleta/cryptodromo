import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCinematicLineup,canonicalHorseOptions} from '../visual-lab/cinematicLineup.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const entries=Array.from({length:12},(_,i)=>({symbol:'CRP'+i,color:'#b88e55',coat:'#8d623c'}));
const coats=Array(12).fill('#80604b');
test('canonical public home is Fidelity and cinematic regardless of old URL params',()=>{
 const renderer=read('visual-lab/horseRenderer.js'),scene=read('visual-lab/scene.js');
 const home=read('index.html');
 assert.match(renderer,/return 'fidelity'/);
 assert.doesNotMatch(renderer,/return createLegacyHorse\(|return createProceduralRaceHorse\(/);
 assert.match(renderer,/quality:'high'/);
 assert.match(scene,/graphicsModeSelect.value='cinematic'/);
 assert.match(scene,/renderer.shadowMap.enabled=true/);
 assert.match(scene,/const treeN=155/);
 assert.match(scene,/const crowdN=980/);
 assert.match(scene,/const flagsN=128/);
 assert.match(scene,/const rainN=1050/);
 assert.match(scene,/const dustN=450/);
 assert.doesNotMatch(scene,/new THREE.SphereGeometry\(\.95,12,9\)/);
 assert.match(home,/id="graphics-quality" hidden/);
 assert.match(home,/value="cinematic" selected/);
 assert.match(home,/id="horse-engine" hidden/);
 assert.match(home,/value="fidelity" selected/);
 assert.doesNotMatch(home,/MOTOR DE CABALLOS|Automática \(FPS\)/);
});
test('public navigation has no laboratory/alternative race destinations',()=>{
 const nav=read('assets/crp-global-nav.js');
 const lab=read('visual-lab/index.html');
 assert.doesNotMatch(nav,/Visual Lab|Modo Parade|\bLaboratorio\b|Estadio 3D/);
 assert.match(lab,/location\.replace\(target\)/);
 assert.match(lab,/rel="canonical" href="\/"/);
 assert.doesNotMatch(lab,/id="raceCanvas"/);
});
test('cinematic horse options preserve official seed identity, lane and height',()=>{
 for(let i=0;i<12;i++){
  const opts=canonicalHorseOptions(entries[i],i,coats);
  assert.equal(opts.symbol,'CRP'+i);assert.equal(opts.stallNumber,i+1);
  assert.equal(opts.quality,'high');assert.equal(opts.mode,'Gallop');
  assert.equal(opts.height,2.85);assert.equal(opts.phase,i*.13);
 }
});
test('entire 12-horse Fidelity roster renders without fallback downgrade',async()=>{
 let count=0;
 const models=await createCinematicLineup({entries,coats,createHorse:async options=>{
  count++;return {root:{type:'Object3D',number:options.stallNumber},
   update(){},setAppearance(){},dispose(){}};
 }});
 assert.equal(models.length,12);assert.equal(count,12);
});
test('any horse failure aborts misleading scene and disposes successful rigs',async()=>{
 let disposed=0;
 await assert.rejects(createCinematicLineup({
  entries,coats,createHorse:async options=>options.stallNumber===4?
   Promise.reject(Error('shader unavailable')):{
    root:{},update(){},setAppearance(){},dispose(){disposed++;}
   }
 }),/Fidelity.*Gatera 4/);
 assert.equal(disposed,11);
});
test('no malformed roster, even without running WebGL',async()=>{
 await assert.rejects(createCinematicLineup({
  entries:entries.slice(0,11),coats,createHorse:()=>{}
 }),/twelve/);
});
