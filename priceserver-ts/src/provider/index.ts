import { Provider, PriceByQuote } from './base';
import * as config from 'config';
import * as bluebird from 'bluebird';
import { reduce } from 'lodash';
import { format, isSameDay, isSameMinute, addMinutes } from 'date-fns';
import { errorHandler } from 'lib/error';
import * as logger from 'lib/logger';
import { createReporter } from 'lib/reporter';
import LunaProvider from './luna/LunaProvider';
import FiatProvider from './fiat/FiatProvider';
import { sendSlack } from 'lib/slack';

const providers: Provider[] = [
  new LunaProvider('LUNA'), // base currency is LUNA (LUNA/KRW LUNA/USD LUNA/...)
  new FiatProvider('KRW') // base currency is KRW (KRW/USD KRW/SDR KRW/MNT ...)
];
let reporter;
let reportedAt: number = 0;

export async function initialize(): Promise<void> {
  await sendSlack('Bithumb is not responding for 1 minute.');
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

    report(now);

    await bluebird.delay(10);
  }
}

function report(now: number) {
  if (isSameMinute(now, reportedAt)) {
    return;
  }

  try {
    const lunaPrices = reduce(
      getLunaPrices(),
      (result, value, key) => Object.assign(result, { [`LUNA/${key}`]: value.toFixed(18) }),
      {}
    );

    logger.info(lunaPrices);

    if (!config.report) {
      reportedAt = now;
      return;
    }

    if (!reporter || !isSameDay(now, reportedAt)) {
      reporter = createReporter(`report/LunaPrices_${format(now, 'MM-dd_HHmm')}.csv`, [
        'time',
        ...Object.keys(lunaPrices).map(quote => quote)
      ]);
    }

    reporter.writeRecords([
      {
        time: format(Math.floor(addMinutes(now, -1).getTime() / 60000) * 60000, 'MM-dd HH:mm'),
        ...lunaPrices
      }
    ]);
  } catch (error) {
    logger.error(error);
  }

  reportedAt = now;
}
