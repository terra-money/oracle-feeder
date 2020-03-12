export function vwap(array: { price: number; volume: number }[]): number {
  if (!array || !array.length) {
    throw new Error('empty array');
  }

  if (array.length === 1) {
    return array[0].price;
  }

  // formula: sum(num shares * share price)/(total shares)
  return array.reduce((s, x) => s + x.volume * x.price, 0) / array.reduce((s, x) => s + x.volume, 0) || 0;
}
