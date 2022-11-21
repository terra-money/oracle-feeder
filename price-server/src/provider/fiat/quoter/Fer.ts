import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { Quoter } from 'provider/base'
import { getBaseCurrency, getQuoteCurrency } from 'lib/currency'

interface Response {
  date: string
  base: string
  rates: object
}

export class Fer extends Quoter {
  private async updateLastPrice(symbol: string): Promise<void> {
    const base = getBaseCurrency(symbol)
    const to = getQuoteCurrency(symbol)

    const params = { base, to }
    const response: Response = await fetch(`https://api.fer.ee/latest?${toQueryString(params)}`, {
      timeout: this.options.timeout,
    }).then((res) => res.json())

    if (!response) {
      logger.error(`${this.constructor.name}: wrong api response`, response ? JSON.stringify(response) : 'empty')
      throw new Error('Invalid response from Fer')
    }

    this.setPrice(symbol, num(response.rates[to]))
  }

  protected async update(): Promise<boolean> {
    for (const symbol of this.symbols) {
      await this.updateLastPrice(symbol).catch(errorHandler)
    }

    return true
  }
}

export default Fer
