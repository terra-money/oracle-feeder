import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { Upbit, Binance, Bitfinex, Kraken } from './quoter'

class CryptoProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

    const { upbit, binance, bitfinex, kraken } = config.cryptoProvider

    upbit && this.quoters.push(new Upbit(upbit))
    binance && this.quoters.push(new Binance(binance))
    bitfinex && this.quoters.push(new Bitfinex(bitfinex))
    kraken && this.quoters.push(new Kraken(kraken))
  }
}

export default CryptoProvider
