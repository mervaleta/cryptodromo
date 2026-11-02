import { TOKEN_ROSTER } from './tokenRoster.js';

export const FIXTURE_DAYS = 7;
export const MINUTES_PER_DAY = 1440;
export const RACES_PER_DAY = 480;
export const RUNNERS_PER_RACE = 12;
export const RACE_INTERVAL_MINUTES = 3;
export const RACE_DURATION_SECONDS = 60;

const FIRST_DECK = [-20, -10, 0, 10, 20, 30, 40, 50, 60];
const SECOND_DECK = [20, 40, 60];
const hashText = (value) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
};
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const gaussianish = (random) => random() + random() + random() + random() - 2;

function createPriceHistory() {
  const history = new Map();
  for (const token of TOKEN_ROSTER) {
    const returns = new Float32Array(FIXTURE_DAYS * MINUTES_PER_DAY);
    const prices = new Float32Array(returns.length + 1);
    const random = rng(hashText(`cryptodromo-synthetic-v1:${token.symbol}`));
    const volatility = token.tier === 'star' ? 0.055 : token.tier === 'core' ? 0.078 : 0.11;
    let price = 0.25 + (hashText(token.symbol) % 90000) / 100;
    prices[0] = price;
    for (let minute = 0; minute < returns.length; minute++) {
      const dayWave = Math.sin((minute % MINUTES_PER_DAY) / MINUTES_PER_DAY * Math.PI * 2 + hashText(token.symbol) % 31) * 0.009;
      const shared = Math.sin(minute * 0.031) * 0.012 + Math.sin(minute * 0.0067) * 0.009;
      let changePct = shared + dayWave + gaussianish(random) * volatility;
      // A few fixed, seeded jolts make races less uniform while preserving a replayable source.
      if (random() > (token.tier === 'challenger' ? 0.998 : 0.9995)) changePct += gaussianish(random) * volatility * 4;
      changePct = Math.max(-0.72, Math.min(0.72, changePct));
      returns[minute] = changePct;
      price *= 1 + changePct / 100;
      prices[minute + 1] = price;
    }
    history.set(token.symbol, { returns, prices });
  }
  return history;
}

// Deterministic synthetic minute candles. Same seed, same prices and same races on every visit.
export const PRICE_FIXTURE = Object.freeze({
  version: 'synthetic-v1',
  generated: true,
  liveConnection: false,
  days: FIXTURE_DAYS,
  minutesPerDay: MINUTES_PER_DAY,
  assets: TOKEN_ROSTER.length,
  history: createPriceHistory(),
});

function weightedPick(group, count, random) {
  const pool = [...group];
  const picked = [];
  while (picked.length < count) {
    const total = pool.reduce((sum, token) => sum + token.weight, 0);
    let cursor = random() * total;
    let index = pool.findIndex((token) => (cursor -= token.weight) <= 0);
    if (index < 0) index = pool.length - 1;
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

const tokenGroups = {
  star: TOKEN_ROSTER.filter((token) => token.tier === 'star'),
  core: TOKEN_ROSTER.filter((token) => token.tier === 'core'),
  challenger: TOKEN_ROSTER.filter((token) => token.tier === 'challenger'),
};

function shuffle(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getRaceFixture(raceNumber, day = 0) {
  const raceIndex = ((raceNumber % RACES_PER_DAY) + RACES_PER_DAY) % RACES_PER_DAY;
  const dayIndex = ((day % FIXTURE_DAYS) + FIXTURE_DAYS) % FIXTURE_DAYS;
  const random = rng(hashText(`schedule-v1:${dayIndex}:${raceIndex}`));
  const minute = raceIndex * RACE_INTERVAL_MINUTES;
  const baseIndex = dayIndex * MINUTES_PER_DAY + minute;
  const tokens = [
    ...weightedPick(tokenGroups.star, 4, random),
    ...weightedPick(tokenGroups.core, 4, random),
    ...weightedPick(tokenGroups.challenger, 4, random),
  ];
  const entries = shuffle(tokens, random).map((token) => {
    const data = PRICE_FIXTURE.history.get(token.symbol);
    const doseRandom = rng(hashText(`dose-v1:${dayIndex}:${raceIndex}:${token.symbol}`));
    return {
      ...token,
      input1: data.returns[baseIndex],
      input2: data.returns[baseIndex + 1],
      priceAtStart: data.prices[baseIndex],
      priceAtFinish: data.prices[baseIndex + 2],
      coefficients1: shuffle(FIRST_DECK, doseRandom),
      coefficients2: shuffle(SECOND_DECK, doseRandom),
    };
  });
  return {
    day: dayIndex + 1,
    number: raceIndex + 1,
    minute,
    time: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
    entries,
  };
}

export function getFixturePrice(symbol, day, minute) {
  const asset = PRICE_FIXTURE.history.get(symbol);
  if (!asset) return null;
  const index = (((day % FIXTURE_DAYS) + FIXTURE_DAYS) % FIXTURE_DAYS) * MINUTES_PER_DAY +
    ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return asset.prices[index];
}
