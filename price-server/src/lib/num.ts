import { BigNumber } from 'bignumber.js'

export function num(number: number | string): BigNumber {
  return new BigNumber(number)
}
