import nodeFetch from 'node-fetch'
import * as logger from 'lib/logger'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import { num } from 'lib/num'
import { Quoter } from '../base'

interface Response {
  success: boolean
  rates: { [quote: string]: number }
  error?: string | Record<string, unknown>
}

export class Fixer extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      access_key: this.options.apiKey,
      // base: this.baseCurrency, // need 'PROFESSIONAL PLUS' subscription
      symbols: this.quotes.map((quote) => (quote === 'SDR' ? 'XDR' : quote)).join(',') + ',KRW',
    }

    const response: Response = await nodeFetch(
      `http://data.fixer.io/api/latest?${toQueryString(params)}`,
      {
        timeout: this.options.timeout,
      }
    ).then((res) => res.json())

    if (!response || !response.success || !response.rates) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from Fixer')
    }

    if (!response.rates.KRW) {
      throw new Error('there is no KRW price')
    }

    // convert to KRW prices
    const krwRate = 1 / +response.rates.KRW
    delete response.rates.KRW
    for (const quote of Object.keys(response.rates)) {
      response.rates[quote] *= krwRate
    }

    // update last trades
    for (const quote of Object.keys(response.rates)) {
      this.setPrice(quote === 'XDR' ? 'SDR' : quote, num(response.rates[quote]))
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default Fixer
