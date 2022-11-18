// Updated 18-Nov-22

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
  cryptoProvider: {
    adjustTvwap: {
      symbols: [
        'LUNA/USDT',
        'BTC/USDT',
        'ETH/USDT',
      ]
    },
    huobi: {
      symbols: [
        'LUNA/USDT',
        'BTC/USDT',
        'ETH/USDT'
      ]
    },
    binance: {
      symbols: [
        'LUNA/USDT',
        'BTC/USDT',
        'ETH/USDT'
      ]
    },
    // kucoin: {
    //   symbols: [
    //     'LUNA-USDT',
    //     'BTC-USDT',
    //     'ETH-USDT'
    //   ]
    // },
    // bitfinex: {
    //   symbols: [
    //     'USDT/USD'
    //   ]
    // },
    // kraken: {
    //   symbols: [
    //     'USDT/USD'
    //   ]
    // },
  },
  fiatProvider: {
    fallbackPriority: ['exchangerate'],
    exchangerate: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
      // https://exchangerate.host/
    }
  },
  fiatSymbols,
}
