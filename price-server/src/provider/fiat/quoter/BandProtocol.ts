import fetch from 'node-fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { num } from 'lib/num'
import { Quoter } from 'provider/base'

interface Response {
  height: boolean
  result: [
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
    const params = {
      symbols: symbolsUSD.map((symbol) =>
        symbol === 'KRW/SDR' ? 'XDR' : symbol.replace('KRW/', '')
      ),
      min_count: 10,
      ask_count: 16,
    }
    const response: Response = await fetch(
      'https://terra-lcd.bandchain.org/oracle/request_prices',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    ).then((res) => res.json())

    if (!response || !response.result || !response.height) {
      logger.error(
        `${this.constructor.name}: wrong api response`,
        response ? JSON.stringify(response) : 'empty'
      )
      throw new Error('Invalid response from BandProtocol')
    }

    // convert to KRW prices & update last trades
    const krwPrice = response.result.find((res) => res.symbol === 'KRW')
    const krwRate = num(1).div(krwPrice ? num(krwPrice.multiplier).div(krwPrice.px) : 1)

    for (const price of response.result) {
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
