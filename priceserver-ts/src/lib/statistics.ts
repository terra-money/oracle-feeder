export function average(array: number[]): number {
  if (!array || !array.length) {
    throw new Error('empty array');
  }

  if (array.length === 1) {
    return array[0];
  }

  return array.reduce((a, b) => a + b) / array.length;
}

export function vwap(array: { price: number; volume: number }[]): number {
  if (!array || !array.length) {
    throw new Error('empty array');
  }

  if (array.length === 1) {
    return array[0].price;
  }

  // sum(volume * price) / (total volume)
  return array.reduce((s, x) => s + x.volume * x.price, 0) / array.reduce((s, x) => s + x.volume, 0) || 0;
}

export function tvwap(
  array: { price: number; volume: number; timestamp: number }[],
  minimumTimeWeight: number = 0.2
): number {
  if (!array || !array.length) {
    throw new Error('empty array');
  }

  if (array.length === 1) {
    return array[0].price;
  }

  const sortedArray = array.sort((a, b) => a.timestamp - b.timestamp);
  const now = Date.now();
  const period = now - array[0].timestamp;
  const tvwapTrades = sortedArray.map(trade => ({
    price: trade.price,
    volume: trade.volume * (((1 - minimumTimeWeight) / period) * (period - (now - trade.timestamp)) + minimumTimeWeight)
  }));

  return vwap(tvwapTrades);
}
