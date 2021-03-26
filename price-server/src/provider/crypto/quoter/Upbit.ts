import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { WebSocketQuoter, Trades } from 'provider/base'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency'

interface CandleStickResponse {
  market: string
  candle_date_time_utc: string
  candle_date_time_kst: string
  opening_price: number
  high_price: number
  low_price: number
  trade_price: number
  timestamp: number
  candle_acc_trade_price: number
  candle_acc_trade_volume: number
  unit: number
}

interface CandlestickStreamData {
  type: string
  code: string
  timestamp: number
  trade_date: string
  trade_time: string
  trade_timestamp: number
  trade_price: number
  trade_volume: number
  ask_bid: string
  prev_closing_price: number
  change: string
  change_price: number
  sequential_id: number
  stream_type: string
}

export class Upbit extends WebSocketQuoter {
  private isUpdated = false

  public async initialize(): Promise<void> {
    await super.initialize()

    for (const symbol of this.symbols) {
      this.setTrades(symbol, [])

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
    this.isUpdated = true

    // try connect to websocket server
    // reference: https://docs.upbit.com/docs/upbit-quotation-websocket
    this.connect('wss://api.upbit.com/websocket/v1')
  }

  protected onConnect(): void {
    super.onConnect()

    // subscribe transaction
    const symbols = this.symbols
      .map((symbol) => `"${getQuoteCurrency(symbol)}-${getBaseCurrency(symbol)}"`)
      .join(',')
    this.ws.send(`[{"ticket":"UNIQUE_TICKET"},{"type":"trade","codes":[${symbols}]}]}`)
  }

  protected onData(data: CandlestickStreamData): void {
    if (data.type !== 'trade') {
      return
    }

    const splitedCode = data.code.split('-')
    const symbol = `${splitedCode[1]}/${splitedCode[0]}`
    if (!symbol) {
      return
    }

    const timestamp = +data.trade_timestamp
    const price = num(data.trade_price)
    const volume = num(data.trade_volume)

    this.setTrade(symbol, timestamp, price, volume)
    this.setPrice(symbol, price)

    this.isUpdated = true
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    // Get candles from Upbit
    // reference: https://docs.upbit.com/reference#%EC%8B%9C%EC%84%B8-%EC%BA%94%EB%93%A4-%EC%A1%B0%ED%9A%8C
    const base = getBaseCurrency(symbol)
    const quote = getQuoteCurrency(symbol)
    const response: CandleStickResponse[] = await fetch(
      `https://api.upbit.com/v1/candles/minutes/1?market=${quote}-${base}&count=10`
    ).then((res) => res.json())

    if (!response || !Array.isArray(response) || response.length < 1) {
      logger.error(
        `${this.constructor.name}: invalid api response:`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    return response
      .filter((row) => row.candle_acc_trade_volume > 0)
      .map((row) => ({
        price: num(row.trade_price),
        volume: num(row.candle_acc_trade_volume),
        timestamp: new Date(row.candle_date_time_kst).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  protected async update(): Promise<boolean> {
    if (this.isUpdated) {
      this.isUpdated = false
      return true
    }

    return false
  }
}

export default Upbit
