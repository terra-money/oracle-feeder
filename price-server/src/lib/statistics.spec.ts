import { average, vwap } from './statistics'
import { num } from './num'

describe('average', () => {
  test('should return average price', () => {
    expect(average([num(1), num(2), num(3)])).toStrictEqual(num(2))
    expect(average([num(2)])).toStrictEqual(num(2))
  })
})

describe('volume weighted average price', () => {
  test('should return weighted average price', () => {
    expect(
      vwap([
        { price: num(1), volume: num(1) },
        { price: num(2), volume: num(1) },
        { price: num(3), volume: num(1) },
      ])
    ).toStrictEqual(num(2))
  })
})
