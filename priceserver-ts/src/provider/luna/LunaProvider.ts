import * as config from 'config';
import { format, getMinutes, addMinutes } from 'date-fns';
import { average } from 'lib/average';
import * as logger from 'lib/logger';
import { createReporter } from 'lib/reporter';
import { tvwap } from 'lib/tvwap';
import { Provider } from '../base';
import Bithumb from './Bithumb';
import Coinone from './Coinone';

const PRICE_PERIOD = 3 * 60 * 1000; // 3 minutes

class LunaProvider extends Provider {
  private reporter;
  private reportedAt: number = 0;

  constructor(baseCurrency: string) {
    super(baseCurrency);

    // bithumb quoter
    if (config.get('provider.bithumb.enable')) {
      const opts = config.get('provider.bithumb');

      this.quoters.push(
        new Bithumb(baseCurrency, opts.quotes, {
          interval: opts.interval || 100,
          timeout: opts.timeout || 10000
        })
      );
    }

    // coinone quoter
    if (config.get('provider.coinone.enable')) {
      const opts = config.get('provider.coinone');

      this.quoters.push(
        new Coinone(baseCurrency, opts.quotes, {
          interval: opts.interval || 1000,
          timeout: opts.timeout || 10000
        })
      );
    }

    if (config.report) {
      this.reporter = createReporter(`report/Luna${format(new Date(), 'MMdd_HHmm')}.csv`, [
        'time',
        ...this.quoters.map(quoter => quoter.constructor.name.toLowerCase()),
        'price',
        ...this.quoters.map(quoter => `${quoter.constructor.name.toLowerCase()}_volume`)
      ]);
    }
  }

  protected adjustPrices() {
    const now = Date.now();

    // adjust price
    for (const quote of this.quotes) {
      delete this.priceByQuote[quote];

      const trades = this.collectTrades(quote).filter(trade => now - trade.timestamp < PRICE_PERIOD);

      if (trades.length > 1) {
        // if have more than one, use tvwap(time volume weighted average price)
        this.priceByQuote[quote] = tvwap(trades);
      } else {
        // use average last price of quoters
        const prices: number[] = this.collectPrice(quote);
        if (prices.length > 0) {
          this.priceByQuote[quote] = average(prices);
        }
      }
    }

    if (config.report) {
      this.report();
    }
  }

  private report() {
    const now = Date.now();

    if (!this.reporter) {
      this.reporter = createReporter(`report/LUNA_KRW_${format(now, 'MM-dd HHmm')}.csv`, [
        'time',
        ...this.quoters.map(quoter => quoter.constructor.name.toLowerCase()),
        'price',
        ...this.quoters.map(quoter => `${quoter.constructor.name.toLowerCase()}_volume`)
      ]);
    }

    if (this.reporter && getMinutes(now) !== getMinutes(this.reportedAt)) {
      try {
        const timestamp = Math.floor(addMinutes(Date.now(), -1).getTime() / 60000) * 60000;
        const report = {
          time: format(timestamp, 'MMdd HH:mm'),
          price: this.priceByQuote['KRW']?.toFixed(2)
        };

        for (const quoter of this.quoters) {
          // quoter last price
          report[quoter.constructor.name.toLowerCase()] = quoter.getPrice('KRW')?.toFixed(2);

          // quoter last volume
          const trade = quoter.getTrades('KRW').find(trade => trade.timestamp === timestamp);
          report[`${quoter.constructor.name.toLowerCase()}_volume`] = trade?.volume || 0;
        }

        this.reporter.writeRecords([report]);
      } catch (error) {
        logger.error(error);
      }
      this.reportedAt = now;
    }
  }
}

export default LunaProvider;
