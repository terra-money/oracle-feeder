import nodeFetch from 'node-fetch';
import { errorHandler } from 'lib/error';
import { num } from 'lib/num';
import * as logger from 'lib/logger';
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
      logger.error(`${this.constructor.name}: wrong api response`, response ? JSON.stringify(response) : 'empty');
      throw 'skip';
    }

    return response.data
      .filter(row => parseFloat(row.Volume) > 0)
      .map(row => ({
        price: num(row.Close),
        volume: num(row.Volume),
        timestamp: +row.DT
      }));
  }

  protected async update(): Promise<boolean> {
    for (const quote of this.quotes) {
      // update last trades of LUNA/quote
      await this.fetchLatestTrades(quote)
        .then(trades => {
          if (!trades.length) {
            return;
          }

          this.setTrades(quote, trades);
          this.setPrice(quote, trades[trades.length - 1].price);
        })
        .catch(errorHandler);
    }

    return true;
  }
}

export default Coinone;
