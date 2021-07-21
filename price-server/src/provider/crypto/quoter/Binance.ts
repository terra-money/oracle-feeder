import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { toQueryString } from 'lib/fetch'
import { WebSocketQuoter, Trades } from 'provider/base'

interface StreamData {
  stream: string
  data: CandlestickStreamData | Record<string, unknown>
}

interface CandlestickStreamData {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  k: {
    t: number // Kline start time
    T: number // Kline close time
    s: string // Symbol
    i: string // Interval
    f: number // First trade ID
    L: number // Last trade ID
    o: string // Open price
    c: string // Close price
    h: string // High price
    l: string // Low price
    v: string // Base asset volume
    n: number // Number of trades
    x: boolean // Is this kline closed?
  }
}

export class Binance extends WebSocketQuoter {
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
          // this.calculateKRWPrice(symbol)
        })
        .catch(errorHandler)
    }
    this.isUpdated = true

    // try connect to websocket server
    // reference: https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-streams
    const symbols = this.symbols
      .map((symbol) => `${symbol.replace('/', '').toLowerCase()}@kline_1m`)
      .join('/')
    this.connect(`wss://stream.binance.com:9443/stream?streams=${symbols}`)
  }

  protected onData(streamData: StreamData): void {
    const data = streamData.data as CandlestickStreamData
    if (streamData.stream.indexOf('@kline_1m') < 0 || data.e !== 'kline') {
      throw new Error(`[Error] wrong stream data ${JSON.stringify(streamData)}`)
    }

    const symbol = this.symbols.find((symbol) => symbol.replace('/', '') === data.k.s)
    if (!symbol) {
      return
    }

    const timestamp = +data.k.t
    const price = num(data.k.c)
    const volume = num(data.k.v)

    this.setTrade(symbol, timestamp, price, volume, true)
    this.setPrice(symbol, price)
    // this.calculateKRWPrice(symbol)

    this.isUpdated = true
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    const params = { symbol: symbol.replace('/', ''), interval: '1m', limit: 10 }

    // Get candles from Binance
    // reference: https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?${toQueryString(params)}`
    ).then((res) => res.json())

    if (!response || !Array.isArray(response) || response.length < 1) {
      logger.error(
        `${this.constructor.name}: invalid api response:`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    return response
      .filter((row) => parseFloat(row[5]) > 0)
      .map((row) => ({
        price: num(row[4]),
        volume: num(row[5]),
        timestamp: +row[0],
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

export default Binance
