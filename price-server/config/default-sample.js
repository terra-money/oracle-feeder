// Updated 09-Feb-22

const fiatSymbols = [
  'SDR/USD',
  'CNY/USD',
  'EUR/USD',
  'JPY/USD',
  'GBP/USD',
  'KRW/USD',
  'INR/USD',
  'CAD/USD',
  'HKD/USD',
  'AUD/USD',
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
    adjustTvwap: { symbols: [] },
    huobi: {
      symbols: ['LUNA/USDT', 'BTC/USDT', 'ETH/USDT'],
    },
    binance: {
      symbols: ['LUNA/USDT', 'LUNA/BUSD', 'BTC/USDT', 'BTC/BUSD', 'ETH/USDT', 'ETH/BUSD', 'BUSD/USDT'],
    },
    kucoin: {
      symbols: ['LUNA-USDT', 'BTC-USDT', 'ETH-USDT'],
    },
    bitfinex: {
      symbols: ['USDT/USD', 'BTC/USDT', 'ETH/USDT'],
    },
    kraken: {
      symbols: ['USDT/USD'],
    },
  },
  fiatProvider: {
    fallbackPriority: ['exchangerate', 'frankfurter', 'fer'],
    // https://exchangerate.host/
    exchangerate: {
      symbols: fiatSymbols,
      interval: 60 * 1000,
      timeout: 5000,
    },
    // https://fer.ee/
    fer: {
      symbols: fiatSymbols.filter((f) => !f.includes('SDR')),
      timeout: 5000,
    },
    // https://www.frankfurter.app/docs/
    frankfurter: {
      symbols: fiatSymbols.filter((f) => !f.includes('SDR')),
      timeout: 5000,
    },
  },
}
