import { BigNumber } from 'bignumber.js'
import { getQuoteCurrency } from 'lib/currency'
import { PriceBySymbol } from 'provider/base'
import { lunaProvider, fiatProvider, cryptoProvider } from 'provider'
import { num } from 'lib/num'
import * as logger from 'lib/logger'

export function getLunaPrices(): PriceBySymbol {
  const baseSymbol = 'LUNA/KRW'
  const prices: PriceBySymbol = {
    [baseSymbol]: lunaProvider.getPriceBy(baseSymbol),
  }

  if (!prices[baseSymbol]) {
    return {}
  }

  // make 'LUNA/FIAT' rates
  for (const symbol of Object.keys(fiatProvider.getPrices())) {
    prices[`LUNA/${getQuoteCurrency(symbol)}`] = fiatProvider
      .getPriceBy(symbol)
      .multipliedBy(prices[baseSymbol])
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
