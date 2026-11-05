/**
 * BTC native 3D lookdev, no image frames, billboards or replacement anatomy.
 * Operates in rest-space on the original Quaternius GLB coat. Derivative
 * filtering suppresses high-frequency fiber shimmer at stadium distances.
 * Compounds with the existing cryptocurrency livery shader.
 */
export const BTC_NATIVE_LOOKDEV_BUILD='btc-native-lookdev-20261105-v1';
const BEGIN='#include <begin_vertex>';
const COMMON='#include <common>';
const COLOR='#include <color_fragment>';
const ROUGHNESS='#include <roughnessmap_fragment>';
const PATCH_VERTEX=String.raw`
 varying vec3 vBTCRestFur;
`;
const PATCH_FRAGMENT=String.raw`
 varying vec3 vBTCRestFur;
`;
const PATCH_COLOR=String.raw`
 vec3 btcFurRest=vBTCRestFur;
 float btcFiberCoord=btcFurRest.y*1700.0+btcFurRest.z*380.0+
   0.45*sin(btcFurRest.x*270.0+btcFurRest.y*150.0);
 float btcFiberPx=fwidth(btcFiberCoord);
 float btcFiberFade=1.0-smoothstep(0.75,2.7,btcFiberPx);
 float btcFiberLine=sin(btcFiberCoord)*btcFiberFade;
 vec3 btcPatchCell=floor(btcFurRest*110.0);
 float btcPatch=fract(sin(dot(btcPatchCell,vec3(12.9898,78.233,37.719)))*43758.5453);
 float btcPatchFade=1.0-smoothstep(0.4,1.7,length(fwidth(btcFurRest*110.0)));
 float btcTone=(btcPatch-0.5)*btcPatchFade;
 diffuseColor.rgb*=clamp(1.0+btcFiberLine*0.014+btcTone*0.035,0.95,1.05);
`;
const PATCH_ROUGHNESS=String.raw`
 roughnessFactor=clamp(roughnessFactor+0.015*abs(btcFiberLine)+0.008*abs(btcTone),0.57,0.95);
`;

export function installBTCNativeLookdev(bindings){
 const undo=[];
 for(const {material,name} of bindings){
  if(name!=='Main'&&name!=='Main_Light')continue;
  if(!material||typeof material.onBeforeCompile!=='function')continue;
  const oldCompile=material.onBeforeCompile;
  const oldKey=material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile=function(shader,renderer){
   oldCompile.call(this,shader,renderer);
   const vertex=shader.vertexShader||'',fragment=shader.fragmentShader||'';
   if(!vertex.includes(BEGIN)||!vertex.includes(COMMON)||
      !fragment.includes(COMMON)||!fragment.includes(COLOR)||!fragment.includes(ROUGHNESS))
    return;
   shader.vertexShader=vertex.replace(COMMON,COMMON+'\n'+PATCH_VERTEX)
      .replace(BEGIN,BEGIN+'\nvBTCRestFur=position;');
   shader.fragmentShader=fragment.replace(COMMON,COMMON+'\n'+PATCH_FRAGMENT)
      .replace(COLOR,COLOR+'\n'+PATCH_COLOR)
      .replace(ROUGHNESS,ROUGHNESS+'\n'+PATCH_ROUGHNESS);
  };
  material.customProgramCacheKey=()=>BTC_NATIVE_LOOKDEV_BUILD+'|'+(oldKey?.()||'');
  material.needsUpdate=true;
  undo.push({material,oldCompile,oldKey});
 }
 return {count:undo.length,dispose(){
  for(const item of undo){
   item.material.onBeforeCompile=item.oldCompile;
   item.material.customProgramCacheKey=item.oldKey;
   item.material.needsUpdate=true;
  }
  undo.length=0;
 }};
}
