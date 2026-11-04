/**
 * BTC v12 - anatomical hindquarter shaping for the Maya 2017 skinned body.
 *
 * All coordinates are in the ORIGINAL 2017 rest-mesh space (metres scaled by
 * the existing viewer). Positive Y points toward the rump and Z is height.
 * The displacement is deliberately restricted to croup, thigh and gaskin:
 * native Gallop animation, bone indices, the hocks' hinge and hoof capsules
 * are NOT replaced with primitives or a screenshot.
 *
 * Pure functions make the body correction reproducible without a renderer.
 */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const gaussian=(v,c,r)=>Math.exp(-((v-c)/r)**2);

export const BTC_HINDQUARTER_BUILD='btc-hindquarters-rump-gaskin-20261104-v12';
export function sculptBTCHindquarters(positions) {
  if(!(positions instanceof Float32Array)||positions.length%3)
    throw Error('BTC hindquarter sculpt requires Float32Array xyz positions');
  let affected=0,maximumExpansion=0,minimumHoofDisplacement=0;
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i],y=positions[i+1],z=positions[i+2];
    if(y<.0023||z<.0062||z>.038)continue;
    const lateral=smooth((Math.abs(x)-.00105)/.00165);
    const rump=gaussian(y,.00935,.0071)*gaussian(z,.0286,.0088);
    const glute=gaussian(y,.01165,.0047)*gaussian(z,.0242,.0068);
    const upperThigh=gaussian(y,.01155,.0043)*gaussian(z,.0184,.0064);
    const gaskin=gaussian(y,.01135,.0038)*gaussian(z,.0118,.0057);
    // Restrict added muscle below the hock and taper gradually at the fetlock.
    const jointSafe=smooth((z-.0062)/.0048);
    const muscle=lateral*jointSafe*(.12*rump+.20*glute+.24*upperThigh+.135*gaskin);
    if(muscle<.004)continue;
    // Grow the actual contiguous skin surface; no floating spheres/tubes.
    positions[i]=x*(1+muscle);
    positions[i+1]=y+.00040*rump*lateral+
      (y-.0109)*(.11*glute+.085*upperThigh)*lateral*jointSafe;
    positions[i+2]=z+(.00032*rump+.00011*glute)*lateral*jointSafe;
    maximumExpansion=Math.max(maximumExpansion,muscle);
    affected++;
  }
  return {affected,maxExpansion:maximumExpansion,hoofDisplacement:minimumHoofDisplacement,
    restSpace:true,originalRigPreserved:true};
}

/**
 * A generated micro-coat: fascia shadows follow anatomical zones, while
 * fine fiber grain runs longitudinally across the croup. No image texture,
 * decal, extra transparency or standalone material is involved.
 * Insert BEFORE the existing #include <color_fragment> extension. The
 * original coat tint / iris / muzzle processing must remain unchanged.
 */
export const BTC_HINDQUARTER_COAT_FRAGMENT=String.raw`
float btcHindMask=smoothstep(.003,.007,vBTCMayaRest.y) *
  (1.0-smoothstep(.035,.041,vBTCMayaRest.z));
float btcCroup=exp(-pow((vBTCMayaRest.y-.0102)/.0075,2.0)
  -pow((vBTCMayaRest.z-.0279)/.0091,2.0));
float btcGaskin=exp(-pow((vBTCMayaRest.y-.0114)/.0042,2.0)
  -pow((vBTCMayaRest.z-.0137)/.0061,2.0));
float btcContour=exp(-pow((vBTCMayaRest.y-.0107)/.0053,2.0)
  -pow((vBTCMayaRest.z-.0201)/.0027,2.0));
float btcCoatFiber=sin(vBTCMayaRest.y*4900.0+
  vBTCMayaRest.z*2650.0+sin(vBTCMayaRest.x*550.0)*.8);
float btcMuscledCoat=btcHindMask*(.033*btcCroup+
  .025*btcGaskin-.022*btcContour+.006*btcCoatFiber);
diffuseColor.rgb*=clamp(1.0+btcMuscledCoat,.95,1.055);
`;

export function addBTCHindquarterCoatTexture(shader){
  if(!shader?.fragmentShader?.includes('#include <color_fragment>'))
    throw Error('BTC hindquarter coat needs the Three.js color fragment hook');
  shader.fragmentShader=shader.fragmentShader.replace(
    '#include <color_fragment>',
    '#include <color_fragment>\n'+BTC_HINDQUARTER_COAT_FRAGMENT
  );
}

/** Keep the source's nearest-skin influence at the rear knee/hock.
 * Two passes of uniform topology smoothing otherwise spread weight across
 * the bending hinge, making the legs look thin and rubbery at mid-Gallop.
 * This affects ONLY how the Maya rest surface follows the original bones.
 */
export function hindLimbSkinNeighborWeight(restY,restZ,self){
  const hinge=smooth((restY-.0048)/.004)*smooth((.023-restZ)/.006)*
    smooth((restZ-.0045)/.0045);
  return self?2+8*hinge:1-.40*hinge;
}
