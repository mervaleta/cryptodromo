import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Alpha07 bundles verified CC0 graphics, requests only runner logos, no sprites',()=>{
 const icons=readdirSync(new URL('../assets/crypto-logos/',import.meta.url)).filter(x=>x.endsWith('.svg'));
 assert.equal(icons.length,47,'Expected 47 audited SVGs, not full roster download');
 for(const name of ['btc.svg','eth.svg','sol.svg','bnb.svg','ada.svg','xrp.svg']){
  assert.ok(icons.includes(name),name);
  assert.match(read('assets/crypto-logos/'+name),/^<svg /);
 }
 const source=read('race-lab/source/src/horseLivery.js');
 assert.match(source,/canvas\.width=canvas\.height=128/);
 assert.match(source,/MAX_TEXTURES=24/);
 assert.match(source,/\bgetLogo\(symbol\)/);
 assert.match(source,/shader\.fragmentShader/);
 assert.match(source,/assets\/crypto-logos\//);
 assert.doesNotMatch(source,/https?:\/\//);
 const horse=read('race-lab/source/src/horse.js');
 assert.ok(horse.includes('createFurIdentity'));
 assert.doesNotMatch(horse,/new THREE\.Sprite\(/);
 assert.doesNotMatch(horse,/badgeMaterial|clothPanels|makeBadgeTexture/);
});
test('Alpha07 1-second official finish hold, fade-in and positive runout',()=>{
 const scene=read('visual-lab/scene.js'),html=read('visual-lab/index.html');
 assert.match(scene,/VISUAL_START_X=-320,VISUAL_FINISH_X=320/);
 assert.match(scene,/if\(elapsed>=61\)showOfficialResult\(\)/);
 assert.match(scene,/coastDistance\(p\.distanceAt60,exitVelocity,elapsed-60\)/);
 assert.match(scene,/trackFX\.stamp/);
 assert.match(scene,/trackFX\.update/);
 assert.match(html,/\.result-overlay\.is-visible\{opacity:1/);
 assert.match(html,/transition:opacity \.85s/);
 assert.match(scene,/resultsOverlay\.classList\.add\('is-visible'\)/);
 const ground=read('visual-lab/trackSurface.js');
 assert.match(ground,/new THREE\.InstancedMesh/);
 assert.match(ground,/puddleMat\.opacity=wetness/);
 assert.match(ground,/wetness=Math\.max\(0,wetness-dt/);
});
