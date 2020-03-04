import * as config from 'config';
import { Provider } from '../base';
import * as weightedMedian from 'weighted-median';
import Bithumb from './Bithumb';
import Coinone from './Coinone';

class LunaProvider extends Provider {
  constructor(baseCurrency: string) {
    super(baseCurrency);

    if (config.get('provider.bithumb.enable')) {
      const opts = config.get('provider.bithumb');

      this.quoters.push(new Bithumb(
        baseCurrency,
        opts.quotes,
        {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          movingAverageSpan: opts.movingAverageSpan || 3 * 60 * 1000
        }
      ));
    }
    if (config.get('provider.coinone.enable')) {
      const opts = config.get('provider.coinone');

      this.quoters.push(new Coinone(
        baseCurrency,
        opts.quotes,
        {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          movingAverageSpan: opts.movingAverageSpan || 3 * 60 * 1000
        }
      ));
    }
  }

  protected adjustPrices() {
    const collectedPrices: {
      [quote: string]: { value: number, weight: number }[]
    } = {};

    // collect price, volume
    for (const quoter of this.quoters) {
      const lastTrades = quoter.getLastTrades();

      for (const quote of Object.keys(lastTrades)) {
        collectedPrices[quote] = [
          ...(collectedPrices[quote] || []),
          { value: lastTrades[quote].price, weight: lastTrades[quote].volume }
        ];
      }
    }

    // calculate weighted median luna price of quote
    for (const quote of Object.keys(collectedPrices)) {
      this.prices[quote] = weightedMedian(collectedPrices[quote]);
    }
  }
}

export default LunaProvider;
