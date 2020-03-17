import { Provider, PriceByQuote } from './base';
import * as bluebird from 'bluebird';
import { format, isSameMinute } from 'date-fns';
import { errorHandler } from 'lib/error';
import * as logger from 'lib/logger';
import LunaProvider from './luna/LunaProvider';
import FiatProvider from './fiat/FiatProvider';

const providers: Provider[] = [
  new LunaProvider('LUNA'), // base currency is LUNA (LUNA/KRW LUNA/USD LUNA/...)
  new FiatProvider('KRW') // base currency is KRW (KRW/USD KRW/SDR KRW/MNT ...)
];
let loggedAt: number = 0;

export async function initialize(): Promise<void> {
  await Promise.all(providers.map(provider => provider.initialize()));

  await loop();
}

export function getLunaPrices(): PriceByQuote {
  let lunaPrices: PriceByQuote = {};

  // collect luna prices
  for (const provider of providers) {
    lunaPrices = Object.assign(lunaPrices, provider.getLunaPrices(lunaPrices));
  }

  return lunaPrices;
}

async function loop(): Promise<void> {
  while (true) {
    const now = Date.now();

    await Promise.all(providers.map(provider => provider.tick(now))).catch(errorHandler);

    if (!isSameMinute(now, loggedAt)) {
      logger.info(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), getLunaPrices());

      loggedAt = now;
    }

    await bluebird.delay(10);
  }
}
