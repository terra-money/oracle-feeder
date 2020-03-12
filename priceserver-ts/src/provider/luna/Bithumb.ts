import nodeFetch from 'node-fetch';
import { errorHandling } from 'lib/error';
import { toFormData } from 'lib/fetch';
import * as logger from 'lib/logger';
import { WebSocketQuoter, Trades } from '../base';

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

interface CandlestickResponse {
  error: string;
  message?: string;
  data?: any;
}

interface TransactionResponse {
  content: {
    list: {
      symbol: string;
      contPrice: string; // price
      contQty: string; // volume
      contDtm: string; // transaction time
    }[];
  };
}

export class Bithumb extends WebSocketQuoter {
  private isUpdated: boolean = false;

  public async initialize(): Promise<void> {
    for (const quote of this.quotes) {
      this.tradesByQuote[quote] = [];

      // update last trades and price of LUNA/quote
      await this.fetchLatestTrades(quote)
        .then(trades => {
          this.tradesByQuote[quote] = trades;
          if (trades.length) {
            this.priceByQuote[quote] = trades[trades.length - 1].price;
          }
        })
        .catch(errorHandling);
    }

    this.connect('wss://pubwss.bithumb.com/pub/ws');
    return;
  }

  protected onConnect() {
    logger.info(`${this.constructor.name}: WebSocket connected`);

    const symbols = this.quotes.map(quote => `"${this.baseCurrency}_${quote}"`).join(',');

    // subscribe transaction
    this.ws.send(`{"type":"transaction", "symbols":[${symbols}]}`);
  }

  protected onData(raw) {
    let data;
    try {
      data = JSON.parse(raw);

      if (data.status === '0000') {
        logger.info(`${this.constructor.name}: ${data.resmsg}`);
        return;
      }
    } catch (error) {
      logger.error(error);
      return;
    }

    try {
      switch (data.type) {
        case 'transaction':
          this.onTransaction(data);
          break;

        default:
          logger.warn(`${this.constructor.name}: receive unknown type data`, data);
          break;
      }
    } catch (error) {
      errorHandling(error);
    }
  }

  private onTransaction(data: TransactionResponse) {
    for (const row of data.content.list) {
      const quote = row.symbol.split('_')[1];

      if (this.quotes.indexOf(quote) < 0 || row.contQty === '0') {
        logger.info(quote, row.contPrice, row.contQty);
        continue;
      }

      const timestamp = Math.floor(new Date(row.contDtm).getTime() / 60000) * 60000;
      const price = parseFloat(row.contPrice);
      const volume = parseFloat(row.contQty);
      const currentTrade = this.tradesByQuote[quote].find(trade => trade.timestamp === timestamp);

      if (currentTrade) {
        currentTrade.price = price;
        currentTrade.volume += volume;
      } else {
        this.tradesByQuote[quote].push({ price, volume, timestamp });
      }

      this.priceByQuote[quote] = price;

      // console.log('last', format(timestamp, 'MM-dd HH:mm:ss'), price, volume);
    }

    this.isUpdated = true;
  }

  private async fetchLatestTrades(quote: string): Promise<Trades> {
    // get latest candles
    const response: CandlestickResponse = await nodeFetch(
      `https://www.bithumb.com/trade_history/chart_data?_=${Date.now()}`,
      {
        method: 'POST',
        headers: Object.assign(headers, { cookie: `csrf_xcoin_name=${requestData[quote].csrf_xcoin_name}` }),
        body: toFormData(requestData[quote]),
        timeout: this.options.timeout
      }
    ).then(res => res.json());

    if (!response || response.error !== '0000' || !Array.isArray(response.data) || response.data.length < 1) {
      throw new Error(`wrong response, ${response}`);
    }

    return response.data.map(row => ({
      // the order is [time, open, close, high, low, volume]
      price: parseFloat(row[2]),
      volume: parseFloat(row[5]),
      timestamp: +row[0]
    }));
  }

  protected async update(): Promise<boolean> {
    // remove trades that are past 5 minutes
    for (const quote of this.quotes) {
      this.tradesByQuote[quote] = this.tradesByQuote[quote].filter(
        trade => Date.now() - trade.timestamp < 5 * 60 * 1000
      );
    }

    if (this.isUpdated) {
      this.isUpdated = false;
      return true;
    }

    return false;
  }
}

export default Bithumb;
