export interface Trade {
  timestamp: number;
  price: number;
  volume: number;
}

export type Trades = Trade[];

export interface TradesByQuote {
  [quote: string]: Trades;
}

export interface PriceByQuote {
  [quote: string]: number;
}
