import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { CurrencyLayer, AlphaVantage, Fixer, ExchangeRate } from './quoter'

class FiatProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)
  }

  public async initialize(): Promise<void> {
    const { fallbackPriority } = config.fiatProvider

    // sort by fallback priority
    for (const name of fallbackPriority) {
      const option = config.fiatProvider[name]
      if (!option) {
        continue
      }

      name === 'currencylayer' && this.quoters.push(new CurrencyLayer(option))
      name === 'alphavantage' && this.quoters.push(new AlphaVantage(option))
      name === 'fixer' && this.quoters.push(new Fixer(option))
      name === 'exchangerate' && this.quoters.push(new ExchangeRate(option))
    }

    await super.initialize()

    await this.tick()
  }

  protected adjustPrices(): void {
    for (const symbol of this.symbols) {
      delete this.priceBySymbol[symbol]

      // get price by fallback priority
      for (const quoter of this.quoters) {
        const price = quoter.getPrice(symbol)

        if (price) {
          this.priceBySymbol[symbol] = price
          break
        }
      }
    }
  }
}

export default FiatProvider
