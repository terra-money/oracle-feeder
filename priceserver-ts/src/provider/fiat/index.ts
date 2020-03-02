import * as median from 'stats-median';
import { Provider, Prices } from '../base';
import CurrencyLayer from './CurrencyLayer';
import Fixer from './Fixer';

const providers: Provider[] = [
  new CurrencyLayer(),
  new Fixer()
];
const krwPrices: Prices = {};

export async function initialize(): Promise<void> {
  for (const provider of providers) {
    await provider.initialize();
  }
}

export function getLunaPrices(LUNAKRW: number): Prices {
  const lunaPrices: Prices = {};

  for (const quote of Object.keys(krwPrices)) {
    lunaPrices[quote] = krwPrices[quote] * LUNAKRW;
  }

  return lunaPrices;
}

export async function tick(): Promise<boolean> {
  let isUpdated = false;

  // update the last price by provider
  for (const provider of providers) {
    if(await provider.tick()) {
      isUpdated = true;
    }
  }

  if (isUpdated) {
    calculateKrwPrices();
  }

  return isUpdated;
}

function calculateKrwPrices() {
  const collectedPrices: { [quote: string]: number[]; } = {};

  // collect last trade of providers
  for (const provider of providers) {
    const lastTrades = provider.getLastTrades();

    for (const quote of Object.keys(lastTrades)) {
      if (!collectedPrices[quote]) {
        collectedPrices[quote] = [];
      }

      collectedPrices[quote].push(lastTrades[quote].price);
    }
  }

  // calculate median price of quotes
  for (const quote of Object.keys(collectedPrices)) {
    krwPrices[quote] = median.calc(collectedPrices[quote]);
  }
}
