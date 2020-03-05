import { average } from 'lib/average';
import { PriceByQuote, TradesByQuote } from './types';
import Quoter from './Quoter';

export class Provider {
  protected quoters: Quoter[] = [];
  protected priceByQuote: PriceByQuote = {};
  protected baseCurrency: string;

  constructor(baseCurrency: string) {
    this.baseCurrency = baseCurrency;
  }

  public async initialize(): Promise<void> {
    for (const quoter of this.quoters) {
      await quoter.initialize();
    }
  }

  public async tick(now: number): Promise<boolean> {
    const responses = await Promise.all(this.quoters.map(quoter => quoter.tick(now)));
    // if some quoter updated
    if (responses.some(response => response)) {
      this.adjustPrices();
      return true;
    }

    return false;
  }

  public getLunaPrices(lunaPrices: PriceByQuote): PriceByQuote {
    if (this.baseCurrency === 'LUNA') {
      return this.priceByQuote;
    }

    // convert base currency to Luna and return
    const prices: PriceByQuote = {};

    if (lunaPrices[this.baseCurrency]) {
      for (const quote of Object.keys(this.priceByQuote)) {
        prices[quote] = this.priceByQuote[quote] * lunaPrices[this.baseCurrency];
      }
    }

    return prices;
  }

  // collect latest trade records of quoters
  protected collectTradesByQuote(): TradesByQuote {
    const collectedTradesByQuote: TradesByQuote = {};

    // collect last trades.
    // ex) { KRW: [{ price: 100, volume: 10, timestamp: 111 }, ...], USD: [...] }
    for (const quoter of this.quoters) {
      const tradesByQuote = quoter.getTradesByQuote();

      for (const quote of Object.keys(tradesByQuote)) {
        collectedTradesByQuote[quote] = [...(collectedTradesByQuote[quote] || []), ...tradesByQuote[quote]];
      }
    }

    return collectedTradesByQuote;
  }

  protected adjustPrices() {
    const tradesByQuote: TradesByQuote = this.collectTradesByQuote();

    // calculate average of prices
    for (const quote of Object.keys(tradesByQuote)) {
      this.priceByQuote[quote] = average(tradesByQuote[quote].map(trade => trade.price));
    }
  }
}

export default Provider;
