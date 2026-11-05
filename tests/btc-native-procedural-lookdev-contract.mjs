import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const moduleText=read('race-lab/source/src/btcNativeLookdev.js');
const lookdev=await import('data:text/javascript;base64,'+Buffer.from(moduleText).toString('base64'));
test('native BTC coat layers real rest-space PBR without sprites or replacement geometry',()=>{
 const master=read('race-lab/source/src/horse.js');
 const pilot=read('racers/btc-atelier-preview.js');
 assert.match(master,/nativeLookdev=false/);
 assert.match(master,/symbol==='BTC'\?installBTCNativeLookdev/);
 assert.match(pilot,/nativeLookdev:token\.symbol==='BTC'/);
 assert.match(pilot,/gaitCorrectionStrength:0/);
 assert.match(pilot,/maneMotion:true/);
 assert.doesNotMatch(moduleText,/TextureLoader|CanvasTexture|SpriteMaterial|PlaneGeometry|DataTexture|\.png|\.jpg|\.webp/);
 assert.match(moduleText,/fwidth\(btcFiberCoord\)/);
 assert.match(moduleText,/fwidth\(btcFurRest\*110\.0\)/);
});
test('coexisting livery shader and native material PBR remain valid with preserved hooks',()=>{
 let priorCalls=0;
 const material={
  onBeforeCompile(shader){priorCalls++;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat existingLivery=1.0;');},
  customProgramCacheKey(){return 'existing-livery'}
 };
 const initial=material.onBeforeCompile;
 const obj=lookdev.installBTCNativeLookdev([{material,name:'Main'}]);
 assert.equal(obj.count,1);
 const shader={vertexShader:'#include <common>\nvoid main(){\n#include <begin_vertex>\n}',fragmentShader:'#include <common>\nvoid main(){\n#include <color_fragment>\n#include <roughnessmap_fragment>\n}'};
 material.onBeforeCompile(shader);
 assert.equal(priorCalls,1);
 assert.match(shader.vertexShader,/vBTCRestFur=position/);
 assert.match(shader.fragmentShader,/existingLivery/);
 assert.match(shader.fragmentShader,/btcFiberFade/);
 assert.match(shader.fragmentShader,/roughnessFactor=clamp/);
 assert.match(material.customProgramCacheKey(),/btc-native-lookdev.*existing-livery/);
 obj.dispose();
 assert.equal(material.onBeforeCompile,initial);
 assert.equal(material.customProgramCacheKey(),'existing-livery');
});
test('native lookdev skips non-coat meshes and avoids changing race defaults',()=>{
 const m={onBeforeCompile(){}};
 assert.equal(lookdev.installBTCNativeLookdev([{material:m,name:'Eye_Black'},{material:m,name:'Hooves'}]).count,0);
 const original=read('race-lab/source/src/horse.js');
 assert.match(original,/gaitCorrectionStrength=\.40,nativeLookdev=false/);
});
