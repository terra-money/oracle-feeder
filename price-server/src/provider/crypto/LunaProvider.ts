import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { Binance, Bithumb, Coinone, Huobi, GateIO } from './quoter'

class LunaProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

    const { bithumb, coinone, huobi, binance, gateio } = config.lunaProvider

    bithumb && this.quoters.push(new Bithumb(bithumb))
    coinone && this.quoters.push(new Coinone(coinone))
    huobi && this.quoters.push(new Huobi(huobi))
    binance && this.quoters.push(new Binance(binance))
    gateio && this.quoters.push(new GateIO(gateio))
  }
}

export default LunaProvider
