import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {
 addBTCEquineCoatLookdev,
 BTC_COAT_LOOKDEV_BUILD
} from '../racers/btc-maya-coat-lookdev.js';

const master=readFileSync(new URL('../racers/btc-maya-master.js',import.meta.url),'utf8');
const fragment='#include <common>\nvarying vec3 vBTCMayaRest;\nvoid main(){\n#include <color_fragment>\n#include <roughnessmap_fragment>\n}';

test('BTC master integrates the isolated procedural coat through the existing PBR shader',()=>{
 assert.match(master,/addBTCHindquarterCoatTexture\(shader\)/,'The visible Maya coat must use the actual registered PBR shader');
 assert.match(master,/roughnessFactor=clamp/,'PBR roughness filtering must remain in production');
 assert.match(master,/createBTCNativeHindLimbRepair/,'The native Gallop donor must inherit the actual Maya coat material');
 assert.match(master,/createBTCHeroMaya/);
 assert.match(master,/Gallop/);
});
test('microfur inserts exactly once and is footprint-filtered without geometry edits',()=>{
 const shader={fragmentShader:fragment,vertexShader:''};
 addBTCEquineCoatLookdev(shader);
 assert.equal((shader.fragmentShader.match(/float btcFiberFootprint=/g)||[]).length,1);
 assert.match(shader.fragmentShader,/fwidth\(btcLongitudinal\)/);
 assert.match(shader.fragmentShader,/smoothstep\(0\.9,2\.9,btcFiberFootprint\)/);
 assert.match(shader.fragmentShader,/roughnessFactor=clamp/);
 assert.doesNotMatch(shader.fragmentShader,/discard|gl_FragDepth|uniform sampler/);
 assert.match(BTC_COAT_LOOKDEV_BUILD,/btc-master-microfur/);
});
test('shader refuses incomplete or wrong host shaders',()=>{
 assert.throws(()=>addBTCEquineCoatLookdev({fragmentShader:'#include <color_fragment>'}),/requires the Maya/);
});
