import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('the mane is attached to the same animated rig shared by Race, Parade and Racers',()=>{
 const horse=source('race-lab/source/src/horse.js');
 assert.match(horse,/createWindMane\(colorBindings/);
 assert.match(horse,/mane\.update\(step/);
 assert.match(horse,/mane\.dispose\(\)/);
 assert.match(horse,/setWind\(level=/);
 for(const path of ['visual-lab/scene.js','parade/parade.js','racers/horse-preview.js'])
  assert.match(source(path),/horse\.js\?v=alpha16-mane-1/,path);
 assert.match(source('parade/parade.js'),/maneEnabled:horseModels\.filter/);
});
test('weather changes mane wind only, never the official scoring or race time',()=>{
 const scene=source('visual-lab/scene.js'),parade=source('parade/parade.js');
 assert.match(scene,/maneWind=wet\?1\.6:\.55/);
 assert.match(scene,/horse\.model\.setWind\?\.\(maneWind\)/);
 assert.match(parade,/paradeManeWind=wet\?1\.25:\.5/);
 assert.match(parade,/horse\.setWind\?\.\(paradeManeWind\)/);
 for(const path of ['race-lab/source/src/data/officialRace.js','race-lab/source/src/data/trackSplits.js'])
  assert.doesNotMatch(source(path),/createWindMane|setWind|crpManeTime/);
});
test('public entrypoints invalidate cached horse imports across the three modes',()=>{
 const expected=[
  ['index.html','scene.js?v=alpha18-camera-density-mane-1'],
  ['visual-lab/index.html','scene.js?v=alpha18-camera-density-mane-1'],
  ['parade/index.html','parade.js?v=alpha18-camera-density-mane-1'],
  ['racers/index.html','racers.js?v=alpha16-mane-1'],
  ['racers/racers.js','horse-preview.js?v=alpha16-mane-1']
 ];
 for(const [path,query] of expected)assert.ok(source(path).includes(query),path+' missing '+query);
});
