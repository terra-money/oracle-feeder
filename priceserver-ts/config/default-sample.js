module.exports = {
  port: 8532,
  provider: {
    bithumb: {
      enable: true,
      base: 'LUNA',
      quotes: ['KRW'], // available quote list
      interval: 1000, // update interval
    },
    coinone: {
      enable: true,
      base: 'LUNA',
      quotes: ['KRW'],
      interval: 1000,
    },
    currencylayer: {
      enable: true,
      base: 'KRW',
      quotes: ['SDR', 'USD', 'MNT'],
      interval: 60 * 1000,
      apiKey: '', // necessary
    },
    fixer: {
      enable: false,
      base: 'KRW',
      quotes: ['SDR', 'USD', 'MNT'],
      interval: 60 * 60 * 1000, // 1 hours (free api support only hourly update)
      apiKey: '', // necessary
    }
  }
};
