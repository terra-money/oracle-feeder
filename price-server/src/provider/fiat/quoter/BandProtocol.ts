import fetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { Quoter } from 'provider/base'
import { URL } from 'url'

interface Response {
  price_results: [
    {
      symbol: string
      multiplier: number
      px: number
      request_id: number
      resolve_time: number
    }
  ]
  error?: string | Record<string, unknown>
}

export class BandProtocol extends Quoter {
  private async updateLastPrice(): Promise<void> {
    const url = new URL('https://terra-lcd-poa.bandchain.org/oracle/v1/request_prices')
    this.symbols.map((symbol) =>
      url.searchParams.append('symbols', symbol === 'USD/SDR' ? 'XDR' : symbol.replace('USD/', ''))
    )
    // min_count: the minimum number of validators that actually respond to the request for the data reported by the validators responding to be aggregated
    url.searchParams.append('min_count', '3')
    // ask_count: The number of validators that you want to request to respond to this request
    url.searchParams.append('ask_count', '4')

    const response: Response = await fetch(url).then((res) => res.json())
    if (!response || !response.price_results) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from BandProtocol')
    }

    for (const price of response.price_results) {
      this.setPrice(
        price.symbol === 'XDR' ? 'USD/SDR' : `USD/${price.symbol}`,
        num(price.multiplier).div(price.px)
      )
    }
  }

  protected async update(): Promise<boolean> {
    await this.updateLastPrice().catch(errorHandler)

    return true
  }
}

export default BandProtocol
