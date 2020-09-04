module.exports = {
  port: 8532,
  sentry: '', // sentry dsn (https://sentry.io/ - error reporting service)
  slack: {
    // for incident alarm (e.g. exchange shutdown)
    channel: '#bot-test',
    url: '',
  },
  lunaProvider: {
    adjustTvwapSymbols: ['LUNA/KRW', 'LUNA/USDT'],
    bithumb: { symbols: ['LUNA/KRW'] },
    coinone: { symbols: ['LUNA/KRW'] },
    huobi: { symbols: ['LUNA/USDT'], krwPriceFrom: 'USDT' },
    binance: { symbols: ['LUNA/USDT'], krwPriceFrom: 'USDT' },
  },
  cryptoProvider: {
    adjustTvwapSymbols: ['BTC/KRW', 'USDT/USD'],
    upbit: { symbols: ['BTC/KRW'] },
    bithumb: { symbols: ['BTC/KRW'] },
    binance: { symbols: ['BTC/USDT'] },
    huobi: { symbols: ['LUNA/USDT'] },
    bitfinex: { symbols: ['USDT/USD'] },
    kraken: { symbols: ['USDT/USD'] },
  },
  fiatProvider: {
    currencylayer: {
      symbols: ['KRW/SDR', 'KRW/USD', 'KRW/MNT'],
      interval: 60 * 1000,
      timeout: 5000,
      // https://currencylayer.com/product
      // recommend: business subscription(60second Updates): $79.99/month
      apiKey: '', // necessary
    },
    fixer: {
      symbols: ['KRW/SDR', 'KRW/USD', 'KRW/MNT'],
      interval: 60 * 1000,
      timeout: 5000,
      // https://fixer.io/product
      // recommend: professional plus(60second Updates): $80/month
      apiKey: '', // necessary
    },
    alphavantage: {
      symbols: ['KRW/SDR', 'KRW/USD', 'KRW/MNT'],
      interval: 60 * 1000,
      timeout: 5000,
      // https://www.alphavantage.co/premium/
      // recommend: 120 API request per minute: $49.99/month
      apiKey: '', // necessary
    },
  },
}
