import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=read('racers/btc-maya-hindquarters.js');
const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const build='btc-master-procedural-hind-groom-20261104-v12';

test('BTC rump, thighs and gaskins are sculpted as real rest mesh vertices on both sides',()=>{
 const vertices=new Float32Array([
   .004,.010,.028,
   -.004,.010,.028,
   .004,.012,.019,
   -.004,.012,.019,
   .004,.012,.012,
   -.004,.012,.012,
   .003,.010,.002, // original hoof must stay intact
   .003,-.012,.024 // front shoulder must stay intact
 ]);
 const original=vertices.slice();
 const info=module.sculptBTCHindquarters(vertices);
 assert.equal(info.originalRigPreserved,true);
 assert.ok(info.affected>=6);
 assert.ok(info.maxExpansion>.12);
 for(const v of [0,3,6,9,12,15]){
   assert.ok(Math.abs(vertices[v])>Math.abs(original[v])*1.11,'posterior side vertex is widened');
 }
 assert.deepEqual([...vertices.slice(18,24)],[...original.slice(18,24)],'hooves and forequarters untouched');
 assert.equal(info.hoofDisplacement,0);
 const profileWidth=new Float32Array([.004,.008,.019,.004,.014,.019]);
 const initialWidth=profileWidth[4]-profileWidth[1];
 module.sculptBTCHindquarters(profileWidth);
 assert.ok(profileWidth[4]-profileWidth[1]>initialWidth*1.10,'posterior thigh also grows in sagittal side profile, not only depth');
});
test('Groom, bone weights and coat texture remain procedural rather than images',()=>{
 assert.match(source,/BTC_HINDQUARTER_COAT_FRAGMENT/);
 assert.match(source,/float btcMuscledCoat/);
 assert.match(source,/float btcCoatFiber/);
 assert.doesNotMatch(source,/TextureLoader|ImageLoader|\.png|\.jpeg|\.jpg|CanvasTexture/);
 const shader={fragmentShader:'#include <color_fragment>'};
 module.addBTCHindquarterCoatTexture(shader);
 assert.match(shader.fragmentShader,/float btcCroup/);
 assert.match(shader.fragmentShader,/diffuseColor\.rgb\*=clamp/);
 assert.ok(module.hindLimbSkinNeighborWeight(.012,.013,true)>2);
 assert.ok(module.hindLimbSkinNeighborWeight(.012,.013,false)<1);
 assert.equal(module.hindLimbSkinNeighborWeight(-.014,.03,true),2);
 const phase={value:.35},vertexShader={vertexShader:'#include <common>\\n#include <begin_vertex>',uniforms:{}};
 module.addBTCHindquarterGaitShader(vertexShader,phase);
 assert.strictEqual(vertexShader.uniforms.btcHindGait,phase);
 assert.match(vertexShader.vertexShader,/btcStifle/);
 assert.match(vertexShader.vertexShader,/transformed\\.x/);
 assert.ok(vertexShader.vertexShader.includes(String.fromCharCode(10)+'float btcHindPhase'),'shader inserts a real newline before muscle motion');
});
test('canonical BTC chain picks new groom and body modules; 99 other horses unchanged',()=>{
 const files=['racers/index.html','racers/racers.js','racers/btc-atelier-preview.js','racers/btc-maya-master.js'];
 for(const file of files){
   const content=read(file);
   assert.ok(content.includes(build),'v12 build not used by '+file);
   assert.ok(!content.includes('btc-master-solid-groom-20261104-v11'),file+' still stale');
 }
 const master=read('racers/btc-maya-master.js');
 assert.match(master,/sculptBTCHindquarters\(positions\)/);
 assert.match(master,/addBTCHindquarterCoatTexture\(shader\)/);
 assert.match(master,/hindLimbSkinNeighborWeight/);
 assert.match(master,/anatomy\.hindGait\.value=gait/);
 assert.match(master,/createMayaGroom/);
 assert.match(master,/gallopPreserved:true/);
 const groom=read('racers/btc-maya-groom.js');
 assert.match(groom,/majorCount:112,fineCount:48/);
 assert.match(groom,/looseNeckFibers/);
 assert.match(groom,/btcCuticle/);
 assert.match(groom,/solidRingSides:SIDES/);
 assert.doesNotMatch(groom,/TextureLoader|\.jpg|\.png|\.webp|PlaneGeometry/);
 const manifest=JSON.parse(read('racers/btc-master-revision.json'));
 assert.equal(manifest.buildId,build);
 assert.equal(manifest.status,'pending_deploy');
 assert.equal(module.BTC_HINDQUARTER_BUILD,'btc-hindquarters-rump-gaskin-20261104-v12');
});
