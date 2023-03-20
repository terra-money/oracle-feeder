import { BigNumber } from 'bignumber.js'
import * as logger from './../../lib/logger'
import { sendSlack } from '../../lib/slack'
import { TradesBySymbol, Trades, PriceBySymbol } from './types'
import { setQuoterAlive } from '../../lib/metrics'

export interface QuoterOptions {
  symbols: string[] // support symbols
  interval: number // update interval
  timeout: number // api call timeout
  krwPriceFrom?: string // 'USDT' | 'BUSD', quote to calculate KRW price(with kimchi premium)
  apiKey?: string
}

export class Quoter {
  protected options: QuoterOptions
  protected symbols: string[] = []

  private tradesBySymbol: TradesBySymbol = {}
  private priceBySymbol: PriceBySymbol = {}

  private tickedAt: number
  private isAlive = true
  private alivedAt = Date.now()

  constructor(options: QuoterOptions) {
    Object.assign(this, { options })

    this.symbols = options.symbols

    if (!this.options.interval) {
      this.options.interval = 1000
    }
    if (!this.options.timeout) {
      this.options.timeout = 10000
    }
  }

  public async initialize(): Promise<void> {
    return
  }

  public async tick(now: number): Promise<boolean> {
    if (now - this.tickedAt < this.options.interval) {
      return false
    }
    this.tickedAt = now

    const isUpdated = await this.update()

    this.checkAlive()

    return isUpdated
  }

  public getSymbols(): string[] {
    return this.symbols
  }

  public getPrice(symbol: string): BigNumber | undefined {
    return this.isAlive ? this.priceBySymbol[symbol] : undefined
  }

  public getTrades(symbol: string): Trades {
    return this.isAlive ? this.tradesBySymbol[symbol] || [] : []
  }

  protected async update(): Promise<boolean> {
    return false
  }

  protected setPrice(symbol: string, price: BigNumber): void {
    if (price && !price.isNaN()) {
      this.priceBySymbol[symbol] = price

      this.alive()
    }
  }

  protected setTrades(symbol: string, trades: Trades): void {
    if (Array.isArray(trades)) {
      const now = Date.now()

      // trades filtering that are past 60 minutes
      this.tradesBySymbol[symbol] = trades.filter(
        (trade) => now - trade.timestamp < 60 * 60 * 1000 && now >= trade.timestamp
      )

      this.alive()
    }
  }

  protected setTrade(
    symbol: string,
    timestamp: number,
    price: BigNumber,
    volume: BigNumber,
    isAccumulatedVolume = false
  ): Trades {
    const trades = this.getTrades(symbol) || []
    const candleTimestamp = Math.floor(timestamp / 60000) * 60000
    const currentTrade = trades.find((trade) => trade.timestamp === candleTimestamp)

    // make 1m candle stick
    if (currentTrade) {
      currentTrade.price = price
      currentTrade.volume = isAccumulatedVolume ? volume : currentTrade.volume.plus(volume)
    } else {
      trades.push({ price, volume, timestamp: candleTimestamp })
    }

    this.setTrades(symbol, trades)

    return trades
  }

  protected alive(): void {
    if (!this.isAlive) {
      const downtime = ((Date.now() - this.alivedAt - this.options.interval) / 60 / 1000).toFixed(1)
      const msg = `${this.constructor.name} is now alive. (downtime ${downtime} minutes)`

      logger.info(msg)
      sendSlack(msg).catch()

      this.isAlive = true
    }

    this.alivedAt = Date.now()
  }

  private checkAlive(): void {
    // no responsed more than 3 minutes, it is down
    if (this.isAlive && Date.now() - this.alivedAt > 3 * 60 * 1000) {
      const msg = `${this.constructor.name} is no response!`

      sendSlack(msg).catch()

      this.isAlive = false
    }
    setQuoterAlive(this.constructor.name, this.isAlive)
  }
}

export default Quoter
