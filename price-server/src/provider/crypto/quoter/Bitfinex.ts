import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { WebSocketQuoter, Trades } from 'provider/base'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency'

interface StreamData {
  event: string
  channel?: string
  chanId?: string
  pair?: string
}

export class Bitfinex extends WebSocketQuoter {
  private isUpdated = false
  private symbolByChanId: { [id: string]: string } = {}

  private getBaseCurrency(symbol) {
    const currency = getBaseCurrency(symbol)
    return currency === 'USDT' ? 'UST' : currency
  }

  private getQuoteCurrency(symbol) {
    const currency = getQuoteCurrency(symbol)
    return currency === 'USDT' ? 'UST' : currency
  }

  public async initialize(): Promise<void> {
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

    // connect to websocket server
    // reference: https://docs.bitfinex.com/docs/ws-general
    this.connect('wss://api-pub.bitfinex.com/ws/2')
  }

  protected onConnect(): void {
    super.onConnect()

    // subscribe transaction
    for (const symbol of this.symbols) {
      const base = this.getBaseCurrency(symbol)
      const quote = this.getQuoteCurrency(symbol)
      this.ws.send(`{"event":"subscribe","channel":"trades","symbol":"t${base}${quote}"}`)
    }
  }

  protected onData(data: StreamData): void {
    if (Array.isArray(data)) {
      // trade data
      if (
        data.length > 2 &&
        data[1] === 'te' &&
        Array.isArray(data[2]) &&
        this.symbolByChanId[data[0]]
      ) {
        this.onTransaction(this.symbolByChanId[data[0]], data[2])
      }

      return
    }

    switch (data?.event) {
      case 'info':
        // logger.info(`${this.constructor.name}: ${JSON.stringify(data)}`)
        break

      case 'subscribed':
        if (!data.chanId || !data.pair) {
          break
        }

        const pair = data.pair.replace('UST', 'USDT')
        const symbol = this.symbols.find((symbol) => symbol.replace('/', '') === pair)
        if (symbol) {
          this.symbolByChanId[data.chanId] = symbol
        }
        // logger.info(`${this.constructor.name}: subscribed to ${symbol}(${data.pair})`)
        break

      default:
        logger.warn(`${this.constructor.name}: receive unknown type data`, JSON.stringify(data))
        break
    }
  }

  private onTransaction(symbol: string, data: number[]) {
    const timestamp = +data[1]
    const price = num(data[3])
    const volume = num(Math.abs(data[2]))

    this.setTrade(symbol, timestamp, price, volume)
    this.setPrice(symbol, price)

    this.isUpdated = true
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    // get latest candles
    // reference: https://docs.bitfinex.com/reference#rest-public-candles
    const base = this.getBaseCurrency(symbol)
    const quote = this.getQuoteCurrency(symbol)
    const response = await fetch(
      `https://api-pub.bitfinex.com/v2/candles/trade:1m:t${base}${quote}/hist`,
      { timeout: this.options.timeout }
    ).then((res) => res.json())

    if (!response || !Array.isArray(response) || response.length < 1) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    return response
      .filter((row) => parseFloat(row[5]) > 0)
      .map((row) => ({
        // the order is [time, open, close, high, low, volume]
        price: num(row[2]),
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

export default Bitfinex
