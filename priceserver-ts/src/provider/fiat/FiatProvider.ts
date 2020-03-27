import * as config from 'config'
import { Provider } from '../base'
import CurrencyLayer from './CurrencyLayer'
import AlphaVantage from './AlphaVantage'
import Fixer from './Fixer'

class FiatProvider extends Provider {
  constructor(baseCurrency: string) {
    super(baseCurrency)

    if (config.get('provider.currencylayer.enable')) {
      const opts = config.get('provider.currencylayer')

      this.quoters.push(
        new CurrencyLayer(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          apiKey: opts.apiKey
        })
      )
    }

    if (config.get('provider.alphavantage.enable')) {
      const opts = config.get('provider.alphavantage')

      this.quoters.push(
        new AlphaVantage(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          apiKey: opts.apiKey
        })
      )
    }

    if (config.get('provider.fixer.enable')) {
      const opts = config.get('provider.fixer')

      this.quoters.push(
        new Fixer(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          apiKey: opts.apiKey
        })
      )
    }
  }
}

export default FiatProvider
