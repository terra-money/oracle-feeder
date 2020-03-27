import { BigNumber } from 'bignumber.js';

export function num(number: number | string) {
  return new BigNumber(number);
}
