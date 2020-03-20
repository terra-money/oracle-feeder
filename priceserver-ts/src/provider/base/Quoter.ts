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
  private tradesByQuote: TradesByQuote = {};
  private priceByQuote: PriceByQuote = {};
  protected alivedAt: number;
  private updatedAt: number; // for interval update

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

  protected setTrades(quote: string, trades: Trades) {
    // trades filtering that are past 60 minutes
    this.tradesByQuote[quote] = trades.filter(trade => Date.now() - trade.timestamp < 60 * 60 * 1000);

    this.alive();
  }

  public getTrades(quote: string): Trades {
    // unresponsed more than 1 minute, not used
    if (Date.now() - this.alivedAt > 60 * 1000) {
      return [];
    }

    return this.tradesByQuote[quote];
  }

  protected setPrice(quote: string, price: BigNumber) {
    this.priceByQuote[quote] = price;

    this.alive();
  }

  public getPrice(quote: string): BigNumber {
    // unresponsed more than 1 minute, not used
    if (Date.now() - this.alivedAt > 60 * 1000) {
      return undefined;
    }

    return this.priceByQuote[quote];
  }

  protected async update(): Promise<boolean> {
    return false;
  }

  protected alive() {
    this.alivedAt = Date.now();
  }
}

export default Quoter;
