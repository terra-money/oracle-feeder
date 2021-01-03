import { BigNumber } from 'bignumber.js'
import { PriceBySymbol } from 'provider/base'
import { lunaProvider, fiatProvider, cryptoProvider } from 'provider'
import { num } from 'lib/num'
import * as logger from 'lib/logger'

export function getLunaPrices(): PriceBySymbol {
  const helpers: PriceBySymbol = {
    'LUNA/USDT': lunaProvider.getPriceBy('LUNA/USDT'), // tvwap(binance, huobi)
    'USDT/USD': cryptoProvider.getPriceBy('USDT/USD'), // tvwap(Kraken, Bitfinex)
    'KRW/USD': fiatProvider.getPriceBy('KRW/USD'),
    'KRW/SDR': fiatProvider.getPriceBy('KRW/SDR'),
    'KRW/MNT': fiatProvider.getPriceBy('KRW/MNT'),
  }
  const prices: PriceBySymbol = {
    'LUNA/KRW': lunaProvider.getPriceBy('LUNA/KRW'),
  }

  if (helpers['LUNA/USDT'] && helpers['USDT/USD']) {
    // Luna/USD = Luna/usdt * usdt/usd
    prices['LUNA/USD'] = helpers['LUNA/USDT'].multipliedBy(helpers['USDT/USD'])
  }

  if (helpers['KRW/USD'] && helpers['KRW/SDR']) {
    const sdrUsd = helpers['KRW/USD'].dividedBy(helpers['KRW/SDR'])

    // Luna/SDR = (Luna/USD) / (SDR/USD)
    prices['LUNA/SDR'] = prices['LUNA/USD'].dividedBy(sdrUsd)
  }

  if (helpers['KRW/USD'] && helpers['KRW/MNT']) {
    const usdMnt = helpers['KRW/MNT'].dividedBy(helpers['KRW/USD'])

    // Luna/MNT = (Luna/USD) * (USD/MNT)
    prices['LUNA/MNT'] = prices['LUNA/USD'].multipliedBy(usdMnt)
  }

  return prices
}

export function getBtcPremium(): BigNumber | undefined {
  try {
    const prices: { [symbol: string]: BigNumber } = {
      'BTC/KRW': cryptoProvider.getPriceBy('BTC/KRW'), // tvwap(upbit, bithumb)
      'BTC/USDT': cryptoProvider.getPriceBy('BTC/USDT'), // tvwap(binance, huobi)

      'USDT/USD': cryptoProvider.getPriceBy('USDT/USD'), // tvwap(Kraken, Bitfinex)
      'USD/KRW': num(1).dividedBy(fiatProvider.getPriceBy('KRW/USD')), // average(currencylayer, alphavantage)
    }
    for (const symbol of Object.keys(prices)) {
      if (!prices[symbol] || prices[symbol].isNaN()) {
        throw new Error(`BTC Premium: wrong price source - ${symbol}(${prices[symbol]})`)
      }
    }

    // BTC PREMIUM = BTC/KRW / (BTC/USDT 최근체결가 * USDT/USD * USD/KRW)
    const btcPremium = prices['BTC/KRW'].dividedBy(
      prices['BTC/USDT'].multipliedBy(prices['USDT/USD']).multipliedBy(prices['USD/KRW'])
    )
    if (!btcPremium || btcPremium.isNaN() === true) {
      throw new Error(`wrong btc premium(${btcPremium})`)
    }

    return btcPremium
  } catch (error) {
    logger.error(error)
    return undefined
  }
}

export function getUsdtToKrwRate(): BigNumber | undefined {
  try {
    const prices: { [symbol: string]: BigNumber } = {
      'USDT/USD': cryptoProvider.getPriceBy('USDT/USD'), // tvwap(Kraken, Bitfinex)
      'USD/KRW': num(1).dividedBy(fiatProvider.getPriceBy('KRW/USD')), // average(currencylayer, alphavantage)
    }
    for (const symbol of Object.keys(prices)) {
      if (!prices[symbol] || prices[symbol].isNaN()) {
        throw new Error(`USDT/KRW: wrong price source - ${symbol}(${prices[symbol]})`)
      }
    }

    // krwRate = USDT/USD * USD/KRW * btcPremium
    const btcPremium = getBtcPremium()
    const krwRate = btcPremium?.multipliedBy(prices['USDT/USD']).multipliedBy(prices['USD/KRW'])
    if (!krwRate || krwRate.isNaN() === true) {
      throw new Error(`wrong krwRate(${krwRate})`)
    }

    return krwRate
  } catch (error) {
    logger.error(error)
    return undefined
  }
}
