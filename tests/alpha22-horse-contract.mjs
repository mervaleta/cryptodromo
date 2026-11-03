import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const moduleSource=name=>readFileSync(new URL('../visual-lab/horse-fidelity/'+name+'.js',import.meta.url),'utf8');
const load=name=>import('data:text/javascript;charset=utf-8,'+encodeURIComponent(moduleSource(name)));
const profile=await load('horseProfiles'),geometry=await load('horseGeometry'),shader=await load('horseShader');
test('original procedural identity and eight coats, four anatomy morphologies',()=>{
 assert.ok(profile.PROCEDURAL_HORSE_VERSION.includes('alpha22'));
 assert.equal(Object.keys(profile.HORSE_ARCHETYPES).length,4);
 assert.equal(Object.keys(profile.COAT_PRESETS).length,8);
 const samples=Array.from({length:12},(_,i)=>profile.randomHorseProfile('TOKEN'+i,i));
 assert.equal(samples.length,12);
 assert.ok(new Set(samples.map(p=>p.seed)).size===12);
 assert.deepEqual(samples,Array.from({length:12},(_,i)=>profile.randomHorseProfile('TOKEN'+i,i)));
});
test('untrusted profile values are constrained',()=>{
 const p=profile.normalizeHorseProfile({archetype:'../../../bad',coat:'unknown',
  height:9999,wetness:-9,mud:23,quality:'invalid',accent:'url(javascript:evil)'});
 assert.equal(p.height,3.15);assert.equal(p.mud,1);assert.equal(p.wetness,0);
 assert.equal(p.coat,'bay');assert.equal(p.archetype,'thoroughbred');
 assert.equal(p.quality,'balanced');assert.equal(p.accent,'#e5bf79');
});
test('loft interpolation creates positive radii and finite coordinates',()=>{
 const sections=[[0,0,0,.01,.01],[.5,.8,0,.38,.25],[1,0,0,.02,.01]];
 for(let i=0;i<=100;i++){
  const a=geometry.interpolateSection(sections,i/100);
  assert.ok(a.center.every(Number.isFinite)&&a.rA>0&&a.rB>0);
 }
 assert.throws(()=>geometry.interpolateSection([[0,0,0,.2,.2]],.5),/two/);
});
test('geometry detail scales monotonically for mobile/desktop',()=>{
 const eco=geometry.geometryBudget('eco'),balanced=geometry.geometryBudget('balanced'),
  high=geometry.geometryBudget('high');
 assert.ok(eco.sides<balanced.sides&&balanced.sides<high.sides);
 assert.ok(eco.hair<balanced.hair&&balanced.hair<high.hair);
 assert.equal(geometry.geometryBudget('unknown'),balanced);
});
test('PBR fur shader is fully image-map-free',()=>{
 const source=moduleSource('horseShader');
 for(const forbidden of ['new Image(','.png','.jpg','CanvasTexture','TextureLoader','GLTFLoader']){
  assert.ok(!source.includes(forbidden),forbidden+' must not be loaded');
 }
 assert.match(source,/crpWetness/);assert.match(source,/crpNoise/);
 assert.match(source,/crpMud/);assert.match(source,/customProgramCacheKey/);
});
test('all Alpha22 horse files are procedural and no external meshes',()=>{
 for(const name of ['horseProfiles','horseGeometry','horseShader','horseGroom','proceduralHorse']){
  const source=moduleSource(name);
  assert.doesNotMatch(source,/\b(fetch\s*\(|GLTFLoader|OBJLoader|TextureLoader|\.png['"]|\.jpe?g['"])\b/);
 }
});
test('LIVE integration stays untouched in this staging branch',()=>{
 const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 assert.ok(!scene.includes('horse-fidelity/proceduralHorse.js'));
});
