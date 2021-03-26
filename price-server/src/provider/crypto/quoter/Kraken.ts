import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { WebSocketQuoter, Trades } from 'provider/base'

interface CandleStickResponse {
  error?: string[]
  // 0: time, 1: open, 2: high, 3: low, 4: close, 5: vwap, 6: volume, 7: count
  result: [number, string, string, string, string, string, string, number][]
}

interface StreamData {
  event: string
  pair?: string
  status?: string
}

export class Kraken extends WebSocketQuoter {
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
    this.connect('wss://ws.kraken.com')
  }

  protected onConnect(): void {
    super.onConnect()

    // subscribe transaction
    // reference: https://docs.kraken.com/websockets/
    const symbols = this.symbols.map((symbol) => `"${symbol}"`).join(',')
    this.ws.send(`{"event": "subscribe","pair": [${symbols}],"subscription": {"name": "trade"}}`)
  }

  protected onData(data: StreamData): void {
    if (Array.isArray(data)) {
      // trade data
      if (
        data.length === 4 &&
        Array.isArray(data[1]) &&
        data[2] === 'trade' &&
        this.symbols.find((symbol) => symbol === data[3])
      ) {
        this.onTransaction(data[3], data[1])
      }

      return
    }

    switch (data?.event) {
      case 'systemStatus':
        // logger.info(`${this.constructor.name}: ${JSON.stringify(data)}`)
        break

      case 'subscriptionStatus':
        if (data.status === 'subscribed') {
          // logger.info(`${this.constructor.name}: subscribed to ${data.pair}`)
        } else {
          logger.warn(`${this.constructor.name}: ${JSON.stringify(data)}`)
        }
        break

      case 'heartbeat':
        break

      default:
        logger.warn(`${this.constructor.name}: receive unknown type data`, JSON.stringify(data))
        break
    }
  }

  private onTransaction(symbol: string, datas: [string, string, string, string, string, string][]) {
    for (const data of datas) {
      // [0] price: string, [1] volume: string, [2] time: string, [3] side: string, [4] orderType: string, [5] misc: string
      const timestamp = Math.floor(+data[2] * 1000)
      const price = num(data[0])
      const volume = num(data[1])

      this.setTrade(symbol, timestamp, price, volume)
      this.setPrice(symbol, price)
    }

    this.isUpdated = true
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    // Get candles
    // reference: https://www.kraken.com/features/api#get-ohlc-data
    const pair = symbol.replace('/', '').toLowerCase()
    const response: CandleStickResponse = await fetch(
      `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1`
    ).then((res) => res.json())

    const responseSymbol = symbol.replace('/', 'Z')
    if (
      !response ||
      response.error?.length ||
      !response.result[responseSymbol] ||
      !Array.isArray(response.result[responseSymbol])
    ) {
      logger.error(
        `${this.constructor.name}: invalid api response:`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    // 0: time, 1: open, 2: high, 3: low, 4: close, 5: vwap, 6: volume, 7: count
    return response.result[responseSymbol]
      .filter((row) => parseFloat(row[6]) > 0)
      .map((row) => ({
        price: num(row[4]),
        volume: num(row[6]),
        timestamp: +row[0] * 1000,
      }))
  }

  protected async update(): Promise<boolean> {
    if (this.isUpdated) {
      this.isUpdated = false
      return true
    }

    return false
  }
}

export default Kraken
