import fetch from 'lib/fetch'
import * as logger from 'lib/logger'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import { num } from 'lib/num'
import { Quoter } from 'provider/base'

interface Response {
  success: boolean
  rates: { [quote: string]: number }
  error?: string | Record<string, unknown>
}

export class Fixer extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      access_key: this.options.apiKey,
      // base: this.baseCurrency, // need 'PROFESSIONAL PLUS' subscription, default: EUR
      symbols:
        this.symbols
          .map((symbol) => (symbol === 'USD/SDR' ? 'XDR' : symbol.replace('USD/', '')))
          .join(',') + ',USD',
    }

    const response: Response = await fetch(
      `http://data.fixer.io/api/latest?${toQueryString(params)}`,
      { timeout: this.options.timeout }
    ).then((res) => res.json())

    if (!response || !response.success || !response.rates) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from Fixer')
    }

    if (!response.rates.USD) {
      throw new Error('there is no USD price')
    }

    // convert to USD prices
    const usdRate = 1 / +response.rates.USD
    delete response.rates.USD
    for (const quote of Object.keys(response.rates)) {
      response.rates[quote] *= usdRate
    }

    // update last trades
    for (const quote of Object.keys(response.rates)) {
      this.setPrice(quote === 'XDR' ? 'USD/SDR' : `USD/${quote}`, num(response.rates[quote]))
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default Fixer
