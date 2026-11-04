import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWinnerSlowMotion,WINNER_REPLAY_DURATION,WINNER_REPLAY_POST_HOLD} from '../visual-lab/winnerSlowMotion.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('winner photo-finish must hold two seconds after slow motion before showing official results',()=>{
 const slow=createWinnerSlowMotion();
 assert.equal(WINNER_REPLAY_POST_HOLD,2.2);
 assert.equal(slow.begin(0,'BTC'),true);
 slow.advance(WINNER_REPLAY_DURATION);
 assert.equal(slow.state.phase,'holding');
 assert.equal(slow.state.active,true);
 assert.equal(slow.state.complete,false);
 assert.equal(slow.state.sampleTime,60);
 slow.advance(1.5);
 assert.equal(slow.state.phase,'holding');
 slow.advance(.7);
 assert.equal(slow.state.complete,true);
 slow.reset();
 assert.equal(slow.configure({speed:.25,pre:4,hold:3}),true);
 assert.equal(slow.begin(4,'ETH'),true);
 assert.equal(slow.state.speed,.25);
 assert.equal(slow.state.duration,16);
 slow.advance(16);
 assert.equal(slow.state.phase,'holding');
 slow.advance(3);
 assert.equal(slow.state.complete,true);
 assert.equal(slow.configure({speed:30,pre:3,hold:2}),false);
});
test('photo finish uses a fixed lateral camera oriented perpendicular to direction of travel',()=>{
 const s=read('visual-lab/scene.js');
 assert.match(s,/const line=trackPoint\(layoutMode,1,horse.index\)/);
 assert.match(s,/goal\.set\(line\.x\+line\.sideX\*24-line\.tangentX\*\.65/);
 assert.match(s,/target\.set\(line\.x\+line\.tangentX\*\.75/);
 assert.doesNotMatch(s,/goal\.set\(p\.x-p\.tangentX\*16\+p\.sideX\*12/);
 assert.match(s,/if\(finishShown\|\|winnerReplay\.state\.active\)return;/);
});
test('trees clear the grandstands; West stand and its crowd move together',()=>{
 const scene=read('visual-lab/scene.js'),village=read('parade/scenery.js');
 assert.match(scene,/z=back\?-153-r\(\)\*16:132\+r\(\)\*22/);
 assert.match(scene,/section===2\?9:0/);
 assert.match(village,/const frontOffset=i===2\?9:0/);
 assert.match(village,/z=-107-row\*2\.6\+\(s===2\?9:0\)/);
 assert.doesNotMatch(scene,/box\(3\.5,\.65,2,x,\.16,-22\.9/);
});
test('raised planters do not occupy straight/oval racecourse envelopes',()=>{
 const density=read('visual-lab/stadiumDensity.js');
 const scene=read('visual-lab/scene.js');
 assert.doesNotMatch(density,/planters\.push\(/);
 assert.doesNotMatch(density,/instance\('Concourse · planted separators'/);
 assert.match(density,/root\.visible=mode==='straight'/);
 assert.match(scene,/stadiumDensity\.setLayout\(mode\)/);
});
test('split markers are ground-level, off course, and do not span all lanes',()=>{
 const markers=read('visual-lab/trackSplitMarkers.js');
 assert.match(markers,/new THREE\.CylinderGeometry\(\.075,\.105,\.7,7\)/);
 assert.match(markers,/sprite\.position\.y=\.91;sprite\.scale\.set\(2\.5,\.88,1\)/);
 assert.match(markers,/trackPoint\(layout,p,15\.0\)/);
 assert.match(markers,/item\.stripe\.scale\.x=1\.2/);
 assert.doesNotMatch(markers,/item\.stripe\.scale\.x=length/);
});
test('hoof dust has shorter lifetime, lower emission, smaller alpha and progressive fade-out',()=>{
 const fx=read('visual-lab/hoofTerrainFX.js');
 assert.match(fx,/cinematic:\{particles:760,rate:\.58/);
 assert.match(fx,/Math\.pow\(1-t,2\.6\)/);
 assert.match(fx,/\.10\+random\(\)\*\.10/);
 assert.match(fx,/\.37\+random\(\)\*\.37/);
});
test('every TV quick-access icon opens an adjustable submenu that persists on channel switch',()=>{
 const html=read('stadiums/crypto/live/index.html');
 const tv=read('assets/crypto-venue.js');
 const params=read('assets/satoshi-tv-submenus.js');
 assert.ok(html.includes('id="tv-control-detail"'));
 assert.ok(html.includes('data-tv-replay-panel'));
 for(const group of ['camera','weather','light','hour','stage','replay'])
  assert.match(params,new RegExp(' '+group+':\\['));
 for(const field of ['camera-zoom','rain-intensity','light-dimmer','light-color','daytime',
  'tv-scenery-crowd','tv-scenery-trees','tv-scenery-splits','tv-replay-hold'])
  assert.ok(params.includes("'"+field+"'"),field);
 assert.match(tv,/createTvParameterMenus/);
 assert.match(tv,/parameterDeck\.apply\(\)/);
 assert.match(params,/event\.target\.closest/);
 assert.match(params,/CRP_TV_SCENERY/);
 assert.match(params,/CRP_TV_REPLAY/);
 assert.match(read('visual-lab/scene.js'),/event\.origin!==location\.origin/);
 assert.match(read('visual-lab/scene.js'),/winnerReplay\.configure\(opts\)/);
 assert.equal((html.match(/<iframe\b/g)||[]).length,1);
});
