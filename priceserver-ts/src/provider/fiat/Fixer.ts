import nodeFetch from 'node-fetch';
import { errorHandling } from 'lib/error';
import { toQueryString } from 'lib/fetch';
import { Quoter } from '../base';

interface Response {
  success: boolean;
  rates: { [quote: string]: number };
  error?: any;
}

export class Fixer extends Quoter {
  private async updateLastTrades(): Promise<void> {
    const params = {
      access_key: this.options.apiKey,
      // base: this.baseCurrency, // need 'PROFESSIONAL PLUS' subscription
      symbols: this.quotes.map(quote => (quote === 'SDR' ? 'XDR' : quote)).join(',') + ',KRW'
    };

    const response: Response = await nodeFetch(`http://data.fixer.io/api/latest?${toQueryString(params)}`, {
      timeout: this.options.timeout
    }).then(res => res.json());

    if (!response || !response.success || !response.rates) {
      throw new Error(`wrong response, ${response}`);
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
      this.priceByQuote[quote === 'XDR' ? 'SDR' : quote] = +response.rates[quote];
    }
  }

  protected async update(): Promise<boolean> {
    await this.updateLastTrades().catch(errorHandling);

    return true;
  }
}

export default Fixer;
