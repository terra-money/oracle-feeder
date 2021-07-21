import * as pako from 'pako'
import fetch from 'lib/fetch'
import { num } from 'lib/num'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { toQueryString } from 'lib/fetch'
import { WebSocketQuoter, Trades } from 'provider/base'

interface StreamData {
  ch?: string // channel name
  ts?: number // timestamp
  ping?: number
  subbed?: string
  status?: string
}

interface CandlestickStreamData extends StreamData {
  tick: {
    id: number // UNIX epoch timestamp in second as response id
    open: number // Opening price during the interval
    close: number // Closing price during the interval
    low: number // Low price during the interval
    high: number // High price during the interval
    amount: number // Aggregated trading volume during the interval (in base currency)
    vol: number // Aggregated trading value during the interval (in quote currency)
    count: number // Number of trades during the interval
  }
}

export class Huobi extends WebSocketQuoter {
  private isUpdated = false

  public async initialize(): Promise<void> {
    await super.initialize()

    for (const symbol of this.symbols) {
      this.setTrades(symbol, [])

      // update last trades and price of symbol/USDT
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
    this.connect('wss://api.huobi.pro/ws')
  }

  protected onConnect(): void {
    super.onConnect()

    // subscribe transaction
    // reference: https://huobiapi.github.io/docs/spot/v1/en/#market-candlestick
    for (const symbol of this.symbols) {
      this.ws.send(`{"sub": "market.${symbol.replace('/', '').toLowerCase()}.kline.1min"}`)
    }
  }

  protected onRawData(gzipedData: pako.Data): void {
    const unzipedText = pako.inflate(gzipedData, { to: 'string' })

    try {
      this.onData(JSON.parse(unzipedText))
    } catch (error) {
      errorHandler(error)
    }
    this.alive()
  }

  protected onData(streamData: StreamData): void {
    if (streamData.ping) {
      this.ws.send(`{"pong": ${streamData.ping}}`)
    } else if (streamData.subbed) {
      if (streamData.status !== 'ok') {
        throw new Error(JSON.stringify(streamData))
      }
      // logger.info(`Huobi: subscribe to ${streamData.subbed}, status: ${streamData.status}`)
    } else if (streamData.ch?.indexOf('market.') === 0) {
      const data = streamData as CandlestickStreamData

      const ch = data.ch?.replace('market.', '').replace('.kline.1min', '').toUpperCase()
      const symbol = this.symbols.find((symbol) => symbol.replace('/', '') === ch)
      if (!symbol) {
        return
      }

      const timestamp = +data.tick.id * 1000
      const price = num(data.tick.close)
      const volume = num(data.tick.amount)

      this.setTrade(symbol, timestamp, price, volume, true)
      this.setPrice(symbol, price)
      // this.calculateKRWPrice(symbol)

      this.isUpdated = true
    } else {
      throw new Error(JSON.stringify(streamData))
    }
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    const params = {
      symbol: symbol.replace('/', '').toLowerCase(),
      period: '1min',
      size: 10,
    }

    // Get candles from Huobi
    // reference: https://huobiapi.github.io/docs/spot/v1/en/#get-klines-candles
    const response = await fetch(
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
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    return response.data
      .filter((row) => parseFloat(row.vol) > 0)
      .map((row) => ({
        price: num(row.close),
        volume: num(row.amount),
        timestamp: +row.id * 1000,
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

export default Huobi
