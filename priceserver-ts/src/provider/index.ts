import { Provider, Prices } from './base';
import { format } from 'date-fns';
import LunaProvider from './luna/LunaProvider';
import FiatProvider from './fiat/FiatProvider';

const providers: Provider[] = [
  new LunaProvider('LUNA'), // base currency is LUNA (LUNA/KRW LUNA/USD LUNA/...)
  new FiatProvider('KRW') // base currency is KRW (KRW/USD KRW/SDR KRW/MNT ...)
];
let lunaPrices: Prices = {};
let tickTimer: NodeJS.Timer;
let logedAt: number = 0;

export async function initialize(): Promise<void> {
  for (const provider of providers) {
    await provider.initialize();
  }

  await tick();
}

export function getLunaPrices() {
  return lunaPrices;
}

async function tick(): Promise<void> {
  // if some provider updated
  const now = Date.now();
  const responses = await Promise.all(
    providers.map(provider => provider.tick(now))
  );
  if (responses.some(response => response)) {
    // collect luna prices
    lunaPrices = {};
    for (const provider of providers) {
      lunaPrices = Object.assign(lunaPrices, provider.getLunaPrices(lunaPrices));
    }

    if (now - logedAt > 10000) {
      console.log(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), lunaPrices);
      logedAt = now;
    }
  }

  // set timer for loop
  if (tickTimer) clearTimeout(tickTimer);
  tickTimer = setTimeout(() => tick(), 100);
}
