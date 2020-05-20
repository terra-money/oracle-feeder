import { BigNumber } from 'bignumber.js'
import { TradesByQuote, Trades, PriceByQuote } from './types'
import { sendSlack } from 'lib/slack'

interface QuoterOptions {
  interval: number // update interval
  timeout: number // api call timeout
  apiKey?: string
}

export class Quoter {
  protected options: QuoterOptions
  protected baseCurrency: string // base currency
  protected quotes: string[] = [] // quote currencies

  private tradesByQuote: TradesByQuote = {}
  private priceByQuote: PriceByQuote = {}

  private tickedAt: number
  private isAlive: boolean = true
  private alivedAt: number

  constructor(baseCurrency: string, quotes: string[], options: QuoterOptions) {
    this.baseCurrency = baseCurrency
    this.quotes = quotes
    this.options = options
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

  public getQuotes(): string[] {
    return this.quotes
  }

  public getPrice(quote: string): BigNumber {
    return this.isAlive ? this.priceByQuote[quote] : undefined
  }

  public getTrades(quote: string): Trades {
    return this.isAlive ? this.tradesByQuote[quote] : []
  }

  protected async update(): Promise<boolean> {
    return false
  }

  protected setPrice(quote: string, price: BigNumber) {
    this.priceByQuote[quote] = price

    this.alive()
  }

  protected setTrades(quote: string, trades: Trades) {
    // trades filtering that are past 60 minutes
    this.tradesByQuote[quote] = trades.filter(trade => Date.now() - trade.timestamp < 60 * 60 * 1000)

    this.alive()
  }

  protected alive() {
    if (!this.isAlive) {
      const downtime = ((Date.now() - this.alivedAt - this.options.interval) / 60 / 1000).toFixed(1)
      sendSlack(`${this.constructor.name} is now alive. (downtime ${downtime} minutes)`).catch()
      this.isAlive = true
    }

    this.alivedAt = Date.now()
  }

  private checkAlive() {
    // no responsed more than 3 minutes, it is down
    if (this.isAlive && Date.now() - this.alivedAt > 3 * 60 * 1000) {
      sendSlack(`${this.constructor.name} is no response!`).catch()
      this.isAlive = false
    }
  }
}

export default Quoter
