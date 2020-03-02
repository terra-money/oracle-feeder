import got from 'got';
import * as config from 'config';
import { Provider } from '../base/Provider';

interface Response {
  success: boolean;
  quotes: { [symbol: string]: number };
  error?: any;
};

export class CurrencyLayer extends Provider {
  private async updateLastTrades(): Promise<void> {
    const now = Date.now();

    const searchParams = {
      access_key: config.get(`provider.${this.name}.apiKey`),
      source: this.base,
      currencies: this.quotes.map(quote => quote === 'SDR' ? 'XDR' : quote).join(',')
    };
    const response: Response = await got
      .get('https://apilayer.net/api/live', {
        searchParams,
        retry: 0,
        timeout: config.get(`provider.${this.name}.timeout`, 10000)
      })
      .json();

    if (!response.success) {
      throw new Error(response.error);
    }

    // update last trades
    for (const symbol of Object.keys(response.quotes)) {
      const quote = symbol.replace('KRW', '');
      this.lastTrades[quote === 'XDR' ? 'SDR' : quote] = {
        price: +response.quotes[symbol],
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

export default CurrencyLayer;
