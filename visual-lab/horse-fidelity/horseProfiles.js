/**
 * Alpha22: original parameterized horse definitions, no imported geometry,
 * no purchased meshes, no sprite or image textures. NONECG is a study reference,
 * not an input or part of this source.
 */
export const PROCEDURAL_HORSE_VERSION='alpha22-horse-fidelity-v1';
export const HORSE_ARCHETYPES=Object.freeze({
 thoroughbred:Object.freeze({barrel:1,shoulder:1.04,haunch:.99,neck:1,head:1,leg:1.03,withers:1,mane:.72}),
 sprinter:Object.freeze({barrel:1.06,shoulder:1.14,haunch:1.12,neck:.97,head:.97,leg:.98,withers:1.06,mane:.76}),
 elegant:Object.freeze({barrel:.94,shoulder:.98,haunch:.95,neck:1.12,head:.94,leg:1.08,withers:1.04,mane:1.13}),
 endurance:Object.freeze({barrel:.96,shoulder:1.02,haunch:1.01,neck:1.05,head:1,leg:1.05,withers:1,mane:.9})
});
export const COAT_PRESETS=Object.freeze({
 bay:Object.freeze({coat:'#714735',mane:'#201815',muzzle:'#4b3832',hoof:'#24211f'}),
 chestnut:Object.freeze({coat:'#aa613d',mane:'#6b392c',muzzle:'#6e4537',hoof:'#49322b'}),
 black:Object.freeze({coat:'#28252b',mane:'#171a1d',muzzle:'#322d31',hoof:'#1b1b1d'}),
 palomino:Object.freeze({coat:'#c7a271',mane:'#e1c99c',muzzle:'#92775e',hoof:'#60534b'}),
 grey:Object.freeze({coat:'#9a9c9b',mane:'#5a5a5e',muzzle:'#727978',hoof:'#414345'}),
 cream:Object.freeze({coat:'#d5c6ac',mane:'#e0d9be',muzzle:'#aeaaa1',hoof:'#6d6258'}),
 seal:Object.freeze({coat:'#49382f',mane:'#1b1818',muzzle:'#36312e',hoof:'#232120'}),
 dun:Object.freeze({coat:'#9b865c',mane:'#37372c',muzzle:'#72694f',hoof:'#4b4032'})
});
export const DEFAULT_PROFILE=Object.freeze({
 archetype:'thoroughbred',coat:'bay',marking:'star',maneStyle:'sport',tailStyle:'natural',
 quality:'balanced',height:2.85,seed:1,accent:'#e5bf79',wetness:0,mud:0
});
const bound=(v,lo,hi,fallback)=>(Number.isFinite(Number(v))?Math.min(hi,Math.max(lo,Number(v))):fallback);
export function stableHash(value){
 let h=2166136261;
 for(const ch of String(value))h=Math.imul(h^ch.charCodeAt(0),16777619);
 return h>>>0;
}
export function normalizeHorseProfile(partial={}){
 const p={...DEFAULT_PROFILE,...partial};
 for(const key of ['archetype','coat','marking','maneStyle','tailStyle','quality']){
  const valid={
   archetype:Object.keys(HORSE_ARCHETYPES),coat:Object.keys(COAT_PRESETS),
   marking:['none','star','blaze','snip'],maneStyle:['sport','flowing','cropped'],
   tailStyle:['natural','full','sport'],quality:['eco','balanced','high']
  }[key];
  if(!valid.includes(p[key]))p[key]=DEFAULT_PROFILE[key];
 }
 p.height=bound(p.height,2.5,3.15,2.85);
 p.seed=Math.floor(bound(p.seed,0,4294967295,1));
 p.wetness=bound(p.wetness,0,1,0);p.mud=bound(p.mud,0,1,0);
 p.accent=/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(p.accent)?p.accent:DEFAULT_PROFILE.accent;
 return p;
}
export function randomHorseProfile(symbol,index=0){
 const seed=stableHash(symbol+':'+index);
 const coats=Object.keys(COAT_PRESETS),types=Object.keys(HORSE_ARCHETYPES);
 const colors=['#e6b45b','#75bfe0','#dd7d70','#9dd69c','#bf91e6','#e5d7b7'];
 return normalizeHorseProfile({
  coat:coats[seed%coats.length],
  archetype:types[(seed>>>5)%types.length],
  marking:['none','star','blaze','snip'][(seed>>>9)%4],
  maneStyle:['sport','cropped','flowing'][(seed>>>11)%3],
  tailStyle:['natural','full','sport'][(seed>>>14)%3],
  accent:colors[(seed>>>17)%colors.length],seed
 });
}
export function horseAnatomy(profile){
 const p=normalizeHorseProfile(profile);
 return Object.freeze({...HORSE_ARCHETYPES[p.archetype],height:p.height,
   length:1.85,centerY:1.67,shoulderX:.60,hipX:-.73,
   headX:1.45,headY:2.23,footY:.13});
}
