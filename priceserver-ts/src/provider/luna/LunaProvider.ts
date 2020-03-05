import * as weightedMedian from 'weighted-median';
import * as config from 'config';
import { Provider, TradesByQuote } from '../base';
import Bithumb from './Bithumb';
import Coinone from './Coinone';

const PRICE_PERIOD = 60 * 60 * 1000;

class LunaProvider extends Provider {
  constructor(baseCurrency: string) {
    super(baseCurrency);

    if (config.get('provider.bithumb.enable')) {
      const opts = config.get('provider.bithumb');

      this.quoters.push(
        new Bithumb(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          pricePeriod: PRICE_PERIOD
        })
      );
    }
    if (config.get('provider.coinone.enable')) {
      const opts = config.get('provider.coinone');

      this.quoters.push(
        new Coinone(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 5000,
          pricePeriod: PRICE_PERIOD
        })
      );
    }
  }

  protected adjustPrices() {
    const tradesByQuote: TradesByQuote = this.collectTradesByQuote();

    // calculate weighted median price
    for (const quote of Object.keys(tradesByQuote)) {
      this.priceByQuote[quote] = weightedMedian(
        tradesByQuote[quote].map(trade => ({
          value: trade.price,
          weight: trade.volume
        }))
      );
    }
  }
}

export default LunaProvider;
