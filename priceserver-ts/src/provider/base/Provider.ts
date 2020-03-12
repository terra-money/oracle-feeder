import { uniq, concat } from 'lodash';
import { average } from 'lib/average';
import { PriceByQuote, Trades } from './types';
import Quoter from './Quoter';

export class Provider {
  protected quoters: Quoter[] = [];
  protected quotes: string[] = []; // quote currencies
  protected priceByQuote: PriceByQuote = {};
  protected baseCurrency: string;

  constructor(baseCurrency: string) {
    this.baseCurrency = baseCurrency;
  }

  public async initialize(): Promise<void> {
    for (const quoter of this.quoters) {
      await quoter.initialize();
    }
    this.quotes = uniq(concat(...this.quoters.map(quoter => quoter.getQuotes())));
  }

  public async tick(now: number): Promise<boolean> {
    const responses = await Promise.all(this.quoters.map(quoter => quoter.tick(now)));

    // if some quoter updated
    if (responses.some(response => response)) {
      this.adjustPrices();
      return true;
    }

    return false;
  }

  public getLunaPrices(lunaPrices: PriceByQuote): PriceByQuote {
    if (this.baseCurrency === 'LUNA') {
      return this.priceByQuote;
    }

    // convert base currency to Luna and return
    const prices: PriceByQuote = {};

    if (lunaPrices[this.baseCurrency]) {
      for (const quote of Object.keys(this.priceByQuote)) {
        prices[quote] = this.priceByQuote[quote] * lunaPrices[this.baseCurrency];
      }
    }

    return prices;
  }

  // collect latest trade records
  protected collectTrades(quote: string): Trades {
    return concat(...this.quoters.map(quoter => quoter.getTrades(quote) || []));
  }

  protected collectPrice(quote: string): number[] {
    return this.quoters.map(quoter => quoter.getPrice(quote)).filter(price => typeof price === 'number');
  }

  protected adjustPrices() {
    // calculate average of prices
    for (const quote of this.quotes) {
      delete this.priceByQuote[quote];

      const prices: number[] = this.collectPrice(quote);

      if (prices.length > 0) {
        this.priceByQuote[quote] = average(prices);
      }
    }
  }
}

export default Provider;
