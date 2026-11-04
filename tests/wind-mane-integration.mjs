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
 // The race delegates its horse renderer through the shared adapter now.
 assert.match(source('visual-lab/scene.js'),/horseRenderer\.js\?v=/);
 assert.match(source('visual-lab/horseRenderer.js'),/horse\.js\?v=alpha18-gaitmane-1/);
 for(const path of ['parade/parade.js','racers/horse-preview.js'])
  assert.match(source(path),/horse\.js\?v=alpha18-gaitmane-1/,path);
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
 const home=source('index.html');
 assert.match(home,/\/stadiums\/crypto\//,'Home now uses the stadium hub, not the deprecated scene entrypoint');
 const expected=[
  ['visual-lab/index.html',/scene\.js\?v=hoof-fx-public-20261104-v2/],
  ['parade/index.html',/parade\.js\?v=[\w.-]+/],
  ['racers/index.html',/racers\.js\?v=hoof-btc-fiche-20261104-v1/],
  ['racers/racers.js',/horse-preview\.js\?v=alpha18-gaitmane-1/]
 ];
 for(const [path,pattern] of expected)assert.match(source(path),pattern,path+' module cache identity missing');
});
