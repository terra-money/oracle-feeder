import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { Upbit, Bithumb, Binance, Huobi, Bitfinex, Kraken, Kucoin } from './quoter'

class CryptoProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

    const { upbit, bithumb, binance, huobi, bitfinex, kraken, kucoin } = config.cryptoProvider

    upbit && this.quoters.push(new Upbit(upbit))
    bithumb && this.quoters.push(new Bithumb(bithumb))
    binance && this.quoters.push(new Binance(binance))
    huobi && this.quoters.push(new Huobi(huobi))
    bitfinex && this.quoters.push(new Bitfinex(bitfinex))
    kraken && this.quoters.push(new Kraken(kraken))
    kucoin && this.quoters.push(new Kucoin(kucoin))
  }
}

export default CryptoProvider
