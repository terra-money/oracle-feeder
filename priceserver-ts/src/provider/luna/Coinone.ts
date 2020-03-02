import got from 'got';
import * as MA from 'moving-average';
import * as config from 'config';
import { Provider, LastTrade } from '../base';

const url = {
  'KRW': 'https://tb.coinone.co.kr/api/v1/chart/olhc/?site=coinoneluna&type=1m'
};

interface Response {
  success: boolean;
  data?: {
    DT: number;
    Open: string;
    Low: string;
    High: string;
    Close: string;
    Volume: string;
  }[];
};

export class Coinone extends Provider {
  private async fetchLastTrade(quote: string): Promise<LastTrade> {
    const now = Date.now();
    let volume = 0;

    // get latest candles
    const response: Response = await got
      .get(url[quote], { retry: 0, timeout: config.get(`provider.${this.name}.timeout`, 10000) })
      .json();

    if (!response.success || !Array.isArray(response.data)) {
      throw new Error('request failed');
    }

    // calcuate moving average
    const ma = MA(60 * 1000); // moving average(1m)
    const movingAverageSpan = config.get(`provider.${this.name}.movingAverageSpan`, 3 * 60 * 1000);

    for (const row of response.data) {
      const time = +row.DT;
      const high = parseFloat(row.High);
      const low = parseFloat(row.Low);
      const vol = parseFloat(row.Volume);

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

export default Coinone;
