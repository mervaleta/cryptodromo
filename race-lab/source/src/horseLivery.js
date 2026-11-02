import * as THREE from 'three';

/** Official symbol graphics where supported: spothq/cryptocurrency-icons CC0.
 * Logos are projected in the PBR horse skin shader, not meshes, flags or tickers.
 * Unavailable graphics leave the flank plain rather than showing a fake logo.
 */
// Audited against the repository SVG filenames. SKY was deliberately excluded
// because the old ticker icon does not identify the newer Sky crypto project.
const available=new Set('BTC ETH SOL BNB XRP DOGE LINK ADA TRX ZEC XMR XLM BCH LTC AVAX DOT AAVE UNI ICP ETC FIL ATOM QNT ALGO VET GRT CRV MANA SAND CHZ STX THETA XTZ KCS COMP SNX 1INCH LPT ZIL BAT SUSHI DASH NEO KSM ENJ GNO RAY'.split(' '));
const MAX_TEXTURES=24; // current 12 runners plus one previous set, never all 100
const cache=new Map();
const transparent=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1,THREE.RGBAFormat);
transparent.needsUpdate=true;
export function liveryPalette(coat,accent){
 const c=new THREE.Color(accent),fur=new THREE.Color(coat),l={};c.getHSL(l);
 fur.lerp(c,l.l>.85?.27:l.l<.16?.40:.55);
 const mane=c.clone().lerp(new THREE.Color('#131917'),.48);
 const tail=mane.clone().lerp(fur,.12);
 return {fur,mane,tail,fleck:fur.clone().lerp(new THREE.Color('#d8ddcd'),.13)};
}
export function supportedLogo(symbol){return available.has(String(symbol||'').toUpperCase());}
function getLogo(symbol){
 const key=String(symbol||'').toUpperCase();
 if(!supportedLogo(key))return Promise.resolve(null);
 if(cache.has(key)){
   const promise=cache.get(key);
   cache.delete(key);cache.set(key,promise);return promise;
 }
 const promise=new Promise(resolve=>{
  // SVG is local. Only active horses request their mark, never the full roster.
  const image=new Image();
  image.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
   const ctx=canvas.getContext('2d');
   ctx.clearRect(0,0,128,128);ctx.drawImage(image,6,6,116,116);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;
   resolve(texture);
  };
  image.onerror=()=>resolve(null);
  image.src='/assets/crypto-logos/'+key.toLowerCase()+'.svg';
 });
 cache.set(key,promise);
 while(cache.size>MAX_TEXTURES){
  const oldest=cache.keys().next().value,prior=cache.get(oldest);
  cache.delete(oldest);
  // No longer needed by a new race. Dispose once the texture exists.
  prior.then(texture=>texture?.dispose());
 }
 return promise;
}
export const liveryCacheStats=()=>({textures:cache.size,maxTextures:MAX_TEXTURES,iconsBundled:available.size});

/** Apply additive dyed pattern to material shader; follows skinned vertices. */
function tattoo(mesh,material,uniforms){
 const geo=mesh.geometry;if(!geo?.attributes?.position)return;
 geo.computeBoundingBox();const b=geo.boundingBox;
 const dims=new THREE.Vector3();b.getSize(dims);
 if(Math.max(dims.x,dims.z)<.3||dims.y<.4)return;
 const long=dims.x>dims.z?'x':'z',side=long==='x'?'z':'x';
 const axis='vFurLocal.'+long,sideAxis='vFurLocal.'+side;
 const center=(b.min[long]+b.max[long])*.5,sideCenter=(b.min[side]+b.max[side])*.5;
 const halfSide=Math.max(.12,dims[side]*.5),horizontal=Math.max(.14,dims[long]*.36);
 const vertical=Math.max(.1,dims.y*.22),verticalCenter=b.min.y+dims.y*.59;
 const entry={value:transparent};uniforms.push(entry);
 material.onBeforeCompile=shader=>{
  shader.uniforms.cryptoFurLogo=entry;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFurLocal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFurLocal=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vFurLocal;\nuniform sampler2D cryptoFurLogo;');
  const source='vec2 furUV=vec2(('+axis+'-'+center.toFixed(5)+')/'+horizontal.toFixed(5)+'+.5,'+
   '(vFurLocal.y-'+verticalCenter.toFixed(5)+')/'+vertical.toFixed(5)+'+.5);'+
   'float inFlank=step(0.,furUV.x)*step(furUV.x,1.)*step(0.,furUV.y)*step(furUV.y,1.);'+
   'float sideMask=smoothstep(.15,.62,abs('+sideAxis+'-'+sideCenter.toFixed(5)+')/'+halfSide.toFixed(5)+');'+
   'vec4 tattoo=texture2D(cryptoFurLogo,clamp(fract(furUV*vec2(3.,2.)),0.,1.));'+
   'float ink=tattoo.a*inFlank*sideMask*.80;'+
   'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.17+tattoo.rgb*.63,ink);'+
   // Two scales of pigment grain and fiber direction, evaluated in rest-mesh
   // coordinates so the texture travels with the skinned body while galloping.
   'float furPigment=fract(sin(dot(floor(vFurLocal*94.),vec3(12.9898,78.233,43.719)))*43758.5453);'+
   'float furFine=sin(vFurLocal.y*510.+vFurLocal.x*113.)*sin(vFurLocal.z*196.+vFurLocal.y*91.);'+
   'diffuseColor.rgb*=1.0+(furPigment-.5)*.10+furFine*.022;';
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
    '#include <color_fragment>\n'+source);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
    '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(furPigment-.5)*.12,.62,.99);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
    '#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(furFine*.019,(furPigment-.5)*.014,furFine*.013));');
 };
 material.customProgramCacheKey=()=>('crypto-fur-dye-'+long+side);
 material.needsUpdate=true;
}
export function createFurIdentity(bindings){
 let request=0,token='',uniforms=[];
 for(const {material,name,mesh} of bindings)if(name==='Main')tattoo(mesh,material,uniforms);
 function apply({coat,accent,symbol}){
  token=symbol;const colors=liveryPalette(coat,accent);
  for(const {material,name} of bindings){
   if(name==='Main')material.color.copy(colors.fur);
   else if(name==='Main_Dark')material.color.copy(colors.mane);
   else if(name==='Main_Light')material.color.copy(colors.fleck);
   else if(/mane|tail/i.test(name))material.color.copy(colors.tail);
  }
  const id=++request;
  for(const u of uniforms)u.value=transparent;
  getLogo(symbol).then(texture=>{
   if(id===request&&texture)for(const u of uniforms)u.value=texture;
  });
 }
 return {apply,get token(){return token},hasVerifiedMark(){return supportedLogo(token)},dispose(){request++;uniforms=[]}};
}
