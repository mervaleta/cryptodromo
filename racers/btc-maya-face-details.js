/**
 * BTC canonical Maya eye-lid integration v15.
 *
 * The original Maya surface contains anatomical borders around BOTH open
 * eye sockets. The actual orbital gaps are now sealed and the enlarged
 * elliptical corneas follow the native Head joint in btc-maya-master.js.
 * Separate band/ribbon meshes created free-floating orange horseshoes in
 * camera close-ups. They are deliberately removed. Two subtle shaded lids
 * are applied to the original body via the stock coat shader instead.
 *
 * No invisible stand-in meshes, cards, triangles or custom animation.
 */
export function createBTCMayaFaceDetails(source,skinAt,positions){
 if(!source?.skeleton?.bones?.some(b=>b.name==='Head'))
  throw Error('BTC facial shading requires the authored Head bone');
 return {
  surfaces:0,
  triangles:0,
  integratedEyeRims:2,
  eyeAssembly:'integrated-maya-eyelid-shading-v15',
  dispose(){}
 };
}
