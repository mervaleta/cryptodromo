/**
 * Satin horse coat · BTC studio iteration 5.
 * Applies only to the original imported GLB's body materials.
 * Analytic fiber direction and pigment breakup, no image textures.
 */
export const COAT_LOOK_VERSION='btc-studio-satin-coat-v3';
export function applyBTCCoatLook(root){
 const changed=new Set();
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  for(const material of [mesh.material].flat()){
   if(!material||!['Main','Main_Light'].includes(material.name)||
     changed.has(material))continue;
   changed.add(material);
   material.roughness=material.name==='Main'?.77:.81;
   material.metalness=0;
   const previous=material.onBeforeCompile;
   const cacheKey=material.customProgramCacheKey?.bind(material);
   material.onBeforeCompile=function(shader,renderer){
    previous?.call(this,shader,renderer);
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vStudioFur;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvStudioFur=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vStudioFur;');
    const grain=[
      'float crpFiber=sin(vStudioFur.y*10900.0+vStudioFur.x*1900.0)*sin(vStudioFur.z*9700.0-vStudioFur.y*1450.0);',
      'float crpSoft=sin(vStudioFur.x*540.0+vStudioFur.y*760.0)*sin(vStudioFur.z*770.0-vStudioFur.y*510.0);',
      'float crpPigment=fract(sin(dot(floor(vStudioFur*1650.0),vec3(13.02,71.89,48.81)))*37627.11);',
      'diffuseColor.rgb*=clamp(.985+.022*crpFiber+.045*crpSoft+(crpPigment-.5)*.042,.89,1.08);'
    ].join('\n');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n'+grain);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(crpPigment-.5)*.055+crpFiber*.027,.65,.96);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
      '#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(crpFiber*.004,crpSoft*.003,crpFiber*.002));');
   };
   material.customProgramCacheKey=()=>String(cacheKey?.()||'')+'|'+COAT_LOOK_VERSION;
   material.needsUpdate=true;
  }
 });
 return changed.size;
}
