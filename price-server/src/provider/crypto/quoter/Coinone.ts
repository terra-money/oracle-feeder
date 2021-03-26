import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import { num } from 'lib/num'
import * as logger from 'lib/logger'
import { Quoter, Trades } from 'provider/base'
import { getBaseCurrency } from 'lib/currency'

interface CandlestickResponse {
  success: boolean
  data?: {
    DT: number
    Open: string
    Low: string
    High: string
    Close: string
    Volume: string
    Adj_Close: string
  }[]
}

export class Coinone extends Quoter {
  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    // get latest candles
    const base = getBaseCurrency(symbol)
    const response: CandlestickResponse = await fetch(
      `https://tb.coinone.co.kr/api/v1/chart/olhc/?site=coinone${base.toLowerCase()}&type=1m`,
      { timeout: this.options.timeout }
    ).then((res) => res.json())

    if (
      !response ||
      !response.success ||
      !Array.isArray(response.data) ||
      response.data.length < 1
    ) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    return response.data
      .filter((row) => parseFloat(row.Volume) > 0)
      .map((row) => ({
        price: num(row.Close),
        volume: num(row.Volume),
        timestamp: +row.DT,
      }))
  }

  protected async update(): Promise<boolean> {
    for (const symbol of this.symbols) {
      await this.fetchLatestTrades(symbol)
        .then((trades) => {
          if (!trades.length) {
            return
          }

          this.setTrades(symbol, trades)
          this.setPrice(symbol, trades[trades.length - 1].price)
        })
        .catch(errorHandler)
    }

    return true
  }
}

export default Coinone
