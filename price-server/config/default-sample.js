module.exports = {
  port: 8532,
  sentry: '', // sentry dsn (https://sentry.io/ - error reporting service)
  slack: {
    // for incident alarm (e.g. exchange shutdown)
    channel: '#bot-test',
    url: '',
  },
  lunaProvider: {
    bithumb: {
      symbols: ['LUNA/KRW'], // available symbol list
      interval: 100, // update interval
    },
    coinone: {
      symbols: ['LUNA/KRW'],
      interval: 1000,
    },
    huobi: {
      symbols: ['LUNA/USDT'], // available symbol list
      interval: 100, // update interval
    },
  },
  fiatProvider: {
    currencylayer: {
      symbols: ['KRW/SDR', 'KRW/USD', 'KRW/MNT'],
      interval: 60 * 1000,
      apiKey: '', // necessary
    },
    alphavantage: {
      symbols: ['KRW/SDR', 'KRW/USD', 'KRW/MNT'],
      interval: 60 * 1000,
      apiKey: '', // necessary
    },
    fixer: {
      symbols: ['KRW/SDR', 'KRW/USD', 'KRW/MNT'],
      interval: 60 * 60 * 1000, // 1 hours (free api support only hourly update)
      apiKey: '', // necessary
    },
  },
}
