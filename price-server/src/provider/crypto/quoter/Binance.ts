import fetch from 'lib/fetch'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { Quoter } from 'provider/base'
import * as _ from 'lodash'
import { num } from 'lib/num'

type Response = Array<{ symbol: string; price: string }> | { msg: string; code: number }

export class Binance extends Quoter {
  private async updatePrices(): Promise<void> {
    const symbols = this.symbols.map((symbol) => '"' + symbol.replace('/', '') + '"').join(',')
    const response: Response = await fetch(`https://data-api.binance.vision/api/v3/ticker/price?symbols=[${symbols}]`, {
      timeout: this.options.timeout,
    }).then((res) => res.json())

    if (!_.isArray(response)) {
      logger.error(`${this.constructor.name}:`, response.msg)
      throw new Error('Invalid response from Binance')
    }

    for (const crypto of response) {
      const symbol = this.symbols.find((symbol) => symbol.replace('/', '') === crypto.symbol)

      if (symbol) {
        this.setPrice(symbol, num(crypto.price))
      }
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default Binance
