import { BigNumber } from 'bignumber.js';
import { TradesByQuote, Trades, PriceByQuote } from './types';

interface QuoterOptions {
  interval: number; // update interval
  timeout: number; // api call timeout
  apiKey?: string;
}

export class Quoter {
  protected options: QuoterOptions;
  protected baseCurrency: string; // base currency
  protected quotes: string[] = []; // quote currencies
  protected tradesByQuote: TradesByQuote = {};
  protected priceByQuote: PriceByQuote = {};
  private updatedAt: number;

  constructor(baseCurrency: string, quotes: string[], options: QuoterOptions) {
    this.baseCurrency = baseCurrency;
    this.quotes = quotes;
    this.options = options;
  }

  public async initialize(): Promise<void> {
    return;
  }

  public async tick(now: number): Promise<boolean> {
    if (now - this.updatedAt < this.options.interval) {
      return false;
    }

    this.updatedAt = now;
    return this.update();
  }

  public getQuotes(): string[] {
    return this.quotes;
  }

  public getTrades(quote: string): Trades {
    return this.tradesByQuote[quote];
  }

  public getPrice(quote: string): BigNumber {
    return this.priceByQuote[quote];
  }

  protected async update(): Promise<boolean> {
    return false;
  }
}

export default Quoter;
