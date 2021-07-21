import fetch from 'lib/fetch'
import { num } from 'lib/num'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { toQueryString } from 'lib/fetch'
import { WebSocketQuoter, Trades } from 'provider/base'

const url = 'https://api.kucoin.com'

interface CandlesResponse {
  code: string
  data?: [
    time: string,
    open: string,
    close: string,
    high: string,
    low: string,
    volume: string,
    turnover: string
  ][]
}

interface WebSocketTokenResponse {
  code: string
  data: {
    code: string
    token: string
    instanceServers: {
      endpoint: string
      protocol: string
      encrypt: boolean
      pingInterval: number
      pingTimeout: number
    }[]
  }
}

interface CandlestickStreamData {
  type: string
  topic?: string
  subject?: string
  data?: {
    symbol: string
    candles: [
      timestamp: string,
      open: string,
      close: string,
      high: string,
      low: string,
      volume: string,
      amount: string
    ]
    time: number
  }
}

export class Kucoin extends WebSocketQuoter {
  private isUpdated = false
  private token

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
    this.connect('wss://push-private.kucoin.com/endpoint')
  }

  public async connect(wsUrl: string): Promise<void> {
    const response: WebSocketTokenResponse = await fetch(`${url}/api/v1/bullet-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => res.json())

    const server = response?.data?.instanceServers?.find(
      (server) => server.protocol === 'websocket'
    )

    if (response?.code !== '200000' || !response?.data?.token || !server) {
      setTimeout(() => this.connect(wsUrl), 5000)
      return
    }

    // public websocket token
    this.token = response.data.token

    return super.connect(`${server.endpoint}?token=${this.token}`)
  }

  protected onConnect(): void {
    super.onConnect()

    const symbols = this.symbols
      .map((symbol) => `${symbol.replace('/', '-').toUpperCase()}_1min`)
      .join(',')

    // subscribe candles
    this.ws.send(
      JSON.stringify({
        type: 'subscribe',
        topic: `/market/candles:${symbols}`,
      })
    )
  }

  protected onData(streamData: CandlestickStreamData): void {
    if (
      streamData?.type !== 'message' ||
      streamData?.subject !== 'trade.candles.update' ||
      !streamData?.data
    ) {
      return
    }

    const { data } = streamData

    const symbol = data.symbol.replace('-', '/')
    const timestamp = +data.candles[0] * 1000
    const price = num(data.candles[2])
    const volume = num(data.candles[5])

    this.setTrade(symbol, timestamp, price, volume, true)
    this.setPrice(symbol, price)

    this.isUpdated = true
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    const params = {
      symbol: symbol.replace('/', '-').toUpperCase(),
      type: '1min',
      startAt: Math.floor((Date.now() - 600000) / 1000), // 10mins
    }

    // Get candles from Kucoin
    // reference: https://docs.kucoin.com/#get-klines
    const response: CandlesResponse = await fetch(
      `${url}/api/v1/market/candles?${toQueryString(params)}`
    ).then((res) => res.json())
    // type=1min&symbol=BTC-USDT&startAt=1566703297&endAt=1566789757

    if (
      !response ||
      response.code !== '200000' ||
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
      .filter((row) => parseFloat(row[5]) > 0)
      .map((row) => ({
        price: num(row[2]),
        volume: num(row[5]),
        timestamp: +row[0] * 1000,
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

export default Kucoin
