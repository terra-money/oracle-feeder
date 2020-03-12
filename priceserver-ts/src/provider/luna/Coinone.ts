import nodeFetch from 'node-fetch';
import { errorHandling } from 'lib/error';
import { Quoter, Trades } from '../base';

const candlestickUrl = {
  KRW: 'https://tb.coinone.co.kr/api/v1/chart/olhc/?site=coinoneluna&type=1m'
};

interface CandlestickResponse {
  success: boolean;
  data?: {
    DT: number;
    Open: string;
    Low: string;
    High: string;
    Close: string;
    Volume: string;
    Adj_Close: string;
  }[];
}

export class Coinone extends Quoter {
  private async fetchLatestTrades(quote: string): Promise<Trades> {
    // get latest candles
    const response: CandlestickResponse = await nodeFetch(candlestickUrl[quote], {
      timeout: this.options.timeout
    }).then(res => res.json());

    if (!response || !response.success || !Array.isArray(response.data) || response.data.length < 1) {
      throw new Error(`wrong response, ${response}`);
    }

    return response.data
      .filter(row => parseFloat(row.Volume) > 0)
      .map(row => ({
        price: parseFloat(row.Close),
        volume: parseFloat(row.Volume),
        timestamp: +row.DT
      }));
  }

  protected async update(): Promise<boolean> {
    for (const quote of this.quotes) {
      // update last trades of LUNA/quote
      await this.fetchLatestTrades(quote)
        .then(trades => {
          if (trades.length > 0) {
            this.tradesByQuote[quote] = trades;
            this.priceByQuote[quote] = trades[trades.length - 1].price;
          }
        })
        .catch(errorHandling);
    }

    return true;
  }
}

export default Coinone;
