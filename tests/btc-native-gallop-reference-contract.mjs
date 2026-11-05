import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('BTC viewer follows three.js Horse example: one authored mixer clip, no additive joint rotations',()=>{
 const horse=read('race-lab/source/src/horse.js');
 const viewer=read('racers/btc-atelier-preview.js');
 assert.match(horse,/gaitCorrectionStrength=\.40/,'race engine behavior remains unchanged by default');
 assert.match(horse,/createGaitRefiner\(model,\{strength:THREE\.MathUtils\.clamp/);
 assert.match(viewer,/gaitCorrectionStrength:0/,'BTC anatomy QA must expose native clip unmodified');
 assert.match(horse,/mixer\.update\(step\*rate\)/);
 assert.match(horse,/action\.time\/action\.getClip\(\)\.duration/);
 assert.match(viewer,/mode:paused\?'Idle':'Gallop'/);
});
