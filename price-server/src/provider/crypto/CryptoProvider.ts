import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { Upbit, Bithumb, Binance, Huobi, Bitfinex, Kraken } from './quoter'

class CryptoProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

    const { upbit, bithumb, binance, huobi, bitfinex, kraken } = config.cryptoProvider

    upbit && this.quoters.push(new Upbit(upbit))
    bithumb && this.quoters.push(new Bithumb(bithumb))
    binance && this.quoters.push(new Binance(binance))
    huobi && this.quoters.push(new Huobi(huobi))
    bitfinex && this.quoters.push(new Bitfinex(bitfinex))
    kraken && this.quoters.push(new Kraken(kraken))
  }
}

export default CryptoProvider
