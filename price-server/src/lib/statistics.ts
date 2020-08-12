import { BigNumber } from 'bignumber.js'
import { num } from './num'

export function average(array: BigNumber[]): BigNumber {
  if (!array || !array.length) {
    throw new Error('empty array')
  }

  if (array.length === 1) {
    return array[0]
  }

  return array.reduce((a, b) => a.plus(b)).dividedBy(num(array.length))
}

export function vwap(array: { price: BigNumber; volume: BigNumber }[]): BigNumber {
  if (!array || !array.length) {
    throw new Error('empty array')
  }

  if (array.length === 1) {
    return array[0].price
  }

  // sum(volume * price) / (total volume)
  // return array.reduce((s, x) => s + x.volume * x.price, 0) / array.reduce((s, x) => s + x.volume, 0) || 0
  const sum = array.reduce((s, x) => s.plus(x.volume.multipliedBy(x.price)), num(0))
  const totalVolume = array.reduce((s, x) => s.plus(x.volume), num(0))
  return sum.dividedBy(totalVolume) || num(0)
}

export function tvwap(
  array: { price: BigNumber; volume: BigNumber; timestamp: number }[],
  minimumTimeWeight: BigNumber = num(0.2)
): BigNumber {
  if (!array || !array.length) {
    throw new Error('empty array')
  }

  if (array.length === 1) {
    return array[0].price
  }

  const sortedArray = array.sort((a, b) => a.timestamp - b.timestamp)
  const now = num(Date.now())
  const period = now.minus(num(array[0].timestamp))
  const weightUnit = num(1).minus(minimumTimeWeight).dividedBy(period)

  const tvwapTrades = sortedArray.map((trade) => ({
    price: trade.price,
    // volume: trade.volume * (((1 - minimumTimeWeight) / period) * (period - (now - trade.timestamp)) + minimumTimeWeight)
    volume: trade.volume.multipliedBy(
      weightUnit.multipliedBy(period.minus(now.minus(num(trade.timestamp))).plus(minimumTimeWeight))
    ),
  }))

  return vwap(tvwapTrades)
}
