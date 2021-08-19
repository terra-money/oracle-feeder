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
  'USD/NOK',
  'USD/DKK',
  'USD/IDR',
  'USD/PHP',
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
    fallbackPriority: ['currencylayer', 'alphavantage', 'fixer', 'exchangerate', 'bandprotocol'],
    currencylayer: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://currencylayer.com/product
      // recommend: business subscription(60second Updates): $79.99/month
      apiKey: '', // necessary
    },
    bandprotocol: {
      // DKK is not supported for bandprotocol
      symbols: fiatSymbols.filter(v => !v.includes('DKK') && !v.includes('PHP')),
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
