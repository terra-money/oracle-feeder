import { Provider, PriceByQuote } from './base';
import * as bluebird from 'bluebird';
import { format } from 'date-fns';
import * as sentry from '@sentry/node';
import LunaProvider from './luna/LunaProvider';
import FiatProvider from './fiat/FiatProvider';

const providers: Provider[] = [
  new LunaProvider('LUNA'), // base currency is LUNA (LUNA/KRW LUNA/USD LUNA/...)
  new FiatProvider('KRW') // base currency is KRW (KRW/USD KRW/SDR KRW/MNT ...)
];
let loggedAt: number = 0;

export async function initialize(): Promise<void> {
  for (const provider of providers) {
    await provider.initialize();
  }

  await loop();
}

export function getLunaPrices() {
  // collect luna prices
  let lunaPrices: PriceByQuote = {};
  for (const provider of providers) {
    lunaPrices = Object.assign(lunaPrices, provider.getLunaPrices(lunaPrices));
  }
  return lunaPrices;
}

async function loop(): Promise<void> {
  while (true) {
    const now = Date.now();

    await Promise.all(providers.map(provider => provider.tick(now))).catch(sentry.captureException);

    if (now - loggedAt > 60 * 1000) {
      console.log(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), getLunaPrices());
      loggedAt = now;
    }

    await bluebird.delay(100);
  }
}
