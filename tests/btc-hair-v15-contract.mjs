import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../racers/btc-hair-v15.js',import.meta.url),'utf8');
const hair=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));

test('neck mane and tail are independent; anchoring prevents root drift',()=>{
 const mane=hair.hairRegionWeights(0,-.020,.044);
 const tail=hair.hairRegionWeights(0,.020,.016);
 assert.ok(mane.mane>.20&&mane.tail===0);
 assert.ok(tail.tail>.20&&tail.mane===0);
 assert.ok(hair.hairRegionWeights(0,-.020,.037).mane<.01);
 assert.ok(hair.hairRegionWeights(0,.020,.034).tail<.01);
});
test('only the validated original 510-vertex skinned Hair mesh passes',()=>{
 const mesh={isSkinnedMesh:true,geometry:{attributes:{position:{count:510}},
  boundingBox:{min:{y:-.029727,z:.014485},max:{y:.022233,z:.045763}}}};
 assert.equal(hair.isCompatibleHair(mesh),true);
 assert.equal(hair.isCompatibleHair({...mesh,isSkinnedMesh:false}),false);
 assert.equal(hair.isCompatibleHair({...mesh,geometry:{
  attributes:{position:{count:510}},
  boundingBox:{min:{y:-.2,z:.014485},max:{y:.022233,z:.045763}}
 }}),false);
});
test('existing Hair material gets two physical spring inputs and shader-only waves',()=>{
 const material={name:'Hair',roughness:.86,needsUpdate:false,
  onBeforeCompile(){},customProgramCacheKey(){return 'old';}};
 const mesh={isSkinnedMesh:true,material,geometry:{attributes:{position:{count:510}},
  boundingBox:{min:{y:-.029727,z:.014485},max:{y:.022233,z:.045763}}}};
 const root={traverse(fn){fn(mesh);}};
 const groom=hair.createBTCHairAtelier(root);
 assert.equal(groom.channelCount,1);
 assert.match(material.customProgramCacheKey(),/btc-mane-tail-v15/);
 const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',
  fragmentShader:'#include <common>\n#include <color_fragment>'};
 material.onBeforeCompile(shader,{});
 assert.match(shader.vertexShader,/crpHair15ManeWeight/);
 assert.match(shader.vertexShader,/crpHair15TailWeight/);
 assert.match(shader.fragmentShader,/crpHair15Fiber/);
 groom.update(.016,{wind:1.7,speed:1.15,phase:.45,running:true});
 assert.ok(groom.snapshot.mane!==0);
 assert.ok(groom.snapshot.tail!==0);
 assert.ok(groom.snapshot.air>0);
 groom.dispose();
 assert.equal(groom.channelCount,0);
 assert.equal(material.customProgramCacheKey(),'old');
 assert.equal(material.roughness,.66);
});
test('experimental effect adds no image textures, geometry or new race loop',()=>{
 assert.doesNotMatch(source,/GLTFLoader|TextureLoader|new Image\(|CanvasTexture|PlaneGeometry|new THREE\.Mesh/);
 assert.doesNotMatch(source,/createOfficialRace|raceFixture|createAlpha22RaceHorse/);
});
