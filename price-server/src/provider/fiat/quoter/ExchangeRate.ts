import nodeFetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import { num } from 'lib/num'
import * as logger from 'lib/logger'
import { Quoter } from 'provider/base'

interface Response {
  success: boolean
  rates: { [symbol: string]: number }
  error?: Record<string, unknown> | string
}

export class ExchangeRate extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      base: 'KRW',
      symbols: this.symbols
        .map((symbol) => (symbol === 'KRW/SDR' ? 'XDR' : symbol.replace('KRW/', '')))
        .join(','),
    }

    const response: Response = await nodeFetch(
      `https://api.exchangerate.host/latest?${toQueryString(params)}`,
      {
        timeout: this.options.timeout,
      }
    ).then((res) => res.json())

    if (!response || !response.success || !response.rates) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from ExchangeRate')
    }

    // update last trades
    for (const symbol of Object.keys(response.rates)) {
      const convertedSymbol = symbol.replace(symbol, 'KRW/' + symbol)
      this.setPrice(
        convertedSymbol === 'KRW/XDR' ? 'KRW/SDR' : convertedSymbol,
        num(response.rates[symbol])
      )
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default ExchangeRate
