/**
 * BTC pose-stable hind thigh deformation (v13).
 *
 * Why: the copied Quaternius Gallop has several rotating joints per Maya 2017
 * thigh. Conventional linear blend skinning mixes their matrices, shortens the
 * transverse diameter at some frames, and makes the same muscle look "thin".
 *
 * Here the original skeleton, clip, and weights stay exactly as imported.
 * Only BTC's body material substitutes a gently masked DUAL-QUATERNION result
 * for the thigh / gaskin skin surface. DQS blends rigid transformations without
 * the skin-volume collapse caused by averaging rotated matrices.
 *
 * No topology change, new animation clip, extra bones or stadium code.
 */
export const BTC_POSE_VOLUME_BUILD='btc-hind-pose-volume-dq-20261104-v13';

const functions=String.raw`
vec4 btcDQMultiply(vec4 a,vec4 b) {
  return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),
              a.w*b.w-dot(a.xyz,b.xyz));
}
vec4 btcDQRotation(mat4 m) {
  // GLSL matrices are indexed column,row. Four stable quaternion branches.
  float tr=m[0][0]+m[1][1]+m[2][2];
  if(tr>0.0) {
    float s=sqrt(max(1.0+tr,0.000001))*2.0;
    return normalize(vec4((m[1][2]-m[2][1])/s,
      (m[2][0]-m[0][2])/s,(m[0][1]-m[1][0])/s,0.25*s));
  }
  if(m[0][0]>m[1][1] && m[0][0]>m[2][2]) {
    float s=sqrt(max(1.0+m[0][0]-m[1][1]-m[2][2],0.000001))*2.0;
    return normalize(vec4(0.25*s,(m[1][0]+m[0][1])/s,
      (m[2][0]+m[0][2])/s,(m[1][2]-m[2][1])/s));
  }
  if(m[1][1]>m[2][2]) {
    float s=sqrt(max(1.0+m[1][1]-m[0][0]-m[2][2],0.000001))*2.0;
    return normalize(vec4((m[1][0]+m[0][1])/s,0.25*s,
      (m[2][1]+m[1][2])/s,(m[2][0]-m[0][2])/s));
  }
  float s=sqrt(max(1.0+m[2][2]-m[0][0]-m[1][1],0.000001))*2.0;
  return normalize(vec4((m[2][0]+m[0][2])/s,
    (m[2][1]+m[1][2])/s,0.25*s,(m[0][1]-m[1][0])/s));
}
void btcDQAccumulate(in mat4 m,in float weight,in vec4 reference,
                     inout vec4 realPart,inout vec4 dualPart) {
  if(weight<=0.000001)return;
  vec4 q=btcDQRotation(m);
  vec4 d=0.5*btcDQMultiply(vec4(m[3].xyz,0.0),q);
  float signFix=dot(reference,q)<0.0?-1.0:1.0;
  realPart+=q*weight*signFix;
  dualPart+=d*weight*signFix;
}
vec3 btcDQApply(vec4 realPart,vec4 dualPart,vec3 p) {
  float lengthReal=max(length(realPart),0.000001);
  vec4 q=realPart/lengthReal;
  vec4 d=dualPart/lengthReal;
  d-=q*dot(d,q);
  vec3 rotated=p+2.0*cross(q.xyz,cross(q.xyz,p)+q.w*p);
  vec3 translation=2.0*btcDQMultiply(d,vec4(-q.xyz,q.w)).xyz;
  return rotated+translation;
}
`;

const skinning=String.raw`
#ifdef USE_SKINNING
  // Restrict volume-preserving skinning to rear muscles. The loin, body,
  // coronet and hooves remain on the original skinning implementation.
  float btcHindMask=smoothstep(0.0045,0.0090,position.y) *
    (1.0-smoothstep(0.0170,0.0202,position.y)) *
    smoothstep(0.0085,0.0130,position.z) *
    (1.0-smoothstep(0.0250,0.0310,position.z)) *
    smoothstep(0.0012,0.0027,abs(position.x));
  float btcDqMix=btcHindMask*btcVolumePreservation;
  if(btcDqMix>0.001) {
    vec4 btcRef=btcDQRotation(boneMatX);
    vec4 btcReal=vec4(0.0);
    vec4 btcDual=vec4(0.0);
    btcDQAccumulate(boneMatX,skinWeight.x,btcRef,btcReal,btcDual);
    btcDQAccumulate(boneMatY,skinWeight.y,btcRef,btcReal,btcDual);
    btcDQAccumulate(boneMatZ,skinWeight.z,btcRef,btcReal,btcDual);
    btcDQAccumulate(boneMatW,skinWeight.w,btcRef,btcReal,btcDual);
    vec3 btcDqSkin=btcDQApply(btcReal,btcDual,skinVertex.xyz);
    vec3 btcDqLocal=(bindMatrixInverse*vec4(btcDqSkin,1.0)).xyz;
    transformed=mix(transformed,btcDqLocal,btcDqMix);
  }
#endif
`;

export function installBTCVolumePreservingSkin(shader, strengthUniform={value:0.95}){
  if(!shader||!shader.vertexShader?.includes('#include <skinning_vertex>')||
       !shader.vertexShader.includes('#include <common>'))
    throw Error('BTC DQS correction requires the standard Three.js skinned-vertex chunks');
  shader.uniforms.btcVolumePreservation=strengthUniform;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
    '#include <common>\nuniform float btcVolumePreservation;\n'+functions);
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_vertex>',
    '#include <skinning_vertex>\n'+skinning);
}

/** Reference maths for source-level regression tests. Synthetic joints only;
 * the GPU shader above is the runtime implementation.
 */
const mul=(a,b)=>[
 a[3]*b[0]+b[3]*a[0]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]+b[3]*a[1]+a[2]*b[0]-a[0]*b[2],
 a[3]*b[2]+b[3]*a[2]+a[0]*b[1]-a[1]*b[0],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
];
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
export function dualQuaternionSkinPoint(point,bones,weights){
 if(bones.length!==weights.length||bones.length===0)throw Error('Expected bone transforms and weights');
 const ref=bones[weights.findIndex(w=>w>0)]?.rotation;
 if(!ref)throw Error('At least one bone influence required');
 let r=[0,0,0,0],d=[0,0,0,0];
 for(let i=0;i<bones.length;i++){
  const {rotation:q,translation:t}=bones[i],w=weights[i];
  if(w<=0)continue;
  const sign=dot(q,ref)<0?-1:1;
  const dual=mul([t[0],t[1],t[2],0],q).map(x=>x*.5);
  for(let k=0;k<4;k++){r[k]+=sign*w*q[k];d[k]+=sign*w*dual[k];}
 }
 const norm=Math.hypot(...r);r=r.map(x=>x/norm);d=d.map(x=>x/norm);
 const offset=dot(r,d);d=d.map((x,i)=>x-offset*r[i]);
 const rotated=mul(mul(r,[...point,0]),[-r[0],-r[1],-r[2],r[3]]);
 const translated=mul(d,[-r[0],-r[1],-r[2],r[3]]);
 return rotated.slice(0,3).map((v,i)=>v+2*translated[i]);
}
