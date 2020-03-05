import * as sentry from '@sentry/node';
import { Quoter, Trades } from '../base';

const headers = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest'
};

const requestData = {
  KRW: {
    // LUNA/KRW
    coinType: 'C0534',
    crncCd: 'C0100',
    tickType: '01M',
    csrf_xcoin_name: 'd2e131dccab300919c9fafcec567bb51'
  }
};

interface Response {
  error: string;
  message?: string;
  data?: any;
}

export class Bithumb extends Quoter {
  private async fetchLatestTrade(quote: string): Promise<Trades> {
    const now = Date.now();

    // get latest candles
    const response: Response = await this.client
      .post(`https://www.bithumb.com/trade_history/chart_data?_=${now}`, {
        headers: {
          ...headers,
          cookie: `csrf_xcoin_name=${requestData[quote].csrf_xcoin_name}`
        },
        form: requestData[quote]
      })
      .json();

    if (!response || !Array.isArray(response.data)) {
      throw new Error(`wrong response, ${response}`);
    }
    if (response.error !== '0000') {
      throw new Error(`[${response.error}] ${response.message}`);
    }

    const trades: Trades = [];

    for (const row of response.data) {
      // the order is [time, open, close, high, low, volume]
      const timestamp = +row[0];
      const high = parseFloat(row[3]);
      const low = parseFloat(row[4]);
      const volume = parseFloat(row[5]);

      // Use data only as much as price period
      if (now - timestamp < this.options.pricePeriod) {
        trades.push({
          price: (high + low) / 2,
          volume,
          timestamp
        });
      }
    }

    if (trades.length < 1) {
      throw new Error('there is no trade record');
    }

    return trades;
  }

  protected async update(): Promise<boolean> {
    // update last trades of LUNA/quote
    this.tradesByQuote = {};
    for (const quote of this.quotes) {
      await this.fetchLatestTrade(quote)
        .then(trades => {
          this.tradesByQuote[quote] = trades;
        })
        .catch(sentry.captureException);
    }

    return true;
  }
}

export default Bithumb;
