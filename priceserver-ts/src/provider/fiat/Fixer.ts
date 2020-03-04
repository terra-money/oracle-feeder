import { Quoter } from '../base';

interface Response {
  success: boolean;
  rates: { [quote: string]: number };
  error?: any;
};

export class Fixer extends Quoter {
  private async updateLastTrades(): Promise<void> {
    const now = Date.now();

    const searchParams = {
      access_key: this.options.apiKey,
      // base: this.baseCurrency, // need 'PROFESSIONAL PLUS' subscription
      symbols: this.quotes.map(quote => quote === 'SDR' ? 'XDR' : quote).join(',') + ',KRW'
    };

    const response: Response = await this.client
      .get('http://data.fixer.io/api/latest', { searchParams })
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

  protected async update(): Promise<boolean> {
    this.lastTrades = {};

    await this
      .updateLastTrades()
      .catch(console.error);

    return true;
  }
}

export default Fixer;
