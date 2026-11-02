import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trackPoint} from '../visual-lab/trackMath.js';
import {getRaceFixture} from '../race-lab/source/src/data/raceFixture.js';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js';
import {illustrativeRatios,BOTS} from '../apuestas/botRatios.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Alpha14 oval runout is continuous, monotonic and does not wrap',()=>{
 const p1=trackPoint('oval',1,5.5);
 let previous=p1;let previousTravel=0;
 for(let i=1;i<=700;i++){
  const p=1+i/2000,v=trackPoint('oval',p,5.5);
  const along=(v.x-p1.x)*p1.tangentX+(v.z-p1.z)*p1.tangentZ;
  assert.ok(along>=previousTravel-1e-5,'backwards oval runout');
  assert.ok(Math.hypot(v.x-previous.x,v.z-previous.z)<1.0,'teleport at finish');
  assert.ok(along<=1000+1e-6,'exceeded safely bounded runout');
  assert.ok(along>previousTravel+.3,'horse stopped abruptly in post-finish runout');
  previousTravel=along;previous=v;
 }
 assert.ok(Math.abs(trackPoint('oval',0,5.5).x-p1.x)<1e-6);
});
test('all 100 horse skins have marks, only 47 are bundled artwork',()=>{
 const livery=read('race-lab/source/src/horseLivery.js');
 assert.match(livery,/makeTickerSeal/);
 assert.match(livery,/tickerFallbacks:100-available.size/);
 assert.match(livery,/MAX_TEXTURES=24/);
 assert.match(livery,/texture2D\(cryptoFurLogo/);
 assert.doesNotMatch(livery,/fetch\('https?:/);
});
test('fixture and results pages share official price-based engine; betting demo cannot charge',()=>{
 for(const area of ['fixture','resultados','apuestas']){
  const html=read(area+'/index.html'),js=read(area+'/'+area+'.js');
  assert.match(html,/href="\/racers\/"/);
  assert.match(html,/href="\/estadisticas\/"/);
  assert.ok(js.includes("getRaceFixture"));
 }
 const results=read('resultados/resultados.js');
 assert.match(results,/const profiles=createOfficialRace\(race\.entries\)/);
 assert.match(results,/officialRanking\(profiles\)/);
 assert.match(results,/buildTrackSplits\(buildBroadcastProfiles\(profiles\)/);
 const bet=read('apuestas/index.html');
 assert.match(bet,/disabled aria-disabled="true"/);
 assert.match(bet,/Sin depósitos, tickets, pagos ni retiros/);
});
test('illustrative favorite bots normalize 12 horse probabilities, irrespective of official outcomes',()=>{
 const fixture=getRaceFixture(21,0),map=new Map(fixture.entries.map((runner,i)=>[runner.symbol,{
  wins:i+1,podiums:i+4,starts:80,averagePlace:5+(i%5)
 }]));
 const summary=illustrativeRatios(fixture.entries,map);
 assert.equal(summary.results.length,12);
 assert.equal(summary.bots.length,BOTS.length);
 assert.ok(Math.abs(summary.results.reduce((sum,x)=>sum+x.probability,0)-1)<1e-10);
 assert.ok(summary.results.every(x=>x.fairRatio>=1&&Number.isFinite(x.fairRatio)));
 const official=officialRanking(createOfficialRace(fixture.entries));
 assert.equal(official.length,12);
});
test('camera and lighting controls are aligned on both home and visual lab',()=>{
 for(const path of ['index.html','visual-lab/index.html']){
  const html=read(path);
  for(const id of ['camera-zoom','camera-angle','camera-height','light-spread','light-ambient','light-perimeter'])
   assert.ok(html.includes('id="'+id+'"'),path+' missing '+id);
  assert.match(html,/value="leader"/);assert.match(html,/value="grandstand"/);
 }
 const scene=read('visual-lab/scene.js');
 assert.match(scene,/mode==='leader'/);
 assert.match(scene,/mode==='orbit'/);
 assert.match(scene,/lightPerimeter\.checked/);
 const lighting=read('visual-lab/nightLights.js');
 assert.match(lighting,/poleCount=16/);
});
