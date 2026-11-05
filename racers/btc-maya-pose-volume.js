/**
 * BTC v13b: anatomically consistent skin weights for the 2017 Maya body.
 *
 * The experiment with dual quaternion skinning was visually rejected:
 * although DQS preserves volume on synthetic joints, the transferred
 * Quaternius weights made large triangular membranes between hind bones.
 * Production therefore retains Three.js's ORIGINAL linear skinning and
 * Gallop clip, with stable left/right hind-leg influences.
 *
 * The GLB's BackLeg.L and BackLeg.R rest coordinates match +X and -X.
 * Filtering cross-leg influences is gradual and confined to the hind limb.
 */
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const smooth=v=>{const x=clamp(v,0,1);return x*x*(3-2*x);};
export const BTC_POSE_VOLUME_BUILD='btc-hind-skin-continuity-20261104-v13b';

/** Returns a smooth 0..1 mask. Zero at feet, spine and limb center seam. */
export function hindSkinRegion(x,y,z){
 const side=smooth((Math.abs(x)-.00120)/.00165);
 const rear=smooth((y-.0038)/.0052);
 const upper=smooth((z-.0065)/.006);
 const lower=1-smooth((z-.0285)/.007);
 return side*rear*upper*lower;
}

/**
 * Remove weights assigned to the WRONG hind leg or to front/tail controls
 * on the posterior thigh. Don't replace bone IDs or introduce new joints.
 * The remaining weights are renormalized, preserving native skin order.
 */
export function stabilizeHindSkinWeights(positions,bones,weights,boneNames){
 if(!(positions instanceof Float32Array)||
    !(bones instanceof Uint16Array)||
    !(weights instanceof Float32Array)||
    positions.length/3*4!==bones.length||
    bones.length!==weights.length||
    !Array.isArray(boneNames))throw Error('BTC limb skin stabilizer needs rest positions and original skin attributes');
 let adjusted=0,badBefore=0,badAfter=0,scanned=0;
 for(let v=0;v<positions.length/3;v++){
  const x=positions[v*3],y=positions[v*3+1],z=positions[v*3+2];
  const region=hindSkinRegion(x,y,z);
  if(region<=.005)continue;
  const correctSide=x>0?'.L':'.R',otherSide=x>0?'.R':'.L';
  let removed=0,available=0,originalTotal=0;
  const original=[],wrong=[];
  for(let k=0;k<4;k++){
   const j=bones[v*4+k],name=boneNames[j]||'',w=weights[v*4+k];
   const invalid=((name.startsWith('Back')||name.startsWith('IKBackLeg')||
       name.startsWith('FFB'))&&name.endsWith(otherSide)) ||
      name.startsWith('Front') || name.startsWith('Tail');
   original.push(w);wrong.push(invalid);
   originalTotal+=w;
   if(invalid)removed+=w;
   else available+=w;
  }
  if(originalTotal<=0||removed<=.00001||available<.15)continue;
  scanned++;
  badBefore+=removed;
  // A narrow floor prevents a hard seam at the inner thigh boundary.
  const attenuation=1-.985*region;
  let sum=0;
  for(let k=0;k<4;k++){
   const value=original[k]*(wrong[k]?attenuation:1);
   weights[v*4+k]=value;sum+=value;
  }
  if(sum<=.0000001){
   for(let k=0;k<4;k++)weights[v*4+k]=original[k];
   continue;
  }
  let after=0;
  for(let k=0;k<4;k++){
   weights[v*4+k]/=sum;
   if(wrong[k])after+=weights[v*4+k];
  }
  badAfter+=after;
  adjusted++;
 }
 return {adjusted,scanned,crossSideBefore:badBefore,crossSideAfter:badAfter,
   nativeLinearSkinning:true,rigPreserved:true};
}
