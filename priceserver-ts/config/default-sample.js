module.exports = {
  port: 8532,
  provider: {
    bithumb: {
      enable: true,
      base: 'LUNA',
      quotes: ['KRW'], // available quote list
      interval: 500, // update interval
      timeout: 5000, // api call timeout
      movingAverageSpan: 3 * 60 * 1000 // 3 minutes
    },
    coinone: {
      enable: true,
      base: 'LUNA',
      quotes: ['KRW'],
      interval: 500,
      timeout: 5000,
      movingAverageSpan: 3 * 60 * 1000
    },
    currencylayer: {
      enable: true,
      base: 'KRW',
      quotes: ['SDR', 'USD', 'MNT'],
      interval: 60 * 1000,
      apiKey: '', // necessary
      timeout: 5000
    },
    fixer: {
      enable: false,
      base: 'KRW',
      quotes: ['SDR', 'USD', 'MNT'],
      interval: 60 * 60 * 1000, // 1 hours (free api is support only hourly update)
      apiKey: '', // necessary
      timeout: 5000
    },
  },
};
