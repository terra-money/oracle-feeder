# `price-server`

This component is responsible for computing the exchange rate of different assets from multiple data sources and make it available through HTTP endpoints.

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
nano ./config/default.js
```

3. Run server

```sh
# Price is available at `tcp://127.0.0.1:8532/latest`
npm run start
```

## Configuration

You can find the sample configuration at: `config/default-sample.js`. Oracle Price Server expects your configuration file at `config/default.js`.

```js
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
        'LUNC/USDT',
        'BTC/USDT',
        'ETH/USDT',
      ]
    },
    huobi: {
      symbols: [
        'LUNA/USDT',
        'LUNC/USDT',
        'BTC/USDT',
        'ETH/USDT'
      ]
    },
    binance: {
      symbols: [
        'LUNA/USDT',
        'LUNC/USDT',
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
```

| Key              | Type   | Description                                                                                                                                       |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port`           | number | Port number to expose the price server.                                                                                                           |
| `sentry`         | string | URL for [sentry.io](https://sentry.io) error reporting                                                                                            |
| `slack`          | object | Slack webhook notification configuration                                                                                                          |
| `cryptoProvider` | object | Configuration for cryptocurrency data provider. Current supported providers are `upbit`, `bithumb`, `binance`, `huobi`, `bitfinex`, and `kraken`. |
| `fiatProvider`   | object | Configuration for fiat currency data providers. Current supported providers are `currencylayer`, `fixer`, and `alphavantage`.                     |
