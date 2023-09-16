import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { Upbit, Bithumb, Binance, Huobi, Bitfinex, Kraken, Kucoin, CoinGecko } from './quoter'

class CryptoProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)
    const { fallbackPriority } = options

    // sort by fallback priority
    for (const name of fallbackPriority) {
      const option = config.cryptoProvider[name]
      if (!option) {
        continue
      }

      name === 'upbit' && this.quoters.push(new Upbit(option))
      name === 'bithumb' && this.quoters.push(new Bithumb(option))
      name === 'binance' && this.quoters.push(new Binance(option))
      name === 'huobi' && this.quoters.push(new Huobi(option))
      name === 'bitfinex' && this.quoters.push(new Bitfinex(option))
      name === 'kraken' && this.quoters.push(new Kraken(option))
      name === 'kucoin' && this.quoters.push(new Kucoin(option))
      name === 'coinGecko' && this.quoters.push(new CoinGecko(option))
      // SKIP BROKEN QUOTER name === 'osmosis' && this.quoters.push(new Osmosis(option))
    }
  }
}

export default CryptoProvider
