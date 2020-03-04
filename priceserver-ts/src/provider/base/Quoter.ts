import got, { Got } from 'got';
import { LastTrades } from './types';

interface QuoterOptions {
  interval: number; // update interval
  timeout: number; // api call timeout
  apiKey?: string;
  movingAverageSpan?: number;
}

export class Quoter {
  protected options: QuoterOptions;
  protected baseCurrency: string; // base currency
  protected quotes: string[] = []; // quote currencies
  protected lastTrades: LastTrades = {};
  protected client: Got;
  private updatedAt: number;

  constructor(baseCurrency: string, quotes: string[], options: QuoterOptions) {
    this.baseCurrency = baseCurrency;
    this.quotes = quotes;
    this.options = options;
  }

  public async initialize(): Promise<void> {
    this.client = got.extend({
      retry: 0,
      timeout: this.options.timeout
    });
  }

  public async tick(now: number): Promise<boolean> {
    if (now - this.updatedAt < this.options.interval) {
      return false;
    }

    this.updatedAt = now;
    return this.update();
  }

  public getLastTrades(): LastTrades {
    return this.lastTrades;
  }

  protected async update(): Promise<boolean> {
    throw new Error(`[${this.constructor.name}] update() must be implemented`);
  }
}

export default Quoter;
