import nodeFetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { Quoter } from '../base'

interface Response {
  'Realtime Currency Exchange Rate': {
    '5. Exchange Rate': string
  }
}

export class AlphaVantage extends Quoter {
  private async updateLastPrice(quote: string): Promise<void> {
    const params = {
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: this.baseCurrency,
      to_currency: quote === 'SDR' ? 'XDR' : quote,
      apikey: this.options.apiKey,
    }

    const response: Response = await nodeFetch(
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

    this.setPrice(
      quote === 'XDR' ? 'SDR' : quote,
      num(response['Realtime Currency Exchange Rate']['5. Exchange Rate'])
    )
  }

  protected async update(): Promise<boolean> {
    for (const quote of this.quotes) {
      await this.updateLastPrice(quote).catch(errorHandler)
    }

    return true
  }
}

export default AlphaVantage
