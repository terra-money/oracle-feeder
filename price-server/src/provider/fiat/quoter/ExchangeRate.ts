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

/**
 *
 * ExchangeRate API allow querying fiat prices
 * using a base coin to do a single call.
 *
 * In order to optimize the program and have
 * parity with the other services the price
 * is switched as of 1 unit of the basis currency being
 * the quoted currency e.g.:
 *  instead of USD/EUR, it will be EUR/USD
 *
 * https://exchangerate.host/#/#our-services
 */
export class ExchangeRate extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      base: 'USD',
      symbols: this.symbols.map((symbol) => (symbol === 'SDR/USD' ? 'XDR' : symbol.replace('/USD', ''))).join(','),
    }

    const response: Response = await nodeFetch(`https://api.exchangerate.host/latest?${toQueryString(params)}`, {
      timeout: this.options.timeout,
    }).then((res) => res.json())
    if (!response || !response.success || !response.rates) {
      logger.error(`${this.constructor.name}: wrong api response`, response ? JSON.stringify(response) : 'empty')
      throw new Error('Invalid response from ExchangeRate')
    }

    // Update the latest trades
    for (const symbol of Object.keys(response.rates)) {
      const convertedSymbol = symbol + '/USD'
      const convertedPrice = num(1).dividedBy(num(response.rates[symbol]))

      this.setPrice(convertedSymbol === 'XDR/USD' ? 'SDR/USD' : convertedSymbol, convertedPrice)
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default ExchangeRate
