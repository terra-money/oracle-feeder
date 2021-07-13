# `price-server`

This component is reponsible for computing the exchange rate of LUNA to submit and makes it available through an HTTP endpoints.

## Instructions

1. Install dependencies

```sh
npm install
```

2. Configure settings (see [below](#Configuration))

```sh
# Copy sample config file
cp ./config/default-sample.js ./config/default.js
# make edits
vim ./config/default.js
```

3. Run server

```sh
# Price is available at `tcp://127.0.0.1:8532/latest`
npm run start
```

## Configuration

You can find the sample configuration at: `config/default.sample.js`. Oracle Price Server expects your configuration file at `config/default.js`.

```js
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
  fiatProvider: { // at least one fiatprovider should be set
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
      symbols: fiatSymbols.filter(v => !v.includes('DKK')),
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
    // fixer: {
    //   symbols: fiatSymbols,
    //   interval: 60 * 1000,
    //   timeout: 5000,
    //   // https://fixer.io/product
    //   // recommend: professional plus(60second Updates): $80/month
    //   apiKey: '', // necessary
    // },
    // alphavantage: {
    //   symbols: fiatSymbols,
    //   interval: 60 * 1000,
    //   timeout: 5000,
    //   // https://www.alphavantage.co/premium/
    //   // recommend: 120 API request per minute: $49.99/month
    //   apiKey: '', // necessary
    // },
  },
}
```

| Key              | Type   | Description                                                                                                                                       |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port`           | number | Port number to expose the price server.                                                                                                           |
| `sentry`         | string | URL for [sentry.io](https://sentry.io) error reporting                                                                                            |
| `slack`          | object | Slack webhook notification configuration                                                                                                          |
| `lunaProvider`   | object | Configuration for LUNA data provider. Current supported providers are `bithumb`, `coinone`, `huobi`, and `binance`.                               |
| `cryptoProvider` | object | Configuration for cryptocurrency data provider. Current supported providers are `upbit`, `bithumb`, `binance`, `huobi`, `bitfinex`, and `kraken`. |
| `fiatProvider`   | object | Configuration for fiat currency data providers. Current supported providers are `currencylayer`, `fixer`, and `alphavantage`.                     |
