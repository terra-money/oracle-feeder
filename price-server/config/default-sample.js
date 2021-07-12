const fiatSymbols = [
  'USD/SDR',
  'USD/KRW',
  'USD/MNT',
  'USD/EUR',
  'USD/CNY',
  'USD/JPY',
  'USD/GBP',
  'USD/INR',
  'USD/CAD',
  'USD/CHF',
  'USD/HKD',
  'USD/AUD',
  'USD/SGD',
  'USD/THB',
  'USD/SEK',
]

module.exports = {
  port: 8532,
  sentry: '', // sentry dsn (https://sentry.io/ - error reporting service)
  slack: {
    // for incident alarm (e.g. exchange shutdown)
    channel: '#bot-test',
    url: '',
  },
  lunaProvider: {
    adjustTvwapSymbols: ['LUNA/USDT'],
    huobi: { symbols: ['LUNA/USDT'] },
    binance: { symbols: ['LUNA/USDT'] },
    kucoin: { symbols: ['LUNA/USDT'] },
  },
  cryptoProvider: {
    adjustTvwapSymbols: ['USDT/USD'],
    bitfinex: { symbols: ['USDT/USD'] },
    kraken: { symbols: ['USDT/USD'] },
  },
  fiatProvider: {
    fallbackPriority: ['currenctylayer', 'exchangerate', 'bandprotocol'],
    currencylayer: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://currencylayer.com/product
      // recommend: business subscription(60second Updates): $79.99/month
      apiKey: '', // necessary
    },
    bandprotocol: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://data.bandprotocol.com/
    },
    exchangerate: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://exchangerate.host/
    },
    fixer: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://fixer.io/product
      // recommend: professional plus(60second Updates): $80/month
      apiKey: '', // necessary
    },
    alphavantage: {
      symbols: fiatSymbols.filter((symbol) => !symbol.includes('MNT')),
      interval: 60 * 1000,
      timeout: 5000,
      // https://www.alphavantage.co/premium/
      // recommend: 120 API request per minute: $49.99/month
      apiKey: '', // necessary
    },
  },
}
