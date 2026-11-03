/* CRP Alpha20 analytic GPU grounds. Does not fetch texture files or mutate game data.
 * Hooks only the two existing LIVE race materials. Stadium and oval keep their own surfaces.
 */
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));
const TYPE={grass:0,dirt:1,synthetic:2};
function patch(material,{seed=1,kind=0}={}){
 const state={seed:Number(seed)||1,kind,wetness:0,mowing:6.5,stripe:.12};
 let compiled=null;
 const oldCompile=material.onBeforeCompile;
 material.map=null;material.bumpMap=null;material.bumpScale=0;
 material.onBeforeCompile=shader=>{
  oldCompile?.(shader);
  compiled=shader;
  Object.assign(shader.uniforms,{
   crpGroundSeed:{value:state.seed},crpGroundKind:{value:state.kind},
   crpGroundWetness:{value:state.wetness},crpGroundMowing:{value:state.mowing},
   crpGroundStripe:{value:state.stripe}
  });
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vCrpGroundWorld;')
   .replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvCrpGroundWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying vec3 vCrpGroundWorld;\n'+
   'uniform float crpGroundSeed,crpGroundKind,crpGroundWetness,crpGroundMowing,crpGroundStripe;\n'+
   'float crpGroundHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}\n'+
   'float crpGroundNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(crpGroundHash(i),crpGroundHash(i+vec2(1.,0.)),f.x),mix(crpGroundHash(i+vec2(0.,1.)),crpGroundHash(i+vec2(1.,1.)),f.x),f.y);}\n'+
   'float crpGroundFbm(vec2 p){return .55*crpGroundNoise(p)+.27*crpGroundNoise(p*2.03)+.18*crpGroundNoise(p*4.13);}\n');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\n'+
   'vec2 crpXZ=vCrpGroundWorld.xz+vec2(crpGroundSeed*.19,crpGroundSeed*.37);'+
   'float crpMicro=crpGroundNoise(crpXZ*5.9)-.5;'+
   'float crpMacro=crpGroundFbm(crpXZ*.28)-.5;'+
   'float crpCut=sin(6.2831853*vCrpGroundWorld.z/max(1.0,crpGroundMowing));'+
   'float crpTurf=(crpMicro*.16+crpMacro*.19+crpCut*crpGroundStripe);'+
   'float crpSoil=crpMicro*.27+crpMacro*.22;'+
   'float crpStone=crpMicro*.045+crpMacro*.045;'+
   'float crpDetail=crpGroundKind<.5?crpTurf:(crpGroundKind<1.5?crpSoil:crpStone);'+
   'diffuseColor.rgb*=1.0+crpDetail-crpGroundWetness*.19;');
 };
 material.customProgramCacheKey=()=> 'crp-procedural-ground-v2';
 material.needsUpdate=true;
 const sync=()=>{if(compiled){
  compiled.uniforms.crpGroundKind.value=state.kind;
  compiled.uniforms.crpGroundWetness.value=state.wetness;
  compiled.uniforms.crpGroundMowing.value=state.mowing;
  compiled.uniforms.crpGroundStripe.value=state.stripe;
 }};
 return {setKind(v){state.kind=v;sync();},setWetness(v){state.wetness=clamp(v,0,1);sync();},
  dispose(){material.onBeforeCompile=oldCompile;material.needsUpdate=true;compiled=null;},
  get settings(){return {...state}}};
}
export function installProceduralGround({grass,track}={}){
 if(!grass?.isMeshStandardMaterial||!track?.isMeshStandardMaterial)
  throw TypeError('Two existing MeshStandardMaterial instances required');
 const ground=patch(grass,{seed:93,kind:0});
 const surface=patch(track,{seed:274,kind:1});
 function setSurface(kind='dirt'){
  const id=TYPE[kind]??1;surface.setKind(id);
  surface.setWetness(ground.settings.wetness);
  // No texture files, decals, canvas tiles or image sprites in this visual mode.
  track.map=null;track.bumpMap=null;track.bumpScale=0;track.needsUpdate=true;
  grass.map=null;grass.bumpMap=null;grass.needsUpdate=true;
 }
 return {setSurface,setWetness(w){ground.setWetness(w);surface.setWetness(w);},
  dispose(){ground.dispose();surface.dispose();},get settings(){return {ground:ground.settings,track:surface.settings}}};
}
