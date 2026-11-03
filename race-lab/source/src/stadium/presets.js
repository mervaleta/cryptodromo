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
/* World editorial venues reuse the same scenic generator. They do not introduce
   a new market engine or claim that thirteen individual course meshes are ready. */
export const WORLD_STADIUM_PRESETS=Object.freeze({
  crypto:Object.freeze({...STADIUM_PRESETS.satoshi,id:'crypto',name:'Cryptódromo Central',
    track:'Pista Eadweard Muybridge',market:'CRIPTO · 24/7'}),
  merval:Object.freeze({
    id:'merval',name:'Estadio MERVAL',track:'Clásico de Palermo',market:'ACCIONES ARGENTINAS',
    tagline:'Las cotizaciones del Río de la Plata',seed:3345,
    palette:{wall:0xd6c2a2,trim:0xece0c9,roof:0x28463e,metal:0xb88f68,accent:0xca975e,
      grass:0x45704b,track:0x967255,trees:0x386342},
    features:{spires:false,artDeco:true,industrial:false,localPlaza:true},
    signs:{gate:'PUERTA MERVAL',club:'BOLSA DE BUENOS AIRES',paddock:'PADDOCK DEL PLATA'}
  }),
  'wall-street':Object.freeze({
    id:'wall-street',name:'Wall Street Arena',track:'Main Street',market:'ACCIONES EE. UU.',
    tagline:'La velocidad del mercado de Nueva York',seed:4455,
    palette:{wall:0xa7b6ba,trim:0xd6e5e7,roof:0x283849,metal:0x8eadd0,accent:0x6c9cec,
      grass:0x3c6265,track:0x6a7277,trees:0x3a6057},
    features:{spires:false,artDeco:true,industrial:false,skyline:true},
    signs:{gate:'WALL STREET ARENA',club:'MARKET EXCHANGE',paddock:'THE BELL PADDOCK'}
  }),
  tokyo:Object.freeze({
    id:'tokyo',name:'Tokyo Circuit',track:'Neon Circuit',market:'ACCIONES JAPONESAS',
    tagline:'La sesión del Pacífico bajo las luces',seed:5561,
    palette:{wall:0xb2abc5,trim:0xe3e0f1,roof:0x242845,metal:0x807cbe,accent:0x9a7ee8,
      grass:0x3c675c,track:0x5b5671,trees:0x375b54},
    features:{spires:false,artDeco:false,industrial:false,neon:true},
    signs:{gate:'TOKYO CIRCUIT',club:'NEON EXCHANGE',paddock:'TOKYO PADDOCK'}
  }),
  london:Object.freeze({
    id:'london',name:'London Exchange Grounds',track:'Royal Turf',market:'ACCIONES BRITANICAS',
    tagline:'Un clásico de la City',seed:6673,
    palette:{wall:0xd2c1aa,trim:0xf1debd,roof:0x344e56,metal:0xc1a47f,accent:0xd4ad73,
      grass:0x3b684e,track:0x997d59,trees:0x375f48},
    features:{spires:true,artDeco:false,industrial:false,clockTower:true},
    signs:{gate:'LONDON EXCHANGE',club:'ROYAL TURF',paddock:'CITY PADDOCK'}
  }),
  commodities:Object.freeze({
    id:'commodities',name:'Commodity Coliseum',track:'Mines Trail',market:'MATERIAS PRIMAS',
    tagline:'Metales y energía en una gran arena',seed:7785,
    palette:{wall:0xcdb28e,trim:0xf2ddae,roof:0x765041,metal:0x9b8770,accent:0xc89f52,
      grass:0x777953,track:0x9e7d5e,trees:0x6c7049},
    features:{spires:false,artDeco:false,industrial:true,mines:true},
    signs:{gate:'COMMODITY COLISEUM',club:'THE EXCHANGE MINES',paddock:'ENERGY PADDOCK'}
  }),
  forex:Object.freeze({
    id:'forex',name:'Forex International',track:'World Circuit',market:'DIVISAS',
    tagline:'El mercado que sigue al sol',seed:8891,
    palette:{wall:0xabc8c7,trim:0xdaece9,roof:0x285461,metal:0x83b8ba,accent:0x6fbcc5,
      grass:0x426d64,track:0x75898c,trees:0x3c6a5b},
    features:{spires:false,artDeco:true,industrial:false,globalArches:true},
    signs:{gate:'FOREX INTERNATIONAL',club:'WORLD EXCHANGE',paddock:'GLOBAL PADDOCK'}
  }),
  champions:Object.freeze({
    id:'champions',name:'Champions Arena',track:'Grand Final',market:'COPA INTERMERCADO',
    tagline:'La final de todos los mercados',seed:9917,
    palette:{wall:0xd8c9ac,trim:0xffeed0,roof:0x48454b,metal:0xd4b371,accent:0xe1be71,
      grass:0x42694c,track:0x927b5b,trees:0x416448},
    features:{spires:true,artDeco:false,industrial:false,championsArch:true},
    signs:{gate:'CHAMPIONS ARENA',club:'THE GRAND FINAL',paddock:'CHAMPIONS PADDOCK'}
  })
});
export const WORLD_STADIUM_IDS=Object.freeze(Object.keys(WORLD_STADIUM_PRESETS));

export const STADIUM_IDS=Object.freeze(Object.keys(STADIUM_PRESETS));
export function getStadiumPreset(id='satoshi'){
  if(Object.hasOwn(STADIUM_PRESETS,id))return STADIUM_PRESETS[id];
  if(Object.hasOwn(WORLD_STADIUM_PRESETS,id))return WORLD_STADIUM_PRESETS[id];
  throw new Error('Estadio desconocido: '+id);
}
