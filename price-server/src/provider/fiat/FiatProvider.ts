import * as config from 'config'
import { Provider } from 'provider/base'
import CurrencyLayer from './CurrencyLayer'
import AlphaVantage from './AlphaVantage'
import Fixer from './Fixer'

class FiatProvider extends Provider {
  constructor() {
    super()

    if (config.fiatProvider?.currencylayer) {
      const opts = config.fiatProvider.currencylayer

      this.quoters.push(
        new CurrencyLayer(opts.symbols, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          apiKey: opts.apiKey,
        })
      )
    }

    if (config.fiatProvider?.alphavantage) {
      const opts = config.fiatProvider.alphavantage

      this.quoters.push(
        new AlphaVantage(opts.symbols, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          apiKey: opts.apiKey,
        })
      )
    }

    if (config.fiatProvider?.fixer) {
      const opts = config.fiatProvider.fixer

      this.quoters.push(
        new Fixer(opts.symbols, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          apiKey: opts.apiKey,
        })
      )
    }
  }

  public async initialize(): Promise<void> {
    await super.initialize()

    await this.tick(Date.now())
  }
}

export default FiatProvider
