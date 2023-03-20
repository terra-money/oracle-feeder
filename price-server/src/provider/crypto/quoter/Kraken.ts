import fetch, { toQueryString } from './../../../lib/fetch'
import { errorHandler } from './../../../lib/error'
import * as logger from './../../../lib/logger'
import { num } from './../../../lib/num'
import { Quoter } from './../../base'
import _ from 'lodash'

interface Response {
  error?: string[]
  result: {
    [x: string]: { a: string }
  }
}

export class Kraken extends Quoter {
  private async updatePrices(): Promise<void> {
    const params = {
      pair: this.symbols.map((symbol) => symbol.replace('/', '')).join(','),
    }

    const response: Response = await fetch(`https://api.kraken.com/0/public/Ticker?${toQueryString(params)}`, {
      timeout: this.options.timeout,
    }).then((res) => res.json())

    if (response && _.isEmpty(response.result)) {
      logger.error(`${this.constructor.name}:`, response ? JSON.stringify(response) : 'empty')
      throw new Error('Invalid response from Kraken')
    }

    for (const symbol in response.result) {
      const data = response.result[symbol]

      if (data.a[0]) {
        this.setPrice(symbol, num(data.a[0]))
      }
    }
  }

  protected async update(): Promise<boolean> {
    await this.updatePrices().catch(errorHandler)

    return true
  }
}

export default Kraken
