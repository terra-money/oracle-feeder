import * as weightedMedian from 'weighted-median';
import { Provider, Prices } from '../base';
import Bithumb from './Bithumb';
import Coinone from './Coinone';

const providers: Provider[] = [
  new Bithumb(),
  new Coinone()
];
const lunaPrices: Prices = {};

export async function initialize(): Promise<void> {
  for (const provider of providers) {
    await provider.initialize();
  }
}

export function getLunaPrices(): Prices {
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
    calculateLunaPrices();
  }

  return isUpdated;
}

function calculateLunaPrices() {
  // collected last trade record by quote
  const collectedTrades: {
    [quote: string]: { value: number, weight: number }[]
  } = {};

  // collect last trade record by quote of providers
  for (const provider of providers) {
    const lastTrades = provider.getLastTrades();

    for (const quote of Object.keys(lastTrades)) {
      if (!collectedTrades[quote]) {
        collectedTrades[quote] = [];
      }

      collectedTrades[quote].push({
        value: lastTrades[quote].price,
        weight: lastTrades[quote].volume
      });
    }
  }

  // calculate weighted median luna price of quotes
  for (const quote of Object.keys(collectedTrades)) {
    lunaPrices[quote] = weightedMedian(collectedTrades[quote]);
  }
}
