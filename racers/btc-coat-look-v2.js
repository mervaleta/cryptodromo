/**
 * BTC body finish, local to the opt-in 3D preview.
 * Adds microscopic pigment grain and directional sheen to existing coat
 * materials. No texture files, canvases, models, or body geometry changes.
 */
export const COAT_LOOK_VERSION='btc-fur-studio-v2';
export function applyBTCCoatLook(root){
 const materials=new Set();
 root.traverse(node=>{
  if(!node.isMesh)return;
  const m=Array.isArray(node.material)?node.material:[node.material];
  m.forEach(mat=>{
   if((mat?.name==='Main'||mat?.name==='Main_Light')&&!materials.has(mat)){
    materials.add(mat);
    mat.roughness=mat.name==='Main'?.53:.61;
    mat.metalness=0;
    const previous=mat.onBeforeCompile;
    const key=mat.customProgramCacheKey?.bind(mat);
    mat.onBeforeCompile=function(shader,renderer){
     previous?.call(this,shader,renderer);
     shader.vertexShader=shader.vertexShader.replace('#include <common>',
       '#include <common>\nvarying vec3 vCRPBTCFur;');
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
       '#include <begin_vertex>\nvCRPBTCFur=position;');
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
       '#include <common>\nvarying vec3 vCRPBTCFur;');
     const pigment=[
      'float crpGrain=fract(sin(dot(floor(vCRPBTCFur*6400.0),vec3(12.9898,78.233,43.719)))*43758.5453);',
      'float crpFurFib=sin(vCRPBTCFur.y*26000.0+vCRPBTCFur.x*2100.0)*sin(vCRPBTCFur.z*17300.0-vCRPBTCFur.y*1900.0);',
      'diffuseColor.rgb*=clamp(1.0+(crpGrain-.5)*.073+crpFurFib*.038,.87,1.13);'
     ].join('\n');
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
       '#include <color_fragment>\n'+pigment);
     shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
       '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(crpGrain-.5)*.095,.44,.84);');
     shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
       '#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(crpFurFib*.012,(crpGrain-.5)*.012,crpFurFib*.007));');
    };
    mat.customProgramCacheKey=()=>String(key?.()||'')+'|'+COAT_LOOK_VERSION;
    mat.needsUpdate=true;
   }
  });
 });
 return materials.size;
}
