import nodeFetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import { toQueryString } from 'lib/fetch'
import { num } from 'lib/num'
import * as logger from 'lib/logger'
import { Quoter } from 'provider/base'
import { TimeInput } from '@opentelemetry/api'

interface Response {
  base: string
  results: { [symbol: string]: number }
  updated: TimeInput
  ms: number
}

export class Fastforex extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      api_key: this.options.apiKey,
      from: 'USD',
      to: this.symbols.map((symbol) => (symbol === 'SDR/USD' ? 'XDR' : symbol.replace('/USD', ''))).join(','),
    }

    const response: Response = await nodeFetch(`https://api.fastforex.io/fetch-multi?${toQueryString(params)}`, {
      timeout: this.options.timeout,
    }).then((res) => res.json())
    if (!response || !response.results) {
      logger.error(`${this.constructor.name}: wrong api response`, response ? JSON.stringify(response) : 'empty')
      throw new Error('Invalid response from Fastforex')
    }

    // Update the latest trades
    for (const symbol of Object.keys(response.results)) {
      const convertedSymbol = symbol + '/USD'
      const convertedPrice = num(1).dividedBy(num(response.results[symbol]))

      this.setPrice(convertedSymbol === 'XDR/USD' ? 'SDR/USD' : convertedSymbol, convertedPrice)
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default Fastforex
