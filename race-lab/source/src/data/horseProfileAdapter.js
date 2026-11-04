/**
 * CRP Horse Atelier publication adapter, independent of the race/fixture engine.
 * All 100 horses share one GLB + one rig; only data and materials differ.
 * Safe to import after the BTC master is approved, without mutating TOKEN_ROSTER.
 */
export const HORSE_PROFILE_SCHEMA = 'cryptodromo-horses-v1';

export async function fetchPublishedHorseProfiles({url='/api/horse-profiles.php',signal}={}) {
  const response=await fetch(url,{credentials:'omit',cache:'no-store',signal});
  if (!response.ok) throw new Error(`Perfiles públicos no disponibles: HTTP ${response.status}`);
  const manifest=await response.json();
  if (manifest?.ok!==true||manifest?.schema!==HORSE_PROFILE_SCHEMA||!manifest.profiles||Array.isArray(manifest.profiles)) {
    throw new Error('Esquema de perfiles de caballos incompatible');
  }
  return manifest;
}

export function resolveHorseProfile(rosterToken, profiles={}) {
  if (!rosterToken||typeof rosterToken.symbol!=='string')throw new TypeError('Token inválido');
  const saved=profiles[rosterToken.symbol]||null;
  const visual=saved?.appearance||{};
  return {
    symbol:rosterToken.symbol,
    name:saved?.name||rosterToken.name,
    nickname:saved?.nickname||'',
    tagline:saved?.tagline||'',
    biography:saved?.biography||'',
    logoId:saved?.logoId||null,
    logoUrl:saved?.logoId?'/api/horse-logo.php?symbol='+encodeURIComponent(rosterToken.symbol):null,
    networks:saved?.networks||[],
    links:saved?.links||{},
    tier:rosterToken.tier,
    weight:rosterToken.weight, // unchanged: fixture frequency is NEVER editable here
    raceColor:visual.raceColor||rosterToken.color,
    coatColor:visual.coatColor||rosterToken.coat,
    appearanceMode:visual.appearanceMode||'brand_colored',
    muzzleColor:visual.muzzleColor||null,
    maneColor:visual.maneColor||null,
    tailColor:visual.tailColor||null,
    hoofColor:visual.hoofColor||null,
    eyeColor:visual.eyeColor||null,
    legsColor:visual.legsColor||null,
    bridleColor:visual.bridleColor||null,
    maneScale:visual.maneScale??1,
    tailScale:visual.tailScale??1,
    maneStyle:['short','medium','long'].includes(visual.maneStyle)?visual.maneStyle:'medium',
    tailStyle:['short','medium','long'].includes(visual.tailStyle)?visual.tailStyle:'medium',
    edited:!!saved,
  };
}

export function toMasterHorseOptions(rosterToken, profiles={}) {
  const p=resolveHorseProfile(rosterToken,profiles);
  return {
    symbol:p.symbol,
    coat:p.appearanceMode==='natural_coat'?p.coatColor:p.raceColor,
    accent:p.raceColor,
    // New BTC mesh adapters can use these independently when released.
    materials:{coat:p.coatColor,muzzle:p.muzzleColor,mane:p.maneColor,tail:p.tailColor,
      hoof:p.hoofColor,eye:p.eyeColor,legs:p.legsColor,bridle:p.bridleColor},
    groom:{maneScale:p.maneScale,tailScale:p.tailScale,maneStyle:p.maneStyle,tailStyle:p.tailStyle}
  };
}

/** Only invokes APIs the renderer actually implements, leaving its rig untouched. */
export function applyHorseProfileToRenderer(horse, rosterToken, profiles={}) {
  const options=toMasterHorseOptions(rosterToken,profiles);
  horse?.setAppearance?.({coat:options.coat,accent:options.accent,symbol:options.symbol});
  horse?.setMaterialColors?.(options.materials);
  horse?.setGroom?.(options.groom);
  return options;
}
