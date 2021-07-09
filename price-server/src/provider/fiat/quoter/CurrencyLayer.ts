import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import { num } from 'lib/num'
import * as logger from 'lib/logger'
import { Quoter } from 'provider/base'

interface Response {
  success: boolean
  quotes: { [symbol: string]: number }
  error?: Record<string, unknown> | string
}

export class CurrencyLayer extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      access_key: this.options.apiKey,
      source: 'USD',
      currencies: this.symbols
        .map((symbol) => (symbol === 'USD/SDR' ? 'XDR' : symbol.replace('USD/', '')))
        .join(','),
    }

    const response: Response = await fetch(
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
      const convertedSymbol = symbol.replace('USD', 'USD/')
      this.setPrice(
        convertedSymbol === 'USD/XDR' ? 'USD/SDR' : convertedSymbol,
        num(response.quotes[symbol])
      )
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default CurrencyLayer
