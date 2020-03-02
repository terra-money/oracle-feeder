import got from 'got';
import * as MA from 'moving-average';
import * as config from 'config';
import { Provider, LastTrade } from '../base';

const headers = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest'
};

const requestData = {
  'KRW': { // LUNA/KRW
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
};

export class Bithumb extends Provider {
  private async fetchLastTrade(quote: string): Promise<LastTrade> {
    const now = Date.now();
    let volume = 0;

    // get latest candles
    const response: Response = await got
      .post(`https://www.bithumb.com/trade_history/chart_data?_=${now}`, {
        headers : {
          ...headers,
          cookie: `csrf_xcoin_name=${requestData[quote].csrf_xcoin_name}`
        },
        form: requestData[quote],
        retry: 0,
        timeout: config.get(`provider.${this.name}.timeout`, 10000),
      })
      .json();

    if (response.error !== '0000' || !Array.isArray(response.data)) {
      throw new Error(`[${response.error}] ${response.message}`);
    }

    // calcuate moving average
    const ma = MA(60 * 1000); // moving average(1m)
    const movingAverageSpan = config.get(`provider.${this.name}.movingAverageSpan`, 3 * 60 * 1000);

    for (const row of response.data) {
      // the order is [time, open, close, high, low, volume]
      const time = +row[0];
      const high = parseFloat(row[3]);
      const low = parseFloat(row[4]);
      const vol = parseFloat(row[5]);

      // Use data only as much as moving average span
      if (now - time < movingAverageSpan) {
        ma.push(time, (high + low) / 2);
        volume += vol;
      }
    }

    return {
      price: ma.movingAverage(),
      volume,
      updatedAt: now
    }
  }

  protected async update(): Promise<void> {
    // update last trade of LUNA/quotes
    this.lastTrades = {};
    for (const quote of this.quotes) {
      await this
        .fetchLastTrade(quote)
        .then(lastTrade => { this.lastTrades[quote] = lastTrade; })
        .catch(console.error);
    }
  }
}

export default Bithumb;
