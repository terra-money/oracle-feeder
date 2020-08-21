import { BigNumber } from 'bignumber.js'
import * as config from 'config'
import { average, tvwap } from 'lib/statistics'
import { getQuoteCurrency } from 'lib/currency'
import { Provider, PriceBySymbol } from 'provider/base'
import { fiatProvider } from 'provider'
import { Binance, Bithumb, Coinone, Huobi } from './quoter'

const PRICE_PERIOD = 3 * 60 * 1000 // 3 minutes

class CryptoProvider extends Provider {
  constructor() {
    super()

    const { bithumb, coinone, huobi, binance } = config.lunaProvider

    bithumb && this.quoters.push(new Bithumb(bithumb))
    coinone && this.quoters.push(new Coinone(coinone))
    huobi && this.quoters.push(new Huobi(huobi))
    binance && this.quoters.push(new Binance(binance))
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

  public getLunaPrices(): PriceBySymbol {
    const prices: PriceBySymbol = {
      'LUNA/KRW': this.priceBySymbol['LUNA/KRW'],
    }

    if (!prices['LUNA/KRW']) {
      return {}
    }

    // make 'LUNA/FIAT' rates
    for (const symbol of Object.keys(fiatProvider.getPrices())) {
      prices[`LUNA/${getQuoteCurrency(symbol)}`] = fiatProvider
        .getPriceBy(symbol)
        .multipliedBy(prices['LUNA/KRW'])
    }

    return prices
  }
}

export default CryptoProvider
