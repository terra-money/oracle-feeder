import * as config from 'config';
import { uniq, concat } from 'lodash';
import { format, addMinutes, isSameMinute, isSameDay } from 'date-fns';
import { createReporter } from 'lib/reporter';
import { average } from 'lib/statistics';
import * as logger from 'lib/logger';
import { PriceByQuote, Trades } from './types';
import Quoter from './Quoter';

export class Provider {
  protected quoters: Quoter[] = [];
  protected quotes: string[] = []; // quote currencies
  protected priceByQuote: PriceByQuote = {};
  protected baseCurrency: string;
  private reporter;
  private reportedAt: number = 0;

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

    // report the prices
    if (config.report) {
      this.report(now);
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

  private report(now: number) {
    if (isSameMinute(now, this.reportedAt)) {
      return;
    }

    try {
      if (!this.reporter || !isSameDay(now, this.reportedAt)) {
        this.reporter = createReporter(
          `report/${this.constructor.name}_${format(now, 'MM-dd_HHmm')}.csv`,
          [
            'time',
            ...this.quotes.map(quote => `${this.baseCurrency}/${quote}`),
            ...concat(...this.quoters.map(quoter => concat(...quoter.getQuotes().map(quote => `${quoter.constructor.name}\n${this.baseCurrency}/${quote}`))))
          ]
        );
      }

      const report = {
        time: format(Math.floor(addMinutes(now, -1).getTime() / 60000) * 60000, 'MM-dd HH:mm')
      };

      // report adjust price
      for (const quote of this.quotes) {
        report[`${this.baseCurrency}/${quote}`] = this.priceByQuote[quote]?.toFixed(8);
      }

      // report quoter's price
      for (const quoter of this.quoters) {
        for (const quote of quoter.getQuotes()) {
          const key = `${quoter.constructor.name}\n${this.baseCurrency}/${quote}`;
          report[key] = quoter.getPrice(quote)?.toFixed(8);
        }
      }

      this.reporter.writeRecords([report]);
    } catch (error) {
      logger.error(error);
    }

    this.reportedAt = now;
  }
}

export default Provider;
