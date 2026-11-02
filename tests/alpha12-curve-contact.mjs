import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trackPoint} from '../visual-lab/trackMath.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('dust trails track the horse heading across all oval turns',()=>{
 for(let step=0;step<180;step++){
  const p=step/180;
  const c=trackPoint('oval',p,6);
  const dust={x:c.x-c.tangentX*5,z:c.z-c.tangentZ*5};
  assert.ok((c.x-dust.x)*c.tangentX+(c.z-dust.z)*c.tangentZ>4.99);
 }
 const scene=source('visual-lab/scene.js');
 assert.match(scene,/direction\.tangentX\*trail/);
 assert.match(scene,/direction\.tangentZ\*trail/);
});
test('oval has one ground finish marker and XZ-tangent aligned stripe vertices',()=>{
 const visual=source('visual-lab/trackVisuals.js');
 assert.match(visual,/if\(mode!=='oval'\)stripeAt\(0\)/);
 assert.match(visual,/stripeAt\(1\)/);
 assert.match(visual,/c\.sideX\*w/);
 assert.match(visual,/c\.tangentX\*half/);
});
