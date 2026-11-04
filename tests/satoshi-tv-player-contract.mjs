import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 readTvReplay,buildTvPlayerUrl,isRaceDocument,findRacePlayerSource,RACE_PLAYER_SOURCES
} from '../assets/satoshi-tv-contract.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const live=read('stadiums/crypto/live/index.html');
const broadcast=read('stadiums/crypto/broadcast/index.html');
const lab=read('visual-lab/index.html');
const archive=read('assets/crypto-archive.js');
const tv=read('assets/crypto-venue.js');
const scene=read('visual-lab/scene.js');

test('TV controller has exactly one paused-by-default 3D frame and three actionable channels',()=>{
 assert.equal((live.match(/<iframe\b/g)||[]).length,1);
 assert.match(live,/<iframe id="stadium-broadcast"[^>]*src="about:blank"/);
 assert.equal((live.match(/data-tv-tune="/g)||[]).length,3);
 for(const id of ['muybridge','genesis','vint-cerf'])assert.match(live,new RegExp('data-tv-tune="'+id+'"'));
 for(const id of ['tv-loading','tv-error','tv-live-now','tv-replay-again','tv-audio','tv-fullscreen','tv-direct'])assert.ok(live.includes('id="'+id+'"'),id);
 assert.match(live,/satoshi-tv\.css\?v=satoshi-tv-director-v1-20261104/);
 assert.match(tv,/findRacePlayerSource/);
 assert.match(tv,/window\.self===window\.top/);
 assert.match(tv,/tvNestedHub='blocked'/);
 assert.match(tv,/validFrameDoc/);
 assert.match(tv,/setError/);
 assert.doesNotMatch(tv,/\/stadiums\/crypto\/broadcast\/\?track=/);
});
test('strict source recognition rejects Hostinger fallback to another live hub',async()=>{
 assert.ok(isRaceDocument(broadcast));
 assert.ok(isRaceDocument(lab));
 assert.equal(isRaceDocument(live),false);
 assert.equal(isRaceDocument('<html><body>Forbidden</body></html>'),false);
 const calls=[];
 const mock=async path=>{
  calls.push(path);
  return {ok:true,async text(){return path===RACE_PLAYER_SOURCES[0]?live:lab;}};
 };
 assert.equal(await findRacePlayerSource(mock),RACE_PLAYER_SOURCES[1]);
 assert.deepEqual(calls,RACE_PLAYER_SOURCES);
 assert.equal(await findRacePlayerSource(async()=>({ok:false,async text(){return'';}})),null);
});
test('valid live and archived paths always resolve to explicit race HTML, never a recursive hub',()=>{
 for(const id of ['muybridge','genesis','vint-cerf']){
  const url=buildTvPlayerUrl(RACE_PLAYER_SOURCES[0],id);
  assert.ok(url.startsWith('/stadiums/crypto/broadcast/index.html?'));
  assert.ok(url.includes('embed=tv'));
  assert.ok(url.includes('track='+id));
  assert.ok(!url.includes('/live/'));
 }
 assert.deepEqual(readTvReplay('?replayDay=6&replayMinute=1438','genesis'),{
  day:6,minute:1438,trackId:'genesis'
 });
 assert.equal(readTvReplay('?replayDay=6&replayMinute=1438','vint-cerf'),null);
 assert.equal(readTvReplay('?replayDay=7&replayMinute=1438','genesis'),null);
 assert.equal(readTvReplay('?replayDay=-1&replayMinute=1438','genesis'),null);
 assert.equal(readTvReplay('?replayDay=6&replayMinute=1440','muybridge'),null);
 const replay=readTvReplay('?replayDay=4&replayMinute=1400','vint-cerf');
 assert.ok(buildTvPlayerUrl(RACE_PLAYER_SOURCES[1],'vint-cerf',replay).includes('replayDay=4&replayMinute=1400'));
 assert.throws(()=>buildTvPlayerUrl('/stadiums/crypto/live/index.html','genesis'),RangeError);
 assert.throws(()=>buildTvPlayerUrl(RACE_PLAYER_SOURCES[0],'other'),RangeError);
});
test('embedded race isolates stage but preserves race engine DOM, scoring and archive links',()=>{
 for(const doc of [broadcast,lab]){
  assert.match(doc,/tv-embed/);
  assert.match(doc,/html\.tv-embed \.stage/);
  assert.match(doc,/id="raceCanvas"/);
  assert.match(doc,/id="start"/);
 }
 assert.match(scene,/if\(hasReplay&&broadcastQuery\.get\('embed'\)==='tv'\)/);
 assert.match(scene,/start\.click\(\)/);
 assert.match(archive,/\/stadiums\/crypto\/live\/\?track=/);
 assert.match(archive,/replayDay/);
 assert.match(archive,/#tv-station/);
 assert.doesNotMatch(archive,/link\.href='\/stadiums\/crypto\/broadcast\/\?/);
 const js=read('visual-lab/presentationHorse.js');
 assert.match(js,/if\(!container\)/);
 assert.match(js,/catch\(error\)/);
});
