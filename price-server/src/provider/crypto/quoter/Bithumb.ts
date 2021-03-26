import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { WebSocketQuoter, Trades } from 'provider/base'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency'

interface CandlestickResponse {
  status: string
  data?: Record<string, unknown>
}

interface TransactionResponse {
  content: {
    list: {
      symbol: string
      contPrice: string // price
      contQty: string // volume
      contDtm: string // transaction time
    }[]
  }
}

export class Bithumb extends WebSocketQuoter {
  private isUpdated = false

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
    // reference: https://apidocs.bithumb.com/docs/websocket_public
    this.connect('wss://pubwss.bithumb.com/pub/ws')
  }

  protected onConnect(): void {
    super.onConnect()

    // subscribe transaction
    const symbols = this.symbols
      .map((symbol) => `"${getBaseCurrency(symbol)}_${getQuoteCurrency(symbol)}"`)
      .join(',')

    this.ws.send(`{"type":"transaction", "symbols":[${symbols}]}`)
  }

  protected onData(data: Record<string, unknown>): void {
    if (data?.status === '0000') {
      // logger.info(`${this.constructor.name}: ${data.resmsg}`)
      return
    }

    switch (data?.type) {
      case 'transaction':
        this.onTransaction((data as unknown) as TransactionResponse)
        break

      default:
        logger.warn(`${this.constructor.name}: receive unknown type data`, data)
        break
    }
  }

  private onTransaction(data: TransactionResponse) {
    for (const row of data.content.list) {
      const symbol = row.symbol.replace('_', '/')

      if (this.symbols.indexOf(symbol) < 0 || row.contQty === '0') {
        continue
      }

      // row.contDtm has no timezone info, so need to add timezone data
      const timestamp = new Date(row.contDtm + '+09:00').getTime()
      const price = num(row.contPrice)
      const volume = num(row.contQty)

      this.setTrade(symbol, timestamp, price, volume)
      this.setPrice(symbol, price)
    }

    this.isUpdated = true
  }

  private async fetchLatestTrades(symbol: string): Promise<Trades> {
    // get latest candles
    // reference: (https://apidocs.bithumb.com/docs/candlestick)
    const base = getBaseCurrency(symbol)
    const quote = getQuoteCurrency(symbol)
    const response: CandlestickResponse = await fetch(
      `https://api.bithumb.com/public/candlestick/${base}_${quote}/1m`,
      { timeout: this.options.timeout }
    ).then((res) => res.json())

    if (
      !response ||
      response.status !== '0000' ||
      !Array.isArray(response.data) ||
      response.data.length < 1
    ) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error(`${this.constructor.name}: invalid response`)
    }

    return response.data.map((row) => ({
      // the order is [time, open, close, high, low, volume]
      price: num(row[2]),
      volume: num(row[5]),
      timestamp: +row[0],
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

export default Bithumb
