import { BigNumber } from 'bignumber.js';

export interface Trade {
  timestamp: number;
  price: BigNumber;
  volume: BigNumber;
}

export type Trades = Trade[];

export interface TradesByQuote {
  [quote: string]: Trades;
}

export interface PriceByQuote {
  [quote: string]: BigNumber;
}
