/**
 * BTC master lookdev: antialiased, directional micro-fur on the original Maya coat.
 * This is a surface-only adjustment. It does not alter skeletons, animation,
 * geometry, collision, identity, market data or the 99 other horses.
 *
 * Strong sinusoidal frequencies in the legacy coat shader can alias badly at
 * distant stadium camera distances. The new fiber layer is footprint filtered
 * with fwidth and fades continuously before becoming subpixel shimmer.
 */
export const BTC_COAT_LOOKDEV_BUILD='btc-master-microfur-20261104-v1';

export const BTC_COAT_LOOKDEV_FRAGMENT=String.raw`
 // The Maya rest position is stable across every frame of the native Gallop.
 // Hair lays broadly along the longitudinal axis; the local, irregular
 // weave changes direction gently to avoid an artificial striped pattern.
 vec3 btcRest=vBTCMayaRest;
 float btcLongitudinal=btcRest.y*3600.0+btcRest.z*610.0+
   sin(btcRest.x*800.0+btcRest.y*330.0)*0.58;
 float btcFiberFootprint=fwidth(btcLongitudinal);
 float btcFiberVisibility=1.0-smoothstep(0.9,2.9,btcFiberFootprint);
 float btcFiber=sin(btcLongitudinal)*btcFiberVisibility;
 // A broad, low-amplitude hair color variation visible from TV cameras.
 // Material-only: this does not create geometry or fake moving muscles.
 float btcWarmZones=sin(btcRest.y*145.0+btcRest.z*48.0)*
                    sin(btcRest.x*220.0-btcRest.y*75.0);
 float btcBelly=smoothstep(0.019,0.012,btcRest.z);
 float btcFurVariation=clamp(1.0+0.014*btcFiber+
   0.012*btcWarmZones-0.018*btcBelly,0.94,1.06);
 diffuseColor.rgb*=btcFurVariation;
`;

export const BTC_COAT_LOOKDEV_ROUGHNESS=String.raw`
 // Grazing light breaks up specularity without the plastic wax finish.
 roughnessFactor=clamp(roughnessFactor+
   0.017*btcFiberVisibility*abs(btcFiber)+
   0.013*abs(btcWarmZones),0.48,0.88);
`;

export function addBTCEquineCoatLookdev(shader) {
 if(!shader?.fragmentShader?.includes('#include <color_fragment>')||
    !shader.fragmentShader.includes('#include <roughnessmap_fragment>')||
    !shader.fragmentShader.includes('vBTCMayaRest'))
   throw new Error('BTC coat lookdev requires the Maya rest-space PBR shader');
 shader.fragmentShader=shader.fragmentShader.replace(
  '#include <color_fragment>',
  '#include <color_fragment>\n'+BTC_COAT_LOOKDEV_FRAGMENT
 );
 shader.fragmentShader=shader.fragmentShader.replace(
  '#include <roughnessmap_fragment>',
  '#include <roughnessmap_fragment>\n'+BTC_COAT_LOOKDEV_ROUGHNESS
 );
}
