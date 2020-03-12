export function average(array: number[]): number {
  if (!array || !array.length) {
    throw new Error('empty array');
  }

  if (array.length === 1) {
    return array[0];
  }

  return array.reduce((a, b) => a + b) / array.length;
}
