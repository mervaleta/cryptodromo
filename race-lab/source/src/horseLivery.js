import * as THREE from 'three';

/** Official symbol graphics where supported: spothq/cryptocurrency-icons CC0.
 * Logos are projected in the PBR horse skin shader, not meshes, flags or tickers.
 * Unavailable graphics leave the flank plain rather than showing a fake logo.
 */
const available=new Set('1INCH AAVE ADA ALGO ATOM AVAX BAT BCH BNB BTC CAKE COMP CRO CRV DASH DOGE DOT EGLD ENJ ETC ETH FIL FLOW GALA GNO GRT INJ IOTA KAVA KSM LINK LTC LPT MANA NEO OKB OSMO RAY RUNE SAND SHIB SNX SOL SUSHI THETA TRX UNI VET XLM XMR XRP XTZ ZEC ZIL'.split(' '));
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
async function getLogo(symbol){
 const key=String(symbol||'').toUpperCase();
 if(!supportedLogo(key))return null;
 if(cache.has(key))return cache.get(key);
 const promise=new Promise(resolve=>{
  const url='https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/'+key.toLowerCase()+'.svg';
  const image=new Image();image.crossOrigin='anonymous';
  image.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
   const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,256);
   ctx.drawImage(image,8,8,240,240);
   const texture=new THREE.CanvasTexture(canvas);
   texture.colorSpace=THREE.SRGBColorSpace;
   texture.minFilter=THREE.LinearMipmapLinearFilter;
   resolve(texture);
  };
  image.onerror=()=>resolve(null);
  image.src=url;
 });
 cache.set(key,promise);return promise;
}
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
   'vec4 tattoo=texture2D(cryptoFurLogo,clamp(furUV,0.,1.));'+
   'float ink=tattoo.a*inFlank*sideMask*.90;'+
   'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.17+tattoo.rgb*.63,ink);';
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
    '#include <color_fragment>\n'+source);
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
