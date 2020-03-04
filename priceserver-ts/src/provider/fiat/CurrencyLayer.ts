import * as sentry from '@sentry/node';
import { Quoter } from '../base';

interface Response {
  success: boolean;
  quotes: { [symbol: string]: number };
  error?: any;
};

export class CurrencyLayer extends Quoter {
  private async updateLastTrades(): Promise<void> {
    const now = Date.now();

    const searchParams = {
      access_key: this.options.apiKey,
      source: this.baseCurrency,
      currencies: this.quotes.map(quote => quote === 'SDR' ? 'XDR' : quote).join(',')
    };

    const response: Response = await this.client
      .get('https://apilayer.net/api/live', { searchParams })
      .json();

    if (!response || !response.success || !response.quotes) {
      throw new Error(`wrong response, ${response}`);
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

  protected async update(): Promise<boolean> {
    this.lastTrades = {};

    await this
      .updateLastTrades()
      .catch(sentry.captureException);

    return true;
  }
}

export default CurrencyLayer;
