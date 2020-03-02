import got from 'got';
import * as config from 'config';
import { Provider } from '../base/Provider';

interface Response {
  success: boolean;
  rates: { [quote: string]: number };
  error?: any;
};

export class Fixer extends Provider {
  private async updateLastTrades(): Promise<void> {
    const now = Date.now();

    const searchParams = {
      access_key: config.get(`provider.${this.name}.apiKey`),
      // base: this.base, // need 'PROFESSIONAL PLUS' subscription
      symbols: this.quotes.map(quote => quote === 'SDR' ? 'XDR' : quote).join(',') + ',KRW'
    };
    const response: Response = await got
      .get('http://data.fixer.io/api/latest', {
        searchParams,
        retry: 0,
        timeout: config.get(`provider.${this.name}.timeout`, 10000)
      })
      .json();

    if (!response.success) {
      throw new Error(response.error);
    }

    if (!response.rates.KRW) {
      throw new Error('there is no KRW price');
    }

    // convert to KRW prices
    const krwRate = 1 / +response.rates.KRW;
    delete response.rates.KRW;
    for (const quote of Object.keys(response.rates)) {
      response.rates[quote] *= krwRate;
    }

    // update last trades
    for (const quote of Object.keys(response.rates)) {
      this.lastTrades[quote === 'XDR' ? 'SDR' : quote] = {
        price: +response.rates[quote],
        updatedAt: now,
        volume: 0
      };
    }
  }

  protected async update(): Promise<void> {
    this.lastTrades = {};

    await this
      .updateLastTrades()
      .catch(console.error);
  }
}

export default Fixer;
