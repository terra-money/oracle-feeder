import nodeFetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import { num } from 'lib/num'
import * as logger from 'lib/logger'
import { Quoter } from '../base'

interface Response {
  success: boolean
  quotes: { [symbol: string]: number }
  error?: Record<string, unknown> | string
}

export class CurrencyLayer extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      access_key: this.options.apiKey,
      source: this.baseCurrency,
      currencies: this.quotes.map((quote) => (quote === 'SDR' ? 'XDR' : quote)).join(','),
    }

    const response: Response = await nodeFetch(
      `https://apilayer.net/api/live?${toQueryString(params)}`,
      {
        timeout: this.options.timeout,
      }
    ).then((res) => res.json())

    if (!response || !response.success || !response.quotes) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from CurrencyLayer')
    }

    // update last trades
    for (const symbol of Object.keys(response.quotes)) {
      const quote = symbol.replace('KRW', '')
      this.setPrice(quote === 'XDR' ? 'SDR' : quote, num(response.quotes[symbol]))
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default CurrencyLayer
