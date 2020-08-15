import nodeFetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import { num } from 'lib/num'
import * as logger from 'lib/logger'
import { sendSlack } from 'lib/slack'
import { Quoter, Trades } from '../base'
import { toQueryString } from 'lib/fetch'
import { fiatProvider } from '..'

export class Huobi extends Quoter {
  private async fetchLatestTrades(quote: string): Promise<Trades> {
    const params = {
      symbol: 'lunausdt',
      period: '1min',
      size: 200,
    }

    quote // to avoid lint

    // Get candles from Huobi
    // reference: https://huobiapi.github.io/docs/spot/v1/en/#get-klines-candles
    const response = await nodeFetch(
      `https://api.huobi.pro/market/history/kline?${toQueryString(params)}`
    ).then((res) => res.json())

    if (
      !response ||
      response.status !== 'ok' ||
      !Array.isArray(response.data) ||
      response.data.length < 1
    ) {
      logger.error(
        `${this.constructor.name}: invalid api response:`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('invalid response from Huobi')
    }

    const rate = fiatProvider.getPriceBy('USD')

    if (!rate) {
      return []
    }

    return response.data
      .filter((row) => parseFloat(row.vol) > 0)
      .map((row) => ({
        price: num(row.close).dividedBy(rate),
        volume: num(row.amount),
        timestamp: +row.id * 1000,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  protected async update(): Promise<boolean> {
    for (const quote of this.quotes) {
      // update last trades of LUNA/quote
      await this.fetchLatestTrades(quote)
        .then((trades) => {
          if (!trades.length) {
            return
          }

          this.setTrades(quote, trades)
          this.setPrice(quote, trades[trades.length - 1].price)
        })
        .catch(errorHandler)
    }

    return true
  }
}

export default Huobi
