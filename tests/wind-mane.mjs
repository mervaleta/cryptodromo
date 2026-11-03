import test from 'node:test';
import assert from 'node:assert/strict';
import {createWindMane,isSupportedManeGeometry,maneTipWeight} from '../race-lab/source/src/windMane.js';

function mesh(){
 const bbox={min:{x:-.0022,y:-.0298,z:.0144},max:{x:.0022,y:.0223,z:.0458}};
 return {isSkinnedMesh:true,geometry:{attributes:{position:{count:510}},boundingBox:bbox}};
}
function material(){
 return {needsUpdate:false,onBeforeCompile(){},customProgramCacheKey(){return 'base-hair';}};
}

test('mane mask moves neck tips, not tail, roots or lower coat',()=>{
 assert.ok(maneTipWeight(0,-.022,.045)>0.9);
 assert.equal(maneTipWeight(0,.020,.033),0,'tail stays unmodified');
 assert.equal(maneTipWeight(0,-.013,.0363),0,'mane roots remain anchored');
 assert.equal(maneTipWeight(0,-.004,.045),0,'outside neck region');
});

test('only compatible skinned Hair geometry receives the effect',()=>{
 assert.equal(isSupportedManeGeometry(mesh()),true);
 assert.equal(isSupportedManeGeometry({...mesh(),isSkinnedMesh:false}),false);
 assert.equal(isSupportedManeGeometry({...mesh(),geometry:{attributes:{position:{count:510}},boundingBox:{min:{x:-.1,y:-1,z:-1},max:{x:.1,y:1,z:1}}}}),false);
 const mat=material(),coat=material(),hairMesh=mesh();
 const fx=createWindMane([
  {material:mat,name:'Hair',mesh:hairMesh},
  {material:coat,name:'Main',mesh:hairMesh}
 ],{seed:.15});
 assert.equal(fx.enabled,true);
 assert.equal(fx.channelCount,1);
 assert.equal(mat.needsUpdate,true);
 assert.equal(coat.needsUpdate,false);
 assert.match(mat.customProgramCacheKey(),/crp-mane-wind-v1/);
});

test('shader animates rest-space hair before skinning, preserving original shader',()=>{
 const mat=material(),fx=createWindMane([{material:mat,name:'Hair',mesh:mesh()}]);
 const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>\n#include <skinning_vertex>',fragmentShader:'unchanged'};
 mat.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.indexOf('crpManeTip')<shader.vertexShader.indexOf('#include <skinning_vertex>'));
 assert.match(shader.vertexShader,/transformed\.z\+=crpManeTip/);
 assert.match(shader.vertexShader,/positive Y is the TAIL/);
 assert.equal(shader.fragmentShader,'unchanged');
 assert.equal(shader.uniforms.crpManeTime.value,0);
 fx.update(.1,{wind:1.6,speed:2.2});
 assert.ok(shader.uniforms.crpManeTime.value>0);
 assert.ok(shader.uniforms.crpManeMotion.value>.6);
 fx.update(.1,{wind:2,speed:3,reducedMotion:true});
 assert.equal(shader.uniforms.crpManeMotion.value,0);
 fx.dispose();assert.equal(fx.enabled,false);
});

test('unsupported replacement rig degrades to no effect without throwing',()=>{
 const fx=createWindMane([{material:material(),name:'Hair',mesh:{isSkinnedMesh:false}}]);
 assert.equal(fx.enabled,false);
 fx.update(0.1,{wind:1.6});
 fx.dispose();
});

test('shader keys are stable across all 12 horse instances',()=>{
 const keys=Array.from({length:12},(_,i)=>{
  const mat=material();createWindMane([{material:mat,name:'Hair',mesh:mesh()}],{seed:i*.11});
  return mat.customProgramCacheKey();
 });
 assert.equal(new Set(keys).size,1,'no shader program proliferation');
});
