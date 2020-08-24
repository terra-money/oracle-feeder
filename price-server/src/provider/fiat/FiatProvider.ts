import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { CurrencyLayer, AlphaVantage, Fixer } from './quoter'

class FiatProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

    const { currencylayer, alphavantage, fixer } = config.fiatProvider

    currencylayer && this.quoters.push(new CurrencyLayer(currencylayer))
    alphavantage && this.quoters.push(new AlphaVantage(alphavantage))
    fixer && this.quoters.push(new Fixer(fixer))
  }

  public async initialize(): Promise<void> {
    await super.initialize()

    await this.tick(Date.now())
  }
}

export default FiatProvider
