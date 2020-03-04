import * as median from 'stats-median';
import { Prices } from './types';
import Quoter from './Quoter';

export class Provider {
  protected quoters: Quoter[] = [];
  protected prices: Prices = {};
  protected baseCurrency: string;

  constructor(baseCurrency: string) {
    this.baseCurrency = baseCurrency;
  }

  public async initialize(): Promise<void> {
    for (const quoter of this.quoters) {
      await quoter.initialize();
    }
  }

  public async tick(now: number): Promise<boolean> {
    const responses = await Promise.all(
      this.quoters.map(quoter => quoter.tick(now))
    );
    // if some quoter updated
    if (responses.some(response => response)) {
      this.adjustPrices();
      return true;
    }

    return false;
  }

  public getLunaPrices(lunaPrices: Prices): Prices {
    if (this.baseCurrency === 'LUNA') {
      return this.prices;
    }

    // convert base currency to Luna and return
    const prices: Prices = {};

    if (lunaPrices[this.baseCurrency]) {
      for (const quote of Object.keys(this.prices)) {
        prices[quote] = this.prices[quote] * lunaPrices[this.baseCurrency];
      }
    }

    return prices;
  }

  // calculate median of prices collected by quoters
  protected adjustPrices() {
    const collectedPrices: { [quote: string]: number[]; } = {};

    // collect prices ex) { KRW: [100, 101], USD: [200, 201] }
    for (const quoter of this.quoters) {
      const lastTrades = quoter.getLastTrades();

      for (const quote of Object.keys(lastTrades)) {
        collectedPrices[quote] = [
          ...(collectedPrices[quote] || []),
          lastTrades[quote].price
        ];
      }
    }

    // calculate median of prices
    for (const quote of Object.keys(collectedPrices)) {
      this.prices[quote] = median.calc(collectedPrices[quote]);
    }
  }
}

export default Provider;
