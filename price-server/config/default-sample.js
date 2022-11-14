// Updated 09-Feb-22

const fiatSymbols = [
  'USD/SDR',
  'USD/CNY',
  'USD/EUR',
  'USD/JPY',
  'USD/GBP',
  'USD/KRW',
  'USD/INR',
  'USD/CAD',
  'USD/HKD',
  'USD/AUD',
]

module.exports = {
  port: 8532,
  metricsPort: 8533,
  sentry: '', // sentry dsn (https://sentry.io/ - error reporting service)
  slack: {
    // for incident alarm (e.g. exchange shutdown)
    channel: '#bot-test',
    url: '',
  },
  lunaProvider: {
    adjustTvwap: {
      symbols: [
        'LUNA/USDT'
      ]
    },
    huobi: {
      symbols: ['LUNC/USDT']
    },
    binance: {
      symbols: ['LUNC/USDT']
    },
    kucoin: {
      symbols: ['LUNC/USDT']
    },
  },
  cryptoProvider: {
    adjustTvwap: {
      symbols: [
        'LUNA/USDT'
      ]
    },
    bitfinex: {
      symbols: ['USDT/USD']
    },
    kraken: {
      symbols: ['USDT/USD']
    },
  },
  fiatProvider: {
    fallbackPriority: ['currencylayer', 'alphavantage', 'fixer', 'exchangerate'],
    currencylayer: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://currencylayer.com/product
      // recommend: business subscription(60second Updates): $79.99/month
      apiKey: '', // necessary
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
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://www.alphavantage.co/premium/
      // recommend: 120 API request per minute: $49.99/month
      apiKey: '', // necessary
    },
  },
  fiatSymbols,
}
