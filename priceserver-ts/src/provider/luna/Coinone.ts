import * as sentry from '@sentry/node';
import { Quoter, Trades } from '../base';

const url = {
  KRW: 'https://tb.coinone.co.kr/api/v1/chart/olhc/?site=coinoneluna&type=1m'
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
}

export class Coinone extends Quoter {
  private async fetchLatestTrade(quote: string): Promise<Trades> {
    const now = Date.now();

    // get latest candles
    const response: Response = await this.client.get(url[quote]).json();

    if (!response || !response.success || !Array.isArray(response.data)) {
      throw new Error(`wrong response, ${response}`);
    }

    const trades: Trades = [];

    for (const row of response.data) {
      const timestamp = +row.DT;
      const high = parseFloat(row.High);
      const low = parseFloat(row.Low);
      const volume = parseFloat(row.Volume);

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
    // update last trade of LUNA/quotes
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

export default Coinone;
