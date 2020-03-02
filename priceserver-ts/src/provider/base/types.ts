export interface LastTrade {
  updatedAt: number;
  price: number;
  volume: number;
}

export interface LastTrades {
  [quote: string]: LastTrade;
}

export interface Prices {
  [quote: string]: number;
}
