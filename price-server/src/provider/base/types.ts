import { BigNumber } from 'bignumber.js'

export interface Trade {
  timestamp: number
  price: BigNumber
  volume: BigNumber
}

export type Trades = Trade[]

export interface TradesBySymbol {
  [symbol: string]: Trades
}

export interface PriceBySymbol {
  [symbol: string]: BigNumber
}
