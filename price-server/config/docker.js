const FIAT_SYMBOLS = process.env.FIAT_SYMBOLS.split(',') || []

module.exports = {
  port: parseInt(process.env.PORT) || 8532,
  sentry: process.env.SENTRY || '', // sentry dsn (https://sentry.io/ - error reporting service)
  slack: {
    // for incident alarm (e.g. exchange shutdown)
    channel: process.env.SLACK_CHANNEL || '',
    url: process.env.SLACK_URL || '',
  },
  lunaProvider: {
    adjustTvwapSymbols: process.env.LUNA_PROVIDER_ADJUST_TVWAP_SYMBOLS.split(',') || [],
    bithumb: { symbols: process.env.LUNA_PROVIDER_BITHUMB_SYMBOLS.split(',') || [] },
    coinone: { symbols: process.env.LUNA_PROVIDER_COINONE_SYMBOLS.split(',') || [] },
    huobi: {
      symbols: process.env.LUNA_PROVIDER_HUOBI_SYMBOLS.split(',') || [],
      krwPriceFrom: process.env.LUNA_PROVIDER_HUOBI_KRW_PRICE_FROM || undefined,
    },
    binance: {
      symbols: process.env.LUNA_PROVIDER_BINANCE_SYMBOLS.split(',') || [],
      krwPriceFrom: process.env.LUNA_PROVIDER_BINANCE_KRW_PRICE_FROM || undefined,
    },
    gateio: {
      symbols: process.env.LUNA_PROVIDER_GATEIO_SYMBOLS.split(',') || [],
      krwPriceFrom: process.env.LUNA_PROVIDER_GATEIO_KRW_PRICE_FROM || undefined,
    },
  },
  cryptoProvider: {
    adjustTvwapSymbols: process.env.CRYPTO_PROVIDER_ADJUST_TVWAP_SYMBOLS.split(',') || [],
    upbit: { symbols: process.env.CRYPTO_PROVIDER_UPBIT_SYMBOLS.split(',') || [] },
    bithumb: { symbols: process.env.CRYPTO_PROVIDER_BITHUMB_SYMBOLS.split(',') || [] },
    binance: { symbols: process.env.CRYPTO_PROVIDER_BINANCE_SYMBOLS.split(',') || [] },
    huobi: { symbols: process.env.CRYPTO_PROVIDER_HUOBI_SYMBOLS.split(',') || [] },
    bitfinex: { symbols: process.env.CRYPTO_PROVIDER_BITFINEX_SYMBOLS.split(',') || [] },
    kraken: { symbols: process.env.CRYPTO_PROVIDER_KRAKEN_SYMBOLS.split(',') || [] },
  },
  fiatProvider: {
    currencylayer: process.env.FIAT_PROVIDER_CURRENCY_LAYER_INTERVAL && {
      symbols: FIAT_SYMBOLS,
      interval: parseInt(process.env.FIAT_PROVIDER_CURRENCY_LAYER_INTERVAL) || 60 * 1000,
      timeout: parseInt(process.env.FIAT_PROVIDER_CURRENCY_LAYER_TIMEOUT) || 5000,
      // https://currencylayer.com/product
      // recommend: business subscription(60second Updates): $79.99/month
      apiKey: process.env.FIAT_PROVIDER_CURRENCY_LAYER_API_KEY || '', // necessary
    },
    fixer: process.env.FIAT_PROVIDER_FIXER_INTERVAL && {
      symbols: FIAT_SYMBOLS,
      interval: parseInt(process.env.FIAT_PROVIDER_FIXER_INTERVAL) || 60 * 1000,
      timeout: parseInt(process.env.FIAT_PROVIDER_FIXER_TIMEOUT) || 5000,
      // https://fixer.io/product
      // recommend: professional plus(60second Updates): $80/month
      apiKey: process.env.FIAT_PROVIDER_FIXER_API_KEY || '', // necessary
    },
    alphavantage: process.env.FIAT_PROVIDER_ALPHA_VANTAGE_INTERVAL && {
      symbols: FIAT_SYMBOLS.filter((symbol) => !symbol.includes('MNT')),
      interval: parseInt(process.env.FIAT_PROVIDER_ALPHA_VANTAGE_INTERVAL) || 60 * 1000,
      timeout: parseInt(process.env.FIAT_PROVIDER_ALPHA_VANTAGE_TIMEOUT) || 5000,
      // https://www.alphavantage.co/premium/
      // recommend: 120 API request per minute: $49.99/month
      apiKey: process.env.FIAT_PROVIDER_ALPHA_VANTAGE_API_KEY || '', // necessary
    },
    bandprotocol: process.env.FIAT_PROVIDER_BAND_PROTOCOL_INTERVAL && {
      symbols: FIAT_SYMBOLS,
      interval: parseInt(process.env.FIAT_PROVIDER_BAND_PROTOCOL_INTERVAL) || 60 * 1000,
      timeout: parseInt(process.env.FIAT_PROVIDER_BAND_PROTOCOL_TIMEOUT) || 5000,
      // https://data.bandprotocol.com/
    },
  },
}
