/**
 * Analytic PBR fur, no image textures, no procedural PNG, no SVG, no sprites.
 * Surface coordinates are local to generated anatomy and travel with animation.
 */
export const FUR_SHADER_VERSION='crp-analytic-coat-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):a));
const GLSL=[
 'varying vec3 vCRPLocal;',
 'uniform float crpWetness;',
 'uniform float crpMud;',
 'uniform float crpSeed;',
 'uniform float crpFleck;',
 'float crpHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}',
 'float crpNoise(vec3 p){',
 ' vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
 ' return mix(mix(mix(crpHash(i),crpHash(i+vec3(1,0,0)),f.x),',
 '   mix(crpHash(i+vec3(0,1,0)),crpHash(i+vec3(1,1,0)),f.x),f.y),',
 '   mix(mix(crpHash(i+vec3(0,0,1)),crpHash(i+vec3(1,0,1)),f.x),',
 '   mix(crpHash(i+vec3(0,1,1)),crpHash(i+vec3(1,1,1)),f.x),f.y),f.z);',
 '}'
].join('\n');
const COAT_COLOR=[
 'float crpBroad=crpNoise(vCRPLocal*8.8+vec3(crpSeed*.01));',
 'float crpMid=crpNoise(vCRPLocal*41.+vec3(crpSeed*.029));',
 'float crpGrain=crpHash(floor(vCRPLocal*225.+vec3(crpSeed)));',
 'float crpFiber=sin(vCRPLocal.x*381.+vCRPLocal.y*188.)*sin(vCRPLocal.y*347.-vCRPLocal.z*291.);',
 'float crpPattern=(crpBroad-.5)*.13+(crpMid-.5)*.065+(crpGrain-.5)*.095+crpFiber*.013;',
 'diffuseColor.rgb*=clamp(1.+crpPattern*(.65+crpFleck),.72,1.28);',
 'diffuseColor.rgb*=1.-crpWetness*.21;',
 'float crpDirt=smoothstep(.43,.82,crpNoise(vCRPLocal*18.+vec3(crpSeed)));',
 'diffuseColor.rgb*=1.-crpMud*crpDirt*.29;'
].join('\n');
const ROUGHNESS_COLOR=[
 'roughnessFactor=clamp(roughnessFactor+',
 '(crpHash(floor(vCRPLocal*260.+vec3(crpSeed)))-.5)*.11-',
 'crpWetness*.24+crpMud*.08,.28,.98);'
].join('\n');
export function createAnalyticFurMaterial(THREE,{coat='#734a35',roughness=.75,seed=1,
 fleck=.7,wetness=0,mud=0}={}){
 if(!THREE?.MeshPhysicalMaterial)throw Error('THREE.MeshPhysicalMaterial required');
 const uniforms={wet:{value:clamp(wetness,0,1)},mud:{value:clamp(mud,0,1)},
  seed:{value:Math.max(0,Number(seed)||0)},fleck:{value:clamp(fleck,0,1.5)}};
 const material=new THREE.MeshPhysicalMaterial({
  color:new THREE.Color(coat),roughness,metalness:0,
  clearcoat:.08,clearcoatRoughness:.45
 });
 material.onBeforeCompile=shader=>{
  shader.uniforms.crpWetness=uniforms.wet;
  shader.uniforms.crpMud=uniforms.mud;
  shader.uniforms.crpSeed=uniforms.seed;
  shader.uniforms.crpFleck=uniforms.fleck;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vCRPLocal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvCRPLocal=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\n'+GLSL);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\n'+COAT_COLOR);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
   '#include <roughnessmap_fragment>\n'+ROUGHNESS_COLOR);
 };
 material.customProgramCacheKey=()=>FUR_SHADER_VERSION;
 material.needsUpdate=true;
 function setLook({color,wetness:wet,mud:dirt,fleck:detail}={}){
  if(color)material.color.set(color);
  if(wet!==undefined)uniforms.wet.value=clamp(wet,0,1);
  if(dirt!==undefined)uniforms.mud.value=clamp(dirt,0,1);
  if(detail!==undefined)uniforms.fleck.value=clamp(detail,0,1.5);
 }
 return {material,setLook,uniforms,dispose(){material.dispose();}};
}
export function makeSurfaceMaterial(THREE,color,{roughness=.8,metalness=0,clearcoat=0,
 clearcoatRoughness=.35}={}){
 return new THREE.MeshPhysicalMaterial({color:new THREE.Color(color),roughness,metalness,
  clearcoat,clearcoatRoughness});
}
export function verifyTextureFreeMaterial(root){
 const issues=[];
 root.traverse(node=>{
  if(!node.isMesh)return;
  const mats=Array.isArray(node.material)?node.material:[node.material];
  for(const mat of mats)for(const prop of ['map','normalMap','roughnessMap',
   'bumpMap','displacementMap','alphaMap','emissiveMap']){
   if(mat?.[prop])issues.push(node.name+':'+prop);
  }
 });
 return {textureFree:issues.length===0,violations:issues};
}
