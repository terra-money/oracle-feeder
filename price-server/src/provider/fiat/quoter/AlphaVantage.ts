import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { Quoter } from 'provider/base'

interface Response {
  'Realtime Currency Exchange Rate': {
    '5. Exchange Rate': string
  }
}

export class AlphaVantage extends Quoter {
  private async updateLastPrice(symbol: string): Promise<void> {
    const quote = symbol === 'USD/SDR' ? 'XDR' : symbol.replace('USD/', '')
    const params = {
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: 'USD',
      to_currency: quote,
      apikey: this.options.apiKey,
    }

    const response: Response = await fetch(
      `https://www.alphavantage.co/query?${toQueryString(params)}`,
      {
        timeout: this.options.timeout,
      }
    ).then((res) => res.json())

    if (
      !response ||
      !response['Realtime Currency Exchange Rate'] ||
      !response['Realtime Currency Exchange Rate']['5. Exchange Rate']
    ) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from AlphaVantage')
    }

    this.setPrice(symbol, num(response['Realtime Currency Exchange Rate']['5. Exchange Rate']))
  }

  protected async update(): Promise<boolean> {
    for (const symbol of this.symbols) {
      await this.updateLastPrice(symbol).catch(errorHandler)
    }

    return true
  }
}

export default AlphaVantage
