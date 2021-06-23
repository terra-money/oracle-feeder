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
    const symbolsUSD = this.symbols.map((symbol) => (symbol === 'KRW/USD' ? 'KRW' : symbol))

    const url = new URL('https://terra-lcd-poa.bandchain.org/oracle/v1/request_prices')
    symbolsUSD.map((symbol) =>
      url.searchParams.append('symbols', symbol === 'KRW/SDR' ? 'XDR' : symbol.replace('KRW/', ''))
    )
    url.searchParams.append('min_count', '3')
    url.searchParams.append('ask_count', '4')

    const response: Response = await fetch(url).then((res) => res.json())
    if (!response || !response.price_results) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from BandProtocol')
    }

    // convert to KRW prices & update last trades
    const krwPrice = response.price_results.find((res) => res.symbol === 'KRW')
    const krwRate = num(1).div(krwPrice ? num(krwPrice.multiplier).div(krwPrice.px) : 1)

    for (const price of response.price_results) {
      if (price.symbol === 'KRW') {
        this.setPrice('KRW/USD', krwRate)
        continue
      }

      const usdPrice = num(price.multiplier).div(price.px)
      const adjusted = usdPrice.multipliedBy(krwRate)
      this.setPrice(price.symbol === 'XDR' ? 'KRW/SDR' : `KRW/${price.symbol}`, adjusted)
    }
  }

  protected async update(): Promise<boolean> {
    await this.updateLastPrice().catch(errorHandler)

    return true
  }
}

export default BandProtocol
