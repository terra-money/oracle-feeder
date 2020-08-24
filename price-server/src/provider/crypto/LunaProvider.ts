import * as config from 'config'
import { getQuoteCurrency } from 'lib/currency'
import { Provider, ProviderOptions, PriceBySymbol } from 'provider/base'
import { fiatProvider } from 'provider'
import { Binance, Bithumb, Coinone, Huobi } from './quoter'

class LunaProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

    const { bithumb, coinone, huobi, binance } = config.lunaProvider

    bithumb && this.quoters.push(new Bithumb(bithumb))
    coinone && this.quoters.push(new Coinone(coinone))
    huobi && this.quoters.push(new Huobi(huobi))
    binance && this.quoters.push(new Binance(binance))
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

export default LunaProvider
