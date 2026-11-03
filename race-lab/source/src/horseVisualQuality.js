/** Preset-based PBR finishing for the existing Alpha18 horse materials.
 * Preserves crypto pigment shader, logos, mane animation and player colors.
 * No added textures, shader variants, geometry or per-frame allocations.
 */
const QUALITY={
 performance:{coatRoughness:.86,detail:.0,env:.65},
 balanced:{coatRoughness:.78,detail:.08,env:.9},
 cinematic:{coatRoughness:.71,detail:.13,env:1.18}
};
export function createHorseSurfaceFinish(bindings,{quality='balanced'}={}){
 let mode=QUALITY[quality]?quality:'balanced',wetness=0,finish=0;
 const names=new Map(bindings.map(({material,name})=>[material,name||'']));
 function apply(){
  const p=QUALITY[mode];
  for(const [mat,name] of names){
   const hair=/mane|tail|hair/i.test(name);
   const hoof=/hoof|shoe/i.test(name);
   mat.metalness=hoof?.03:0;
   mat.roughness=Math.max(.32,Math.min(1,(hair?.9:hoof?.68:p.coatRoughness)-wetness*.23-finish*.06));
   if('envMapIntensity'in mat)mat.envMapIntensity=p.env*(hoof?.82:1);
   if('clearcoat'in mat){mat.clearcoat=hair?0:.10+finish*.18;mat.clearcoatRoughness=.28+wetness*.16}
   mat.needsUpdate=false;
  }
 }
 function setQuality(q){if(!QUALITY[q])throw RangeError('Unknown horse visual quality');mode=q;apply()}
 function setWetness(x){wetness=Math.max(0,Math.min(1,Number(x)||0));apply()}
 function setFinish(x){finish=Math.max(0,Math.min(1,Number(x)||0));apply()}
 apply();
 return {setQuality,setWetness,setFinish,get settings(){return {quality:mode,wetness,finish}},dispose(){names.clear()}};
}
export const HORSE_QUALITY_PRESETS=Object.freeze(Object.keys(QUALITY));
