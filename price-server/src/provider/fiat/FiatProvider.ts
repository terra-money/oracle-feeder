import * as config from 'config'
import { Provider, ProviderOptions } from 'provider/base'
import { CurrencyLayer, AlphaVantage, Fixer, BandProtocol, ExchangeRate } from './quoter'

class FiatProvider extends Provider {
  constructor(options: ProviderOptions) {
    super(options)

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
      name === 'bandprotocol' && this.quoters.push(new BandProtocol(option))
      name === 'exchangerate' && this.quoters.push(new ExchangeRate(option))
    }
  }

  public async initialize(): Promise<void> {
    await super.initialize()

    await this.tick(Date.now())
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
