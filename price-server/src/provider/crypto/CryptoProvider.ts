import { BigNumber } from 'bignumber.js'
import * as config from 'config'
import { average, tvwap } from 'lib/statistics'
import { Provider } from 'provider/base'
import { Upbit } from './quoter'

const PRICE_PERIOD = 3 * 60 * 1000 // 3 minutes

class CryptoProvider extends Provider {
  constructor() {
    super()

    const { upbit, bitfinex } = config.cryptoProvider

    upbit && this.quoters.push(new Upbit(upbit))
    bitfinex && this.quoters.push(new Bitfinex(bitfinex))
  }

  protected adjustPrices(): void {
    const now = Date.now()

    for (const symbol of this.symbols) {
      delete this.priceBySymbol[symbol]

      const trades = this.collectTrades(symbol).filter(
        (trade) => now - trade.timestamp < PRICE_PERIOD && now >= trade.timestamp
      )

      if (trades.length > 1) {
        // if have more than one, use tvwap(time volume weighted average price)
        this.priceBySymbol[symbol] = tvwap(trades)
      } else {
        // use average last price of quoters
        const prices: BigNumber[] = this.collectPrice(symbol)

        if (prices.length > 0) {
          this.priceBySymbol[symbol] = average(prices)
        }
      }

      if (this.priceBySymbol[symbol] && this.priceBySymbol[symbol].isNaN()) {
        delete this.priceBySymbol[symbol]
      }
    }
  }
}

export default CryptoProvider
