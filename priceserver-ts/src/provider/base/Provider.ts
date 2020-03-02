import * as config from 'config';
import { LastTrades } from './types';

export class Provider {
  protected name: string; // lower class name (bithumb, coinone, currencylayer)
  protected base: string; // base currency
  protected quotes: string[] = [];
  protected lastTrades: LastTrades = {};
  private updatedAt: number;
  private interval: number;
  private enable: boolean;

  constructor() {
    this.name = this.constructor.name.toLowerCase();
  }

  public async initialize(): Promise<void> {
    this.quotes = config.get(`provider.${this.name}.quotes`, []);
    this.interval = config.get(`provider.${this.name}.interval`, 1000);
    this.enable = config.get(`provider.${this.name}.enable`, false);
    this.base = config.get(`provider.${this.name}.base`);
  }

  public async tick(): Promise<boolean> {
    const now = Date.now();
    if (!this.enable || now - this.updatedAt < this.interval) {
      return false;
    }

    await this.update();

    this.updatedAt = now;
    return true;
  }

  public getLastTrades(): LastTrades {
    return this.lastTrades;
  }

  protected async update(): Promise<void> {
    throw new Error(`[${this.name}] update() must be implemented`);
  }
}

export default Provider;
