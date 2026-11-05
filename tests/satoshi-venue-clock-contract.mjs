import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allLiveTracks} from '../visual-lab/tripleLiveSchedule.js';
import {projectChannelCountdown} from '../assets/crypto-channel-countdown.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const check=date=>allLiveTracks(new Date(date)).map(projectChannelCountdown);

test('Satoshi stadium landing has dedicated venue clocks and no TV iframe controller',()=>{
 const page=read('stadiums/crypto/index.html');
 const controller=read('assets/crypto-stadium-clocks.js');
 assert.match(page,/src="\/assets\/crypto-stadium-clocks\.js\?v=copy-clean-20261105-v1"/);
 assert.doesNotMatch(page,/src="\/assets\/crypto-venue\.js/);
 assert.equal((page.match(/data-countdown/g)||[]).length,3);
 assert.equal((page.match(/data-track="(?:muybridge|genesis|vint-cerf)"/g)||[]).length,3);
 assert.match(controller,/projectChannelCountdown\(item\)/);
 assert.match(controller,/show\.secondsToNext/);
 assert.match(controller,/show\.label/);
 assert.doesNotMatch(controller,/tv-player|stadium-broadcast|frame\.src/);
});
test('14:42:14 local means 00:16 / 01:16 / 02:16 to the next start',()=>{
 const v=check('2026-11-04T17:42:14Z');
 assert.deepEqual(v.map(x=>x.secondsToNext),[16,76,136]);
 assert.deepEqual(v.map(x=>x.nextStart),['14:42:30','14:43:30','14:44:30']);
 assert.deepEqual(v.map(x=>x.nextRaceNumber),[295,295,295]);
 assert.deepEqual(v.map(x=>x.phase),['presentation','results','race']);
});
test('the next race start remains 60 seconds apart across boundaries and midnight',()=>{
 for(const iso of [
  '2026-11-04T17:42:29Z','2026-11-04T17:42:30Z',
  '2026-11-04T17:43:30Z','2026-11-04T17:44:30Z',
  '2026-11-05T02:59:29Z','2026-11-05T03:00:30Z'
 ]){
  const values=check(iso).map(x=>x.secondsToNext).sort((a,b)=>a-b);
  assert.deepEqual([values[1]-values[0],values[2]-values[1]],[60,60],iso);
  assert.ok(values.every(x=>x>0&&x<=180),iso);
 }
});
