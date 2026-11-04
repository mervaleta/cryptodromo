import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trackPoint} from '../visual-lab/trackMath.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('hoof impact debris tracks the tangent across every oval turn',()=>{
 for(let step=0;step<180;step++){
  const p=step/180;
  const c=trackPoint('oval',p,6);
  const dust={x:c.x-c.tangentX*5,z:c.z-c.tangentZ*5};
  assert.ok((c.x-dust.x)*c.tangentX+(c.z-dust.z)*c.tangentZ>4.99);
 }
 const scene=source('visual-lab/scene.js'),effects=source('visual-lab/hoofTerrainFX.js');
 // New contact system computes a local forward/side basis from each actual
 // hoof heading; no generic trailing cloud or straight-X-only footprint.
 assert.match(scene,/hoofFX\.stepHorse\(h\.index/);
 assert.match(effects,/Math\.cos\(heading\),fz=-Math\.sin\(heading\)/);
 assert.match(effects,/event\.x-fx\*back\+sx\*lateral/);
 assert.match(effects,/event\.z-fz\*back\+sz\*lateral/);
});
test('oval has one ground finish marker and XZ-tangent aligned stripe vertices',()=>{
 const visual=source('visual-lab/trackVisuals.js');
 assert.match(visual,/if\(mode!=='oval'\)stripeAt\(0\)/);
 assert.match(visual,/stripeAt\(1\)/);
 assert.match(visual,/c\.sideX\*w/);
 assert.match(visual,/c\.tangentX\*half/);
});
