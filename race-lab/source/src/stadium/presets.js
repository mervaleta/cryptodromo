/**
 * Cryptódromo venue identities.
 * Data only: no race logic, odds, or schedule. New venues are presets of one renderer.
 */
export const STADIUM_PRESETS=Object.freeze({
  satoshi:Object.freeze({
    id:'satoshi',name:'Estadio Satoshi Nakamoto',track:'Pista Eadweard Muybridge',
    tagline:'El hipódromo de las criptomonedas',market:'CRIPTO',seed:1024,
    palette:{wall:0xe4d7bf,trim:0xf6f1e5,roof:0x293d42,metal:0xc8a46c,accent:0x0d9969,grass:0x477455,track:0x916c4e,trees:0x376d4b},
    features:{spires:true,artDeco:false,industrial:false},
    signs:{gate:'PUERTA SATOSHI',club:'SATOSHI NAKAMOTO',paddock:'PADDOCK GENESIS'}
  }),
  exchange:Object.freeze({
    id:'exchange',name:'Estadio de la Bolsa',track:'Pista del Parqué',
    tagline:'El hipódromo de los mercados de acciones',market:'ACCIONES',seed:2048,
    palette:{wall:0xc7bcaa,trim:0xf3e1c5,roof:0x223d50,metal:0xd3a85c,accent:0x287f91,grass:0x497066,track:0x907860,trees:0x416a5e},
    features:{spires:false,artDeco:true,industrial:false},
    signs:{gate:'EXCHANGE GATE',club:'THE EXCHANGE',paddock:'PATIO DEL PARQUÉ'}
  }),
  horizon:Object.freeze({
    id:'horizon',name:'Estadio Horizonte',track:'Pista de los Cuatro Vientos',
    tagline:'El hipódromo de las materias primas',market:'COMMODITIES',seed:4096,
    palette:{wall:0xc4a17a,trim:0xf6d7af,roof:0x824b3b,metal:0xd9b477,accent:0xa26543,grass:0x687d54,track:0xa57b4d,trees:0x5b714b},
    features:{spires:false,artDeco:false,industrial:true},
    signs:{gate:'PUERTA HORIZONTE',club:'HORIZONTE',paddock:'PATIO DE LAS COSECHAS'}
  })
});
export const STADIUM_IDS=Object.freeze(Object.keys(STADIUM_PRESETS));
export function getStadiumPreset(id='satoshi'){
  if(!Object.hasOwn(STADIUM_PRESETS,id))throw new Error('Estadio desconocido: '+id);
  return STADIUM_PRESETS[id];
}
