import { BigNumber } from 'bignumber.js'
import * as config from 'config'
import { average, tvwap } from 'lib/statistics'
import { sendSlack } from 'lib/slack'
import { Provider } from '../base'
import Bithumb from './Bithumb'
import Coinone from './Coinone'
import Huobi from './Huobi'

const PRICE_PERIOD = 3 * 60 * 1000 // 3 minutes

class LunaProvider extends Provider {
  constructor(baseCurrency: string) {
    super(baseCurrency)

    // bithumb quoter
    if (config.get('provider.bithumb.enable')) {
      const opts = config.get('provider.bithumb')

      this.quoters.push(
        new Bithumb(baseCurrency, opts.quotes, {
          interval: opts.interval || 100,
          timeout: opts.timeout || 10000,
        })
      )
    }

    // coinone quoter
    if (config.get('provider.coinone.enable')) {
      const opts = config.get('provider.coinone')

      this.quoters.push(
        new Coinone(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 10000,
        })
      )
    }

    if (config.get('provider.huobi.enable')) {
      const opts = config.get('provider.huobi')

      this.quoters.push(
        new Huobi(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 10000,
        })
      )
    }
  }

  protected adjustPrices(): void {
    const now = Date.now()

    for (const quote of this.quotes) {
      delete this.priceByQuote[quote]

      const trades = this.collectTrades(quote)
        .filter((trade) => now - trade.timestamp < PRICE_PERIOD || now < trade.timestamp)

      if (trades.length > 1) {
        // if have more than one, use tvwap(time volume weighted average price)
        this.priceByQuote[quote] = tvwap(trades)
      } else {
        // use average last price of quoters
        const prices: BigNumber[] = this.collectPrice(quote)

        if (prices.length > 0) {
          this.priceByQuote[quote] = average(prices)
        }
      }

      if (this.priceByQuote[quote] && this.priceByQuote[quote].isNaN()) {
        delete this.priceByQuote[quote]
      }
    }
  }
}

export default LunaProvider
